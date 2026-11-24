// PAUSE — verified, slow dating for India (MVP)
// Categories: Steady 💞 · Forever 💍 · After Dark 🌙. Switches in every category: 🎭 Masked · 🔮 Destiny. Focus 5 for everyone.
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { Pool, types } = require('pg');
types.setTypeParser(1082, (v) => v); // keep DATE as 'YYYY-MM-DD' (no timezone shift)
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const sharp = require('sharp');
const kundli = require('./kundli');
const destiny = require('./destiny');
const help = require('./help');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const BRAND = process.env.BRAND_NAME && !/swoosh/i.test(process.env.BRAND_NAME) ? process.env.BRAND_NAME : 'PAUSE';
const FOCUS = 5;
const DROP_HOUR_IST = Math.min(23, Math.max(0, parseInt(process.env.DESTINY_DROP_HOUR || '21', 10) || 0)); // 9 pm IST

const SCHEMA = (process.env.DB_SCHEMA || '').replace(/[^a-z_]/g, '');
const pool = new Pool({
  ...(SCHEMA ? { options: `-c search_path=${SCHEMA}` } : {}),
  connectionString: process.env.DATABASE_URL || 'postgres://swoosh:swoosh@localhost:5432/swoosh',
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('.render.com') ? { rejectUnauthorized: false } : false
});
const q = (text, params) => pool.query(text, params);

const MODES = ['steady', 'forever', 'afterdark'];
const MODE_NAMES = { steady: 'Steady 💞', forever: 'Forever 💍', afterdark: 'After Dark 🌙' };
const LIVE_CITIES = (process.env.LIVE_CITIES || 'Bangalore,Delhi NCR').split(',').map((c) => c.trim()).filter(Boolean);
function normCity(c) {
  const v = String(c || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!v) return '';
  if (/^(bangalore|bengaluru|blr|bangaluru)$/.test(v)) return 'Bangalore';
  if (/^(delhi|new delhi|delhi ncr|ncr|gurgaon|gurugram|noida|greater noida|ghaziabad|faridabad)$/.test(v)) return 'Delhi NCR';
  return v.replace(/\b\w/g, (ch) => ch.toUpperCase()).slice(0, 40);
}
const GENDERS = ['man', 'woman', 'nonbinary'];
const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Parsi', 'Jewish', 'Spiritual', 'Not religious', 'Other'];
const DIETS = ['Veg', 'Jain food', 'Eggetarian', 'Non-veg', 'Vegan'];

async function migrate() {
  if (SCHEMA) await q(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA}`);
  await q(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, phone TEXT UNIQUE NOT NULL, pass_hash TEXT NOT NULL, name TEXT DEFAULT '', gender TEXT DEFAULT '',
    interested TEXT[] DEFAULT '{}', dob DATE, city TEXT DEFAULT '', any_city BOOLEAN DEFAULT FALSE, company TEXT DEFAULT '',
    hide_company BOOLEAN DEFAULT TRUE, hidden_phones TEXT[] DEFAULT '{}', mode TEXT DEFAULT 'steady', mode_changed_at TIMESTAMPTZ,
    bio TEXT DEFAULT '', prompt_q TEXT DEFAULT 'My perfect Sunday is…', prompt_a TEXT DEFAULT '', tags TEXT[] DEFAULT '{}',
    age_min INT DEFAULT 21, age_max INT DEFAULT 35, trusted_name TEXT DEFAULT '', trusted_phone TEXT DEFAULT '',
    status TEXT DEFAULT 'new', id_hash TEXT UNIQUE, reject_reason TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS photos (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE, idx INT NOT NULL, full_img BYTEA NOT NULL, blur_img BYTEA NOT NULL);
  CREATE TABLE IF NOT EXISTS verifications (user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, id_type TEXT, id_image BYTEA, selfie BYTEA, submitted_at TIMESTAMPTZ DEFAULT now());
  CREATE TABLE IF NOT EXISTS likes (from_id INT REFERENCES users(id) ON DELETE CASCADE, to_id INT REFERENCES users(id) ON DELETE CASCADE, kind TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (from_id, to_id));
  CREATE TABLE IF NOT EXISTS matches (id SERIAL PRIMARY KEY, a_id INT REFERENCES users(id) ON DELETE CASCADE, b_id INT REFERENCES users(id) ON DELETE CASCADE, level INT DEFAULT 0, pending_by INT, closed BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT now(), UNIQUE (a_id, b_id));
  CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, match_id INT REFERENCES matches(id) ON DELETE CASCADE, sender_id INT, body TEXT NOT NULL, system BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT now());
  CREATE TABLE IF NOT EXISTS blocks (blocker INT REFERENCES users(id) ON DELETE CASCADE, blocked INT REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY (blocker, blocked));
  CREATE TABLE IF NOT EXISTS reports (id SERIAL PRIMARY KEY, reporter INT REFERENCES users(id) ON DELETE SET NULL, reported INT REFERENCES users(id) ON DELETE CASCADE, reason TEXT, resolved BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT now());
  CREATE TABLE IF NOT EXISTS banned_ids (id_hash TEXT PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT now());
  CREATE TABLE IF NOT EXISTS waitlist (id SERIAL PRIMARY KEY, phone TEXT, city TEXT, created_at TIMESTAMPTZ DEFAULT now());
  CREATE TABLE IF NOT EXISTS audit_ips (user_id INT, ip TEXT, created_at TIMESTAMPTZ DEFAULT now());
  CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT);
  CREATE TABLE IF NOT EXISTS destiny_answers (user_id INT REFERENCES users(id) ON DELETE CASCADE, mode TEXT NOT NULL, answers JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (user_id, mode));
  CREATE TABLE IF NOT EXISTS destiny_drops (user_id INT REFERENCES users(id) ON DELETE CASCADE, day DATE NOT NULL, mode TEXT, pick_id INT, score INT, reasons JSONB DEFAULT '[]', PRIMARY KEY (user_id, day));
  CREATE TABLE IF NOT EXISTS support_tickets (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE SET NULL, contact TEXT, message TEXT, resolved BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT now());

  ALTER TABLE users ADD COLUMN IF NOT EXISTS masked BOOLEAN DEFAULT FALSE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS destiny BOOLEAN DEFAULT FALSE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS paused BOOLEAN DEFAULT FALSE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS show_zodiac BOOLEAN DEFAULT FALSE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS religion TEXT DEFAULT '';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS diet TEXT DEFAULT '';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm INT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS same_religion BOOLEAN DEFAULT FALSE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS kundli_on BOOLEAN DEFAULT FALSE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS kundli_min INT DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_time TEXT DEFAULT '';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_place TEXT DEFAULT '';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS moon_long DOUBLE PRECISION;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS manglik TEXT DEFAULT 'unknown';
  ALTER TABLE users ALTER COLUMN mode SET DEFAULT 'steady';
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS kind TEXT DEFAULT 'text';
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}';
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS flag TEXT;
  `);
  // One-time move from the Swoosh model (4 modes, 4 reveal levels) to PAUSE (3 categories, 3 steps).
  const { rows } = await q("SELECT 1 FROM app_meta WHERE key='pause_v1'");
  if (!rows[0]) {
    await q(`UPDATE users SET mode = CASE mode WHEN 'marriage' THEN 'forever' WHEN 'fling' THEN 'afterdark' ELSE 'steady' END
      WHERE mode NOT IN ('steady','forever','afterdark')`);
    await q('UPDATE matches SET level = CASE WHEN level >= 3 THEN 2 WHEN level >= 1 THEN 1 ELSE 0 END, pending_by = NULL');
    await q("INSERT INTO app_meta(key, value) VALUES('pause_v1', now()::text)");
  }
}

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '8mb' }));
app.use(cookieSession({ name: 'sw', keys: [SECRET], maxAge: 30 * 24 * 3600 * 1000, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', httpOnly: true }));
app.use((req, res, next) => { res.set('X-Content-Type-Options', 'nosniff'); res.set('Referrer-Policy', 'same-origin'); next(); });

// ---------- helpers ----------
const normPhone = (p) => String(p || '').replace(/\D/g, '').slice(-10);
const hmac = (s) => crypto.createHmac('sha256', SECRET).update(String(s).toUpperCase().replace(/\s/g, '')).digest('hex');
const ageOf = (dob) => {
  if (!dob) return null;
  const [y, m, d] = String(dob).slice(0, 10).split('-').map(Number);
  const n = new Date();
  let a = n.getFullYear() - y;
  if (n.getMonth() + 1 < m || (n.getMonth() + 1 === m && n.getDate() < d)) a--;
  return a;
};
const clean = (s, n = 300) => String(s || '').trim().slice(0, n);
const err = (res, code, msg, extra = {}) => res.status(code).json({ error: msg, ...extra });
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function decodeImage(dataUrl) {
  const m = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(String(dataUrl || ''));
  if (!m) return null;
  const buf = Buffer.from(m[2], 'base64');
  return buf.length > 4 * 1024 * 1024 ? null : buf;
}
const ZODIAC = [['Capricorn', '♑', 120], ['Aquarius', '♒', 219], ['Pisces', '♓', 321], ['Aries', '♈', 420], ['Taurus', '♉', 521], ['Gemini', '♊', 621],
  ['Cancer', '♋', 723], ['Leo', '♌', 823], ['Virgo', '♍', 923], ['Libra', '♎', 1023], ['Scorpio', '♏', 1122], ['Sagittarius', '♐', 1222], ['Capricorn', '♑', 1232]];
function zodiacOf(dob) {
  if (!dob) return null;
  const [, m, d] = String(dob).slice(0, 10).split('-').map(Number);
  const md = m * 100 + d;
  const z = ZODIAC.find((x) => md < x[2]);
  return z ? { name: z[0], sign: z[1] } : null;
}
function istNow() {
  const t = new Date(Date.now() + 330 * 60000);
  return { day: t.toISOString().slice(0, 10), hour: t.getUTCHours(), t };
}

async function auth(req, res, next) {
  if (!req.session.uid) return err(res, 401, 'Please log in');
  const { rows } = await q('SELECT * FROM users WHERE id=$1', [req.session.uid]);
  if (!rows[0]) { req.session = null; return err(res, 401, 'Please log in'); }
  if (rows[0].status === 'banned') return err(res, 403, 'This account has been banned.');
  req.user = rows[0];
  next();
}
const authW = wrap(auth);
const verified = (req, res, next) => (req.user.status === 'verified' ? next() : err(res, 403, 'Verification pending'));

async function activeCount(uid) {
  const { rows } = await q('SELECT count(*)::int AS n FROM matches WHERE (a_id=$1 OR b_id=$1) AND NOT closed', [uid]);
  return rows[0].n;
}
async function destinyAnswers(uid, mode) {
  const { rows } = await q('SELECT answers FROM destiny_answers WHERE user_id=$1 AND mode=$2', [uid, mode]);
  return rows[0] ? rows[0].answers : null;
}
async function photoIds(uid) {
  const { rows } = await q('SELECT id, idx FROM photos WHERE user_id=$1 ORDER BY idx', [uid]);
  return rows;
}

// What another person sees. Extras (destiny %, kundli score) are added by the caller.
function publicUser(u, photos = [], forMode) {
  const mode = forMode || u.mode;
  const out = {
    id: u.id, name: u.name, age: ageOf(u.dob), city: u.city, gender: u.gender, mode: u.mode, masked: u.masked,
    bio: u.bio, prompt_q: u.prompt_q, prompt_a: u.prompt_a, tags: u.tags || [], verified: u.status === 'verified', photos,
    diet: u.diet || '', height_cm: u.height_cm || null
  };
  if (mode === 'forever') { out.religion = u.religion || ''; if (u.kundli_on && u.manglik !== 'unknown') out.manglik = u.manglik; }
  if (mode !== 'forever' && u.show_zodiac) out.zodiac = zodiacOf(u.dob);
  return out;
}
async function meJson(u) {
  const { rows } = await q('SELECT mode FROM destiny_answers WHERE user_id=$1', [u.id]);
  return {
    ...publicUser(u, await photoIds(u.id)), phone: u.phone, interested: u.interested, dob: u.dob, any_city: u.any_city,
    company: u.company, hide_company: u.hide_company, hidden_phones: u.hidden_phones, age_min: u.age_min, age_max: u.age_max,
    trusted_name: u.trusted_name, trusted_phone: u.trusted_phone, status: u.status, reject_reason: u.reject_reason,
    mode_changed_at: u.mode_changed_at, destiny: u.destiny, paused: u.paused, show_zodiac: u.show_zodiac, zodiac: zodiacOf(u.dob),
    religion: u.religion || '', same_religion: u.same_religion, kundli_on: u.kundli_on, kundli_min: u.kundli_min,
    birth_time: u.birth_time, birth_place: u.birth_place, manglik: u.manglik, chart: kundli.chart(u.moon_long),
    destiny_done: rows.map((r) => r.mode), active: await activeCount(u.id), focus: FOCUS
  };
}

// ---------- auth ----------
app.post('/api/signup', wrap(async (req, res) => {
  const phone = normPhone(req.body.phone);
  const pw = String(req.body.password || '');
  if (phone.length !== 10) return err(res, 400, 'Enter a valid 10-digit mobile number');
  if (pw.length < 8) return err(res, 400, 'Password must be at least 8 characters');
  if (!req.body.agree) return err(res, 400, 'Please accept the terms (18+ only)');
  try {
    const { rows } = await q('INSERT INTO users(phone, pass_hash) VALUES($1,$2) RETURNING id', [phone, await bcrypt.hash(pw, 10)]);
    req.session.uid = rows[0].id;
    await q('INSERT INTO audit_ips(user_id, ip) VALUES($1,$2)', [rows[0].id, req.ip]);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === '23505') return err(res, 409, 'An account with this number already exists. Log in instead.');
    throw e;
  }
}));
app.post('/api/login', wrap(async (req, res) => {
  const { rows } = await q('SELECT * FROM users WHERE phone=$1', [normPhone(req.body.phone)]);
  if (!rows[0] || !(await bcrypt.compare(String(req.body.password || ''), rows[0].pass_hash))) return err(res, 401, 'Wrong number or password');
  if (rows[0].status === 'banned') return err(res, 403, 'This account has been banned.');
  req.session.uid = rows[0].id;
  await q('INSERT INTO audit_ips(user_id, ip) VALUES($1,$2)', [rows[0].id, req.ip]);
  res.json({ ok: true });
}));
app.post('/api/logout', (req, res) => { req.session = null; res.json({ ok: true }); });
app.get('/api/me', authW, wrap(async (req, res) => res.json(await meJson(req.user))));

// ---------- profile ----------
app.put('/api/me', authW, wrap(async (req, res) => {
  const b = req.body, u = req.user;
  const gender = GENDERS.includes(b.gender) ? b.gender : u.gender;
  const interested = Array.isArray(b.interested) ? b.interested.filter((g) => GENDERS.includes(g)) : u.interested;
  const mode = MODES.includes(b.mode) ? b.mode : u.mode;
  let modeChanged = u.mode_changed_at;
  if (mode !== u.mode) {
    if (u.mode_changed_at && Date.now() - new Date(u.mode_changed_at).getTime() < 7 * 864e5 && u.status === 'verified') {
      return err(res, 400, 'You can switch category once a week.');
    }
    modeChanged = new Date();
  }
  const dob = b.dob ? String(b.dob).slice(0, 10) : u.dob;
  if (dob && ageOf(dob) < 18) return err(res, 400, 'You must be 18 or older.');
  const ageMin = Math.max(18, parseInt(b.age_min ?? u.age_min, 10) || 18);
  const ageMax = Math.min(80, Math.max(ageMin, parseInt(b.age_max ?? u.age_max, 10) || 60));
  const tags = Array.isArray(b.tags) ? b.tags.map((t) => clean(t, 24)).filter(Boolean).slice(0, 6) : u.tags;
  const hidden = Array.isArray(b.hidden_phones) ? b.hidden_phones.map(normPhone).filter((p) => p.length === 10).slice(0, 500) : u.hidden_phones;
  // Destiny can only be on for a category whose questions you have answered.
  let wantDestiny = typeof b.destiny === 'boolean' ? b.destiny : u.destiny;
  if (wantDestiny && !(await destinyAnswers(u.id, mode))) wantDestiny = false;
  const height = b.height_cm === '' || b.height_cm === null ? null : (parseInt(b.height_cm ?? u.height_cm, 10) || null);
  const kmin = [0, 18, 24, 28].includes(parseInt(b.kundli_min, 10)) ? parseInt(b.kundli_min, 10) : u.kundli_min;
  const bool = (k) => (typeof b[k] === 'boolean' ? b[k] : u[k]);
  await q(`UPDATE users SET name=$2, gender=$3, interested=$4, dob=$5, city=$6, any_city=$7, company=$8, hide_company=$9,
    hidden_phones=$10, mode=$11, mode_changed_at=$12, bio=$13, prompt_q=$14, prompt_a=$15, tags=$16, age_min=$17, age_max=$18,
    trusted_name=$19, trusted_phone=$20, masked=$21, destiny=$22, paused=$23, show_zodiac=$24, religion=$25, diet=$26,
    height_cm=$27, same_religion=$28, kundli_min=$29 WHERE id=$1`,
  [u.id, clean(b.name ?? u.name, 40), gender, interested, dob, normCity(b.city ?? u.city), bool('any_city'),
    clean(b.company ?? u.company, 60), bool('hide_company'), hidden, mode, modeChanged,
    clean(b.bio ?? u.bio, 300), clean(b.prompt_q ?? u.prompt_q, 80), clean(b.prompt_a ?? u.prompt_a, 200), tags,
    ageMin, ageMax, clean(b.trusted_name ?? u.trusted_name, 40), normPhone(b.trusted_phone ?? u.trusted_phone),
    bool('masked'), wantDestiny, bool('paused'), bool('show_zodiac'),
    RELIGIONS.includes(b.religion) || b.religion === '' ? b.religion : u.religion, DIETS.includes(b.diet) || b.diet === '' ? b.diet : u.diet,
    height && height >= 120 && height <= 220 ? height : null, bool('same_religion'), kmin]);
  const { rows } = await q('SELECT * FROM users WHERE id=$1', [u.id]);
  res.json(await meJson(rows[0]));
}));

app.post('/api/me/photos', authW, wrap(async (req, res) => {
  const buf = decodeImage(req.body.image);
  if (!buf) return err(res, 400, 'Upload a JPG, PNG or WEBP under 4 MB');
  const { rows: existing } = await q('SELECT count(*)::int AS n FROM photos WHERE user_id=$1', [req.user.id]);
  if (existing[0].n >= 4) return err(res, 400, 'Up to 4 photos');
  const full = await sharp(buf).rotate().resize(900, 1200, { fit: 'inside' }).jpeg({ quality: 82 }).toBuffer();
  const blur = await sharp(buf).rotate().resize(48, 64, { fit: 'cover' }).blur(6).resize(360, 480).jpeg({ quality: 60 }).toBuffer();
  await q('INSERT INTO photos(user_id, idx, full_img, blur_img) VALUES($1,$2,$3,$4)', [req.user.id, existing[0].n, full, blur]);
  res.json(await photoIds(req.user.id));
}));
app.delete('/api/me/photos/:id', authW, wrap(async (req, res) => {
  await q('DELETE FROM photos WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  const rows = await photoIds(req.user.id);
  for (let i = 0; i < rows.length; i++) await q('UPDATE photos SET idx=$2 WHERE id=$1', [rows[i].id, i]);
  res.json(await photoIds(req.user.id));
}));

// ---------- verification (same check for everyone) ----------
app.post('/api/me/verify', authW, wrap(async (req, res) => {
  const u = req.user;
  if (!u.name || !u.gender || !u.dob || !u.city) return err(res, 400, 'Complete your profile first');
  const { rows: ph } = await q('SELECT count(*)::int AS n FROM photos WHERE user_id=$1', [u.id]);
  if (ph[0].n < 1) return err(res, 400, 'Add at least one photo first');
  const idImg = decodeImage(req.body.id_image), selfie = decodeImage(req.body.selfie);
  const idNum = clean(req.body.id_number, 30);
  if (!idImg || !selfie || idNum.length < 6) return err(res, 400, 'Add your ID photo, ID number and a selfie');
  const idHash = hmac(idNum);
  const { rows: banned } = await q('SELECT 1 FROM banned_ids WHERE id_hash=$1', [idHash]);
  if (banned[0]) return err(res, 403, 'This ID cannot be used on ' + BRAND + '.');
  const { rows: dup } = await q('SELECT id FROM users WHERE id_hash=$1 AND id<>$2', [idHash, u.id]);
  if (dup[0]) return err(res, 409, 'This ID is already linked to another account. One person, one account.');
  await q('UPDATE users SET id_hash=$2, status=$3, reject_reason=$4 WHERE id=$1', [u.id, idHash, 'pending', '']);
  await q(`INSERT INTO verifications(user_id, id_type, id_image, selfie) VALUES($1,$2,$3,$4)
    ON CONFLICT (user_id) DO UPDATE SET id_type=$2, id_image=$3, selfie=$4, submitted_at=now()`,
  [u.id, clean(req.body.id_type, 30), idImg, selfie]);
  res.json({ ok: true, status: 'pending' });
}));

// ---------- kundli (Forever only) ----------
app.put('/api/me/kundli', authW, wrap(async (req, res) => {
  const u = req.user, b = req.body;
  if (b.kundli_on === false) {
    await q('UPDATE users SET kundli_on=false, kundli_min=0 WHERE id=$1', [u.id]);
  } else {
    let long = null;
    const time = /^\d{2}:\d{2}$/.test(String(b.birth_time || '')) ? b.birth_time : '';
    if (b.method === 'manual') long = kundli.fromManual(parseInt(b.rashi, 10), parseInt(b.nakshatra, 10));
    else if (time && u.dob) long = kundli.moonSidereal(u.dob, time);
    if (long === null) return err(res, 400, b.method === 'manual' ? 'That Rashi and Nakshatra don’t go together. Check your kundli.' : 'Add your birth time (and date of birth in your profile).');
    const manglik = ['yes', 'no', 'unknown'].includes(b.manglik) ? b.manglik : 'unknown';
    await q('UPDATE users SET kundli_on=true, moon_long=$2, birth_time=$3, birth_place=$4, manglik=$5 WHERE id=$1',
      [u.id, long, b.method === 'manual' ? '' : time, clean(b.birth_place, 60), manglik]);
  }
  const { rows } = await q('SELECT * FROM users WHERE id=$1', [u.id]);
  res.json(await meJson(rows[0]));
}));

// ---------- destiny ----------
app.get('/api/destiny/questions/:mode', (req, res) => {
  const qs = destiny.QUESTIONS[req.params.mode];
  if (!qs) return err(res, 404, 'Unknown category');
  res.json(qs.map(({ id, q: text, opts }) => ({ id, q: text, opts })));
});
app.get('/api/destiny/answers/:mode', authW, wrap(async (req, res) => res.json((await destinyAnswers(req.user.id, req.params.mode)) || {})));
app.post('/api/destiny/answers', authW, wrap(async (req, res) => {
  const mode = MODES.includes(req.body.mode) ? req.body.mode : req.user.mode;
  const answers = destiny.valid(mode, req.body.answers);
  if (!answers) return err(res, 400, 'Please answer every question');
  await q(`INSERT INTO destiny_answers(user_id, mode, answers) VALUES($1,$2,$3)
    ON CONFLICT (user_id, mode) DO UPDATE SET answers=$3, updated_at=now()`, [req.user.id, mode, answers]);
  if (mode === req.user.mode) await q('UPDATE users SET destiny=true WHERE id=$1', [req.user.id]);
  const { rows } = await q('SELECT * FROM users WHERE id=$1', [req.user.id]);
  res.json(await meJson(rows[0]));
}));

// ---------- photos (privacy-aware, watermarked) ----------
async function matchBetween(a, b) {
  const { rows } = await q('SELECT * FROM matches WHERE (a_id=$1 AND b_id=$2) OR (a_id=$2 AND b_id=$1)', [a, b]);
  return rows[0];
}
async function watermark(img, viewerId) {
  const meta = await sharp(img).metadata();
  const w = meta.width || 900, h = meta.height || 1200;
  const text = `PAUSE · #${viewerId}`;
  let marks = '';
  for (let y = 60; y < h + 200; y += 170) for (let x = -200; x < w; x += 300) marks += `<text x="${x}" y="${y}">${text}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><g transform="rotate(-24 ${w / 2} ${h / 2})" font-family="sans-serif" font-size="22" font-weight="700" fill="#ffffff" fill-opacity="0.16">${marks}</g></svg>`;
  return sharp(img).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 82 }).toBuffer();
}
app.get('/api/photo/:id', authW, wrap(async (req, res) => {
  const { rows } = await q(`SELECT p.id, p.user_id, p.full_img, p.blur_img, u.masked, u.mode, u.status
    FROM photos p JOIN users u ON u.id=p.user_id WHERE p.id=$1`, [req.params.id]);
  const p = rows[0];
  if (!p) return res.status(404).end();
  res.set('Cache-Control', 'private, no-store');
  res.set('Content-Type', 'image/jpeg');
  if (p.user_id === req.user.id) return res.send(p.full_img);
  let full = false;
  const m = await matchBetween(req.user.id, p.user_id);
  if (m) full = m.level >= 1;
  else if (req.user.status === 'verified' && p.status === 'verified' && !req.user.masked && !p.masked && req.user.mode === p.mode) {
    const { rows: bl } = await q('SELECT 1 FROM blocks WHERE (blocker=$1 AND blocked=$2) OR (blocker=$2 AND blocked=$1)', [req.user.id, p.user_id]);
    full = !bl[0];
  }
  res.send(full ? await watermark(p.full_img, req.user.id) : p.blur_img);
}));

// ---------- discover ----------
async function candidates(u, limit = 60) {
  const { rows } = await q(`
    SELECT o.* FROM users o
    WHERE o.id <> $1 AND o.status = 'verified' AND o.mode = $2 AND NOT o.paused
      AND o.gender = ANY($3::text[]) AND $4 = ANY(o.interested)
      AND date_part('year', age(o.dob)) BETWEEN $5 AND $6
      AND $7 BETWEEN o.age_min AND o.age_max
      AND ($8 OR o.any_city OR lower(o.city) = lower($9))
      AND NOT EXISTS (SELECT 1 FROM likes l WHERE l.from_id = $1 AND l.to_id = o.id)
      AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker = $1 AND b.blocked = o.id) OR (b.blocker = o.id AND b.blocked = $1))
      AND NOT EXISTS (SELECT 1 FROM matches m WHERE (m.a_id = $1 AND m.b_id = o.id) OR (m.a_id = o.id AND m.b_id = $1))
      AND (SELECT count(*) FROM matches m WHERE (m.a_id = o.id OR m.b_id = o.id) AND NOT m.closed) < ${FOCUS}
      AND NOT ($10 = ANY(o.hidden_phones)) AND NOT (o.phone = ANY($11::text[]))
      AND NOT ($12 <> '' AND lower(o.company) = lower($12) AND ($13 OR o.hide_company))
    ORDER BY (SELECT count(*) FROM likes l2 WHERE l2.from_id = o.id AND l2.to_id = $1) DESC, random()
    LIMIT ${limit}`,
  [u.id, u.mode, u.interested, u.gender, u.age_min, u.age_max, ageOf(u.dob), u.any_city, u.city,
    u.phone, u.hidden_phones, u.company, u.hide_company]);
  let list = rows;
  if (u.mode === 'forever') {
    if (u.same_religion && u.religion) list = list.filter((o) => o.religion === u.religion);
    if (u.kundli_on && u.kundli_min > 0) list = list.filter((o) => { const s = kundli.pairScore(u, o); return s && s.total >= u.kundli_min; });
  }
  return list;
}
// Adds masked/destiny/kundli info for one candidate.
async function enrich(u, o, myAnswers) {
  const view = publicUser(o, await photoIds(o.id), u.mode);
  view.masked = !!(u.masked || o.masked);
  if (u.destiny && o.destiny && myAnswers) {
    const s = destiny.score(u.mode, myAnswers, await destinyAnswers(o.id, u.mode));
    if (s) view.destiny = s;
  }
  if (u.mode === 'forever' && u.kundli_on && o.kundli_on) {
    const s = kundli.pairScore(u, o);
    if (s) view.kundli = { total: s.total, label: kundli.label(s.total), parts: s.parts };
  }
  return view;
}
app.get('/api/picks', authW, verified, wrap(async (req, res) => {
  const u = req.user;
  const active = await activeCount(u.id);
  if (!LIVE_CITIES.includes(u.city)) return res.json({ live: false, active, picks: [] });
  if (active >= FOCUS) return res.json({ live: true, focus_full: true, active, picks: [] });
  const myAnswers = u.destiny ? await destinyAnswers(u.id, u.mode) : null;
  const list = (await candidates(u, 40)).slice(0, 12);
  const out = [];
  for (const o of list) out.push(await enrich(u, o, myAnswers));
  if (u.destiny) out.sort((a, b) => (b.destiny ? b.destiny.pct : -1) - (a.destiny ? a.destiny.pct : -1));
  res.json({ live: true, active, picks: out.slice(0, 10) });
}));

// The 9 pm Destiny drop: one best-fit person a day for people with Destiny on.
app.get('/api/destiny/drop', authW, verified, wrap(async (req, res) => {
  const u = req.user;
  if (!u.destiny) return res.json({ state: 'off' });
  const { day, hour, t } = istNow();
  const opensAt = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), DROP_HOUR_IST, 0) - 330 * 60000);
  const show = async (row) => {
    if (!row || !row.pick_id) return null;
    const { rows } = await q('SELECT * FROM users WHERE id=$1', [row.pick_id]);
    if (!rows[0] || rows[0].status !== 'verified') return null;
    const { rows: acted } = await q('SELECT kind FROM likes WHERE from_id=$1 AND to_id=$2', [u.id, row.pick_id]);
    const view = await enrich(u, rows[0], await destinyAnswers(u.id, u.mode));
    return { day: row.day, pick: view, score: row.score, reasons: row.reasons, acted: acted[0] ? acted[0].kind : null };
  };
  if (hour < DROP_HOUR_IST) {
    const { rows } = await q('SELECT * FROM destiny_drops WHERE user_id=$1 AND day<$2 ORDER BY day DESC LIMIT 1', [u.id, day]);
    return res.json({ state: 'waiting', opens_at: opensAt.toISOString(), last: await show(rows[0]) });
  }
  let { rows } = await q('SELECT * FROM destiny_drops WHERE user_id=$1 AND day=$2', [u.id, day]);
  if (!rows[0]) {
    const mine = await destinyAnswers(u.id, u.mode);
    const { rows: seen } = await q('SELECT pick_id FROM destiny_drops WHERE user_id=$1 AND pick_id IS NOT NULL', [u.id]);
    const seenIds = new Set(seen.map((r) => r.pick_id));
    let best = null;
    if (mine && (await activeCount(u.id)) < FOCUS && LIVE_CITIES.includes(u.city)) {
      for (const o of await candidates(u, 200)) {
        if (!o.destiny || seenIds.has(o.id)) continue;
        const s = destiny.score(u.mode, mine, await destinyAnswers(o.id, u.mode));
        if (s && (!best || s.pct > best.s.pct)) best = { o, s };
      }
    }
    await q('INSERT INTO destiny_drops(user_id, day, mode, pick_id, score, reasons) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',
      [u.id, day, u.mode, best ? best.o.id : null, best ? best.s.pct : null, JSON.stringify(best ? best.s.reasons : [])]);
    ({ rows } = await q('SELECT * FROM destiny_drops WHERE user_id=$1 AND day=$2', [u.id, day]));
  }
  const drop = await show(rows[0]);
  res.json(drop ? { state: 'ready', ...drop } : { state: 'empty' });
}));

app.post('/api/like/:id', authW, verified, wrap(async (req, res) => {
  const to = parseInt(req.params.id, 10), kind = req.body.kind === 'pass' ? 'pass' : 'like';
  if (to === req.user.id) return err(res, 400, 'Nope');
  const { rows: target } = await q("SELECT * FROM users WHERE id=$1 AND status='verified'", [to]);
  if (!target[0]) return err(res, 404, 'Profile not found');
  if (kind === 'like' && (await activeCount(req.user.id)) >= FOCUS) {
    return err(res, 409, `Focus ${FOCUS}: you’re already talking to ${FOCUS} people. Close a chat politely to meet someone new.`, { focus_full: true });
  }
  await q('INSERT INTO likes(from_id,to_id,kind) VALUES($1,$2,$3) ON CONFLICT (from_id,to_id) DO UPDATE SET kind=$3', [req.user.id, to, kind]);
  if (kind === 'like') {
    const { rows } = await q("SELECT 1 FROM likes WHERE from_id=$1 AND to_id=$2 AND kind='like'", [to, req.user.id]);
    if (rows[0] && (await activeCount(to)) < FOCUS) {
      const [a, b] = [Math.min(to, req.user.id), Math.max(to, req.user.id)];
      const masked = req.user.masked || target[0].masked;
      const { rows: m } = await q(`INSERT INTO matches(a_id,b_id,level) VALUES($1,$2,$3)
        ON CONFLICT (a_id,b_id) DO UPDATE SET closed=false RETURNING id`, [a, b, masked ? 0 : 1]);
      await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m[0].id, masked
        ? 'It’s mutual 🎭 You’re both masked. Talk, play a game, and tap Unmask when you’re ready — photos open only when you both do.'
        : 'It’s mutual. Say hi 👋 Numbers stay private until you both tap Share numbers.']);
      return res.json({ matched: true, match_id: m[0].id, masked });
    }
  }
  res.json({ matched: false });
}));

// ---------- chats, unmask, games ----------
const LEVELS = ['Masked', 'Unmasked', 'Numbers shared'];
const CONTACT_RE = /(\d[\s-]?){10}|@[a-z0-9_.]{3,}|instagram|\binsta\b|whats ?app|\bsnap(chat)?\b|telegram|\bfb\.com|facebook\.com/i;
const ABUSE_RE = /\b(bitch|slut|whore|randi|chutiya|madarchod|bhenchod|behenchod|bhosdi\w*|harami|kutti|kutiya|saali|fuck (you|off)|ugly cow|fat cow)\b/i;
function scamFlag(body) {
  if (/\b(crypto|bitcoin|btc|usdt|binance|forex|trading (tips|signals?)|investment plan|double (your|the) money|guaranteed returns?)\b/i.test(body)) return 'crypto';
  if (/\b(otp|one[- ]time password|verification code|kyc)\b/i.test(body)) return 'otp';
  if (/₹\s?\d|\brs\.?\s?\d{3,}|\b(paytm|g ?pay|google pay|phone ?pe|upi)\b|\b(send|transfer|lend|borrow)\b.{0,25}\b(money|paise|rupees|cash|amount)\b|\b(hospital bill|emergency money|need money|gift card)\b/i.test(body)) return 'money';
  if (/(https?:\/\/|www\.)\S+/i.test(body)) return 'link';
  return null;
}
const TOT = [['Chai ☕', 'Coffee'], ['Mountains ⛰️', 'Beaches 🏖️'], ['Biryani', 'Pizza 🍕'], ['Early bird', 'Night owl 🦉'], ['Text', 'Call'],
  ['Movie at home', 'Theatre 🍿'], ['Road trip 🚗', 'Flight ✈️'], ['Dogs 🐶', 'Cats 🐱'], ['Sweet', 'Spicy 🌶️'], ['Old songs', 'New songs'],
  ['Plan everything', 'Go with the flow'], ['Sunrise', 'Sunset 🌅'], ['Books 📚', 'Podcasts 🎧'], ['Gym', 'Yoga'], ['Street food', 'Fine dining'],
  ['Monsoon 🌧️', 'Winter ❄️'], ['Momos 🥟', 'Golgappe'], ['Window seat', 'Aisle seat'], ['Goa', 'Manali'], ['Big city', 'Small town'],
  ['Saver', 'Spender'], ['Dance', 'Sing (badly)'], ['Ice cream 🍦', 'Kulfi'], ['Ludo', 'Cards 🃏'], ['Long chats', 'Short and sweet'],
  ['Slow dance', 'Fast song'], ['Candlelight 🕯️', 'Neon lights'], ['Late-night drive', 'Late-night call'], ['Surprise me', 'Ask me first'], ['Paneer tikka', 'Dal makhani']];
const LEVEL_DONE = ['', 'You both unmasked 🎭✨ Photos are open now.', 'Numbers shared 📞 Stay safe — meet in a public place first.'];

async function loadMatch(req, res) {
  const { rows } = await q('SELECT * FROM matches WHERE id=$1 AND (a_id=$2 OR b_id=$2)', [req.params.id, req.user.id]);
  if (!rows[0]) { err(res, 404, 'Chat not found'); return null; }
  return rows[0];
}
async function matchView(m, me) {
  const otherId = m.a_id === me.id ? m.b_id : m.a_id;
  const { rows } = await q('SELECT * FROM users WHERE id=$1', [otherId]);
  const o = rows[0];
  const view = publicUser(o, await photoIds(o.id), me.mode);
  if (m.level >= 2) view.phone = o.phone;
  const out = { id: m.id, level: m.level, levels: LEVELS, closed: m.closed, other: view, pending_by: m.pending_by };
  if (me.mode === 'forever' && me.kundli_on && o.kundli_on) { const s = kundli.pairScore(me, o); if (s) out.kundli = { total: s.total, label: kundli.label(s.total) }; }
  return out;
}
function viewMeta(msg, meId) {
  const m = msg.meta || {};
  if (msg.kind === 'tot') {
    const ans = m.ans || {};
    const done = Object.keys(ans).length >= 2;
    return { a: m.a, b: m.b, done, mine: ans[meId] || null, ans: done ? ans : undefined };
  }
  if (msg.kind === 'ttl') {
    const show = m.guess !== null && m.guess !== undefined;
    return { by: m.by, st: m.st, guess: show ? m.guess : null, lie: show || m.by === meId ? m.lie : undefined };
  }
  return undefined;
}
app.get('/api/matches', authW, verified, wrap(async (req, res) => {
  const { rows } = await q(`SELECT m.*, (SELECT CASE WHEN kind='text' THEN body ELSE '🎲 ' || body END FROM messages WHERE match_id=m.id ORDER BY id DESC LIMIT 1) AS last
    FROM matches m WHERE (a_id=$1 OR b_id=$1) AND NOT closed
    AND NOT EXISTS (SELECT 1 FROM blocks b WHERE b.blocker=$1 AND (b.blocked=m.a_id OR b.blocked=m.b_id))
    ORDER BY id DESC`, [req.user.id]);
  const out = [];
  for (const m of rows) out.push({ ...(await matchView(m, req.user)), last: m.last });
  res.json({ focus: FOCUS, chats: out });
}));
app.get('/api/matches/:id', authW, verified, wrap(async (req, res) => {
  const m = await loadMatch(req, res); if (!m) return;
  const { rows: msgs } = await q('SELECT id, sender_id, body, system, kind, meta, flag, created_at FROM messages WHERE match_id=$1 ORDER BY id DESC LIMIT 200', [m.id]);
  res.json({
    ...(await matchView(m, req.user)), me: req.user.id,
    messages: msgs.reverse().map((x) => ({ id: x.id, sender_id: x.sender_id, body: x.body, system: x.system, kind: x.kind, flag: x.sender_id !== req.user.id ? x.flag : null, meta: viewMeta(x, req.user.id), created_at: x.created_at }))
  });
}));
app.post('/api/matches/:id/messages', authW, verified, wrap(async (req, res) => {
  const m = await loadMatch(req, res); if (!m) return;
  if (m.closed) return err(res, 400, 'This chat is closed');
  const body = clean(req.body.body, 1000);
  if (!body) return err(res, 400, 'Empty message');
  if (m.level < 2 && CONTACT_RE.test(body)) return err(res, 400, 'Numbers and social handles unlock when you both tap Share numbers.');
  if (!req.body.confirm && ABUSE_RE.test(body)) return err(res, 409, 'This might come across as hurtful. Send anyway?', { nudge: true });
  await q('INSERT INTO messages(match_id, sender_id, body, flag) VALUES($1,$2,$3,$4)', [m.id, req.user.id, body, scamFlag(body)]);
  res.json({ ok: true });
}));
app.post('/api/matches/:id/reveal', authW, verified, wrap(async (req, res) => {
  const m = await loadMatch(req, res); if (!m) return;
  const action = req.body.action; // request | approve | decline
  if (m.level >= 2) return err(res, 400, 'Everything is already shared');
  const next = m.level + 1;
  const ask = next === 1 ? 'unmask 🎭' : 'share numbers 📞';
  if (action === 'request') {
    if (m.pending_by && m.pending_by !== req.user.id) return err(res, 400, 'They already asked — tap accept below.');
    await q('UPDATE matches SET pending_by=$2 WHERE id=$1', [m.id, req.user.id]);
    await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m.id, `${req.user.name} is ready to ${ask}.`]);
  } else if (action === 'approve' || action === 'decline') {
    if (!m.pending_by || m.pending_by === req.user.id) return err(res, 400, 'Nothing to accept yet');
    if (action === 'approve') {
      await q('UPDATE matches SET level=$2, pending_by=NULL WHERE id=$1', [m.id, next]);
      await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m.id, LEVEL_DONE[next]]);
    } else {
      await q('UPDATE matches SET pending_by=NULL WHERE id=$1', [m.id]);
      await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m.id, 'Not yet — no rush. You can ask again later.']);
    }
  } else if (action === 'cancel') {
    if (m.pending_by !== req.user.id) return err(res, 400, 'Nothing to cancel');
    await q('UPDATE matches SET pending_by=NULL WHERE id=$1', [m.id]);
  } else return err(res, 400, 'Unknown action');
  const { rows: mm } = await q('SELECT * FROM matches WHERE id=$1', [m.id]);
  res.json(await matchView(mm[0], req.user));
}));
app.post('/api/matches/:id/game', authW, verified, wrap(async (req, res) => {
  const m = await loadMatch(req, res); if (!m) return;
  if (m.closed) return err(res, 400, 'This chat is closed');
  if (req.body.type === 'ttl') {
    const st = (Array.isArray(req.body.statements) ? req.body.statements : []).map((s) => clean(s, 120));
    const lie = parseInt(req.body.lie, 10);
    if (st.length !== 3 || st.some((s) => !s) || !(lie >= 0 && lie <= 2)) return err(res, 400, 'Write 3 statements and mark the lie');
    if (m.level < 2 && st.some((s) => CONTACT_RE.test(s))) return err(res, 400, 'No numbers or handles yet 🙂');
    await q("INSERT INTO messages(match_id, sender_id, body, kind, meta) VALUES($1,$2,$3,'ttl',$4)", [m.id, req.user.id, '2 truths, 1 lie', { by: req.user.id, st, lie, guess: null }]);
  } else {
    const { rows } = await q("SELECT meta->>'a' AS a FROM messages WHERE match_id=$1 AND kind='tot'", [m.id]);
    const used = new Set(rows.map((r) => r.a));
    const pool2 = TOT.filter((p) => !used.has(p[0]));
    const [a, b] = (pool2.length ? pool2 : TOT)[Math.floor(Math.random() * (pool2.length || TOT.length))];
    await q("INSERT INTO messages(match_id, sender_id, body, kind, meta) VALUES($1,$2,$3,'tot',$4)", [m.id, req.user.id, `This or that: ${a} or ${b}?`, { a, b, ans: {} }]);
  }
  res.json({ ok: true });
}));
app.post('/api/matches/:id/game/:mid', authW, verified, wrap(async (req, res) => {
  const m = await loadMatch(req, res); if (!m) return;
  const { rows } = await q('SELECT * FROM messages WHERE id=$1 AND match_id=$2', [req.params.mid, m.id]);
  const g = rows[0];
  if (!g || !['tot', 'ttl'].includes(g.kind)) return err(res, 404, 'Game not found');
  const meta = g.meta;
  if (g.kind === 'tot') {
    if (!['a', 'b'].includes(req.body.choice)) return err(res, 400, 'Pick one');
    if (meta.ans[req.user.id]) return err(res, 400, 'You already picked');
    meta.ans[req.user.id] = req.body.choice;
    await q('UPDATE messages SET meta=$2 WHERE id=$1', [g.id, meta]);
    if (Object.keys(meta.ans).length >= 2) {
      const vals = Object.values(meta.ans);
      await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m.id, vals[0] === vals[1] ? `Same vibe ✨ You both picked ${meta[vals[0]]}.` : 'Opposites 😄 Defend your pick!']);
    }
  } else {
    if (meta.by === req.user.id) return err(res, 400, 'Your partner guesses this one');
    if (meta.guess !== null) return err(res, 400, 'Already guessed');
    const guess = parseInt(req.body.guess, 10);
    if (!(guess >= 0 && guess <= 2)) return err(res, 400, 'Pick one');
    meta.guess = guess;
    await q('UPDATE messages SET meta=$2 WHERE id=$1', [g.id, meta]);
    await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m.id, guess === meta.lie ? `${req.user.name} spotted the lie 🕵️` : `${req.user.name} got fooled 😄`]);
  }
  res.json({ ok: true });
}));
app.post('/api/matches/:id/close', authW, verified, wrap(async (req, res) => {
  const m = await loadMatch(req, res); if (!m) return;
  await q('UPDATE matches SET closed=true, pending_by=NULL WHERE id=$1', [m.id]);
  await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m.id, 'This chat was closed politely. Wishing you well 🙏']);
  res.json({ ok: true });
}));

// ---------- safety ----------
app.post('/api/block/:id', authW, wrap(async (req, res) => {
  await q('INSERT INTO blocks VALUES($1,$2) ON CONFLICT DO NOTHING', [req.user.id, req.params.id]);
  const m = await matchBetween(req.user.id, parseInt(req.params.id, 10));
  if (m) await q('UPDATE matches SET closed=true WHERE id=$1', [m.id]);
  res.json({ ok: true });
}));
app.post('/api/report/:id', authW, wrap(async (req, res) => {
  await q('INSERT INTO reports(reporter, reported, reason) VALUES($1,$2,$3)', [req.user.id, req.params.id, clean(req.body.reason, 500)]);
  await q('INSERT INTO blocks VALUES($1,$2) ON CONFLICT DO NOTHING', [req.user.id, req.params.id]);
  const m = await matchBetween(req.user.id, parseInt(req.params.id, 10));
  if (m) await q('UPDATE matches SET closed=true WHERE id=$1', [m.id]);
  res.json({ ok: true });
}));
app.delete('/api/me', authW, wrap(async (req, res) => {
  await q('DELETE FROM users WHERE id=$1', [req.user.id]);
  req.session = null;
  res.json({ ok: true });
}));
app.post('/api/waitlist', wrap(async (req, res) => {
  const phone = normPhone(req.body.phone);
  if (phone.length !== 10) return err(res, 400, 'Enter a valid 10-digit mobile number');
  await q('INSERT INTO waitlist(phone, city) VALUES($1,$2)', [phone, clean(req.body.city, 40)]);
  res.json({ ok: true });
}));

// ---------- Ask PAUSE (help bot) ----------
async function optionalUser(req) {
  if (!req.session || !req.session.uid) return null;
  const { rows } = await q('SELECT id, status, name FROM users WHERE id=$1', [req.session.uid]);
  return rows[0] || null;
}
app.post('/api/help', wrap(async (req, res) => {
  const u = await optionalUser(req);
  res.json(help.answer(clean(req.body.q, 300), u, LIVE_CITIES));
}));
app.post('/api/help/ticket', wrap(async (req, res) => {
  const u = await optionalUser(req);
  const message = clean(req.body.message, 1000);
  if (message.length < 5) return err(res, 400, 'Tell us a little more');
  const contact = u ? '' : clean(req.body.contact, 80);
  if (!u && contact.length < 6) return err(res, 400, 'Add your phone number or email so we can reply');
  await q('INSERT INTO support_tickets(user_id, contact, message) VALUES($1,$2,$3)', [u ? u.id : null, contact, message]);
  res.json({ ok: true });
}));

// ---------- admin ----------
function admin(req, res, next) {
  const a = Buffer.from(req.get('x-admin-password') || ''), b = Buffer.from(ADMIN_PASSWORD);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return err(res, 401, 'Wrong admin password');
  next();
}
app.get('/api/admin/pending', admin, wrap(async (req, res) => {
  const { rows } = await q(`SELECT u.id, u.name, u.gender, u.dob, u.city, u.phone, u.mode, v.id_type, v.submitted_at
    FROM users u JOIN verifications v ON v.user_id=u.id WHERE u.status='pending' ORDER BY v.submitted_at`);
  const out = [];
  for (const r of rows) out.push({ ...r, age: ageOf(r.dob), photos: await photoIds(r.id) });
  res.json(out);
}));
app.get('/api/admin/stats', admin, wrap(async (req, res) => {
  const { rows } = await q(`SELECT
    (SELECT count(*) FROM users)::int AS users,
    (SELECT count(*) FROM users WHERE status='verified')::int AS verified,
    (SELECT count(*) FROM users WHERE status='verified' AND gender='woman')::int AS women,
    (SELECT count(*) FROM users WHERE status='verified' AND gender='man')::int AS men,
    (SELECT count(*) FROM users WHERE status='verified' AND mode='steady')::int AS steady,
    (SELECT count(*) FROM users WHERE status='verified' AND mode='forever')::int AS forever,
    (SELECT count(*) FROM users WHERE status='verified' AND mode='afterdark')::int AS afterdark,
    (SELECT count(*) FROM users WHERE destiny)::int AS destiny_on,
    (SELECT count(*) FROM matches WHERE NOT closed)::int AS active_chats,
    (SELECT count(*) FROM messages WHERE flag IS NOT NULL)::int AS scam_flags,
    (SELECT count(*) FROM waitlist)::int AS waitlist,
    (SELECT count(*) FROM reports WHERE NOT resolved)::int AS open_reports,
    (SELECT count(*) FROM support_tickets WHERE NOT resolved)::int AS open_tickets`);
  res.json(rows[0]);
}));
app.get('/api/admin/verification/:uid/:kind', admin, wrap(async (req, res) => {
  const col = req.params.kind === 'selfie' ? 'selfie' : 'id_image';
  const { rows } = await q(`SELECT ${col} AS img FROM verifications WHERE user_id=$1`, [req.params.uid]);
  if (!rows[0] || !rows[0].img) return res.status(404).end();
  res.set('Content-Type', 'image/jpeg'); res.set('Cache-Control', 'no-store');
  res.send(rows[0].img);
}));
app.get('/api/admin/photo/:id', admin, wrap(async (req, res) => {
  const { rows } = await q('SELECT full_img FROM photos WHERE id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).end();
  res.set('Content-Type', 'image/jpeg'); res.send(rows[0].full_img);
}));
app.post('/api/admin/decide/:uid', admin, wrap(async (req, res) => {
  const approve = req.body.approve === true;
  await q('UPDATE users SET status=$2, reject_reason=$3 WHERE id=$1', [req.params.uid, approve ? 'verified' : 'rejected', approve ? '' : clean(req.body.reason, 200)]);
  await q('UPDATE verifications SET id_image=NULL, selfie=NULL WHERE user_id=$1', [req.params.uid]); // delete ID + selfie after a decision
  res.json({ ok: true });
}));
app.get('/api/admin/reports', admin, wrap(async (req, res) => {
  const { rows } = await q(`SELECT r.id, r.reason, r.created_at, r.reported, u.name AS reported_name, u.phone AS reported_phone, r.reporter,
    (SELECT count(*) FROM messages mm WHERE mm.sender_id=r.reported AND mm.flag IS NOT NULL)::int AS flags
    FROM reports r JOIN users u ON u.id=r.reported WHERE NOT r.resolved ORDER BY r.id DESC`);
  res.json(rows);
}));
app.get('/api/admin/flagged', admin, wrap(async (req, res) => {
  const { rows } = await q(`SELECT u.id, u.name, u.phone, count(*)::int AS flags, array_agg(DISTINCT m.flag) AS kinds
    FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.flag IS NOT NULL AND u.status <> 'banned'
    GROUP BY u.id ORDER BY flags DESC LIMIT 50`);
  res.json(rows);
}));
app.get('/api/admin/tickets', admin, wrap(async (req, res) => {
  const { rows } = await q(`SELECT t.id, t.message, t.contact, t.created_at, u.name, u.phone FROM support_tickets t
    LEFT JOIN users u ON u.id=t.user_id WHERE NOT t.resolved ORDER BY t.id DESC`);
  res.json(rows);
}));
app.post('/api/admin/tickets/:id/resolve', admin, wrap(async (req, res) => { await q('UPDATE support_tickets SET resolved=true WHERE id=$1', [req.params.id]); res.json({ ok: true }); }));
app.post('/api/admin/reports/:id/resolve', admin, wrap(async (req, res) => { await q('UPDATE reports SET resolved=true WHERE id=$1', [req.params.id]); res.json({ ok: true }); }));
app.post('/api/admin/ban/:uid', admin, wrap(async (req, res) => {
  const { rows } = await q('SELECT id_hash FROM users WHERE id=$1', [req.params.uid]);
  if (rows[0] && rows[0].id_hash) await q('INSERT INTO banned_ids(id_hash) VALUES($1) ON CONFLICT DO NOTHING', [rows[0].id_hash]);
  await q("UPDATE users SET status='banned' WHERE id=$1", [req.params.uid]);
  await q('UPDATE matches SET closed=true WHERE a_id=$1 OR b_id=$1', [req.params.uid]);
  await q('UPDATE reports SET resolved=true WHERE reported=$1', [req.params.uid]);
  res.json({ ok: true });
}));

// ---------- pages ----------
app.get('/api/config', (req, res) => res.json({
  brand: BRAND, live_cities: LIVE_CITIES, focus: FOCUS, modes: MODE_NAMES, religions: RELIGIONS, diets: DIETS,
  nakshatras: kundli.NAK, rashis: kundli.RASHI, help_chips: help.CHIPS
}));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.use((e, req, res, next) => { console.error(e); err(res, 500, 'Something went wrong'); });

migrate().then(() => app.listen(PORT, () => console.log(`${BRAND} running on :${PORT}`)))
  .catch((e) => { console.error('Migration failed', e); process.exit(1); });

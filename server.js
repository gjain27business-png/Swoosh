// PAUSE — verified, slow dating for India (MVP)
// Categories: Steady, Forever, After Dark. Switches in every category: Masked and Destiny. Five matches max for everyone: at 5 active matches, new matches pause.
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
const SPOTS = require('./spots');
const IDEAS = require('./ideas');
const help = require('./help');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
// SMS codes (MSG91). Codes are required at sign-up only when both values are set. OTP_DEV=1 logs codes locally instead.
const MSG91_AUTHKEY = process.env.MSG91_AUTHKEY || '', MSG91_TEMPLATE = process.env.MSG91_OTP_TEMPLATE_ID || '';
const OTP_DEV = process.env.OTP_DEV === '1' && process.env.NODE_ENV !== 'production';
const OTP_ON = !!(MSG91_AUTHKEY && MSG91_TEMPLATE) || OTP_DEV;
const BRAND = process.env.BRAND_NAME && !/swoosh/i.test(process.env.BRAND_NAME) ? process.env.BRAND_NAME : 'PAUSE';
const FOCUS = 5;
// A match with no messages for QUIET_DAYS fades and frees the slot. Either person can add EXTEND_DAYS once per quiet spell.
const QUIET_DAYS = 5, EXTEND_DAYS = 2;
const DEADLINE = `COALESCE(m.extended_until, m.last_activity + interval '${QUIET_DAYS} days')`;
const INTENTS = { chai: 'Chai or coffee', walk: 'A walk', activity: 'Something to do', drinks: 'Drinks' };
const DROP_HOUR_IST = Math.min(23, Math.max(0, parseInt(process.env.DESTINY_DROP_HOUR || '21', 10) || 0)); // 9 pm IST

const SCHEMA = (process.env.DB_SCHEMA || '').replace(/[^a-z_]/g, '');
const pool = new Pool({
  ...(SCHEMA ? { options: `-c search_path=${SCHEMA}` } : {}),
  connectionString: process.env.DATABASE_URL || 'postgres://swoosh:swoosh@localhost:5432/swoosh',
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('.render.com') ? { rejectUnauthorized: false } : false
});
const q = (text, params) => pool.query(text, params);

const MODES = ['steady', 'forever', 'afterdark'];
const MODE_NAMES = { steady: 'Steady', forever: 'Forever', afterdark: 'After Dark' };
const LIVE_CITIES = (process.env.LIVE_CITIES || 'Bangalore').split(',').map((c) => c.trim()).filter(Boolean);
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
  ALTER TABLE photos ADD COLUMN IF NOT EXISTS token TEXT;
  CREATE UNIQUE INDEX IF NOT EXISTS photos_token ON photos(token);
  ALTER TABLE verifications ADD COLUMN IF NOT EXISTS id_last4 TEXT DEFAULT '';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS loc_at TIMESTAMPTZ;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS max_km INT DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS insta TEXT DEFAULT '';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin TEXT DEFAULT '';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT FALSE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS id_pending BOOLEAN DEFAULT FALSE;
  CREATE TABLE IF NOT EXISTS otps (phone TEXT NOT NULL, purpose TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, attempts INT DEFAULT 0, PRIMARY KEY (phone, purpose));
  ALTER TABLE likes ADD COLUMN IF NOT EXISTS about TEXT DEFAULT '';
  ALTER TABLE likes ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';
  ALTER TABLE likes ADD COLUMN IF NOT EXISTS intent TEXT DEFAULT '';
  ALTER TABLE likes ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}';
  ALTER TABLE matches ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT now();
  ALTER TABLE matches ADD COLUMN IF NOT EXISTS extended_until TIMESTAMPTZ;
  ALTER TABLE matches ADD COLUMN IF NOT EXISTS extended_by INT;
  ALTER TABLE matches ADD COLUMN IF NOT EXISTS ended_reason TEXT DEFAULT '';
  ALTER TABLE matches ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
  CREATE TABLE IF NOT EXISTS plans (id SERIAL PRIMARY KEY, match_id INT REFERENCES matches(id) ON DELETE CASCADE, by_id INT, what TEXT DEFAULT '',
    place TEXT NOT NULL, area TEXT DEFAULT '', spot_id TEXT DEFAULT '', idea_id TEXT DEFAULT '', slots TIMESTAMPTZ[] NOT NULL, chosen TIMESTAMPTZ,
    status TEXT DEFAULT 'proposed', feedback JSONB DEFAULT '{}', safe JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now());
  CREATE INDEX IF NOT EXISTS plans_match ON plans(match_id);
  `);
  // One-time: everyone verified before social links existed was verified with an ID.
  const { rows: sv } = await q("SELECT 1 FROM app_meta WHERE key='social_v1'");
  if (!sv[0]) {
    await q("UPDATE users SET id_verified=true WHERE status='verified' AND id_hash IS NOT NULL");
    await q("UPDATE users u SET id_pending=true FROM verifications v WHERE v.user_id=u.id AND u.status='pending' AND v.id_image IS NOT NULL");
    await q("INSERT INTO app_meta(key, value) VALUES('social_v1', now()::text) ON CONFLICT DO NOTHING");
  }
  // Photos are addressed by a random token, never by their row number.
  const { rows: untokened } = await q('SELECT id FROM photos WHERE token IS NULL');
  for (const r of untokened) await q('UPDATE photos SET token=$2 WHERE id=$1', [r.id, newToken()]);
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
const newToken = () => crypto.randomBytes(12).toString('hex');
const TOKEN_RE = /^[a-f0-9]{24}$/;

// Simple in-memory rate limiter (one app instance). key -> { n, reset }.
const buckets = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.reset < now) { b = { n: 0, reset: now + windowMs }; buckets.set(key, b); }
  b.n++;
  if (buckets.size > 50000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  return b.n > max ? Math.ceil((b.reset - now) / 60000) : 0;
}
// Per-IP limits are loose because many Indian mobile users share one IP; per-phone and per-account limits do the real work.
const IP_SCALE = Math.max(1, Number(process.env.RL_IP_SCALE) || 1);
const tooMany = (res, mins) => err(res, 429, `Too many attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`);

// ID numbers: normalised, checked against the format for the chosen document, then only a one-way code is kept.
const ID_FORMATS = {
  PAN: [/^[A-Z]{5}\d{4}[A-Z]$/, 'A PAN looks like ABCDE1234F.'],
  'Driving licence': [/^[A-Z]{2}\d{13}$/, 'A driving licence number looks like MH1420110012345.'],
  'Voter ID': [/^[A-Z]{3}\d{7}$/, 'A Voter ID (EPIC) number looks like ABC1234567.'],
  Passport: [/^[A-Z]\d{7}$/, 'A passport number looks like A1234567.']
};
const normId = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
// Step 2: an Instagram or LinkedIn link, seen only by our reviewers. An ID check is optional and adds an ID-verified badge.
const SOCIAL_AUTO = process.env.SOCIAL_AUTO_APPROVE === '1';
function normInsta(v) {
  v = String(v || '').trim(); if (!v) return '';
  const h = v.replace(/^@/, '').replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, '').split(/[/?#]/)[0];
  return /^[A-Za-z0-9._]{1,30}$/.test(h) ? 'https://www.instagram.com/' + h.toLowerCase() : null;
}
function normLinkedin(v) {
  v = String(v || '').trim(); if (!v) return '';
  const m = v.match(/^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/([A-Za-z0-9\-_%]{3,100})\/?(?:[?#].*)?$/i);
  return m ? 'https://www.linkedin.com/in/' + m[1].toLowerCase() : null;
}
const hmac = (s) => crypto.createHmac('sha256', SECRET).update(normId(s)).digest('hex');
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
  return z ? { name: z[0] } : null;
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
for (const name of ['id', 'uid', 'mid']) {
  app.param(name, (req, res, next, v) => (/^\d{1,9}$/.test(v) ? next() : err(res, 404, 'Not found')));
}

async function activeCount(uid) {
  const { rows } = await q('SELECT count(*)::int AS n FROM matches WHERE (a_id=$1 OR b_id=$1) AND NOT closed', [uid]);
  return rows[0].n;
}
async function createMatch(x, y) {
  const [a, b] = [Math.min(x, y), Math.max(x, y)];
  const { rows: us } = await q('SELECT id, masked FROM users WHERE id = ANY($1)', [[a, b]]);
  const masked = us.some((u) => u.masked);
  const { rows: m } = await q(`INSERT INTO matches(a_id,b_id,level) VALUES($1,$2,$3)
    ON CONFLICT (a_id,b_id) DO UPDATE SET closed=false, last_activity=now(), extended_until=NULL, extended_by=NULL, ended_reason='', ended_at=NULL
    RETURNING id, (xmax = 0) AS fresh`, [a, b, masked ? 0 : 1]);
  await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m[0].id, masked
    ? `It’s mutual. You’re both masked: talk first, and photos open only when you both tap Unmask. Say hi within ${QUIET_DAYS} days or the match fades.`
    : `It’s mutual. Numbers stay private until you both choose to share them. Say hi within ${QUIET_DAYS} days or the match fades.`]);
  if (m[0].fresh) {
    // What made each of them pause becomes the first lines of the chat.
    const { rows: ls } = await q(`SELECT from_id, note, meta FROM likes WHERE kind='like' AND ((from_id=$1 AND to_id=$2) OR (from_id=$2 AND to_id=$1))
      AND (about<>'' OR note<>'' OR intent<>'') ORDER BY created_at`, [a, b]);
    for (const l of ls) await q("INSERT INTO messages(match_id, sender_id, body, kind, meta) VALUES($1,$2,$3,'likenote',$4)", [m[0].id, l.from_id, l.note || '', l.meta || {}]);
  }
  return { id: m[0].id, masked };
}
// Any real exchange (a message, a game, a plan) restarts the quiet clock and clears an extension.
const touch = (mid) => q('UPDATE matches SET last_activity=now(), extended_until=NULL, extended_by=NULL WHERE id=$1', [mid]);
// Ends matches that have been quiet past their deadline, then lets waiting likes fill the freed slots.
async function fadeExpired(uid) {
  const { rows } = await q(`UPDATE matches m SET closed=true, pending_by=NULL, ended_reason='faded', ended_at=now()
    WHERE NOT m.closed AND ${DEADLINE} < now() ${uid ? 'AND (m.a_id=$1 OR m.b_id=$1)' : ''} RETURNING id, a_id, b_id`, uid ? [uid] : []);
  for (const r of rows) await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [r.id, `This match faded after ${QUIET_DAYS} quiet days. No hard feelings.`]);
  for (const r of rows) { await resolveWaiting(r.a_id); await resolveWaiting(r.b_id); }
  return rows.length;
}
const endMatch = (mid, reason) => q("UPDATE matches SET closed=true, pending_by=NULL, ended_reason=$2, ended_at=now() WHERE id=$1 AND NOT closed", [mid, reason]);
// Mutual likes that arrived while one side already had five matches wait here.
// When a slot frees up, the oldest waiting pair (both sides under five, never matched before) becomes a match.
async function resolveWaiting(uid) {
  for (;;) {
    if ((await activeCount(uid)) >= FOCUS) return;
    const { rows } = await q(`SELECT l1.to_id AS other FROM likes l1
      JOIN likes l2 ON l2.from_id = l1.to_id AND l2.to_id = l1.from_id AND l2.kind = 'like'
      JOIN users o ON o.id = l1.to_id AND o.status = 'verified'
      WHERE l1.from_id = $1 AND l1.kind = 'like'
        AND NOT EXISTS (SELECT 1 FROM matches m WHERE m.a_id = LEAST($1, l1.to_id) AND m.b_id = GREATEST($1, l1.to_id))
        AND NOT EXISTS (SELECT 1 FROM blocks bl WHERE (bl.blocker = $1 AND bl.blocked = l1.to_id) OR (bl.blocker = l1.to_id AND bl.blocked = $1))
        AND (SELECT count(*) FROM matches m2 WHERE (m2.a_id = l1.to_id OR m2.b_id = l1.to_id) AND NOT m2.closed) < ${FOCUS}
      ORDER BY GREATEST(l1.created_at, l2.created_at) LIMIT 1`, [uid]);
    if (!rows[0]) return;
    await createMatch(uid, rows[0].other);
  }
}
async function destinyAnswers(uid, mode) {
  const { rows } = await q('SELECT answers FROM destiny_answers WHERE user_id=$1 AND mode=$2', [uid, mode]);
  return rows[0] ? rows[0].answers : null;
}
async function photoIds(uid) {
  const { rows } = await q('SELECT token AS id, idx FROM photos WHERE user_id=$1 ORDER BY idx', [uid]);
  return rows;
}

// What another person sees. Extras (destiny %, kundli score) are added by the caller.
function publicUser(u, photos = [], forMode) {
  const mode = forMode || u.mode;
  const out = {
    id: u.id, name: u.name, age: ageOf(u.dob), city: u.city, gender: u.gender, mode: u.mode, masked: u.masked,
    bio: u.bio, prompt_q: u.prompt_q, prompt_a: u.prompt_a, tags: u.tags || [], verified: u.status === 'verified', id_verified: !!u.id_verified, photos,
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
    insta: u.insta || '', linkedin: u.linkedin || '', id_pending: !!u.id_pending, located: u.lat != null, max_km: u.max_km || 0,
    mode_changed_at: u.mode_changed_at, destiny: u.destiny, paused: u.paused, show_zodiac: u.show_zodiac, zodiac: zodiacOf(u.dob),
    religion: u.religion || '', same_religion: u.same_religion, kundli_on: u.kundli_on, kundli_min: u.kundli_min,
    birth_time: u.birth_time, birth_place: u.birth_place, manglik: u.manglik, chart: kundli.chart(u.moon_long),
    destiny_done: rows.map((r) => r.mode), active: await activeCount(u.id), focus: FOCUS
  };
}

// ---------- SMS codes ----------
const otpHash = (phone, purpose, code) => crypto.createHmac('sha256', SECRET).update(`${phone}:${purpose}:${code}`).digest('hex');
async function sendSms(phone, code) {
  if (OTP_DEV && !MSG91_AUTHKEY) { console.log(`[otp] ${phone}: ${code}`); return true; }
  const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(MSG91_TEMPLATE)}&mobile=91${phone}&otp=${code}&otp_length=6&otp_expiry=10`;
  try {
    const r = await fetch(url, { method: 'POST', headers: { authkey: MSG91_AUTHKEY, 'Content-Type': 'application/json' }, body: '{}' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.type === 'error') { console.error('[otp] send failed', r.status, j.message || ''); return false; }
    return true;
  } catch (e) { console.error('[otp] send failed', e.message); return false; }
}
async function checkOtp(phone, purpose, code) {
  const { rows } = await q('SELECT * FROM otps WHERE phone=$1 AND purpose=$2', [phone, purpose]);
  const o = rows[0];
  if (!o || new Date(o.expires_at) < new Date() || o.attempts >= 5) return false;
  const a = Buffer.from(otpHash(phone, purpose, String(code || '').trim())), b = Buffer.from(o.code_hash);
  if (!crypto.timingSafeEqual(a, b)) { await q('UPDATE otps SET attempts=attempts+1 WHERE phone=$1 AND purpose=$2', [phone, purpose]); return false; }
  await q('DELETE FROM otps WHERE phone=$1 AND purpose=$2', [phone, purpose]);
  return true;
}
app.post('/api/otp/send', wrap(async (req, res) => {
  if (!OTP_ON) return err(res, 400, 'SMS codes are not switched on yet');
  const phone = normPhone(req.body.phone), purpose = req.body.purpose === 'reset' ? 'reset' : 'signup';
  if (phone.length !== 10 || !/^[6-9]/.test(phone)) return err(res, 400, 'Enter a valid 10-digit mobile number');
  const wait = limited('otp-ip:' + req.ip, 20 * IP_SCALE, 60 * 60000) || limited('otp-phone:' + phone, 3, 10 * 60000) || limited('otp-day:' + phone, 8, 24 * 60 * 60000);
  if (wait) return tooMany(res, wait);
  const { rows } = await q('SELECT id FROM users WHERE phone=$1', [phone]);
  if (purpose === 'signup' && rows[0]) return err(res, 409, 'An account with this number already exists. Log in instead.');
  if (purpose === 'reset' && !rows[0]) return res.json({ ok: true }); // don't reveal which numbers have accounts
  const code = String(crypto.randomInt(100000, 1000000));
  await q(`INSERT INTO otps(phone, purpose, code_hash, expires_at, attempts) VALUES($1,$2,$3, now() + interval '10 minutes', 0)
    ON CONFLICT (phone, purpose) DO UPDATE SET code_hash=$3, expires_at=now() + interval '10 minutes', attempts=0`, [phone, purpose, otpHash(phone, purpose, code)]);
  if (!(await sendSms(phone, code))) return err(res, 502, 'We couldn’t send the code. Try again in a minute.');
  res.json({ ok: true });
}));
app.post('/api/password/reset', wrap(async (req, res) => {
  if (!OTP_ON) return err(res, 400, 'Password reset by SMS is not switched on yet');
  const phone = normPhone(req.body.phone), pw = String(req.body.password || '');
  if (pw.length < 8) return err(res, 400, 'Password must be at least 8 characters');
  if (!(await checkOtp(phone, 'reset', req.body.otp))) return err(res, 400, 'That code is wrong or has expired. Ask for a new one.');
  const { rows } = await q('UPDATE users SET pass_hash=$2 WHERE phone=$1 RETURNING id, status', [phone, await bcrypt.hash(pw, 10)]);
  if (!rows[0]) return err(res, 400, 'That code is wrong or has expired. Ask for a new one.');
  if (rows[0].status === 'banned') return err(res, 403, 'This account has been banned.');
  buckets.delete('login-phone:' + phone);
  req.session.uid = rows[0].id;
  res.json({ ok: true });
}));

// ---------- auth ----------
app.post('/api/signup', wrap(async (req, res) => {
  const wait = limited('signup:' + req.ip, 30 * IP_SCALE, 60 * 60000);
  if (wait) return tooMany(res, wait);
  const phone = normPhone(req.body.phone);
  const pw = String(req.body.password || '');
  if (phone.length !== 10) return err(res, 400, 'Enter a valid 10-digit mobile number');
  if (pw.length < 8) return err(res, 400, 'Password must be at least 8 characters');
  if (!req.body.agree) return err(res, 400, 'Please accept the terms (18+ only)');
  if (OTP_ON && !(await checkOtp(phone, 'signup', req.body.otp))) return err(res, 400, 'That code is wrong or has expired. Ask for a new one.');
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
  const phone = normPhone(req.body.phone);
  const wait = limited('login-ip:' + req.ip, 100 * IP_SCALE, 15 * 60000) || limited('login-phone:' + phone, 8, 15 * 60000);
  if (wait) return tooMany(res, wait);
  const { rows } = await q('SELECT * FROM users WHERE phone=$1', [phone]);
  if (!rows[0] || !(await bcrypt.compare(String(req.body.password || ''), rows[0].pass_hash))) return err(res, 401, 'Wrong number or password');
  buckets.delete('login-phone:' + phone);
  if (rows[0].status === 'banned') return err(res, 403, 'This account has been banned.');
  req.session.uid = rows[0].id;
  await q('INSERT INTO audit_ips(user_id, ip) VALUES($1,$2)', [rows[0].id, req.ip]);
  res.json({ ok: true });
}));
app.post('/api/logout', (req, res) => { req.session = null; res.json({ ok: true }); });
app.get('/api/me', authW, wrap(async (req, res) => { await fadeExpired(req.user.id); res.json(await meJson(req.user)); }));

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
  if (b.max_km !== undefined) { const mk = [0, 5, 10, 25].includes(Number(b.max_km)) ? Number(b.max_km) : 0; await q('UPDATE users SET max_km=$2 WHERE id=$1', [u.id, mk]); }
  if ([b.name, b.bio, b.prompt_a, ...(Array.isArray(b.tags) ? b.tags : [])].some((t) => t && hasContact(t))) {
    return err(res, 400, 'Keep numbers, emails and social handles out of your profile. You can share them in a chat once you both agree.');
  }
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
  await q('INSERT INTO photos(user_id, idx, full_img, blur_img, token) VALUES($1,$2,$3,$4,$5)', [req.user.id, existing[0].n, full, blur, newToken()]);
  res.json(await photoIds(req.user.id));
}));
app.delete('/api/me/photos/:token', authW, wrap(async (req, res) => {
  await q('DELETE FROM photos WHERE token=$1 AND user_id=$2', [String(req.params.token), req.user.id]);
  const rows = await photoIds(req.user.id);
  for (let i = 0; i < rows.length; i++) await q('UPDATE photos SET idx=$2 WHERE token=$1', [rows[i].id, i]);
  res.json(await photoIds(req.user.id));
}));

// ---------- location (optional) ----------
// We keep an area, not a spot: coordinates are snapped to a ~1 km grid, and other members only ever see a distance range.
const snap = (v) => Math.round(v * 100) / 100;
function kmBetween(a, b) {
  if (a.lat == null || b.lat == null) return null;
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function distLabel(km) {
  if (km == null) return null;
  if (km < 2) return 'Under 2 km away';
  if (km < 5) return '2 to 5 km away';
  if (km < 10) return '5 to 10 km away';
  if (km < 25) return '10 to 25 km away';
  return 'More than 25 km away';
}
app.put('/api/me/location', authW, wrap(async (req, res) => {
  const b = req.body || {};
  if (b.off) { await q('UPDATE users SET lat=NULL, lng=NULL, loc_at=NULL WHERE id=$1', [req.user.id]); return res.json({ ok: true, on: false }); }
  const lat = Number(b.lat), lng = Number(b.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 6 || lat > 37.5 || lng < 68 || lng > 97.5) return err(res, 400, 'That location is outside India');
  if (limited('loc:' + req.user.id, 30, 60 * 60000)) return err(res, 429, 'Too many location updates');
  await q('UPDATE users SET lat=$2, lng=$3, loc_at=now() WHERE id=$1', [req.user.id, snap(lat), snap(lng)]);
  res.json({ ok: true, on: true });
}));

// ---------- verification: social link (required), ID (optional badge) ----------
app.post('/api/me/social', authW, wrap(async (req, res) => {
  const u = req.user;
  if (!u.name || !u.gender || !u.dob || !u.city) return err(res, 400, 'Complete your profile first');
  const { rows: ph } = await q('SELECT count(*)::int AS n FROM photos WHERE user_id=$1', [u.id]);
  if (ph[0].n < 1) return err(res, 400, 'Add at least one photo first');
  const wait = limited('social:' + u.id, 10, 24 * 60 * 60000);
  if (wait) return tooMany(res, wait);
  const insta = normInsta(req.body.instagram), li = normLinkedin(req.body.linkedin);
  if (insta === null) return err(res, 400, 'That Instagram doesn’t look right. Use your @handle or profile link.');
  if (li === null) return err(res, 400, 'That LinkedIn doesn’t look right. Use your profile link, like linkedin.com/in/your-name.');
  if (!insta && !li) return err(res, 400, 'Add your Instagram or LinkedIn');
  const { rows: dup } = await q(`SELECT id FROM users WHERE id<>$1
    AND ((insta<>'' AND insta=$2) OR (linkedin<>'' AND linkedin=$3))`, [u.id, insta || '-', li || '-']);
  if (dup[0]) return err(res, 409, 'That profile is already linked to another account. One person, one account.');
  const next = u.status === 'verified' ? 'verified' : SOCIAL_AUTO ? 'verified' : 'pending';
  await q('UPDATE users SET insta=$2, linkedin=$3, status=$4, reject_reason=$5 WHERE id=$1', [u.id, insta, li, next, '']);
  res.json({ ok: true, status: next });
}));

// ---------- ID check (optional, same for everyone) ----------
app.post('/api/me/verify', authW, wrap(async (req, res) => {
  const u = req.user;
  if (!u.name || !u.gender || !u.dob || !u.city) return err(res, 400, 'Complete your profile first');
  const { rows: ph } = await q('SELECT count(*)::int AS n FROM photos WHERE user_id=$1', [u.id]);
  if (ph[0].n < 1) return err(res, 400, 'Add at least one photo first');
  const wait = limited('verify:' + u.id, 6, 24 * 60 * 60000);
  if (wait) return tooMany(res, wait);
  const idImg = decodeImage(req.body.id_image), selfie = decodeImage(req.body.selfie);
  const idType = ID_FORMATS[req.body.id_type] ? req.body.id_type : '';
  const idNum = normId(clean(req.body.id_number, 40));
  if (!idType) return err(res, 400, 'Choose your ID type');
  if (!idImg || !selfie || !idNum) return err(res, 400, 'Add your ID photo, ID number and a selfie');
  if (!ID_FORMATS[idType][0].test(idNum)) return err(res, 400, 'That doesn’t look like a valid ' + idType + ' number. ' + ID_FORMATS[idType][1]);
  const idHash = hmac(idNum);
  const { rows: banned } = await q('SELECT 1 FROM banned_ids WHERE id_hash=$1', [idHash]);
  if (banned[0]) return err(res, 403, 'This ID cannot be used on ' + BRAND + '.');
  const { rows: dup } = await q('SELECT id FROM users WHERE id_hash=$1 AND id<>$2', [idHash, u.id]);
  if (dup[0]) return err(res, 409, 'This ID is already linked to another account. One person, one account.');
  await q(`UPDATE users SET id_hash=$2, id_pending=true, reject_reason='', status=CASE WHEN status IN ('new','rejected') THEN 'pending' ELSE status END WHERE id=$1`, [u.id, idHash]);
  await q(`INSERT INTO verifications(user_id, id_type, id_image, selfie, id_last4) VALUES($1,$2,$3,$4,$5)
    ON CONFLICT (user_id) DO UPDATE SET id_type=$2, id_image=$3, selfie=$4, id_last4=$5, submitted_at=now()`,
  [u.id, idType, idImg, selfie, idNum.slice(-4)]);
  const { rows: st } = await q('SELECT status FROM users WHERE id=$1', [u.id]);
  res.json({ ok: true, status: st[0].status });
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
// Who may see a photo: its owner; an open match (sharp only after both unmask); or someone this person
// could actually be shown in picks (same category, mutual interest, not paused, not blocked, contact shield respected).
function couldSee(me, o) {
  if (o.status !== 'verified' || o.paused || o.mode !== me.mode) return false;
  if (!(me.interested || []).includes(o.gender) || !(o.interested || []).includes(me.gender)) return false;
  if ((o.hidden_phones || []).includes(me.phone) || (me.hidden_phones || []).includes(o.phone)) return false;
  if (me.company && o.company && me.company.toLowerCase() === o.company.toLowerCase() && (me.hide_company || o.hide_company)) return false;
  return true;
}
const wmCache = new Map(); // `${photo}:${viewer}` -> watermarked jpeg, kept small
async function watermarkCached(pid, img, viewerId) {
  const key = pid + ':' + viewerId;
  if (wmCache.has(key)) { const v = wmCache.get(key); wmCache.delete(key); wmCache.set(key, v); return v; }
  const out = await watermark(img, viewerId);
  wmCache.set(key, out);
  if (wmCache.size > 300) wmCache.delete(wmCache.keys().next().value);
  return out;
}
app.get('/api/photo/:token', authW, wrap(async (req, res) => {
  const token = String(req.params.token);
  if (!TOKEN_RE.test(token)) return res.status(404).end();
  const { rows } = await q(`SELECT p.id AS pid, p.user_id, p.full_img, p.blur_img, u.masked, u.mode, u.status, u.paused, u.gender, u.interested,
      u.phone, u.hidden_phones, u.company, u.hide_company
    FROM photos p JOIN users u ON u.id=p.user_id WHERE p.token=$1`, [token]);
  const p = rows[0], me = req.user;
  if (!p) return res.status(404).end();
  res.set('Cache-Control', 'private, no-store');
  res.set('Content-Type', 'image/jpeg');
  if (p.user_id === me.id) return res.send(p.full_img);
  if (me.status !== 'verified') return res.status(404).end();
  const { rows: bl } = await q('SELECT 1 FROM blocks WHERE (blocker=$1 AND blocked=$2) OR (blocker=$2 AND blocked=$1)', [me.id, p.user_id]);
  if (bl[0]) return res.status(404).end();
  const m = await matchBetween(me.id, p.user_id);
  let full;
  if (m) {
    if (m.closed) return res.status(404).end();
    full = m.level >= 1;
  } else {
    if (!couldSee(me, p)) return res.status(404).end();
    full = !me.masked && !p.masked;
  }
  res.send(full ? await watermarkCached(p.pid, p.full_img, me.id) : p.blur_img);
}));

// ---------- discover ----------
async function candidates(u, limit = 60, sort = 'near') {
  const DIST = `(CASE WHEN $14::float8 IS NULL OR o.lat IS NULL THEN NULL ELSE 111.32 * sqrt(power(o.lat - $14::float8, 2) + power((o.lng - $15::float8) * cos(radians($14::float8)), 2)) END)`;
  const order = sort === 'new' ? 'o.created_at DESC' : sort === 'random' ? 'random()' : `COALESCE(floor(${DIST} / 3), 999), random()`;
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
      AND (${DIST} IS NULL OR (($16 = 0 OR ${DIST} <= $16) AND (COALESCE(o.max_km, 0) = 0 OR ${DIST} <= o.max_km)))
    ORDER BY (SELECT count(*) FROM likes l2 WHERE l2.from_id = o.id AND l2.to_id = $1) DESC, ${order}
    LIMIT ${limit}`,
  [u.id, u.mode, u.interested, u.gender, u.age_min, u.age_max, ageOf(u.dob), u.any_city, u.city,
    u.phone, u.hidden_phones, u.company, u.hide_company, u.lat, u.lng, u.max_km || 0]);
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
  view.distance = distLabel(kmBetween(u, o));
  const mine = (u.tags || []).map((t) => t.toLowerCase());
  view.shared = (o.tags || []).filter((t) => mine.includes(t.toLowerCase()));
  view.is_new = Date.now() - new Date(o.created_at).getTime() < 7 * 86400000;
  const { rows: lk } = await q("SELECT note, intent, meta FROM likes WHERE from_id=$1 AND to_id=$2 AND kind='like'", [o.id, u.id]);
  if (lk[0]) { const mt = lk[0].meta || {}; view.liked_you = { label: mt.label || '', q: mt.q || '', text: mt.text || '', photo: mt.photo || '', note: lk[0].note || '', intent: INTENTS[lk[0].intent] || '' }; }
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
// The match closest to fading, if it fades within a day.
async function expiringSoon(uid) {
  const { rows } = await q(`SELECT m.id, ${DEADLINE} AS deadline, u.name FROM matches m JOIN users u ON u.id = CASE WHEN m.a_id=$1 THEN m.b_id ELSE m.a_id END
    WHERE (m.a_id=$1 OR m.b_id=$1) AND NOT m.closed AND ${DEADLINE} < now() + interval '1 day' ORDER BY 2 LIMIT 1`, [uid]);
  return rows[0] ? { id: rows[0].id, name: rows[0].name, deadline: rows[0].deadline } : null;
}
app.get('/api/picks', authW, verified, wrap(async (req, res) => {
  const u = req.user;
  await fadeExpired(u.id);
  const active = await activeCount(u.id);
  const expiring = await expiringSoon(u.id);
  if (!LIVE_CITIES.includes(u.city)) return res.json({ live: false, active, expiring, picks: [] });
  const myAnswers = u.destiny ? await destinyAnswers(u.id, u.mode) : null;
  const list = (await candidates(u, 40)).slice(0, 12);
  const out = [];
  for (const o of list) out.push(await enrich(u, o, myAnswers));
  if (u.destiny) out.sort((a, b) => (b.liked_you ? 1 : 0) - (a.liked_you ? 1 : 0) || (b.destiny ? b.destiny.pct : -1) - (a.destiny ? a.destiny.pct : -1));
  res.json({ live: true, active, focus_full: active >= FOCUS, expiring, picks: out.slice(0, 10) });
}));
// Explore: browse a grid instead of one card at a time. Same people and rules as picks.
app.get('/api/explore', authW, verified, wrap(async (req, res) => {
  const u = req.user;
  await fadeExpired(u.id);
  const active = await activeCount(u.id);
  if (!LIVE_CITIES.includes(u.city)) return res.json({ live: false, active, people: [] });
  const view = ['near', 'new', 'shared', 'destiny'].includes(req.query.view) ? req.query.view : 'near';
  const tag = clean(req.query.tag, 40).toLowerCase();
  const myAnswers = u.destiny ? await destinyAnswers(u.id, u.mode) : null;
  const list = await candidates(u, 60, view === 'new' ? 'new' : view === 'near' ? 'near' : 'random');
  let out = [];
  for (const o of list) {
    if (tag && !(o.tags || []).some((t) => t.toLowerCase() === tag)) continue;
    out.push(await enrich(u, o, myAnswers));
  }
  if (view === 'shared') out = out.filter((p) => p.shared.length).sort((a, b) => b.shared.length - a.shared.length);
  if (view === 'destiny') out = out.filter((p) => p.destiny).sort((a, b) => b.destiny.pct - a.destiny.pct);
  const tags = {};
  for (const o of list) for (const t of o.tags || []) { const k = t.toLowerCase(); tags[k] = (tags[k] || 0) + 1; }
  res.json({ live: true, active, focus_full: active >= FOCUS, located: u.lat != null, view, people: out.slice(0, 30),
    tags: Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t) });
}));
// Public date spots for the map. Busy, public places only.
app.get('/api/spots', authW, (req, res) => res.json(SPOTS));
app.get('/api/ideas', authW, (req, res) => res.json(IDEAS));

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
  await fadeExpired(req.user.id);
  if (kind === 'like' && (await activeCount(req.user.id)) >= FOCUS) {
    return err(res, 409, `You have ${FOCUS} active matches, the most anyone can have. New matches are paused until you end one.`, { focus_full: true });
  }
  // "What made you pause?": the part of their profile you liked, an optional line, and what you'd be up for.
  let about = '', note = '', intent = '', meta = {};
  if (kind === 'like') {
    const t = target[0], a = String(req.body.about || '');
    note = clean(req.body.note, 140);
    if (note && hasContact(note)) return err(res, 400, 'Keep numbers and handles out of your note. You can share them once you both agree.');
    if (note && ABUSE_RE.test(note)) return err(res, 400, 'Keep it kind. Try saying what you liked about them.');
    if (a === 'prompt' && t.prompt_a) meta = { label: 'answer', q: t.prompt_q, text: t.prompt_a };
    else if (a === 'bio' && t.bio) meta = { label: 'bio', text: t.bio.length > 160 ? t.bio.slice(0, 157) + '…' : t.bio };
    else if (/^photo:[0-3]$/.test(a) && !req.user.masked && !t.masked) {
      const { rows: ph } = await q('SELECT token FROM photos WHERE user_id=$1 AND idx=$2', [t.id, Number(a.slice(6))]);
      if (ph[0]) meta = { label: 'photo', photo: ph[0].token };
    }
    if (meta.label) about = a;
    intent = INTENTS[req.body.intent] ? req.body.intent : '';
    if (intent) meta.intent_label = INTENTS[intent];
  }
  await q(`INSERT INTO likes(from_id,to_id,kind,about,note,intent,meta) VALUES($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (from_id,to_id) DO UPDATE SET kind=$3, about=$4, note=$5, intent=$6, meta=$7`, [req.user.id, to, kind, about, note, intent, meta]);
  if (kind === 'like') {
    const { rows } = await q("SELECT 1 FROM likes WHERE from_id=$1 AND to_id=$2 AND kind='like'", [to, req.user.id]);
    if (rows[0]) {
      const { rows: blk } = await q('SELECT 1 FROM blocks WHERE (blocker=$1 AND blocked=$2) OR (blocker=$2 AND blocked=$1)', [req.user.id, to]);
      if (blk[0]) return res.json({ matched: false });
      if ((await activeCount(to)) < FOCUS) {
        const m = await createMatch(req.user.id, to);
        return res.json({ matched: true, match_id: m.id, masked: m.masked });
      }
      // They already have five matches: the like waits and becomes a match when they free a slot.
      return res.json({ matched: false, waiting: true });
    }
  }
  res.json({ matched: false });
}));

// ---------- chats, unmask, games ----------
const LEVELS = ['Masked', 'Unmasked', 'Numbers shared'];
// Contact details stay locked until both people choose Share numbers. Catches numbers split by spaces,
// dots or dashes, numbers written in words (English and common Hindi), emails, @handles and app names.
const NUM_WORDS = { zero: 1, oh: 1, one: 1, two: 1, three: 1, four: 1, five: 1, six: 1, seven: 1, eight: 1, nine: 1, shunya: 1, ek: 1, paanch: 1, panch: 1, saat: 1, aath: 1, nau: 1 };
const HANDLE_RE = /@[a-z0-9_.]{3,}|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|\b(instagram|insta|ig|snap|snapchat|whats ?app|wa\.me|telegram|t\.me|facebook|fb|gmail)\b/i;
function hasContact(text) {
  const body = String(text || '');
  if (HANDLE_RE.test(body)) return true;
  let run = 0;
  for (const t of body.toLowerCase().split(/[\s.,\-()+/_:;|*#]+/)) {
    if (!t) continue;
    if (/^\d+$/.test(t)) run += t.length;
    else if (NUM_WORDS[t]) run += 1;
    else run = 0;
    if (run >= 10) return true;
  }
  return false;
}
const ABUSE_RE = /\b(bitch|slut|whore|randi|chutiya|madarchod|bhenchod|behenchod|bhosdi\w*|harami|kutti|kutiya|saali|fuck (you|off)|ugly cow|fat cow)\b/i;
function scamFlag(body) {
  if (/\b(crypto|bitcoin|btc|usdt|binance|forex|trading (tips|signals?)|investment plan|double (your|the) money|guaranteed returns?)\b/i.test(body)) return 'crypto';
  if (/\b(otp|one[- ]time password|verification code|kyc)\b/i.test(body)) return 'otp';
  if (/₹\s?\d|\brs\.?\s?\d{3,}|\b(paytm|g ?pay|google pay|phone ?pe|upi)\b|\b(send|transfer|lend|borrow)\b.{0,25}\b(money|paise|rupees|cash|amount)\b|\b(hospital bill|emergency money|need money|gift card)\b/i.test(body)) return 'money';
  if (/(https?:\/\/|www\.)\S+/i.test(body)) return 'link';
  return null;
}
const TOT = [['Chai', 'Coffee'], ['Mountains', 'Beaches'], ['Biryani', 'Pizza'], ['Early bird', 'Night owl'], ['Text', 'Call'],
  ['Movie at home', 'Theatre'], ['Road trip', 'Flight'], ['Dogs', 'Cats'], ['Sweet', 'Spicy'], ['Old songs', 'New songs'],
  ['Plan everything', 'Go with the flow'], ['Sunrise', 'Sunset'], ['Books', 'Podcasts'], ['Gym', 'Yoga'], ['Street food', 'Fine dining'],
  ['Monsoon', 'Winter'], ['Momos', 'Golgappe'], ['Window seat', 'Aisle seat'], ['Goa', 'Manali'], ['Big city', 'Small town'],
  ['Saver', 'Spender'], ['Dance', 'Sing (badly)'], ['Ice cream', 'Kulfi'], ['Ludo', 'Cards'], ['Long chats', 'Short and sweet'],
  ['Slow dance', 'Fast song'], ['Candlelight', 'Neon lights'], ['Late-night drive', 'Late-night call'], ['Surprise me', 'Ask me first'], ['Paneer tikka', 'Dal makhani']];
const BLR = [['Filter coffee', 'Chai'], ['Indiranagar', 'Koramangala'], ['Masala dosa', 'Idli vada'], ['Metro', 'Auto'], ['Cubbon Park', 'Lalbagh'],
  ['Nandi Hills sunrise', 'Sleep in'], ['Brewery', 'Darshini'], ['Old Bangalore', 'New Bangalore'], ['Rain on the window', 'Rain on a bike'], ['Church Street books', 'Commercial Street shopping'],
  ['Weekend in Coorg', 'Weekend in Pondy'], ['Bisi bele bath', 'Biryani'], ['Benne dosa', 'Ghee roast'], ['Working from a café', 'Working from home'], ['Traffic podcast', 'Traffic playlist']];
const WYR = [['Cook together', 'Eat out every night'], ['Travel with no plan', 'Travel with a perfect plan'], ['Always be 10 minutes early', 'Always be 10 minutes late'],
  ['Live in the hills', 'Live by the sea'], ['Know every language', 'Play every instrument'], ['Have a great first date', 'Have a great tenth date'],
  ['Only text', 'Only call'], ['Give up sweets', 'Give up chai'], ['Sing karaoke on a first date', 'Dance on a first date'], ['Read their mind for a day', 'Be invisible for a day'],
  ['Plan the date', 'Be surprised'], ['A long drive', 'A long walk'], ['Win a quiz', 'Win an argument'], ['Have a pet dog', 'Have a pet cat'], ['Rewatch a favourite', 'Try something new']];
const DECKS = { tot: ['This or that', TOT], blr: ['This or that: Bangalore', BLR], wyr: ['Would you rather', WYR] };
const QUESTIONS = ['What’s a small thing that made your week better?', 'What would your perfect Sunday in Bangalore look like?', 'What are you weirdly good at?',
  'Which song have you played too many times this month?', 'What’s a food you could eat every single day?', 'What’s the best trip you’ve ever taken, and why?',
  'What did you want to be when you were ten?', 'What’s a show you’d recommend to anyone?', 'What’s something you changed your mind about recently?',
  'Where do you go when you need to think?', 'What’s a smell that takes you straight back home?', 'What’s the best advice someone gave you?',
  'What’s your go-to order at a darshini?', 'What would you do with a free Wednesday?', 'What are you looking forward to this month?',
  'Who in your life makes you laugh the most?', 'What’s a hobby you’d pick up if you had the time?', 'What’s a festival memory you love?',
  'Mountains, beaches or cities, and what’s the one place you’d go back to?', 'What’s a little thing people do that you find very attractive?',
  'What’s the most Bangalore thing that has happened to you?', 'What do your friends come to you for?', 'What’s a book or movie that stayed with you?',
  'What does a good first date look like to you?', 'What’s something on your bucket list for this year?'];
const PLATFORMS = ['Netflix', 'Prime Video', 'JioHotstar', 'YouTube', 'Other'];
const GOODBYES = ['It was lovely chatting. I don’t feel a spark, and I wish you the best.',
  'I’ve met someone I want to focus on. Take care!', 'I don’t think we’re the right fit, but thank you for the chat.'];
const LEVEL_DONE = ['', 'You both unmasked. Photos are open now.', 'Numbers shared. For a first meeting, choose a busy public place.'];

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
    return { a: m.a, b: m.b, title: (DECKS[m.deck] || DECKS.tot)[0], done, mine: ans[meId] || null, ans: done ? ans : undefined };
  }
  if (msg.kind === 'ttl') {
    const show = m.guess !== null && m.guess !== undefined;
    return { by: m.by, st: m.st, guess: show ? m.guess : null, lie: show || m.by === meId ? m.lie : undefined };
  }
  if (msg.kind === 'qa') {
    const ans = m.ans || {};
    const done = Object.keys(ans).length >= 2;
    return { q: m.q, done, mine: ans[meId] || null, ans: done ? ans : undefined };
  }
  if (['likenote', 'song', 'watch', 'plan'].includes(msg.kind)) return m;
  return undefined;
}
// Countdown facts for one match, shared by the chat list and the chat.
async function clockOf(m) {
  const { rows } = await q(`SELECT ${DEADLINE} AS deadline, m.last_activity,
      EXISTS (SELECT 1 FROM messages x WHERE x.match_id=m.id AND NOT x.system AND x.kind<>'likenote') AS started
    FROM matches m WHERE m.id=$1`, [m.id]);
  const r = rows[0];
  return { deadline: r.deadline, last_activity: r.last_activity, started: r.started, extended: !!m.extended_until, extended_by: m.extended_by || null,
    quiet_days: QUIET_DAYS, extend_days: EXTEND_DAYS };
}
const IST_FMT = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const fmtIst = (d) => IST_FMT.format(new Date(d));
function planView(p, me) {
  const sp = SPOTS.find((s) => s.id === p.spot_id);
  return { id: p.id, match_id: p.match_id, by_me: p.by_id === me, what: p.what, place: p.place, area: p.area, spot_id: p.spot_id,
    lat: sp ? sp.lat : null, lng: sp ? sp.lng : null, slots: p.slots, chosen: p.chosen, status: p.status,
    my_feedback: (p.feedback || {})[me] || null, both_again: Object.values(p.feedback || {}).filter((v) => v === 'again').length >= 2,
    my_safe: !!(p.safe || {})[me], created_at: p.created_at };
}
app.get('/api/matches', authW, verified, wrap(async (req, res) => {
  await fadeExpired(req.user.id);
  const { rows } = await q(`SELECT m.*, (SELECT body FROM messages WHERE match_id=m.id AND body<>'' ORDER BY id DESC LIMIT 1) AS last
    FROM matches m WHERE (a_id=$1 OR b_id=$1) AND NOT closed
    AND NOT EXISTS (SELECT 1 FROM blocks b WHERE b.blocker=$1 AND (b.blocked=m.a_id OR b.blocked=m.b_id))
    ORDER BY id DESC`, [req.user.id]);
  const out = [];
  for (const m of rows) out.push({ ...(await matchView(m, req.user)), ...(await clockOf(m)), last: m.last });
  const { rows: faded } = await q(`SELECT u.name FROM matches m JOIN users u ON u.id = CASE WHEN m.a_id=$1 THEN m.b_id ELSE m.a_id END
    WHERE (m.a_id=$1 OR m.b_id=$1) AND m.ended_reason='faded' AND m.ended_at > now() - interval '3 days' ORDER BY m.ended_at DESC LIMIT 3`, [req.user.id]);
  res.json({ focus: FOCUS, server_now: new Date(), chats: out, faded: faded.map((f) => f.name) });
}));
app.get('/api/matches/:id', authW, verified, wrap(async (req, res) => {
  await fadeExpired(req.user.id);
  const m = await loadMatch(req, res); if (!m) return;
  const { rows: msgs } = await q('SELECT id, sender_id, body, system, kind, meta, flag, created_at FROM messages WHERE match_id=$1 ORDER BY id DESC LIMIT 200', [m.id]);
  const { rows: plans } = await q('SELECT * FROM plans WHERE match_id=$1 ORDER BY id', [m.id]);
  res.json({
    ...(await matchView(m, req.user)), ...(await clockOf(m)), me: req.user.id, server_now: new Date(), ended_reason: m.ended_reason,
    plans: plans.map((p) => planView(p, req.user.id)),
    messages: msgs.reverse().map((x) => ({ id: x.id, sender_id: x.sender_id, body: x.body, system: x.system, kind: x.kind, flag: x.sender_id !== req.user.id ? x.flag : null, meta: viewMeta(x, req.user.id), created_at: x.created_at }))
  });
}));
app.post('/api/matches/:id/messages', authW, verified, wrap(async (req, res) => {
  const m = await loadMatch(req, res); if (!m) return;
  if (m.closed) return err(res, 400, 'This chat is closed');
  const body = clean(req.body.body, 1000);
  if (!body) return err(res, 400, 'Empty message');
  if (m.level < 2 && hasContact(body)) return err(res, 400, 'Numbers and social handles unlock when you both tap Share numbers.');
  if (!req.body.confirm && ABUSE_RE.test(body)) return err(res, 409, 'This might come across as hurtful. Send anyway?', { nudge: true });
  await q('INSERT INTO messages(match_id, sender_id, body, flag) VALUES($1,$2,$3,$4)', [m.id, req.user.id, body, scamFlag(body)]);
  await touch(m.id);
  res.json({ ok: true });
}));
// "Need more time": once per quiet spell, in the last two days, either person adds two days.
app.post('/api/matches/:id/extend', authW, verified, wrap(async (req, res) => {
  const m = await loadMatch(req, res); if (!m) return;
  if (m.closed) return err(res, 400, 'This match has ended');
  if (m.extended_until) return err(res, 400, 'More time was already added. Send a message to restart the clock.');
  const { deadline } = await clockOf(m);
  if (new Date(deadline) - Date.now() > EXTEND_DAYS * 864e5) return err(res, 400, `You can add time in the last ${EXTEND_DAYS} days.`);
  await q(`UPDATE matches SET extended_until = last_activity + interval '${QUIET_DAYS + EXTEND_DAYS} days', extended_by=$2 WHERE id=$1`, [m.id, req.user.id]);
  await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m.id, `${req.user.name} added ${EXTEND_DAYS} more days.`]);
  res.json({ ok: true });
}));
app.post('/api/matches/:id/reveal', authW, verified, wrap(async (req, res) => {
  const m = await loadMatch(req, res); if (!m) return;
  const action = req.body.action; // request | approve | decline | cancel
  if (m.closed) return err(res, 400, 'This match has ended');
  if (m.level >= 2) return err(res, 400, 'Everything is already shared');
  const next = m.level + 1;
  const ask = next === 1 ? 'unmask' : 'share numbers';
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
    await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m.id, `${req.user.name} took back the request to ${ask}.`]);
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
    if (m.level < 2 && st.some((x) => hasContact(x))) return err(res, 400, 'Numbers and handles unlock when you both choose to share them.');
    await q("INSERT INTO messages(match_id, sender_id, body, kind, meta) VALUES($1,$2,$3,'ttl',$4)", [m.id, req.user.id, '2 truths, 1 lie', { by: req.user.id, st, lie, guess: null }]);
  } else if (req.body.type === 'qa') {
    const { rows } = await q("SELECT meta->>'q' AS q FROM messages WHERE match_id=$1 AND kind='qa'", [m.id]);
    const used = new Set(rows.map((r) => r.q));
    const left = QUESTIONS.filter((x) => !used.has(x));
    const qq = (left.length ? left : QUESTIONS)[Math.floor(Math.random() * (left.length || QUESTIONS.length))];
    await q("INSERT INTO messages(match_id, sender_id, body, kind, meta) VALUES($1,$2,$3,'qa',$4)", [m.id, req.user.id, 'Question for both: ' + qq, { q: qq, ans: {} }]);
  } else if (req.body.type === 'song') {
    const title = clean(req.body.title, 80), artist = clean(req.body.artist, 60), why = clean(req.body.why, 120);
    if (!title) return err(res, 400, 'Add the song name');
    if (m.level < 2 && [title, artist, why].some((x) => hasContact(x))) return err(res, 400, 'Numbers and handles unlock when you both choose to share them.');
    if (/(https?:\/\/|www\.)/i.test(title + artist + why)) return err(res, 400, 'Just the song name and artist. We add the search links.');
    await q("INSERT INTO messages(match_id, sender_id, body, kind, meta) VALUES($1,$2,$3,'song',$4)", [m.id, req.user.id, `Song swap: ${title}${artist ? ' by ' + artist : ''}`, { by: req.user.id, title, artist, why }]);
  } else if (req.body.type === 'watch') {
    const title = clean(req.body.title, 80), platform = PLATFORMS.includes(req.body.platform) ? req.body.platform : 'Other';
    const at = new Date(req.body.at);
    if (!title) return err(res, 400, 'Add what you’ll watch');
    if (m.level < 2 && hasContact(title)) return err(res, 400, 'Numbers and handles unlock when you both choose to share them.');
    if (!(at.getTime() > Date.now() + 60000) || at.getTime() > Date.now() + 7 * 864e5) return err(res, 400, 'Pick a start time between a minute and a week from now.');
    await q("INSERT INTO messages(match_id, sender_id, body, kind, meta) VALUES($1,$2,$3,'watch',$4)", [m.id, req.user.id, `Watch together: ${title} on ${platform}`, { by: req.user.id, title, platform, at: at.toISOString(), in: { [req.user.id]: true } }]);
  } else {
    const deck = DECKS[req.body.deck] ? req.body.deck : 'tot';
    const list = DECKS[deck][1];
    const { rows } = await q("SELECT meta->>'a' AS a FROM messages WHERE match_id=$1 AND kind='tot'", [m.id]);
    const used = new Set(rows.map((r) => r.a));
    const pool2 = list.filter((p) => !used.has(p[0]));
    const [a, b] = (pool2.length ? pool2 : list)[Math.floor(Math.random() * (pool2.length || list.length))];
    await q("INSERT INTO messages(match_id, sender_id, body, kind, meta) VALUES($1,$2,$3,'tot',$4)", [m.id, req.user.id, `${DECKS[deck][0]}: ${a} or ${b}?`, { a, b, deck, ans: {} }]);
  }
  await touch(m.id);
  res.json({ ok: true });
}));
app.post('/api/matches/:id/game/:mid', authW, verified, wrap(async (req, res) => {
  const m = await loadMatch(req, res); if (!m) return;
  if (m.closed) return err(res, 400, 'This chat is closed');
  const { rows } = await q('SELECT * FROM messages WHERE id=$1 AND match_id=$2', [req.params.mid, m.id]);
  const g = rows[0];
  if (!g || !['tot', 'ttl', 'qa', 'watch'].includes(g.kind)) return err(res, 404, 'Game not found');
  const meta = g.meta;
  await touch(m.id);
  if (g.kind === 'qa') {
    const a = clean(req.body.answer, 300);
    if (!a) return err(res, 400, 'Write your answer');
    if (meta.ans[req.user.id]) return err(res, 400, 'You already answered');
    if (m.level < 2 && hasContact(a)) return err(res, 400, 'Numbers and handles unlock when you both choose to share them.');
    meta.ans[req.user.id] = a;
    await q('UPDATE messages SET meta=$2 WHERE id=$1', [g.id, meta]);
    if (Object.keys(meta.ans).length >= 2) await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m.id, 'You both answered. Answers are open.']);
    return res.json({ ok: true });
  }
  if (g.kind === 'watch') {
    if (meta.in[req.user.id]) return err(res, 400, 'You’re already in');
    meta.in[req.user.id] = true;
    await q('UPDATE messages SET meta=$2 WHERE id=$1', [g.id, meta]);
    await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m.id, `${req.user.name} is in for ${meta.title}.`]);
    return res.json({ ok: true });
  }
  if (g.kind === 'tot') {
    if (!['a', 'b'].includes(req.body.choice)) return err(res, 400, 'Pick one');
    if (meta.ans[req.user.id]) return err(res, 400, 'You already picked');
    meta.ans[req.user.id] = req.body.choice;
    await q('UPDATE messages SET meta=$2 WHERE id=$1', [g.id, meta]);
    if (Object.keys(meta.ans).length >= 2) {
      const vals = Object.values(meta.ans);
      await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m.id, vals[0] === vals[1] ? `You both picked ${meta[vals[0]]}.` : 'You picked differently.']);
    }
  } else {
    if (meta.by === req.user.id) return err(res, 400, 'Your partner guesses this one');
    if (meta.guess !== null) return err(res, 400, 'Already guessed');
    const guess = parseInt(req.body.guess, 10);
    if (!(guess >= 0 && guess <= 2)) return err(res, 400, 'Pick one');
    meta.guess = guess;
    await q('UPDATE messages SET meta=$2 WHERE id=$1', [g.id, meta]);
    await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m.id, guess === meta.lie ? `${req.user.name} spotted the lie.` : `${req.user.name} was fooled.`]);
  }
  res.json({ ok: true });
}));
app.post('/api/matches/:id/close', authW, verified, wrap(async (req, res) => {
  const m = await loadMatch(req, res); if (!m) return;
  if (m.closed) return res.json({ ok: true });
  const note = GOODBYES[parseInt(req.body.note, 10)];
  if (note) await q('INSERT INTO messages(match_id, sender_id, body) VALUES($1,$2,$3)', [m.id, req.user.id, note]);
  await endMatch(m.id, 'ended');
  await q("UPDATE plans SET status='cancelled' WHERE match_id=$1 AND status='proposed'", [m.id]);
  await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m.id, 'This match has ended. Wishing you well.']);
  await resolveWaiting(m.a_id); await resolveWaiting(m.b_id);
  res.json({ ok: true });
}));

// ---------- date plans ----------
// One open suggestion per chat: a place and up to three times. The other person picks a time, suggests others, or says not this time.
app.post('/api/matches/:id/plans', authW, verified, wrap(async (req, res) => {
  const m = await loadMatch(req, res); if (!m) return;
  if (m.closed) return err(res, 400, 'This match has ended');
  { const w = limited('plan:' + req.user.id, 30, 24 * 60 * 60000); if (w) return tooMany(res, w); }
  const b = req.body || {};
  const sp = SPOTS.find((s) => s.id === b.spot_id), idea = IDEAS.find((x) => x.id === b.idea_id);
  let place = sp ? sp.name : clean(b.place, 80), area = sp ? sp.area : clean(b.area, 40);
  const what = idea ? idea.title : clean(b.what, 60);
  if (!place) return err(res, 400, 'Choose a place');
  if (m.level < 2 && [place, area, what].some((x) => hasContact(x))) return err(res, 400, 'Numbers and handles unlock when you both choose to share them.');
  if (/(https?:\/\/|www\.)/i.test(place + area + what)) return err(res, 400, 'Just the name of the place. Directions are added for you.');
  const now = Date.now();
  const slots = [...new Set((Array.isArray(b.slots) ? b.slots : []).map((s) => new Date(s).getTime()))]
    .filter((t) => Number.isFinite(t) && t > now + 30 * 60000 && t < now + 30 * 864e5).sort((x, y) => x - y).slice(0, 3);
  if (!slots.length) return err(res, 400, 'Offer at least one time, from half an hour to 30 days from now.');
  await q("UPDATE plans SET status='cancelled' WHERE match_id=$1 AND status='proposed'", [m.id]);
  const { rows } = await q(`INSERT INTO plans(match_id, by_id, what, place, area, spot_id, idea_id, slots) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [m.id, req.user.id, what, place, area, sp ? sp.id : '', idea ? idea.id : '', slots.map((t) => new Date(t))]);
  await q("INSERT INTO messages(match_id, sender_id, body, kind, meta) VALUES($1,$2,$3,'plan',$4)", [m.id, req.user.id, `Date idea: ${what ? what + ' at ' : ''}${place}`, { plan_id: rows[0].id }]);
  await touch(m.id);
  res.json(planView(rows[0], req.user.id));
}));
app.post('/api/plans/:id', authW, verified, wrap(async (req, res) => {
  const { rows } = await q(`SELECT p.*, m.a_id, m.b_id, m.closed FROM plans p JOIN matches m ON m.id=p.match_id
    WHERE p.id=$1 AND (m.a_id=$2 OR m.b_id=$2)`, [req.params.id, req.user.id]);
  const p = rows[0];
  if (!p) return err(res, 404, 'Plan not found');
  const me = req.user.id, action = req.body.action, now = Date.now();
  const say = (t) => q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [p.match_id, t]);
  if (action === 'accept' || action === 'decline') {
    if (p.closed) return err(res, 400, 'This match has ended');
    if (p.status !== 'proposed') return err(res, 400, 'This plan isn’t open any more');
    if (p.by_id === me) return err(res, 400, 'The other person picks a time');
    if (action === 'accept') {
      const slot = p.slots[parseInt(req.body.slot, 10)];
      if (!slot) return err(res, 400, 'Pick one of the times');
      if (new Date(slot).getTime() < now) return err(res, 400, 'That time has passed. Suggest a new one.');
      await q("UPDATE plans SET status='confirmed', chosen=$2 WHERE id=$1", [p.id, slot]);
      await say(`Date set: ${p.what ? p.what + ' at ' : ''}${p.place}, ${fmtIst(slot)}. Share the plan with a friend before you go.`);
    } else {
      await q("UPDATE plans SET status='declined' WHERE id=$1", [p.id]);
      await say(`${req.user.name} can’t make that one. Either of you can suggest another plan.`);
    }
    await touch(p.match_id);
  } else if (action === 'cancel') {
    if (!['proposed', 'confirmed'].includes(p.status)) return err(res, 400, 'This plan isn’t open any more');
    if (p.status === 'proposed' && p.by_id !== me) return err(res, 400, 'Tap “Not this time” instead');
    await q("UPDATE plans SET status='cancelled' WHERE id=$1", [p.id]);
    await say(`${req.user.name} cancelled the plan${p.status === 'confirmed' ? ' for ' + fmtIst(p.chosen) : ''}.`);
    if (!p.closed) await touch(p.match_id);
  } else if (action === 'safe') {
    if (p.status !== 'confirmed' || new Date(p.chosen).getTime() - now > 3600000) return err(res, 400, 'You can mark yourself home safe once the date has started.');
    await q('UPDATE plans SET safe = safe || $2::jsonb WHERE id=$1', [p.id, JSON.stringify({ [me]: new Date() })]);
  } else if (action === 'feedback') {
    const v = req.body.value;
    if (!['again', 'not', 'report'].includes(v)) return err(res, 400, 'Pick one');
    if (p.status !== 'confirmed' || new Date(p.chosen).getTime() + 2 * 3600000 > now) return err(res, 400, 'You can tell us how it went after the date.');
    if ((p.feedback || {})[me]) return err(res, 400, 'You already told us');
    await q('UPDATE plans SET feedback = feedback || $2::jsonb WHERE id=$1', [p.id, JSON.stringify({ [me]: v })]);
    const other = (p.feedback || {})[p.a_id === me ? p.b_id : p.a_id];
    if (v === 'again' && other === 'again' && !p.closed) await say('You both want to meet again.');
  } else return err(res, 400, 'Unknown action');
  const { rows: out } = await q('SELECT * FROM plans WHERE id=$1', [p.id]);
  res.json(planView(out[0], me));
}));
// Your plans across chats: suggestions waiting, upcoming dates, and check-ins after a date.
app.get('/api/plans', authW, verified, wrap(async (req, res) => {
  const me = req.user.id;
  const { rows } = await q(`SELECT p.*, m.level, m.closed, CASE WHEN m.a_id=$1 THEN m.b_id ELSE m.a_id END AS other_id FROM plans p JOIN matches m ON m.id=p.match_id
    WHERE (m.a_id=$1 OR m.b_id=$1) AND (
      (p.status='proposed' AND NOT m.closed) OR
      (p.status='confirmed' AND p.chosen > now() - interval '7 days'))
    ORDER BY COALESCE(p.chosen, p.created_at)`, [me]);
  const out = [];
  for (const p of rows) {
    const { rows: us } = await q('SELECT name FROM users WHERE id=$1', [p.other_id]);
    const ph = p.level >= 1 ? (await photoIds(p.other_id))[0] : null;
    out.push({ ...planView(p, me), other: { name: us[0] ? us[0].name : '', photo: ph ? ph.id : null }, closed: p.closed });
  }
  res.json(out);
}));

// ---------- safety ----------
app.post('/api/block/:id', authW, wrap(async (req, res) => {
  await q('INSERT INTO blocks VALUES($1,$2) ON CONFLICT DO NOTHING', [req.user.id, req.params.id]);
  const m = await matchBetween(req.user.id, parseInt(req.params.id, 10));
  if (m) { await endMatch(m.id, 'blocked'); await resolveWaiting(req.user.id); await resolveWaiting(parseInt(req.params.id, 10)); }
  res.json({ ok: true });
}));
app.post('/api/report/:id', authW, wrap(async (req, res) => {
  { const w = limited('report:' + req.user.id, 20, 24 * 60 * 60000); if (w) return tooMany(res, w); }
  await q('INSERT INTO reports(reporter, reported, reason) VALUES($1,$2,$3)', [req.user.id, req.params.id, clean(req.body.reason, 500)]);
  await q('INSERT INTO blocks VALUES($1,$2) ON CONFLICT DO NOTHING', [req.user.id, req.params.id]);
  const m = await matchBetween(req.user.id, parseInt(req.params.id, 10));
  if (m) { await endMatch(m.id, 'reported'); await resolveWaiting(req.user.id); await resolveWaiting(parseInt(req.params.id, 10)); }
  res.json({ ok: true });
}));
app.delete('/api/me', authW, wrap(async (req, res) => {
  await q('DELETE FROM users WHERE id=$1', [req.user.id]);
  req.session = null;
  res.json({ ok: true });
}));
app.post('/api/waitlist', wrap(async (req, res) => {
  { const w = limited('waitlist:' + req.ip, 10 * IP_SCALE, 60 * 60000); if (w) return tooMany(res, w); }
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
  { const w = limited('help:' + req.ip, 60 * IP_SCALE, 10 * 60000); if (w) return tooMany(res, w); }
  const u = await optionalUser(req);
  res.json(help.answer(clean(req.body.q, 300), u, LIVE_CITIES));
}));
app.post('/api/help/ticket', wrap(async (req, res) => {
  { const w = limited('ticket:' + req.ip, 10 * IP_SCALE, 60 * 60000); if (w) return tooMany(res, w); }
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
  if (process.env.NODE_ENV === 'production' && ADMIN_PASSWORD === 'admin') return err(res, 503, 'Set ADMIN_PASSWORD on the server first.');
  const key = 'admin-fail:' + req.ip, f = buckets.get(key);
  if (f && f.reset > Date.now() && f.n >= 10) return tooMany(res, Math.ceil((f.reset - Date.now()) / 60000));
  const a = Buffer.from(req.get('x-admin-password') || ''), b = Buffer.from(ADMIN_PASSWORD);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) { limited(key, 10, 15 * 60000); return err(res, 401, 'Wrong admin password'); }
  next();
}
app.get('/api/admin/pending', admin, wrap(async (req, res) => {
  const { rows } = await q(`SELECT u.id, u.name, u.gender, u.dob, u.city, u.phone, u.mode, u.status, u.insta, u.linkedin, u.id_pending,
      u.interested, u.bio, u.prompt_q, u.prompt_a, u.tags, u.created_at, u.reject_reason,
      v.id_type, v.id_last4, v.submitted_at, (v.id_image IS NOT NULL AND u.id_pending) AS has_id
    FROM users u LEFT JOIN verifications v ON v.user_id=u.id
    WHERE u.status='pending' OR u.id_pending ORDER BY COALESCE(v.submitted_at, u.created_at)`);
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
    (SELECT count(*) FROM support_tickets WHERE NOT resolved)::int AS open_tickets,
    (SELECT count(*) FROM users WHERE status='pending' OR id_pending)::int AS pending,
    (SELECT count(*) FROM users WHERE id_verified)::int AS id_verified,
    (SELECT count(*) FROM users WHERE lat IS NOT NULL)::int AS located,
    (SELECT count(*) FROM users WHERE status='banned')::int AS banned,
    (SELECT count(*) FROM users WHERE created_at > now() - interval '7 days')::int AS signups_7d,
    (SELECT count(*) FROM matches WHERE created_at > now() - interval '1 day')::int AS matches_24h,
    (SELECT count(*) FROM messages WHERE NOT system AND created_at > now() - interval '1 day')::int AS messages_24h,
    (SELECT count(*) FROM likes WHERE kind='like' AND created_at > now() - interval '1 day')::int AS likes_24h,
    (SELECT count(*) FROM likes WHERE kind='like' AND created_at > now() - interval '7 days' AND (note<>'' OR about<>''))::int AS notes_7d,
    (SELECT count(*) FROM plans WHERE status='confirmed')::int AS dates_set,
    (SELECT count(*) FROM plans WHERE status='confirmed' AND created_at > now() - interval '7 days')::int AS dates_7d,
    (SELECT count(*) FROM matches WHERE ended_reason='faded' AND ended_at > now() - interval '7 days')::int AS faded_7d`);
  const { rows: days } = await q(`SELECT to_char(d::date, 'YYYY-MM-DD') AS day,
      (SELECT count(*) FROM users u WHERE u.created_at::date = d::date)::int AS signups,
      (SELECT count(*) FROM matches m WHERE m.created_at::date = d::date)::int AS matches
    FROM generate_series(current_date - 13, current_date, interval '1 day') d ORDER BY d`);
  const { rows: cities } = await q("SELECT city, count(*)::int AS n FROM users WHERE city<>'' GROUP BY city ORDER BY n DESC LIMIT 6");
  // Dates set per place: the number to show a venue before any partnership talk.
  const { rows: sp } = await q("SELECT COALESCE(NULLIF(spot_id,''), 'other') AS id, max(place) AS place, count(*)::int AS n FROM plans WHERE status='confirmed' GROUP BY 1 ORDER BY n DESC LIMIT 6");
  res.json({ ...rows[0], days, cities, top_spots: sp.map((r) => ({ name: r.id === 'other' ? 'Other places' : r.place, n: r.n })) });
}));
app.get('/api/admin/members', admin, wrap(async (req, res) => {
  const term = clean(req.query.q, 60).toLowerCase(), st = ['new', 'pending', 'verified', 'rejected', 'banned'].includes(req.query.status) ? req.query.status : '';
  const { rows } = await q(`SELECT u.id, u.name, u.phone, u.gender, u.dob, u.city, u.mode, u.status, u.id_verified, u.insta, u.linkedin, u.created_at, u.paused,
      (SELECT count(*) FROM reports r WHERE r.reported=u.id)::int AS reports,
      (SELECT count(*) FROM matches m WHERE (m.a_id=u.id OR m.b_id=u.id) AND NOT m.closed)::int AS matches
    FROM users u
    WHERE ($1 = '' OR lower(u.name) LIKE '%' || $1 || '%' OR u.phone LIKE '%' || $1 || '%' OR lower(u.insta) LIKE '%' || $1 || '%' OR lower(u.linkedin) LIKE '%' || $1 || '%')
      AND ($2 = '' OR u.status = $2)
    ORDER BY u.created_at DESC LIMIT 100`, [term, st]);
  res.json(rows.map((r) => ({ ...r, age: ageOf(r.dob) })));
}));
app.get('/api/admin/member/:uid', admin, wrap(async (req, res) => {
  const { rows } = await q('SELECT * FROM users WHERE id=$1', [req.params.uid]);
  if (!rows[0]) return err(res, 404, 'Not found');
  const u = rows[0];
  const { rows: reps } = await q('SELECT r.reason, r.created_at, r.resolved FROM reports r WHERE r.reported=$1 ORDER BY r.id DESC LIMIT 20', [u.id]);
  res.json({ id: u.id, name: u.name, phone: u.phone, gender: u.gender, interested: u.interested, age: ageOf(u.dob), city: u.city, mode: u.mode,
    status: u.status, id_verified: u.id_verified, insta: u.insta, linkedin: u.linkedin, bio: u.bio, prompt_q: u.prompt_q, prompt_a: u.prompt_a,
    tags: u.tags || [], created_at: u.created_at, paused: u.paused, reject_reason: u.reject_reason, photos: await photoIds(u.id), reports: reps });
}));
app.get('/api/admin/waitlist', admin, wrap(async (req, res) => {
  const { rows } = await q('SELECT phone, city, created_at FROM waitlist ORDER BY id DESC LIMIT 200');
  res.json(rows);
}));
app.post('/api/admin/unban/:uid', admin, wrap(async (req, res) => {
  const { rows } = await q("UPDATE users SET status='verified' WHERE id=$1 AND status='banned' RETURNING id_hash", [req.params.uid]);
  if (rows[0] && rows[0].id_hash) await q('DELETE FROM banned_ids WHERE id_hash=$1', [rows[0].id_hash]);
  res.json({ ok: true });
}));
app.get('/api/admin/verification/:uid/:kind', admin, wrap(async (req, res) => {
  const col = req.params.kind === 'selfie' ? 'selfie' : 'id_image';
  const { rows } = await q(`SELECT ${col} AS img FROM verifications WHERE user_id=$1`, [req.params.uid]);
  if (!rows[0] || !rows[0].img) return res.status(404).end();
  res.set('Content-Type', 'image/jpeg'); res.set('Cache-Control', 'no-store');
  res.send(rows[0].img);
}));
app.get('/api/admin/photo/:token', admin, wrap(async (req, res) => {
  const { rows } = await q('SELECT full_img FROM photos WHERE token=$1', [String(req.params.token)]);
  if (!rows[0]) return res.status(404).end();
  res.set('Content-Type', 'image/jpeg'); res.set('Cache-Control', 'no-store'); res.send(rows[0].full_img);
}));
app.post('/api/admin/decide/:uid', admin, wrap(async (req, res) => {
  const approve = req.body.approve === true, idOk = approve && req.body.id_ok !== false;
  const { rows } = await q('SELECT status, id_pending FROM users WHERE id=$1', [req.params.uid]);
  if (!rows[0]) return err(res, 404, 'Not found');
  const u = rows[0], reason = clean(req.body.reason, 200);
  if (u.status === 'pending') {
    await q('UPDATE users SET status=$2, reject_reason=$3 WHERE id=$1', [req.params.uid, approve ? 'verified' : 'rejected', approve ? '' : reason]);
  }
  if (u.id_pending) {
    // An ID that doesn't pass is unlinked, so it can't block the real owner later.
    await q(`UPDATE users SET id_pending=false, id_verified=$2, id_hash=CASE WHEN $2 THEN id_hash ELSE NULL END,
      reject_reason=CASE WHEN $2 OR status<>'verified' THEN reject_reason ELSE $3 END WHERE id=$1`, [req.params.uid, idOk, reason ? 'ID check: ' + reason : 'ID check didn’t pass']);
  }
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
  await q("UPDATE matches SET closed=true, ended_reason='banned', ended_at=now() WHERE (a_id=$1 OR b_id=$1) AND NOT closed", [req.params.uid]);
  await q('UPDATE reports SET resolved=true WHERE reported=$1', [req.params.uid]);
  res.json({ ok: true });
}));

// ---------- pages ----------
app.get('/api/config', (req, res) => res.json({
  brand: BRAND, live_cities: LIVE_CITIES, focus: FOCUS, otp: OTP_ON, id_types: Object.keys(ID_FORMATS), modes: MODE_NAMES, religions: RELIGIONS, diets: DIETS,
  nakshatras: kundli.NAK, rashis: kundli.RASHI, help_chips: help.CHIPS,
  intents: INTENTS, platforms: PLATFORMS, goodbyes: GOODBYES, quiet_days: QUIET_DAYS, extend_days: EXTEND_DAYS
}));
app.use('/vendor/leaflet', express.static(path.join(__dirname, 'node_modules', 'leaflet', 'dist'), { maxAge: '7d' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.use((e, req, res, next) => { console.error(e); err(res, 500, 'Something went wrong'); });

migrate().then(() => {
  app.listen(PORT, () => console.log(`${BRAND} running on :${PORT}`));
  setInterval(() => fadeExpired().catch((e) => console.error('fade sweep', e.message)), 10 * 60000);
})
  .catch((e) => { console.error('Migration failed', e); process.exit(1); });

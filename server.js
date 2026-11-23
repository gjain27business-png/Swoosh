// Swoosh — verified, privacy-first dating (MVP)
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { Pool, types } = require('pg');
types.setTypeParser(1082, (v) => v); // keep DATE as 'YYYY-MM-DD' (no timezone shift)
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const sharp = require('sharp');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const BRAND = process.env.BRAND_NAME || 'Swoosh';

const SCHEMA = (process.env.DB_SCHEMA || '').replace(/[^a-z_]/g, '');
const pool = new Pool({
  ...(SCHEMA ? { options: `-c search_path=${SCHEMA}` } : {}),
  connectionString: process.env.DATABASE_URL || 'postgres://swoosh:swoosh@localhost:5432/swoosh',
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && process.env.DATABASE_URL.includes('.render.com') ? { rejectUnauthorized: false } : false
});
// DB_SCHEMA (optional) keeps Swoosh tables in their own schema so the app can share a database safely.
const q = (text, params) => pool.query(text, params);

const MODES = ['serious', 'marriage', 'fling', 'vibe'];
const GENDERS = ['man', 'woman', 'nonbinary'];

async function migrate() {
  if (SCHEMA) await q(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA}`);
  await q(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    pass_hash TEXT NOT NULL,
    name TEXT DEFAULT '',
    gender TEXT DEFAULT '',
    interested TEXT[] DEFAULT '{}',
    dob DATE,
    city TEXT DEFAULT '',
    any_city BOOLEAN DEFAULT FALSE,
    company TEXT DEFAULT '',
    hide_company BOOLEAN DEFAULT TRUE,
    hidden_phones TEXT[] DEFAULT '{}',
    mode TEXT DEFAULT 'serious',
    mode_changed_at TIMESTAMPTZ,
    bio TEXT DEFAULT '',
    prompt_q TEXT DEFAULT 'My perfect Sunday is…',
    prompt_a TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    age_min INT DEFAULT 21,
    age_max INT DEFAULT 35,
    trusted_name TEXT DEFAULT '',
    trusted_phone TEXT DEFAULT '',
    status TEXT DEFAULT 'new',
    id_hash TEXT UNIQUE,
    reject_reason TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    idx INT NOT NULL,
    full_img BYTEA NOT NULL,
    blur_img BYTEA NOT NULL
  );
  CREATE TABLE IF NOT EXISTS verifications (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    id_type TEXT,
    id_image BYTEA,
    selfie BYTEA,
    submitted_at TIMESTAMPTZ DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS likes (
    from_id INT REFERENCES users(id) ON DELETE CASCADE,
    to_id INT REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (from_id, to_id)
  );
  CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    a_id INT REFERENCES users(id) ON DELETE CASCADE,
    b_id INT REFERENCES users(id) ON DELETE CASCADE,
    level INT DEFAULT 0,
    pending_by INT,
    closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (a_id, b_id)
  );
  CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    match_id INT REFERENCES matches(id) ON DELETE CASCADE,
    sender_id INT,
    body TEXT NOT NULL,
    system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS blocks (
    blocker INT REFERENCES users(id) ON DELETE CASCADE,
    blocked INT REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (blocker, blocked)
  );
  CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    reporter INT REFERENCES users(id) ON DELETE SET NULL,
    reported INT REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS banned_ids (id_hash TEXT PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT now());
  CREATE TABLE IF NOT EXISTS waitlist (id SERIAL PRIMARY KEY, phone TEXT, city TEXT, created_at TIMESTAMPTZ DEFAULT now());
  CREATE TABLE IF NOT EXISTS audit_ips (user_id INT, ip TEXT, created_at TIMESTAMPTZ DEFAULT now());
  `);
}

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '8mb' }));
app.use(cookieSession({
  name: 'sw', keys: [SECRET], maxAge: 30 * 24 * 3600 * 1000,
  sameSite: 'lax', secure: process.env.NODE_ENV === 'production', httpOnly: true
}));

// ---------- helpers ----------
const normPhone = (p) => String(p || '').replace(/\D/g, '').slice(-10);
const hmac = (s) => crypto.createHmac('sha256', SECRET).update(String(s).toUpperCase().replace(/\s/g, '')).digest('hex');
const ageOf = (dob) => {
  if (!dob) return null;
  const d = new Date(dob), n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a;
};
const clean = (s, n = 300) => String(s || '').trim().slice(0, n);
const err = (res, code, msg) => res.status(code).json({ error: msg });

function decodeImage(dataUrl) {
  const m = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(String(dataUrl || ''));
  if (!m) return null;
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 4 * 1024 * 1024) return null;
  return buf;
}

async function auth(req, res, next) {
  if (!req.session.uid) return err(res, 401, 'Please log in');
  const { rows } = await q('SELECT * FROM users WHERE id=$1', [req.session.uid]);
  if (!rows[0]) { req.session = null; return err(res, 401, 'Please log in'); }
  if (rows[0].status === 'banned') return err(res, 403, 'This account has been banned.');
  req.user = rows[0];
  next();
}
const verified = (req, res, next) => req.user.status === 'verified' ? next() : err(res, 403, 'Verification pending');

function publicUser(u, photos = []) {
  return {
    id: u.id, name: u.name, age: ageOf(u.dob), city: u.city, gender: u.gender, mode: u.mode,
    bio: u.bio, prompt_q: u.prompt_q, prompt_a: u.prompt_a, tags: u.tags || [],
    verified: u.status === 'verified', photos
  };
}
function meJson(u, photos) {
  return {
    ...publicUser(u, photos), phone: u.phone, interested: u.interested, dob: u.dob,
    any_city: u.any_city, company: u.company, hide_company: u.hide_company,
    hidden_phones: u.hidden_phones, age_min: u.age_min, age_max: u.age_max,
    trusted_name: u.trusted_name, trusted_phone: u.trusted_phone, status: u.status,
    reject_reason: u.reject_reason, mode_changed_at: u.mode_changed_at
  };
}
async function photoIds(uid) {
  const { rows } = await q('SELECT id, idx FROM photos WHERE user_id=$1 ORDER BY idx', [uid]);
  return rows;
}

// ---------- auth ----------
app.post('/api/signup', async (req, res) => {
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
});
app.post('/api/login', async (req, res) => {
  const { rows } = await q('SELECT * FROM users WHERE phone=$1', [normPhone(req.body.phone)]);
  if (!rows[0] || !(await bcrypt.compare(String(req.body.password || ''), rows[0].pass_hash))) return err(res, 401, 'Wrong number or password');
  if (rows[0].status === 'banned') return err(res, 403, 'This account has been banned.');
  req.session.uid = rows[0].id;
  await q('INSERT INTO audit_ips(user_id, ip) VALUES($1,$2)', [rows[0].id, req.ip]);
  res.json({ ok: true });
});
app.post('/api/logout', (req, res) => { req.session = null; res.json({ ok: true }); });

app.get('/api/me', auth, async (req, res) => res.json(meJson(req.user, await photoIds(req.user.id))));

// ---------- profile ----------
app.put('/api/me', auth, async (req, res) => {
  const b = req.body, u = req.user;
  const gender = GENDERS.includes(b.gender) ? b.gender : u.gender;
  const interested = Array.isArray(b.interested) ? b.interested.filter((g) => GENDERS.includes(g)) : u.interested;
  let mode = MODES.includes(b.mode) ? b.mode : u.mode;
  let modeChanged = u.mode_changed_at;
  if (mode !== u.mode) {
    if (u.mode_changed_at && Date.now() - new Date(u.mode_changed_at).getTime() < 7 * 864e5 && u.status === 'verified') {
      return err(res, 400, 'You can change your mode once a week.');
    }
    modeChanged = new Date();
  }
  const dob = b.dob ? new Date(b.dob) : u.dob;
  if (dob && ageOf(dob) < 18) return err(res, 400, 'You must be 18 or older.');
  const ageMin = Math.max(18, parseInt(b.age_min ?? u.age_min, 10) || 18);
  const ageMax = Math.min(80, Math.max(ageMin, parseInt(b.age_max ?? u.age_max, 10) || 60));
  const tags = Array.isArray(b.tags) ? b.tags.map((t) => clean(t, 24)).filter(Boolean).slice(0, 6) : u.tags;
  const hidden = Array.isArray(b.hidden_phones) ? b.hidden_phones.map(normPhone).filter((p) => p.length === 10).slice(0, 500) : u.hidden_phones;
  await q(`UPDATE users SET name=$2, gender=$3, interested=$4, dob=$5, city=$6, any_city=$7, company=$8, hide_company=$9,
    hidden_phones=$10, mode=$11, mode_changed_at=$12, bio=$13, prompt_q=$14, prompt_a=$15, tags=$16, age_min=$17, age_max=$18,
    trusted_name=$19, trusted_phone=$20 WHERE id=$1`,
  [u.id, clean(b.name ?? u.name, 40), gender, interested, dob, clean(b.city ?? u.city, 40), b.any_city ?? u.any_city,
    clean(b.company ?? u.company, 60), b.hide_company ?? u.hide_company, hidden, mode, modeChanged,
    clean(b.bio ?? u.bio, 300), clean(b.prompt_q ?? u.prompt_q, 80), clean(b.prompt_a ?? u.prompt_a, 200), tags,
    ageMin, ageMax, clean(b.trusted_name ?? u.trusted_name, 40), normPhone(b.trusted_phone ?? u.trusted_phone)]);
  const { rows } = await q('SELECT * FROM users WHERE id=$1', [u.id]);
  res.json(meJson(rows[0], await photoIds(u.id)));
});

app.post('/api/me/photos', auth, async (req, res) => {
  const buf = decodeImage(req.body.image);
  if (!buf) return err(res, 400, 'Upload a JPG, PNG or WEBP under 4 MB');
  const { rows: existing } = await q('SELECT count(*)::int AS n FROM photos WHERE user_id=$1', [req.user.id]);
  if (existing[0].n >= 4) return err(res, 400, 'Up to 4 photos');
  const full = await sharp(buf).rotate().resize(900, 1200, { fit: 'inside' }).jpeg({ quality: 82 }).toBuffer();
  const blur = await sharp(buf).rotate().resize(48, 64, { fit: 'cover' }).blur(6).resize(360, 480).jpeg({ quality: 60 }).toBuffer();
  await q('INSERT INTO photos(user_id, idx, full_img, blur_img) VALUES($1,$2,$3,$4)', [req.user.id, existing[0].n, full, blur]);
  res.json(await photoIds(req.user.id));
});
app.delete('/api/me/photos/:id', auth, async (req, res) => {
  await q('DELETE FROM photos WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  const rows = await photoIds(req.user.id);
  for (let i = 0; i < rows.length; i++) await q('UPDATE photos SET idx=$2 WHERE id=$1', [rows[i].id, i]);
  res.json(await photoIds(req.user.id));
});

// ---------- verification ----------
app.post('/api/me/verify', auth, async (req, res) => {
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
});

// ---------- photos (privacy-aware) ----------
async function matchBetween(a, b) {
  const { rows } = await q('SELECT * FROM matches WHERE (a_id=$1 AND b_id=$2) OR (a_id=$2 AND b_id=$1)', [a, b]);
  return rows[0];
}
app.get('/api/photo/:id', auth, async (req, res) => {
  const { rows } = await q('SELECT id, user_id, idx, full_img, blur_img FROM photos WHERE id=$1', [req.params.id]);
  const p = rows[0];
  if (!p) return res.status(404).end();
  let full = p.user_id === req.user.id;
  if (!full) {
    const m = await matchBetween(req.user.id, p.user_id);
    if (m && ((m.level >= 1 && p.idx === 0) || m.level >= 2)) full = true;
  }
  res.set('Content-Type', 'image/jpeg');
  res.set('Cache-Control', 'private, no-store');
  res.send(full ? p.full_img : p.blur_img);
});

// ---------- discover (mutual filters, same mode, shields) ----------
app.get('/api/picks', auth, verified, async (req, res) => {
  const u = req.user;
  const { rows } = await q(`
    SELECT o.* FROM users o
    WHERE o.id <> $1 AND o.status = 'verified' AND o.mode = $2
      AND o.gender = ANY($3::text[]) AND $4 = ANY(o.interested)
      AND date_part('year', age(o.dob)) BETWEEN $5 AND $6
      AND $7 BETWEEN o.age_min AND o.age_max
      AND ($8 OR o.any_city OR lower(o.city) = lower($9))
      AND NOT EXISTS (SELECT 1 FROM likes l WHERE l.from_id = $1 AND l.to_id = o.id)
      AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker = $1 AND b.blocked = o.id) OR (b.blocker = o.id AND b.blocked = $1))
      AND NOT EXISTS (SELECT 1 FROM matches m WHERE (m.a_id = $1 AND m.b_id = o.id) OR (m.a_id = o.id AND m.b_id = $1))
      AND NOT ($10 = ANY(o.hidden_phones)) AND NOT (o.phone = ANY($11::text[]))
      AND NOT ($12 <> '' AND lower(o.company) = lower($12) AND ($13 OR o.hide_company))
    ORDER BY (SELECT count(*) FROM likes l2 WHERE l2.from_id = o.id AND l2.to_id = $1) DESC, random()
    LIMIT 10`,
  [u.id, u.mode, u.interested, u.gender, u.age_min, u.age_max, ageOf(u.dob), u.any_city, u.city,
    u.phone, u.hidden_phones, u.company, u.hide_company]);
  const out = [];
  for (const o of rows) out.push(publicUser(o, await photoIds(o.id)));
  res.json(out);
});

app.post('/api/like/:id', auth, verified, async (req, res) => {
  const to = parseInt(req.params.id, 10), kind = req.body.kind === 'pass' ? 'pass' : 'like';
  if (to === req.user.id) return err(res, 400, 'Nope');
  const { rows: target } = await q("SELECT 1 FROM users WHERE id=$1 AND status='verified'", [to]);
  if (!target[0]) return err(res, 404, 'Profile not found');
  await q('INSERT INTO likes(from_id,to_id,kind) VALUES($1,$2,$3) ON CONFLICT (from_id,to_id) DO UPDATE SET kind=$3', [req.user.id, to, kind]);
  if (kind === 'like') {
    const { rows } = await q("SELECT 1 FROM likes WHERE from_id=$1 AND to_id=$2 AND kind='like'", [to, req.user.id]);
    if (rows[0]) {
      const [a, b] = [Math.min(to, req.user.id), Math.max(to, req.user.id)];
      const { rows: m } = await q('INSERT INTO matches(a_id,b_id) VALUES($1,$2) ON CONFLICT (a_id,b_id) DO UPDATE SET a_id=EXCLUDED.a_id RETURNING id', [a, b]);
      await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m[0].id, 'You matched in dark mode. Photos stay blurred until you both reveal.']);
      return res.json({ matched: true, match_id: m[0].id });
    }
  }
  res.json({ matched: false });
});

// ---------- chats + reveal ----------
const LEVELS = ['Chat', 'One photo', 'All photos', 'Contact'];
async function loadMatch(req, res) {
  const { rows } = await q('SELECT * FROM matches WHERE id=$1 AND (a_id=$2 OR b_id=$2)', [req.params.id, req.user.id]);
  if (!rows[0]) { err(res, 404, 'Chat not found'); return null; }
  return rows[0];
}
function decider(m, me, other) {
  // In a man–woman pair the woman decides; otherwise the person who did not ask decides.
  if (me.gender === 'woman' && other.gender === 'man') return me.id;
  if (other.gender === 'woman' && me.gender === 'man') return other.id;
  return null;
}
async function matchView(m, me) {
  const otherId = m.a_id === me.id ? m.b_id : m.a_id;
  const { rows } = await q('SELECT * FROM users WHERE id=$1', [otherId]);
  const o = rows[0];
  const view = publicUser(o, await photoIds(o.id));
  if (m.level < 3) delete view.phone; else view.phone = o.phone;
  const d = decider(m, me, o);
  return {
    id: m.id, level: m.level, levels: LEVELS, closed: m.closed, other: view,
    pending_by: m.pending_by, i_decide: d === null ? (m.pending_by && m.pending_by !== me.id) : d === me.id,
    i_am_decider_type: d === null ? 'mutual' : (d === me.id ? 'me' : 'them')
  };
}
app.get('/api/matches', auth, verified, async (req, res) => {
  const { rows } = await q(`SELECT m.*, (SELECT body FROM messages WHERE match_id=m.id ORDER BY id DESC LIMIT 1) AS last
    FROM matches m WHERE (a_id=$1 OR b_id=$1) AND NOT closed
    AND NOT EXISTS (SELECT 1 FROM blocks b WHERE b.blocker=$1 AND (b.blocked=m.a_id OR b.blocked=m.b_id))
    ORDER BY id DESC`, [req.user.id]);
  const out = [];
  for (const m of rows) out.push({ ...(await matchView(m, req.user)), last: m.last });
  res.json(out);
});
app.get('/api/matches/:id', auth, verified, async (req, res) => {
  const m = await loadMatch(req, res); if (!m) return;
  const { rows: msgs } = await q('SELECT id, sender_id, body, system, created_at FROM messages WHERE match_id=$1 ORDER BY id DESC LIMIT 200', [m.id]);
  res.json({ ...(await matchView(m, req.user)), me: req.user.id, messages: msgs.reverse() });
});
app.post('/api/matches/:id/messages', auth, verified, async (req, res) => {
  const m = await loadMatch(req, res); if (!m) return;
  if (m.closed) return err(res, 400, 'This chat is closed');
  const body = clean(req.body.body, 1000);
  if (!body) return err(res, 400, 'Empty message');
  // Contact details are only shared through the Contact reveal step.
  if (m.level < 3 && /(\d[\s-]?){10}|@[a-z0-9_.]{3,}|instagram|insta id|whatsapp|snap/i.test(body)) {
    return err(res, 400, 'Contact details unlock at the Contact step. Ask to reveal first.');
  }
  await q('INSERT INTO messages(match_id, sender_id, body) VALUES($1,$2,$3)', [m.id, req.user.id, body]);
  res.json({ ok: true });
});
app.post('/api/matches/:id/reveal', auth, verified, async (req, res) => {
  const m = await loadMatch(req, res); if (!m) return;
  const action = req.body.action; // request | approve | decline
  if (m.level >= 3) return err(res, 400, 'Everything is already revealed');
  const otherId = m.a_id === req.user.id ? m.b_id : m.a_id;
  const { rows } = await q('SELECT * FROM users WHERE id=$1', [otherId]);
  const d = decider(m, req.user, rows[0]);
  const next = LEVELS[m.level + 1];
  if (action === 'request') {
    if (d === req.user.id) {
      await q('UPDATE matches SET level=level+1, pending_by=NULL WHERE id=$1', [m.id]);
      await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m.id, `${req.user.name} revealed: ${next}.`]);
    } else {
      await q('UPDATE matches SET pending_by=$2 WHERE id=$1', [m.id, req.user.id]);
      await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m.id, `${req.user.name} asked to reveal: ${next}.`]);
    }
  } else if (action === 'approve' || action === 'decline') {
    if (!m.pending_by || m.pending_by === req.user.id) return err(res, 400, 'Nothing to approve');
    if (d !== null && d !== req.user.id) return err(res, 403, 'Only she can approve reveals');
    if (action === 'approve') {
      await q('UPDATE matches SET level=level+1, pending_by=NULL WHERE id=$1', [m.id]);
      await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m.id, `Revealed: ${next}.`]);
    } else {
      await q('UPDATE matches SET pending_by=NULL WHERE id=$1', [m.id]);
      await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m.id, 'Not yet — reveal stays locked for now.']);
    }
  } else return err(res, 400, 'Unknown action');
  const { rows: mm } = await q('SELECT * FROM matches WHERE id=$1', [m.id]);
  res.json(await matchView(mm[0], req.user));
});
app.post('/api/matches/:id/close', auth, verified, async (req, res) => {
  const m = await loadMatch(req, res); if (!m) return;
  await q('UPDATE matches SET closed=true WHERE id=$1', [m.id]);
  await q('INSERT INTO messages(match_id, body, system) VALUES($1,$2,true)', [m.id, 'This chat was closed politely.']);
  res.json({ ok: true });
});

// ---------- safety ----------
app.post('/api/block/:id', auth, async (req, res) => {
  await q('INSERT INTO blocks VALUES($1,$2) ON CONFLICT DO NOTHING', [req.user.id, req.params.id]);
  res.json({ ok: true });
});
app.post('/api/report/:id', auth, async (req, res) => {
  await q('INSERT INTO reports(reporter, reported, reason) VALUES($1,$2,$3)', [req.user.id, req.params.id, clean(req.body.reason, 500)]);
  await q('INSERT INTO blocks VALUES($1,$2) ON CONFLICT DO NOTHING', [req.user.id, req.params.id]);
  res.json({ ok: true });
});
app.delete('/api/me', auth, async (req, res) => {
  await q('DELETE FROM users WHERE id=$1', [req.user.id]);
  req.session = null;
  res.json({ ok: true });
});

app.post('/api/waitlist', async (req, res) => {
  const phone = normPhone(req.body.phone);
  if (phone.length !== 10) return err(res, 400, 'Enter a valid 10-digit mobile number');
  await q('INSERT INTO waitlist(phone, city) VALUES($1,$2)', [phone, clean(req.body.city, 40)]);
  res.json({ ok: true });
});

// ---------- admin ----------
function admin(req, res, next) {
  const pw = req.get('x-admin-password') || '';
  const a = Buffer.from(pw), b = Buffer.from(ADMIN_PASSWORD);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return err(res, 401, 'Wrong admin password');
  next();
}
app.get('/api/admin/pending', admin, async (req, res) => {
  const { rows } = await q(`SELECT u.id, u.name, u.gender, u.dob, u.city, u.phone, v.id_type, v.submitted_at
    FROM users u JOIN verifications v ON v.user_id=u.id WHERE u.status='pending' ORDER BY v.submitted_at`);
  const out = [];
  for (const r of rows) out.push({ ...r, age: ageOf(r.dob), photos: await photoIds(r.id) });
  res.json(out);
});
app.get('/api/admin/stats', admin, async (req, res) => {
  const { rows } = await q(`SELECT
    (SELECT count(*) FROM users)::int AS users,
    (SELECT count(*) FROM users WHERE status='verified')::int AS verified,
    (SELECT count(*) FROM users WHERE status='verified' AND gender='woman')::int AS women,
    (SELECT count(*) FROM users WHERE status='verified' AND gender='man')::int AS men,
    (SELECT count(*) FROM matches)::int AS matches,
    (SELECT count(*) FROM waitlist)::int AS waitlist,
    (SELECT count(*) FROM reports WHERE NOT resolved)::int AS open_reports`);
  res.json(rows[0]);
});
app.get('/api/admin/verification/:uid/:kind', admin, async (req, res) => {
  const col = req.params.kind === 'selfie' ? 'selfie' : 'id_image';
  const { rows } = await q(`SELECT ${col} AS img FROM verifications WHERE user_id=$1`, [req.params.uid]);
  if (!rows[0] || !rows[0].img) return res.status(404).end();
  res.set('Content-Type', 'image/jpeg'); res.set('Cache-Control', 'no-store');
  res.send(rows[0].img);
});
app.get('/api/admin/photo/:id', admin, async (req, res) => {
  const { rows } = await q('SELECT full_img FROM photos WHERE id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).end();
  res.set('Content-Type', 'image/jpeg'); res.send(rows[0].full_img);
});
app.post('/api/admin/decide/:uid', admin, async (req, res) => {
  const approve = req.body.approve === true;
  await q('UPDATE users SET status=$2, reject_reason=$3 WHERE id=$1', [req.params.uid, approve ? 'verified' : 'rejected', approve ? '' : clean(req.body.reason, 200)]);
  // Data minimisation: ID image and selfie are deleted once a decision is made.
  await q('UPDATE verifications SET id_image=NULL, selfie=NULL WHERE user_id=$1', [req.params.uid]);
  res.json({ ok: true });
});
app.get('/api/admin/reports', admin, async (req, res) => {
  const { rows } = await q(`SELECT r.id, r.reason, r.created_at, r.reported, u.name AS reported_name, u.phone AS reported_phone, r.reporter
    FROM reports r JOIN users u ON u.id=r.reported WHERE NOT r.resolved ORDER BY r.id DESC`);
  res.json(rows);
});
app.post('/api/admin/reports/:id/resolve', admin, async (req, res) => {
  await q('UPDATE reports SET resolved=true WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});
app.post('/api/admin/ban/:uid', admin, async (req, res) => {
  const { rows } = await q('SELECT id_hash FROM users WHERE id=$1', [req.params.uid]);
  if (rows[0] && rows[0].id_hash) await q('INSERT INTO banned_ids(id_hash) VALUES($1) ON CONFLICT DO NOTHING', [rows[0].id_hash]);
  await q("UPDATE users SET status='banned' WHERE id=$1", [req.params.uid]);
  await q('UPDATE reports SET resolved=true WHERE reported=$1', [req.params.uid]);
  res.json({ ok: true });
});

// ---------- pages ----------
app.get('/api/config', (req, res) => res.json({ brand: BRAND }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.use((e, req, res, next) => { console.error(e); err(res, 500, 'Something went wrong'); });

migrate().then(() => app.listen(PORT, () => console.log(`${BRAND} running on :${PORT}`)))
  .catch((e) => { console.error('Migration failed', e); process.exit(1); });

// PAUSE web app (mobile-first PWA). Plain JS, hash routing.
const $root = document.getElementById('root');
const el = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- line icons (1.5px stroke, 24px grid) ----------
const P = {
  back: '<path d="M15 18l-6-6 6-6"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  chat: '<path d="M20 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 20 12z"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17h.01"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  dots: '<circle cx="12" cy="5" r=".8"/><circle cx="12" cy="12" r=".8"/><circle cx="12" cy="19" r=".8"/>',
  send: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  mask: '<path d="M2.5 9.5C2.5 7.6 4 6.5 6 6.5c2.3 0 3.6 1.4 6 1.4s3.7-1.4 6-1.4c2 0 3.5 1.1 3.5 3 0 4.2-2.8 7.5-6 7.5-2.2 0-2.6-2-3.5-2s-1.3 2-3.5 2c-3.2 0-6-3.3-6-7.5z"/><path d="M6.8 11.3c.8-.7 2.1-.7 2.9 0M14.3 11.3c.8-.7 2.1-.7 2.9 0"/>',
  star: '<path d="M12 3.5l1.7 5.6 5.8 1.9-5.8 1.9L12 18.5l-1.7-5.6-5.8-1.9 5.8-1.9z"/>',
  steady: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
  forever: '<circle cx="12" cy="14.5" r="5.5"/><path d="M9.5 6.5L12 3.5l2.5 3L12 9z"/>',
  moon: '<path d="M19.5 14.5A7.5 7.5 0 1 1 9.5 4.5a6 6 0 0 0 10 10z"/>',
  kundli: '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 4l16 16M20 4L4 20M12 4l8 8-8 8-8-8z"/>',
  pause: '<path d="M9 6v12M15 6v12"/>',
  drop: '<path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z"/>',
  alert: '<path d="M12 4.5l8.5 15h-17z"/><path d="M12 10v4M12 16.8h.01"/>',
  id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.6-1.4 1.7-2 3-2s2.4.6 3 2M14.5 10h3.5M14.5 13h2.5"/>',
  building: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-4h4v4"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  pin: '<path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
  phone: '<path d="M5 4h3l1.5 4-2 1.2a11 11 0 0 0 5.3 5.3l1.2-2 4 1.5v3a2 2 0 0 1-2 2A13 13 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  split: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16"/>',
  list3: '<path d="M9 7h11M9 12h11M9 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M9 9h.01M15 15h.01M15 9h.01M9 15h.01M12 12h.01"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  block: '<circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/>',
  minus: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12h7"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  music: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  play: '<rect x="3" y="5" width="18" height="13" rx="2"/><path d="M10.5 9v5l4-2.5z"/><path d="M8 21h8"/>',
  share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/>',
  home: '<path d="M4 11l8-6.5 8 6.5"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
  map: '<path d="M9 4.5L3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/>'
};
const I = (name, extra = '') => `<svg class="ic ${extra}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`;
const OBJ = (name) => (window.PauseObj ? PauseObj.svg(name) : '');
const EMOBJ = (name) => `<span class="emobj" aria-hidden="true">${OBJ(name)}</span>`;
const WORDMARK = '<span class="wordmark light"><i class="mk" aria-hidden="true"><b></b><b></b></i>pause</span>';

const CAT = {
  steady: { name: 'Steady', icon: 'steady', line: 'Dating that’s going somewhere' },
  forever: { name: 'Forever', icon: 'forever', line: 'Marriage-minded. Kundli optional.' },
  afterdark: { name: 'After Dark', icon: 'moon', line: 'Casual and honest. Still fully verified.' }
};
const GENDERS = { woman: 'Woman', man: 'Man', nonbinary: 'Non-binary' };
const SEEKING = { woman: 'Women', man: 'Men', nonbinary: 'Non-binary people' };
const STEPS = ['Masked', 'Unmasked', 'Numbers shared'];
let ME = null;
let CFG = { brand: 'PAUSE', live_cities: ['Bangalore'], focus: 5, religions: [], diets: [], nakshatras: [], rashis: [], intents: {}, platforms: ['Netflix', 'Prime Video', 'JioHotstar', 'YouTube', 'Other'], goodbyes: [], quiet_days: 5, extend_days: 2 };
const cfgReady = fetch('/api/config').then((r) => r.json()).then((c) => { CFG = { ...CFG, ...c }; }).catch(() => {});
let pollTimer = null, tickTimer = null;

async function api(path, opts = {}) {
  const r = await fetch('/api' + path, {
    method: opts.method || 'GET',
    headers: opts.body ? { 'Content-Type': 'application/json' } : {},
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin'
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(data.error || 'Something went wrong. Try again.'); e.status = r.status; e.data = data; throw e; }
  return data;
}
function toast(msg) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 3400);
}
function compress(file, max = 1200) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.85));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('That file isn’t an image we can read. Try a JPG or PNG.'));
    img.src = URL.createObjectURL(file);
  });
}
document.addEventListener('contextmenu', (e) => { if (e.target.tagName === 'IMG') e.preventDefault(); });

const catTag = (m, href) => { const c = CAT[m] || CAT.steady; const inner = `${I(c.icon)}${c.name}`; return href ? `<a class="tag" href="${href}">${inner}</a>` : `<span class="tag">${inner}</span>`; };
const swTag = (label, icon, on, href, brassy) => `<a class="tag ${on ? 'on' : ''} ${on && brassy ? 'brassy' : ''}" href="${href}" aria-label="${label} is ${on ? 'on' : 'off'}">${I(icon)}${label} ${on ? 'on' : 'off'}</a>`;
const fmtHeight = (cm) => { if (!cm) return ''; let ft = Math.floor(cm / 30.48), inch = Math.round(cm / 2.54 - ft * 12); if (inch === 12) { ft++; inch = 0; } return `${ft}′${inch}″`; };
const initial = (n) => esc(String(n || '?').trim().charAt(0).toUpperCase());
function navbar(active, badge = 0) {
  const item = (href, label, ic, b) => `<a href="#${href}" ${active === href ? 'aria-current="page"' : ''}>${I(ic)}${label}${b ? `<span class="badge">${b}</span>` : ''}</a>`;
  return `<nav class="navbar" aria-label="Main"><div>${item('picks', 'Picks', 'heart')}${item('explore', 'Explore', 'compass')}${item('plans', 'Plans', 'calendar')}${item('chats', 'Chats', 'chat', badge)}${item('profile', 'Profile', 'user')}</div></nav>`;
}
function render(html, dark = false) {
  document.body.style.background = dark ? 'var(--night)' : '';
  $root.innerHTML = html;
  window.scrollTo(0, 0);
}
function openSheet(html) {
  closeSheet();
  const bg = document.createElement('div'); bg.className = 'sheet-bg';
  const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog');
  sh.innerHTML = '<div class="grab"></div>' + html;
  bg.onclick = closeSheet;
  document.body.append(bg, sh);
  return sh;
}
function closeSheet() { document.querySelectorAll('.sheet,.sheet-bg').forEach((e) => e.remove()); }
// In-app replacement for confirm()/prompt(). Resolves false on cancel, true (or the typed text) on OK.
function dialog({ title, body = '', ok = 'OK', cancel = 'Cancel', danger = false, input = null }) {
  return new Promise((resolve) => {
    const sh = openSheet(`<h2 style="margin:4px 0 8px;font-size:24px">${esc(title)}</h2>${body ? `<p class="hint" style="font-size:15px;margin:0 0 16px">${esc(body)}</p>` : ''}
      ${input ? `<div class="field"><label for="dlgin" class="sr">${esc(input)}</label><textarea id="dlgin" placeholder="${esc(input)}" maxlength="500"></textarea></div>` : ''}
      <div style="display:flex;gap:10px"><button class="btn ghost" style="flex:1" id="dlgno" type="button">${esc(cancel)}</button><button class="btn${danger ? ' danger' : ''}" style="flex:1" id="dlgok" type="button">${esc(ok)}</button></div>`);
    const done = (v) => { closeSheet(); resolve(v); };
    document.querySelector('.sheet-bg').onclick = () => done(false);
    sh.querySelector('#dlgno').onclick = () => done(false);
    sh.querySelector('#dlgok').onclick = () => done(input ? sh.querySelector('#dlgin').value.trim() : true);
    (input ? sh.querySelector('#dlgin') : sh.querySelector('#dlgok')).focus();
  });
}

// ---------- routing ----------
async function route() {
  clearInterval(pollTimer); clearInterval(tickTimer);
  document.onkeydown = null;
  document.querySelectorAll('.celebrate,.toast,.ask,.ask-bg').forEach((e) => e.remove());
  closeSheet();
  await cfgReady;
  const [view, arg] = location.hash.replace(/^#/, '').split('/');
  if (view === 'signup' || view === 'login' || view === 'reset') return authView(view);
  try { ME = await api('/me'); } catch (e) { return authView('signup'); }
  const profileDone = ME.name && ME.gender && ME.dob && ME.city && ME.interested.length && ME.photos.length;
  if (view === 'profile' || !profileDone) return profileView(!profileDone);
  if (view === 'safety') return safetyView();
  if (view === 'destiny') return destinyView(arg || ME.mode);
  if (view === 'kundli') return kundliView();
  if (ME.status !== 'verified' || view === 'verify') return verifyView();
  refreshLocation();
  if (view === 'explore' && arg === 'spots') { location.hash = 'plans/map'; return; }
  if (view === 'explore') return exploreView(arg);
  if (view === 'plans') return plansView(arg);
  if (view === 'chats') return chatsView();
  if (view === 'chat' && arg) return chatView(arg);
  if (view === 'drop') return dropView();
  return picksView();
}
window.addEventListener('hashchange', route);

// ---------- auth ----------
function authView(mode) {
  const signup = mode === 'signup', reset = mode === 'reset';
  if (reset && !CFG.otp) { location.hash = 'login'; return; }
  const needCode = (signup || reset) && CFG.otp;
  render(`<main class="screen fade-in" style="padding-top:24px">
    <div class="authhero">${WORDMARK}<div class="ahs" aria-hidden="true"><span class="o1">${OBJ('mask')}</span><span class="o2">${OBJ('kulhad')}</span><span class="o3">${OBJ('heart')}</span><span class="o4">${OBJ('star')}</span><span class="stk mint s1">${I('heart')}It’s mutual!</span><span class="stk s2">Chai pe chalein?</span></div></div>
    ${reset ? '<h1 style="font-size:42px;margin:28px 0 12px">Reset your password.</h1><p class="hint" style="font-size:15px;margin:0 0 24px">We’ll text a 6-digit code to your number.</p>' : `    <h1 style="font-size:42px;margin:28px 0 12px">${signup ? 'Hit pause on swiping.' : 'Welcome back.'}</h1>
    <p class="hint" style="font-size:15px;margin:0 0 24px">${signup ? 'Every member is checked by a real person. You can have up to five matches at a time, and photos stay masked until you both choose to unmask. Live in Bangalore.' : 'Log in with your mobile number.'}</p>`}
    <form id="f">
      <div class="field"><label for="phone">Mobile number</label><input id="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="10-digit number" required></div>
      ${needCode ? `<div class="field" id="codef" hidden><label for="otp">6-digit code</label><input id="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="Sent by SMS"><span class="hint" id="codeh"></span></div>` : ''}
      <div class="field"><label for="pw">${reset ? 'New password' : 'Password'}</label><input id="pw" type="password" autocomplete="${signup || reset ? 'new-password' : 'current-password'}" minlength="8" required placeholder="At least 8 characters"></div>
      ${signup ? '<label style="display:flex;gap:10px;align-items:flex-start;font-size:14px;margin-bottom:14px"><input id="agree" type="checkbox" style="width:20px;height:20px;margin-top:1px;flex:none;accent-color:#0B4A5C" required><span>I’m 18 or older and agree to the <a href="/terms" target="_blank">Terms</a> and <a href="/privacy" target="_blank">Privacy Policy</a>.</span></label>' : ''}
      <div class="err" id="err" role="alert"></div>
      <button class="btn block" type="submit" id="go">${needCode ? 'Text me a code' : signup ? 'Create account' : 'Log in'}</button>
    </form>
    ${!signup && !reset && CFG.otp ? '<p style="text-align:center;margin-top:14px;font-size:15px"><a href="#reset">Forgot password?</a></p>' : ''}
    <p style="text-align:center;margin-top:22px;font-size:15px">${signup ? 'Already a member? <a href="#login">Log in</a>' : reset ? '<a href="#login">Back to log in</a>' : 'New to PAUSE? <a href="#signup">Create an account</a>'}</p>
    <p style="text-align:center"><button class="linkbtn" data-ask type="button">Questions before you join?</button></p>
  </main>`);
  let codeSent = false;
  const sendCode = async () => {
    await api('/otp/send', { method: 'POST', body: { phone: el('phone').value, purpose: reset ? 'reset' : 'signup' } });
    codeSent = true; el('codef').hidden = false; el('otp').focus();
    el('codeh').innerHTML = 'Didn’t get it? <button class="linkbtn" type="button" id="resend">Send again</button>';
    el('resend').onclick = async () => { try { await sendCode(); toast('New code sent'); } catch (x) { el('err').textContent = x.message; } };
    el('go').textContent = signup ? 'Create account' : reset ? 'Set new password' : 'Log in';
  };
  el('f').onsubmit = async (e) => {
    e.preventDefault();
    el('err').textContent = '';
    try {
      if (needCode && !codeSent) { if (signup && !el('agree').checked) { el('err').textContent = 'Please confirm you’re 18 or older and agree to the terms.'; return; } await sendCode(); return; }
      if (reset) await api('/password/reset', { method: 'POST', body: { phone: el('phone').value, otp: el('otp').value, password: el('pw').value } });
      else await api(signup ? '/signup' : '/login', { method: 'POST', body: { phone: el('phone').value, password: el('pw').value, agree: signup ? el('agree').checked : true, otp: needCode ? el('otp').value : undefined } });
      location.hash = signup ? 'profile' : 'picks'; route();
    } catch (x) { el('err').textContent = x.message; }
  };
}

// ---------- location (optional) ----------
// Only an area is stored (rounded to about 1 km); other members see distance ranges, never a spot.
function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Your browser can’t share location.'));
    navigator.geolocation.getCurrentPosition((p) => resolve(p.coords), (e) => reject(new Error(e.code === 1 ? 'Location is blocked. Allow it for this site in your browser settings, then try again.' : 'We couldn’t get your location. Try again outdoors or with Wi-Fi on.')), { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 });
  });
}
async function turnOnLocation() {
  const c = await getPosition();
  await api('/me/location', { method: 'PUT', body: { lat: c.latitude, lng: c.longitude } });
  ME.located = true;
  try { localStorage.setItem('locAt', String(Date.now())); } catch (e) { /* ignore */ }
}
async function refreshLocation() {
  try {
    if (!ME || !ME.located || !navigator.permissions) return;
    if (Date.now() - Number(localStorage.getItem('locAt') || 0) < 6 * 3600000) return;
    const st = await navigator.permissions.query({ name: 'geolocation' });
    if (st.state === 'granted') await turnOnLocation();
  } catch (e) { /* stays as it was */ }
}

// ---------- swipe ----------
function swipeable(card, { left, right, rightBlocked }) {
  const ph = card.querySelector('.ph');
  ph.insertAdjacentHTML('beforeend', '<span class="stamp like" aria-hidden="true">Like</span><span class="stamp pass" aria-hidden="true">Pass</span>');
  const sL = ph.querySelector('.stamp.like'), sP = ph.querySelector('.stamp.pass');
  let x0 = null, y0 = 0, dx = 0, pid = null, dragging = false;
  const reset = () => { card.style.transition = 'transform .25s ease'; card.style.transform = ''; sL.style.opacity = 0; sP.style.opacity = 0; };
  card.addEventListener('pointerdown', (e) => { if (e.button > 0 || e.target.closest('button,a,input')) return; x0 = e.clientX; y0 = e.clientY; dx = 0; dragging = false; pid = e.pointerId; });
  card.addEventListener('pointermove', (e) => {
    if (x0 === null || e.pointerId !== pid) return;
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (!dragging) {
      if (Math.abs(mx) > 10 && Math.abs(mx) > Math.abs(my)) { dragging = true; card.setPointerCapture(pid); card.style.transition = 'none'; }
      else if (Math.abs(my) > 10) { x0 = null; return; } else return;
    }
    dx = mx;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 22}deg)`;
    sL.style.opacity = Math.max(0, Math.min(1, dx / 110)); sP.style.opacity = Math.max(0, Math.min(1, -dx / 110));
  });
  const end = () => {
    if (x0 === null) return; x0 = null;
    if (!dragging) return;
    if (dx > 110 && !rightBlocked) { reset(); right(); } // the like sheet decides whether the card leaves
    else if (dx < -110) { card.style.transition = 'transform .28s ease-out'; card.style.transform = 'translateX(-140%) rotate(-18deg)'; left(); }
    else { if (dx > 110 && rightBlocked) toast('End a match to like someone new'); reset(); }
  };
  card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
  card.style.touchAction = 'pan-y';
}

// ---------- profile ----------
const toggleRow = (id, icon, title, sub, checked, extra = '', brass = false) => `<div class="toggle"><span class="circ ${brass ? 'brass' : ''}">${I(icon)}</span><div class="tx"><b>${title}</b><span>${sub}</span>${extra}</div><label class="tg"><input type="checkbox" id="${id}" ${checked ? 'checked' : ''} aria-label="${esc(title)}"><i></i></label></div>`;
function profileView(onboarding) {
  const m = ME;
  let cat = m.mode;
  const pills = (name, opts, selected, multi) => Object.entries(opts).map(([k, v]) =>
    `<button type="button" class="pill" data-group="${name}" data-multi="${multi ? 1 : 0}" data-val="${k}" aria-pressed="${(multi ? selected.includes(k) : selected === k) ? 'true' : 'false'}">${esc(v)}</button>`).join('');
  const photoSlots = [0, 1, 2, 3].map((i) => {
    const p = m.photos[i];
    return p ? `<div class="slot"><img src="/api/photo/${p.id}" alt="Your photo ${i + 1}"><button type="button" class="x" data-del="${p.id}" aria-label="Remove photo ${i + 1}">${I('x')}</button></div>`
      : `<label class="slot" style="cursor:pointer">${I('plus')}<input type="file" accept="image/*" class="sr" data-add="1" aria-label="Add photo"></label>`;
  }).join('');
  const parts = [m.photos.length, m.name, m.dob, m.city, m.gender, m.prompt_a, m.bio, (m.tags || []).length];
  const pct = Math.round(parts.filter(Boolean).length / parts.length * 100);
  const opt = (list, v, blank) => `<option value="">${blank}</option>` + list.map((x) => `<option ${x === v ? 'selected' : ''}>${esc(x)}</option>`).join('');
  render(`<main class="screen">
    <div class="top"><h1>${onboarding ? 'Your profile' : 'Profile'}</h1>${onboarding ? '' : '<button class="btn ghost" id="logout" style="min-height:40px">Log out</button>'}</div>
    <div class="profilehead">${m.photos[0] ? `<img class="av" style="width:56px;height:56px;border-radius:28px" src="/api/photo/${m.photos[0].id}" alt="">` : `<span class="av" style="width:56px;height:56px;border-radius:28px">${initial(m.name)}</span>`}
      <div style="flex:1"><div style="font-weight:600;display:flex;gap:8px;align-items:center">${esc(m.name || 'Your profile')} ${m.status === 'verified' ? `<span class="vtick">${I('check')}${m.id_verified ? 'ID verified' : 'Verified'}</span>` : ''}</div>
      <div class="hint">${onboarding ? 'Step 1 of 2. Next, link your Instagram or LinkedIn.' : `Profile ${pct}% complete`}</div><div class="bar"><i style="width:${pct}%"></i></div></div></div>
    ${!onboarding && m.status === 'verified' && !m.id_verified ? `<a class="idcta" href="#verify">${I(m.id_pending ? 'clock' : 'shield')}<span><b>${m.id_pending ? 'ID check in progress' : 'Get the ID-verified badge'}</b>${m.id_pending ? 'Usually within a few hours.' : 'Optional. Takes two minutes.'}</span>${I('chev')}</a>` : ''}
    ${onboarding ? '' : `<div class="card linkrows"><a href="#safety">${I('shield')}<span><b>Safety</b><small>Take a pause, contact shield, emergency help</small></span>${I('chev')}</a><button type="button" data-ask>${I('help')}<span><b>Help</b><small>Ask a question or talk to our team</small></span>${I('chev')}</button></div>`}
    <form id="pf">
      <div class="field"><span class="flabel">Photos</span><div class="photos">${photoSlots}</div><span class="hint">Add one to four. Everyone who sees them sees a faint watermark with their own account code.</span></div>
      <div class="field"><label for="fname">First name</label><input id="fname" value="${esc(m.name)}" maxlength="40" required autocomplete="given-name"></div>
      <div class="row">
        <div class="field"><label for="dob">Date of birth</label><input id="dob" type="date" value="${m.dob ? m.dob.slice(0, 10) : ''}" required></div>
        <div class="field"><label for="citysel">City</label><select id="citysel">${[...CFG.live_cities, 'Other'].map((c) => `<option ${(c === 'Other' ? (m.city && !CFG.live_cities.includes(m.city)) : m.city === c) ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
          <input id="city" value="${esc(CFG.live_cities.includes(m.city) ? '' : m.city)}" placeholder="Your city" style="display:${m.city && !CFG.live_cities.includes(m.city) ? 'block' : 'none'};margin-top:8px" aria-label="Your city"></div>
      </div>
      <div class="field"><span class="flabel">I am</span><div class="chips">${pills('gender', GENDERS, m.gender, false)}</div></div>
      <div class="field"><span class="flabel">Interested in</span><div class="chips">${pills('interested', SEEKING, m.interested, true)}</div><span class="hint">Pick one or more. Only people who are also interested in you will see you.</span></div>

      <h2 class="section-t">Category</h2>
      <div class="catgrid" role="group" aria-label="Category">${Object.entries(CAT).map(([k, c]) => `<button type="button" class="catcard" data-cat="${k}" aria-pressed="${k === cat}"><span class="circ">${I(c.icon)}</span><span><b>${c.name}</b><span class="l">${c.line}</span></span><span class="tick" aria-hidden="true"></span></button>`).join('')}</div>
      <p class="hint" style="margin:10px 0 0">You only meet people in the same category. You can switch once a week.</p>

      <h2 class="section-t">Settings for this category</h2>
      ${toggleRow('masked', 'mask', 'Masked', 'Your photos stay hidden until you and the other person both tap Unmask. It works both ways.', m.masked)}
      <div id="destinyrow"></div>
      <div id="extras"></div>

      <h2 class="section-t">Nearby</h2>
      ${toggleRow('loc', 'pin', 'Use my location', 'Optional. Shows nearby people first. We keep only your area (rounded to about 1 km), and others see a distance range, never where you are.', !!m.located)}
      <div class="field" style="margin-top:12px"><label for="maxkm">Show people within</label><select id="maxkm">${[[0, 'Any distance'], [5, '5 km'], [10, '10 km'], [25, '25 km']].map(([v, l]) => `<option value="${v}" ${Number(m.max_km || 0) === v ? 'selected' : ''}>${l}</option>`).join('')}</select><span class="hint">Applies only to people who also share their location.</span></div>

      <h2 class="section-t">About you</h2>
      <div class="row">
        <div class="field"><label for="diet">Food</label><select id="diet">${opt(CFG.diets, m.diet, 'Prefer not to say')}</select></div>
        <div class="field"><label for="height">Height (cm)</label><input id="height" type="number" inputmode="numeric" min="120" max="220" value="${m.height_cm || ''}" placeholder="170"></div>
      </div>
      <div class="field"><label for="pa">${esc(m.prompt_q)}</label><input id="pa" value="${esc(m.prompt_a)}" maxlength="200"></div>
      <div class="field"><label for="bio">About me</label><textarea id="bio" maxlength="300">${esc(m.bio)}</textarea></div>
      <div class="field"><label for="tags">Interests</label><input id="tags" value="${esc((m.tags || []).join(', '))}" placeholder="Trekking, filter coffee, old Hindi songs"><span class="hint">Up to six, separated by commas.</span></div>

      <h2 class="section-t">Who you see</h2>
      <div class="row">
        <div class="field"><label for="amin">Age from</label><input id="amin" type="number" min="18" max="80" value="${m.age_min}"></div>
        <div class="field"><label for="amax">Age to</label><input id="amax" type="number" min="18" max="80" value="${m.age_max}"></div>
      </div>
      ${toggleRow('anycity', 'compass', 'Other cities too', 'Also show me people outside my city.', m.any_city)}
      <div class="err" id="err" role="alert"></div>
      <button class="btn block" type="submit">${onboarding ? 'Save and continue' : 'Save changes'}</button>
    </form>
  </main>${onboarding ? '' : navbar('profile')}`);

  const drawCat = () => {
    const done = (ME.destiny_done || []).includes(cat);
    el('destinyrow').innerHTML = done
      ? toggleRow('destiny', 'star', 'Destiny', `One considered ${CAT[cat].name} match every night at 9 pm, with the reasons you fit.`, ME.destiny && cat === ME.mode, `<div style="margin-top:6px"><button type="button" class="linkbtn" data-goto="destiny/${cat}">Edit my answers</button></div>`, true)
      : `<div class="toggle"><span class="circ brass">${I('star')}</span><div class="tx"><b>Destiny</b><span>Answer 12 short ${CAT[cat].name} questions, about three minutes. Your picks then show a match score and a 9 pm match.</span></div><button type="button" class="btn ghost" style="min-height:40px;padding:0 14px" data-goto="destiny/${cat}">Start</button></div>`;
    if (cat === 'forever') {
      const ch = ME.chart;
      el('extras').innerHTML = `<div class="toggle"><span class="circ brass">${I('kundli')}</span><div class="tx"><b>Kundli</b><span>${ME.kundli_on && ch ? `On. Moon in ${esc(ch.rashi_name)}, ${esc(ch.nak_name)} nakshatra.` : 'Optional. Shows a guna score out of 36 on Forever picks.'}</span></div><button type="button" class="btn ghost" style="min-height:40px;padding:0 14px" data-goto="kundli">${ME.kundli_on ? 'Edit' : 'Set up'}</button></div>
        <div class="field" style="margin-top:6px"><label for="religion">Religion</label><select id="religion">${opt(CFG.religions, ME.religion, 'Prefer not to say')}</select></div>
        ${toggleRow('samerel', 'check', 'Same religion only', 'Only show me people who share my religion.', ME.same_religion)}`;
    } else {
      el('extras').innerHTML = ME.zodiac ? toggleRow('zodiac', 'moon', 'Show my zodiac sign', `Adds “${esc(ME.zodiac.name)}” to your profile. Optional, and never used as a filter.`, ME.show_zodiac) : '';
    }
    bindGoto();
  };
  const bindGoto = () => document.querySelectorAll('[data-goto]').forEach((b) => b.onclick = async () => { await saveDraft(); location.hash = b.dataset.goto; });
  drawCat();
  document.querySelectorAll('.catcard').forEach((b) => b.onclick = () => {
    cat = b.dataset.cat;
    document.querySelectorAll('.catcard').forEach((o) => o.setAttribute('aria-pressed', o === b ? 'true' : 'false'));
    if (cat === 'afterdark' && !el('masked').checked) { el('masked').checked = true; toast('Masked is on. Most people keep it on in After Dark; you can turn it off.'); }
    drawCat();
  });
  document.querySelectorAll('.pill').forEach((b) => b.onclick = () => {
    if (b.dataset.multi === '1') b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    else document.querySelectorAll(`.pill[data-group="${b.dataset.group}"]`).forEach((o) => o.setAttribute('aria-pressed', o === b ? 'true' : 'false'));
  });
  el('citysel').onchange = () => { el('city').style.display = el('citysel').value === 'Other' ? 'block' : 'none'; };
  const pick = (g) => [...document.querySelectorAll(`.pill[data-group="${g}"][aria-pressed="true"]`)].map((b) => b.dataset.val);
  if (el('logout')) el('logout').onclick = async () => { await api('/logout', { method: 'POST' }); location.hash = 'login'; };
  document.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => { await saveDraft(); ME.photos = await api('/me/photos/' + b.dataset.del, { method: 'DELETE' }); profileView(onboarding); });
  document.querySelectorAll('[data-add]').forEach((inp) => inp.onchange = async () => {
    if (!inp.files[0]) return;
    try { await saveDraft(); ME.photos = await api('/me/photos', { method: 'POST', body: { image: await compress(inp.files[0]) } }); profileView(onboarding); } catch (x) { toast(x.message); }
  });
  const collect = () => {
    const d = {
      name: el('fname').value, dob: el('dob').value || null, city: el('citysel').value === 'Other' ? el('city').value : el('citysel').value,
      gender: pick('gender')[0], interested: pick('interested'), mode: cat, age_min: el('amin').value, age_max: el('amax').value,
      any_city: el('anycity').checked, masked: el('masked').checked, diet: el('diet').value, height_cm: el('height').value,
      prompt_a: el('pa').value, bio: el('bio').value, tags: el('tags').value.split(',').map((t) => t.trim()).filter(Boolean)
    };
    if (el('destiny')) d.destiny = el('destiny').checked;
    if (el('religion')) d.religion = el('religion').value;
    if (el('samerel')) d.same_religion = el('samerel').checked;
    if (el('zodiac')) d.show_zodiac = el('zodiac').checked;
    return d;
  };
  async function saveDraft() { try { Object.assign(ME, await api('/me', { method: 'PUT', body: collect() })); } catch (e) { /* best effort */ } }
  el('loc').onchange = async () => {
    const box = el('loc');
    try {
      if (box.checked) { await turnOnLocation(); toast('Location on. Nearby people come first.'); }
      else { await api('/me/location', { method: 'PUT', body: { off: true } }); ME.located = false; toast('Location off. We deleted your area.'); }
    } catch (x) { box.checked = !box.checked; toast(x.message); }
  };
  el('maxkm').onchange = async () => { try { ME = await api('/me', { method: 'PUT', body: { max_km: Number(el('maxkm').value) } }); toast('Saved'); } catch (x) { toast(x.message); } };
  el('pf').onsubmit = async (e) => {
    e.preventDefault();
    const d = collect();
    const errEl = el('err');
    if (!d.gender || !d.interested.length) { errEl.textContent = 'Choose who you are and who you’d like to meet.'; return; }
    if (!ME.photos.length) { errEl.textContent = 'Add at least one photo.'; return; }
    try { ME = await api('/me', { method: 'PUT', body: d }); toast('Changes saved'); location.hash = 'picks'; route(); }
    catch (x) { errEl.textContent = x.message; }
  };
}

// ---------- verification ----------
function verifyView() {
  const s = ME.status, idOnly = s === 'verified';
  if (s === 'pending' || (idOnly && ME.id_pending)) {
    render(`<main class="screen fade-in" style="padding-top:64px">
      ${idOnly ? `<a href="#profile" class="backlink">${I('back')}Profile</a>` : ''}
      <span class="circ" style="width:56px;height:56px;border-radius:28px">${I('shield')}</span>
      <h1 style="font-size:34px;margin:24px 0 10px">${idOnly ? 'Your ID is being checked.' : 'You’re in the queue.'}</h1>
      <p class="hint" style="font-size:15px">${idOnly ? 'A member of our team is comparing your ID with your selfie, usually within a few hours. You can keep using PAUSE meanwhile. Both images are deleted once we decide.' : 'A member of our team is taking a quick look at your profile and links, usually within a few hours. Your links are never shown to other members.'}</p>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:28px">
        <button class="btn" id="re">Check status</button>
        ${idOnly || (ME.destiny_done || []).includes(ME.mode) ? '' : `<a class="btn ghost" href="#destiny/${ME.mode}">Answer Destiny questions meanwhile</a>`}
        ${idOnly ? '' : '<a class="btn ghost" href="#profile">Edit profile</a><a class="btn ghost" href="#safety">Set up safety</a>'}
      </div></main>`);
    el('re').onclick = route;
    return;
  }
  const idForm = `
      <div class="field"><label for="idt">ID type</label><select id="idt"><option>PAN</option><option>Driving licence</option><option>Voter ID</option><option>Passport</option></select></div>
      <div class="field"><label for="idn">ID number</label><input id="idn" autocomplete="off" minlength="6"><span class="hint" id="idh"></span></div>
      <div class="field"><label for="idi">Photo of your ID (front)</label><input id="idi" type="file" accept="image/*"><span class="hint" id="idph"></span></div>
      <div class="field"><label for="sf">A selfie, facing the camera in good light</label><input id="sf" type="file" accept="image/*" capture="user"></div>
      <div class="note" style="margin-bottom:6px">${I('lock')}<span>A person compares your selfie with your ID and photos. Both images are deleted as soon as we decide. We don’t accept Aadhaar.</span></div>`;
  render(`<main class="screen">
    ${idOnly ? `<a href="#profile" class="backlink">${I('back')}Profile</a>` : ''}
    <div class="top"><h1 style="font-size:32px">${idOnly ? 'Get the ID-verified badge' : 'Show you’re real'}</h1></div>
    <p class="hint" style="font-size:15px;margin-top:-6px">${idOnly ? 'Optional. Members with the badge show “ID verified” on their profile, so others know their ID was checked by a person.' : 'Step 2 of 2. Link your Instagram or LinkedIn. A member of our team takes a quick look to check you’re real. Your links are never shown to other members.'}</p>
    ${ME.reject_reason ? `<div class="note" style="margin-bottom:16px">${I('alert')}<span>Your last check didn’t pass: ${esc(ME.reject_reason)}. Please try again.</span></div>` : ''}
    <form id="vf">
      ${idOnly ? idForm : `
      <div class="field"><label for="ig">Instagram</label><input id="ig" value="${esc((ME.insta || '').replace('https://www.instagram.com/', '@'))}" placeholder="@yourhandle or profile link" autocomplete="off" autocapitalize="off"></div>
      <div class="field"><label for="li">LinkedIn</label><input id="li" value="${esc(ME.linkedin || '')}" placeholder="linkedin.com/in/your-name" autocomplete="off" autocapitalize="off"><span class="hint">Add at least one. A public profile with your photos is checked fastest.</span></div>
      <details class="idopt"><summary><b>Add an ID check</b> (optional) <span class="hint">Get the “ID verified” badge</span></summary>${idForm}</details>`}
      <div class="err" id="err" role="alert"></div>
      <button class="btn block" type="submit" id="vb" style="margin-top:14px">${idOnly ? 'Submit ID for checking' : 'Submit for review'}</button>
    </form>
    ${idOnly ? '' : '<p style="text-align:center;margin-top:16px"><a href="#profile">Edit profile</a></p>'}
  </main>`);
  const ID_HINTS = {
    PAN: ['Looks like ABCDE1234F.', 'A clear photo of the front of your PAN card.'],
    'Driving licence': ['Looks like MH1420110012345.', 'A clear photo of the front of your driving licence.'],
    'Voter ID': ['Looks like ABC1234567.', 'A clear photo of the front of your Voter ID.'],
    Passport: ['Looks like A1234567.', 'A clear photo of the page with your photo.']
  };
  const keepNote = ' We keep only a one-way code so one ID can’t open two accounts, plus the last 4 characters so our reviewer can match it to your photo. The full number is never stored or shown.';
  const hint = () => { const h = ID_HINTS[el('idt').value]; el('idh').textContent = h[0] + keepNote; el('idph').textContent = h[1]; };
  el('idt').onchange = hint; hint();
  el('vf').onsubmit = async (e) => {
    e.preventDefault();
    const btn = el('vb'), label = btn.textContent;
    const idParts = [el('idn').value.trim(), el('idi').files[0], el('sf').files[0]];
    const wantsId = idOnly || idParts.some(Boolean);
    if (wantsId && !idParts.every(Boolean)) { el('err').textContent = 'For the ID check, add the ID number, a photo of your ID and a selfie' + (idOnly ? '.' : ', or leave all three empty.'); return; }
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      if (!idOnly) await api('/me/social', { method: 'POST', body: { instagram: el('ig').value, linkedin: el('li').value } });
      if (wantsId) { btn.textContent = 'Uploading ID…'; await api('/me/verify', { method: 'POST', body: { id_type: el('idt').value, id_number: el('idn').value, id_image: await compress(el('idi').files[0], 1600), selfie: await compress(el('sf').files[0]) } }); }
      route();
    } catch (x) { el('err').textContent = x.message; btn.disabled = false; btn.textContent = label; }
  };
}

// ---------- picks ----------
function pickCard(p) {
  const photo = p.photos[0] ? `<img src="/api/photo/${p.photos[0].id}" alt="${p.masked ? 'Masked photo' : 'Photo of ' + esc(p.name)}">` : '';
  const badges = [];
  if (p.liked_you) badges.push(`<span class="ly">${I('heart')}Likes you</span>`);
  if (p.destiny) badges.push(`<span class="d">${I('star')}${p.destiny.pct}% Destiny match</span>`);
  if (p.kundli) badges.push(`<span>${I('kundli')}Kundli ${p.kundli.total} of 36</span>`);
  if (p.zodiac) badges.push(`<span>${esc(p.zodiac.name)}</span>`);
  if (p.is_new) badges.push('<span>New this week</span>');
  const mine = (ME.tags || []).map((t) => t.toLowerCase());
  const shared = (p.tags || []).filter((t) => mine.includes(t.toLowerCase())).slice(0, 2);
  const facts = [['Height', p.height_cm ? fmtHeight(p.height_cm) : ''], ['Food', p.diet], ['Religion', p.religion], ['Manglik', p.manglik ? (p.manglik === 'yes' ? 'Yes' : 'No') : '']].filter((f) => f[1]);
  return `<article class="card pick fade-in" id="card">
    <div class="ph">${photo}${p.masked ? `<span class="masklabel">${I('mask')}Masked until you both unmask</span>` : ''}
      <div class="over"><h2>${esc(p.name)}, ${p.age}</h2>
        <div class="city">${p.distance ? `${I('pin')}${esc(p.distance)}` : esc(p.city)}<span class="vtick">${I('check')}${p.id_verified ? 'ID verified' : 'Verified'}</span></div>
        ${badges.length ? `<div class="badges">${badges.join('')}</div>` : ''}</div>
    </div>
    <div class="body">
      ${likedYouBox(p)}
      ${p.destiny && p.destiny.reasons.length ? `<ul class="reasons" aria-label="Why you match">${p.destiny.reasons.map((r) => `<li>${I('star')}<span>${esc(r)}</span></li>`).join('')}</ul>` : ''}
      ${p.prompt_a ? `<div class="prompt"><small>${esc(p.prompt_q)}</small><p>${esc(p.prompt_a)}</p></div>` : ''}
      ${p.bio ? `<p style="margin:0;font-size:15px;line-height:1.6;color:#3A5560">${esc(p.bio)}</p>` : ''}
      ${facts.length ? `<div class="facts">${facts.map(([k, v]) => `<div><small>${k}</small><span>${esc(v)}</span></div>`).join('')}</div>` : ''}
      ${p.tags.length ? `<div class="chips">${p.tags.map((t) => `<span class="chip" ${shared.includes(t) ? 'style="background:var(--brass-soft);color:#6B4A00"' : ''}>${esc(t)}</span>`).join('')}</div>` : ''}
    </div>
  </article>`;
}
function celebrate(other, matchId, masked) {
  const ph = !masked && other.photos[0] ? `<img src="/api/photo/${other.photos[0].id}" alt="">` : initial(other.name);
  const mine = !masked && ME.photos[0] ? `<img src="/api/photo/${ME.photos[0].id}" alt="">` : initial(ME.name);
  const ov = document.createElement('div');
  ov.className = 'celebrate'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'It’s mutual');
  ov.innerHTML = `<div class="pairwrap"><div class="pair"><div>${mine}</div><div>${ph}</div></div><span class="stk sun cs1" aria-hidden="true">${I('heart')}Match!</span><span class="stk mint cs2" aria-hidden="true">Say hi first</span></div>
    <h2>It’s mutual.</h2>
    <p>You and ${esc(other.name)} liked each other.${masked ? ' You’re both masked, so talk first and unmask when you’re both ready.' : ' Numbers stay private until you both choose to share them.'}</p>
    <a class="btn" href="#chat/${matchId}" style="min-width:240px">Open chat</a>
    <button class="btn ghost" style="color:#EAF4F2;border-color:var(--nline);min-width:240px" id="keep">Keep browsing</button>`;
  document.body.appendChild(ov);
  ov.querySelector('a').onclick = () => ov.remove();
  ov.querySelector('#keep').onclick = () => ov.remove();
}
function countdown(iso) {
  const ms = new Date(iso) - Date.now();
  if (ms <= 0) return 'any moment now';
  const h = Math.floor(ms / 36e5), m = Math.floor((ms % 36e5) / 6e4);
  return h ? `${h}h ${m}m` : `${m}m`;
}
function destinyPanel(drop) {
  if (!ME.destiny) {
    const done = (ME.destiny_done || []).includes(ME.mode);
    return `<button type="button" class="panel light" id="dOn"><span class="circ">${I('star')}</span><div><b>${done ? 'Turn Destiny on' : 'Try Destiny'}</b><small>${done ? 'Your answers are saved. One considered match every night at 9.' : 'Answer 12 questions and get one considered match every night at 9.'}</small></div><span class="act">${done ? 'Turn on' : 'Start'}</span></button>`;
  }
  if (!drop) return '';
  if (drop.state === 'waiting') {
    const last = drop.last && drop.last.pick && !drop.last.acted ? `<a href="#drop" style="display:block;font-size:13px;color:#FFD166;margin-top:6px">Yesterday’s match, ${esc(drop.last.pick.name)}, is still waiting</a>` : '';
    return `<div class="panel"><span class="circ">${I('star')}</span><div><b>Tonight’s Destiny</b><small>Arrives at 9 pm, in <span id="cd" data-at="${drop.opens_at}">${countdown(drop.opens_at)}</span></small>${last}</div></div>`;
  }
  if (drop.state === 'ready') {
    if (drop.acted) return `<div class="panel"><span class="circ">${I('star')}</span><div><b>You ${drop.acted === 'like' ? 'liked' : 'passed on'} tonight’s Destiny</b><small>The next one arrives tomorrow at 9 pm.</small></div></div>`;
    return `<a class="panel" href="#drop"><span class="circ">${I('star')}</span><div><b>Tonight’s Destiny: ${esc(drop.pick.name)}</b><small>${drop.score}% match on your answers</small></div><span class="act">View</span></a>`;
  }
  if (drop.state === 'empty') return `<div class="panel"><span class="circ">${I('star')}</span><div><b>No Destiny match tonight</b><small>More verified members join every day. The next one arrives tomorrow at 9 pm.</small></div></div>`;
  return '';
}
async function picksView() {
  const head = () => `<div class="top"><h1>Picks</h1>${catTag(ME.mode, '#profile')}</div>
    <div class="chips" style="margin:-4px 0 18px">${swTag('Masked', 'mask', ME.masked, '#profile')}${swTag('Destiny', 'star', ME.destiny, ME.destiny ? '#profile' : '#destiny/' + ME.mode, true)}${ME.mode === 'forever' ? swTag('Kundli', 'kundli', ME.kundli_on, '#kundli', true) : ''}</div>`;
  render(`<main class="screen">${head()}<p class="hint">Finding your picks…</p></main>${navbar('picks')}`);
  let data = { live: true, picks: [] }, drop = null;
  try { [data, drop] = await Promise.all([api('/picks'), ME.destiny ? api('/destiny/drop').catch(() => null) : null]); } catch (x) { toast(x.message); }
  const panel = destinyPanel(drop);
  const bindPanel = () => {
    if (el('dOn')) el('dOn').onclick = async () => {
      if (!(ME.destiny_done || []).includes(ME.mode)) { location.hash = 'destiny/' + ME.mode; return; }
      ME = await api('/me', { method: 'PUT', body: { destiny: true } }); picksView();
    };
    if (el('cd')) tickTimer = setInterval(() => { const c = el('cd'); if (c) c.textContent = countdown(c.dataset.at); }, 30000);
  };
  const screen = (inner) => { render(`<main class="screen fade-in">${head()}${panel}${inner}</main>${navbar('picks')}`); bindPanel(); };
  if (!data.live) {
    return screen(`<div class="empty">${EMOBJ('pin')}<h2>PAUSE isn’t in ${esc(ME.city)} yet</h2>
      <p class="hint">We’re live in ${esc(CFG.live_cities.join(' and '))}. Your verified profile is saved, and your picks start the day your city opens.</p>
      <a class="btn ghost" href="#profile" style="margin-top:12px">Change city</a></div>`);
  }
  const full = !!data.focus_full;
  let locAsk = !ME.located && !(() => { try { return localStorage.getItem('locAsk'); } catch (e) { return '1'; } })();
  const locCard = () => locAsk ? `<div class="loccard" id="loccard">${I('pin')}<span><b>See people near you first</b>Optional. We only use your area, rounded to about 1 km, and show distance as a range.</span><div><button class="btn" id="locon" type="button">Turn on</button><button class="linkbtn" id="locno" type="button">Not now</button></div></div>` : '';
  const bindLoc = () => {
    if (!el('locon')) return;
    el('locon').onclick = async () => { try { await turnOnLocation(); toast('Location on. Nearby people come first.'); picksView(); } catch (x) { toast(x.message); } };
    el('locno').onclick = () => { try { localStorage.setItem('locAsk', '1'); } catch (e) { /* ignore */ } locAsk = false; el('loccard').remove(); };
  };
  if (data.server_now) setSkew(data.server_now);
  const ex = data.expiring;
  const fullBar = (ex ? `<a class="expbar" href="#chat/${ex.id}">${ring(left(ex.deadline) / 864e5, 'dark')}<span><b>Your match with ${esc(ex.name)} fades in ${leftLabel(left(ex.deadline))}</b>Send a message, or tap Need more time in the chat.</span>${I('chev')}</a>` : '')
    + (full ? `<div class="fullbar">${I('pause')}<span><b>You have five matches.</b> Keep exploring. To like someone new, end one of your matches.</span><a href="#chats">Chats</a></div>` : '');
  const picks = data.picks;
  let i = 0;
  const show = () => {
    const p = picks[i];
    if (!p && !full && picks.length >= 10) { picksView(); return; } // more to explore: load the next batch
    if (!p) {
      return screen(`${fullBar}<div class="empty">${EMOBJ('moon')}<h2>You’ve seen everyone for now</h2>
        <p class="hint">That’s everyone who fits your category, city and age range right now. New members are verified every day, so check back soon, or widen your preferences to see more.</p>
        <a class="btn ghost" href="#profile" style="margin-top:12px">Adjust preferences</a></div>`);
    }
    screen(`${fullBar}${locCard()}<div class="counter">${i + 1} of ${picks.length}</div>
      ${pickCard(p)}
      <div class="actions">
        <button class="round" id="pass" aria-label="${full ? 'Next profile' : 'Pass on ' + esc(p.name)}">${I(full ? 'back' : 'x')}</button>
        <button class="btn" id="like" style="flex:1;min-height:56px;border-radius:28px" ${full ? 'disabled' : ''}>${full ? 'End a match to like' : p.masked ? 'Like, stay masked' : 'Like'}</button>
      </div>
      <p class="hint" style="text-align:center">${full ? 'Browsing doesn’t use anything up. People you skip here stay in your picks.' : `If ${esc(p.name)} likes you back, it’s a match. You have ${data.active} of ${CFG.focus} matches.`}</p>`);
    bindLoc();
    const next = () => { i++; show(); };
    if (full) {
      el('pass').onclick = next;
      swipeable(el('card'), { left: () => setTimeout(next, 260), right: () => {}, rightBlocked: true });
      document.onkeydown = (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') next(); };
      return;
    }
    const card = el('card');
    let busy = false;
    const act = async (kind) => {
      if (busy) return; busy = true;
      if (kind === 'like') {
        const res = await likeSheet(p);
        if (!res.sent) { busy = false; if (res.full) { toast(res.error); setTimeout(picksView, 600); } return; }
        card.classList.add('out-right');
        if (res.r.matched) { data.active++; celebrate(p, res.r.match_id, res.r.masked); }
        setTimeout(() => { i++; show(); }, 280);
        return;
      }
      card.classList.add('out-left');
      try { await api('/like/' + p.id, { method: 'POST', body: { kind } }); } catch (x) { toast(x.message); }
      setTimeout(() => { i++; show(); }, 280);
    };
    el('pass').onclick = () => act('pass');
    el('like').onclick = () => act('like');
    swipeable(card, { left: () => act('pass'), right: () => act('like') });
    document.onkeydown = (e) => { if (document.querySelector('.sheet,.celebrate')) return; if (e.key === 'ArrowRight') act('like'); if (e.key === 'ArrowLeft') act('pass'); };
    if (i === 0 && !(() => { try { return localStorage.getItem('swipeTip'); } catch (e) { return '1'; } })()) {
      toast('Tip: swipe right to like, left to pass');
      try { localStorage.setItem('swipeTip', '1'); } catch (e) { /* ignore */ }
    }
  };
  show();
}

// ---------- explore ----------
const exploreHead = () => `<div class="top"><h1>Explore</h1>${catTag(ME.mode, '#profile')}</div>`;
async function exploreView() {
  let view = sessionStorage.getItem('xview') || (ME.located ? 'near' : 'new'), tag = '';
  const load = async () => {
    render(`<main class="screen">${exploreHead('people')}<p class="hint">Loading…</p></main>${navbar('explore')}`);
    let d;
    try { d = await api('/explore?view=' + view + (tag ? '&tag=' + encodeURIComponent(tag) : '')); } catch (x) { toast(x.message); return; }
    if (!d.live) {
      return render(`<main class="screen">${exploreHead('people')}<div class="empty">${EMOBJ('pin')}<h2>PAUSE isn’t in ${esc(ME.city)} yet</h2><p class="hint">We’re live in ${esc(CFG.live_cities.join(' and '))}.</p></div></main>${navbar('explore')}`);
    }
    const views = [['near', 'Near you'], ['new', 'New this week'], ['shared', 'Shared interests']].concat(ME.destiny ? [['destiny', 'Best Destiny']] : []);
    const tile = (p, k) => {
      const sub = (view === 'shared' && p.shared.length) ? p.shared.slice(0, 2).join(', ') : p.distance || (p.is_new ? 'New this week' : p.city);
      return `<button class="tile" data-k="${k}" type="button" aria-label="${esc(p.name)}, ${p.age}">
        ${p.photos[0] ? `<img src="/api/photo/${p.photos[0].id}" alt="" loading="lazy">` : `<span class="noimg">${initial(p.name)}</span>`}
        ${p.masked ? `<span class="tmask">${I('mask')}</span>` : ''}${p.destiny ? `<span class="tdest">${I('star')}${p.destiny.pct}%</span>` : p.liked_you ? `<span class="tdest tly">${I('heart')}Likes you</span>` : ''}
        <span class="tcap"><b>${esc(p.name)}, ${p.age}</b><small>${esc(sub)}</small></span></button>`;
    };
    render(`<main class="screen fade-in">${exploreHead('people')}
      ${d.focus_full ? `<div class="fullbar">${I('pause')}<span><b>You have five matches.</b> Browse freely; end one to like someone new.</span><a href="#chats">Chats</a></div>` : ''}
      <div class="chips xchips">${views.map(([k, v]) => `<button type="button" class="pill" data-view="${k}" aria-pressed="${view === k && !tag}">${k === 'near' ? I('pin') : ''}${v}</button>`).join('')}</div>
      ${d.tags.length ? `<div class="chips xtags">${d.tags.map((t) => `<button type="button" class="chip" data-tag="${esc(t)}" aria-pressed="${tag === t}">${esc(t)}</button>`).join('')}</div>` : ''}
      ${view === 'near' && !d.located ? `<div class="loccard">${I('pin')}<span><b>Turn on location to sort by distance</b>Optional. We only keep your area, rounded to about 1 km.</span><div><button class="btn" id="xloc" type="button">Turn on</button></div></div>` : ''}
      ${d.people.length ? `<div class="grid">${d.people.map(tile).join('')}</div>` : `<div class="empty">${EMOBJ('moon')}<h2>Nobody here yet</h2><p class="hint">${view === 'shared' ? 'Add more interests to your profile to find people who share them.' : view === 'destiny' ? 'Nobody with Destiny on matches you right now.' : 'You’ve seen everyone who fits for now. New members are verified every day.'}</p></div>`}
    </main>${navbar('explore')}`);
    document.querySelectorAll('[data-view]').forEach((b) => b.onclick = () => { view = b.dataset.view; tag = ''; sessionStorage.setItem('xview', view); load(); });
    document.querySelectorAll('[data-tag]').forEach((b) => b.onclick = () => { tag = tag === b.dataset.tag ? '' : b.dataset.tag; load(); });
    if (el('xloc')) el('xloc').onclick = async () => { try { await turnOnLocation(); load(); } catch (x) { toast(x.message); } };
    document.querySelectorAll('.tile').forEach((t) => t.onclick = () => {
      const p = d.people[+t.dataset.k];
      const sh = openSheet(`<div class="xsheet">${pickCard(p)}</div>
        <div class="actions"><button class="round" id="xpass" aria-label="${d.focus_full ? 'Close' : 'Pass on ' + esc(p.name)}">${I('x')}</button>
        <button class="btn" id="xlike" style="flex:1;min-height:56px;border-radius:28px" ${d.focus_full ? 'disabled' : ''}>${d.focus_full ? 'End a match to like' : p.masked ? 'Like, stay masked' : 'Like'}</button></div>`);
      sh.classList.add('tall');
      const gone = () => { closeSheet(); t.remove(); };
      sh.querySelector('#xpass').onclick = async () => { if (d.focus_full) return closeSheet(); try { await api('/like/' + p.id, { method: 'POST', body: { kind: 'pass' } }); gone(); } catch (x) { toast(x.message); } };
      sh.querySelector('#xlike').onclick = async () => {
        closeSheet();
        const res = await likeSheet(p);
        if (!res.sent) { if (res.full) toast(res.error); return; }
        t.remove();
        if (res.r.matched) celebrate(p, res.r.match_id, res.r.masked); else toast('Liked. If it’s mutual, you’ll match.');
      };
    });
  };
  load();
}

// ---------- date spots map ----------
let leafletReady;
function loadLeaflet() {
  if (!leafletReady) leafletReady = new Promise((resolve, reject) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/vendor/leaflet/leaflet.css'; document.head.appendChild(css);
    const js = document.createElement('script'); js.src = '/vendor/leaflet/leaflet.js'; js.onload = () => resolve(window.L); js.onerror = () => { leafletReady = null; reject(new Error('The map didn’t load. Check your connection.')); };
    document.head.appendChild(js);
  });
  return leafletReady;
}
let SPOTS = null;
async function spotsView() {
  render(`<main class="screen">${plansHead('map')}<p class="hint">Loading the map…</p></main>${navbar('plans')}`);
  try { SPOTS = SPOTS || await api('/spots'); } catch (x) { toast(x.message); return; }
  const kinds = [...new Set(SPOTS.map((s) => s.kind))];
  render(`<main class="screen fade-in">${plansHead('map')}
    <p class="hint" style="margin:-4px 0 12px">Busy, public places in Bangalore that work well for a first meeting. Tap Plan here to suggest one to a match.</p>
    <div class="map" id="map" role="region" aria-label="Map of date spots"></div>
    <div class="chips xtags" style="margin-top:14px"><button type="button" class="chip" data-kind="" aria-pressed="true">All</button>${kinds.map((k) => `<button type="button" class="chip" data-kind="${esc(k)}" aria-pressed="false">${esc(k)}</button>`).join('')}</div>
    <div class="spots" id="spots"></div>
  </main>${navbar('plans')}`);
  let L;
  try { L = await loadLeaflet(); } catch (x) { el('map').innerHTML = `<p class="hint" style="padding:16px">${esc(x.message)}</p>`; }
  let map = null; const pins = {};
  if (L && el('map')) {
    map = L.map('map', { scrollWheelZoom: false, zoomControl: true }).setView([12.965, 77.61], 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
    for (const sp of SPOTS) {
      pins[sp.id] = L.marker([sp.lat, sp.lng], { icon: L.divIcon({ className: 'spotpin', html: '<i></i>', iconSize: [30, 30], iconAnchor: [15, 28] }), title: sp.name })
        .addTo(map).bindPopup(`<b>${esc(sp.name)}</b><br>${esc(sp.kind)}, ${esc(sp.area)}`);
    }
  }
  const list = (kind) => {
    el('spots').innerHTML = SPOTS.filter((s) => !kind || s.kind === kind).map((sp) => `<div class="spot" data-id="${sp.id}">
      <div><b>${esc(sp.name)}</b><small>${esc(sp.kind)}, ${esc(sp.area)}</small><p>${esc(sp.note)}</p></div>
      <span class="spotacts"><button class="linkbtn" type="button" data-planhere="${sp.id}">Plan here</button><a class="linkbtn" href="https://www.google.com/maps/search/?api=1&query=${sp.lat},${sp.lng}" target="_blank" rel="noopener">Directions</a></span></div>`).join('');
    el('spots').querySelectorAll('[data-planhere]').forEach((b) => b.onclick = () => { const sp = SPOTS.find((x) => x.id === b.dataset.planhere); planWith({ spot: sp.id, label: sp.name + ', ' + sp.area }); });
    el('spots').querySelectorAll('.spot').forEach((d) => d.onclick = (e) => { if (e.target.closest('a,button') || !map) return; const sp = SPOTS.find((x) => x.id === d.dataset.id); map.flyTo([sp.lat, sp.lng], 15, { duration: 0.6 }); pins[sp.id].openPopup(); el('map').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    if (map) { const shown = SPOTS.filter((s) => !kind || s.kind === kind); for (const sp of SPOTS) { const on = shown.includes(sp); if (on && !map.hasLayer(pins[sp.id])) pins[sp.id].addTo(map); if (!on && map.hasLayer(pins[sp.id])) map.removeLayer(pins[sp.id]); } }
  };
  document.querySelectorAll('[data-kind]').forEach((b) => b.onclick = () => { document.querySelectorAll('[data-kind]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); list(b.dataset.kind); });
  list('');
}
async function dropView() {
  render(`<main class="screen"><div class="top"><h1>Destiny</h1></div><p class="hint">Opening tonight’s match…</p></main>${navbar('picks')}`);
  let drop;
  try { drop = await api('/destiny/drop'); } catch (x) { toast(x.message); location.hash = 'picks'; return; }
  const d = drop.state === 'ready' ? drop : drop.last;
  if (!d || !d.pick) { location.hash = 'picks'; return; }
  const p = d.pick;
  render(`<main class="screen fade-in"><div class="top"><a class="back" href="#picks" aria-label="Back to picks">${I('back')}</a><h1 style="flex:1;font-size:30px">${drop.state === 'ready' ? 'Tonight’s Destiny' : 'Yesterday’s Destiny'}</h1></div>
    <p class="hint" style="margin-top:-6px">Of everyone in ${esc(CAT[ME.mode].name)}, ${esc(p.name)} is your closest match on the Destiny questions, at ${d.score}%.</p>
    ${pickCard(p)}
    ${d.acted ? `<p class="hint" style="text-align:center;margin-top:16px">You ${d.acted === 'like' ? 'liked' : 'passed on'} this match.</p>` : `<div class="actions"><button class="round" id="pass" aria-label="Pass">${I('x')}</button><button class="btn" id="like" style="flex:1;min-height:56px;border-radius:28px">${p.masked ? 'Like, stay masked' : 'Like'}</button></div>`}
  </main>${navbar('picks')}`);
  if (d.acted) return;
  const act = async (kind) => {
    try {
      let r;
      if (kind === 'like') { const res = await likeSheet(p); if (!res.sent) { if (res.full) toast(res.error); return; } r = res.r; }
      else r = await api('/like/' + p.id, { method: 'POST', body: { kind } });
      if (r.matched) { celebrate(p, r.match_id, r.masked); return; }
      toast(kind === 'like' ? 'Liked. If it’s mutual, a chat opens.' : 'Passed. The next match arrives tomorrow at 9.'); location.hash = 'picks';
    } catch (x) { toast(x.message); }
  };
  el('pass').onclick = () => act('pass');
  el('like').onclick = () => act('like');
}

// ---------- destiny questionnaire ----------
async function destinyView(mode) {
  if (!CAT[mode]) mode = ME.mode;
  let qs, prev;
  try { [qs, prev] = await Promise.all([api('/destiny/questions/' + mode), api('/destiny/answers/' + mode).catch(() => ({}))]); } catch (x) { toast(x.message); location.hash = 'profile'; return; }
  const ans = { ...prev };
  let i = 0;
  const finish = async () => {
    try { ME = await api('/destiny/answers', { method: 'POST', body: { mode, answers: ans } }); } catch (x) { toast(x.message); i = 0; return draw(); }
    const here = mode === ME.mode;
    render(`<div class="qwrap fade-in" style="justify-content:center;text-align:center;align-items:center">
      <span class="circ" style="width:60px;height:60px;border-radius:30px;background:transparent;border-color:#2F6676;color:#FFD166">${I('star')}</span>
      <h2 style="margin:22px 0 10px">Destiny is on.</h2>
      <p style="color:#BCD6D3;max-width:300px;line-height:1.6;margin:0 0 28px">${here ? 'Your picks now show a match score, and each night at 9 pm you’ll get one considered match with the reasons you fit.' : `Saved for ${CAT[mode].name}. It turns on when you move to that category.`}</p>
      <a class="btn" href="#${ME.status === 'verified' ? 'picks' : 'profile'}" style="min-width:240px">${ME.status === 'verified' ? 'See my picks' : 'Back to my profile'}</a></div>`, true);
  };
  const draw = () => {
    if (i >= qs.length) return finish();
    const qq = qs[i];
    render(`<div class="qwrap fade-in">
      <div style="display:flex;align-items:center;gap:12px"><button id="qb" class="back" aria-label="Back" style="color:#EAF4F2">${I('back')}</button>
        <div class="qbar" style="flex:1"><i style="width:${(i / qs.length) * 100}%"></i></div><span style="font-size:13px;color:#8FB4B8">${i + 1} of ${qs.length}</span></div>
      <p style="margin:22px 0 0;font-size:13px;color:#8FB4B8">Destiny, ${esc(CAT[mode].name)}</p>
      <h2 style="margin-top:8px">${esc(qq.q)}</h2>
      <div role="group" aria-label="${esc(qq.q)}">${qq.opts.map((o, k) => `<button class="qopt" data-k="${k}" aria-pressed="${ans[qq.id] === k}">${esc(o)}</button>`).join('')}</div>
      <p style="margin-top:auto;padding-top:20px;font-size:13px;color:#7E999F;text-align:center">Used only to rank your matches. Never shown on your profile.</p></div>`, true);
    document.querySelectorAll('.qopt').forEach((b) => b.onclick = () => {
      ans[qq.id] = +b.dataset.k;
      document.querySelectorAll('.qopt').forEach((o) => o.setAttribute('aria-pressed', o === b ? 'true' : 'false'));
      i++; setTimeout(draw, 180);
    });
    el('qb').onclick = () => { if (i > 0) { i--; draw(); } else history.back(); };
  };
  draw();
}

// ---------- kundli ----------
function kundliView() {
  const m = ME;
  let method = m.kundli_on && !m.birth_time ? 'manual' : 'time';
  const ch = m.chart;
  render(`<main class="screen fade-in">
    <div class="top"><a class="back" href="#profile" aria-label="Back to profile">${I('back')}</a><h1 style="flex:1">Kundli</h1>${catTag('forever')}</div>
    ${m.mode !== 'forever' ? `<div class="note" style="margin-bottom:16px">${I('forever')}<span>Kundli is used only in Forever. You can set it up now and it will show when you’re in Forever.</span></div>` : ''}
    ${m.kundli_on && ch ? `<div class="kres" style="margin-bottom:18px"><span class="circ brass" style="background:#fff">${I('kundli')}</span><div><b>Moon in ${esc(ch.rashi_name)}</b><span style="font-size:14px">${esc(ch.nak_name)} nakshatra, pada ${ch.pada}${m.manglik !== 'unknown' ? (m.manglik === 'yes' ? '. Manglik.' : '. Not manglik.') : ''}</span></div></div>` : ''}
    <div class="chips" style="margin-bottom:16px"><button type="button" class="pill" data-m="time" aria-pressed="${method === 'time'}">From birth time</button><button type="button" class="pill" data-m="manual" aria-pressed="${method === 'manual'}">I know my Rashi and Nakshatra</button></div>
    <form id="kf">
      <div id="byTime">
        <div class="row"><div class="field"><label for="bt">Birth time</label><input id="bt" type="time" value="${esc(m.birth_time)}"></div>
        <div class="field"><label for="bp">Birth city</label><input id="bp" value="${esc(m.birth_place)}" placeholder="Bhilai"></div></div>
        <p class="hint" style="margin-top:-6px">Uses your date of birth (${esc(m.dob || 'add it in your profile')}) in Indian Standard Time.</p>
      </div>
      <div id="byHand" class="row">
        <div class="field"><label for="ra">Rashi (Moon sign)</label><select id="ra">${CFG.rashis.map((r, k) => `<option value="${k}" ${ch && ch.rashi === k ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></div>
        <div class="field"><label for="nk">Nakshatra</label><select id="nk">${CFG.nakshatras.map((n, k) => `<option value="${k}" ${ch && ch.nak === k ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label for="mg">Manglik</label><select id="mg"><option value="unknown">Not sure</option><option value="yes" ${m.manglik === 'yes' ? 'selected' : ''}>Yes</option><option value="no" ${m.manglik === 'no' ? 'selected' : ''}>No</option></select></div>
      <div class="err" id="err" role="alert"></div>
      <button class="btn block" type="submit">${m.kundli_on ? 'Update kundli' : 'Turn on kundli'}</button>
    </form>
    ${m.kundli_on ? `<h2 class="section-t">Show only matches with at least</h2>
      <div class="chips">${[[0, 'Any score'], [18, '18 guna'], [24, '24 guna'], [28, '28 guna']].map(([v, l]) => `<button type="button" class="pill" data-min="${v}" aria-pressed="${m.kundli_min === v}">${l}</button>`).join('')}</div>
      <p class="hint">A higher minimum means fewer picks. Most families look for 18 or more.</p>
      <button class="btn ghost block" id="koff" style="margin-top:18px">Turn off kundli</button>` : ''}
    <p class="hint" style="margin-top:22px">Ashtakoota guna milan out of 36, calculated with Lahiri ayanamsa. A family pandit may differ by a point or two. Scores appear only when both people have kundli on.</p>
  </main>${navbar('profile')}`);
  const sync = () => { el('byTime').style.display = method === 'time' ? 'block' : 'none'; el('byHand').style.display = method === 'manual' ? 'flex' : 'none'; };
  sync();
  document.querySelectorAll('[data-m]').forEach((b) => b.onclick = () => { method = b.dataset.m; document.querySelectorAll('[data-m]').forEach((o) => o.setAttribute('aria-pressed', o === b ? 'true' : 'false')); sync(); });
  el('kf').onsubmit = async (e) => {
    e.preventDefault();
    try {
      ME = await api('/me/kundli', { method: 'PUT', body: { method, birth_time: el('bt').value, birth_place: el('bp').value, rashi: el('ra').value, nakshatra: el('nk').value, manglik: el('mg').value } });
      toast('Kundli saved'); kundliView();
    } catch (x) { el('err').textContent = x.message; }
  };
  document.querySelectorAll('[data-min]').forEach((b) => b.onclick = async () => { ME = await api('/me', { method: 'PUT', body: { kundli_min: +b.dataset.min } }); kundliView(); });
  if (el('koff')) el('koff').onclick = async () => { ME = await api('/me/kundli', { method: 'PUT', body: { kundli_on: false } }); toast('Kundli turned off'); kundliView(); };
}

// ---------- chats ----------
async function chatsView() {
  render(`<main class="screen"><div class="top"><h1>Chats</h1></div><p class="hint">Loading…</p></main>${navbar('chats')}`);
  const data = await api('/matches').catch(() => ({ focus: CFG.focus, chats: [], faded: [] }));
  if (data.server_now) setSkew(data.server_now);
  const list = data.chats, F = data.focus;
  const slots = Array.from({ length: F }, (_, k) => { const c = list[k]; return c ? `<i>${c.level >= 1 && c.other.photos[0] ? `<img src="/api/photo/${c.other.photos[0].id}" alt="">` : initial(c.other.name)}</i>` : '<i class="free"></i>'; }).join('');
  const waiting = (m) => m.pending_by && m.pending_by !== ME.id;
  const faded = data.faded || [];
  render(`<main class="screen fade-in"><div class="top"><h1>Chats</h1>${catTag(ME.mode)}</div>
    <div class="focus"><div class="slots" aria-hidden="true">${slots}</div><div><b>${list.length} of ${F} matches</b><small>${list.length >= F ? 'New matches are paused. End one to make room.' : `New matches pause at five. Quiet matches fade after ${CFG.quiet_days} days.`}</small></div></div>
    ${faded.length ? `<div class="fadednote">${I('clock')}<span>${esc(faded.join(', '))} faded after ${CFG.quiet_days} quiet days. The slot is free again.</span></div>` : ''}
    ${list.length ? `<div class="card list" style="overflow:hidden">${list.map((m) => {
      const cs = clockState(m);
      const av = m.other.photos[0] ? `<img class="av" src="/api/photo/${m.other.photos[0].id}" alt="">` : `<span class="av">${initial(m.other.name)}</span>`;
      const sub = waiting(m) ? (m.level === 0 ? `${esc(m.other.name)} is ready to unmask` : `${esc(m.other.name)} wants to share numbers`)
        : cs.show ? `<span class="${cs.urgent ? 'urg' : 'quiet'}">${esc(cs.text)}</span>` : esc(m.last || '');
      return `<a href="#chat/${m.id}">
      ${cs.show ? `<span class="ringav ${cs.urgent ? 'urgent' : ''}">${av}${ring(cs.frac)}</span>` : av}
      <div style="flex:1;min-width:0"><div style="font-weight:600;display:flex;align-items:center;gap:8px">${esc(m.other.name)}, ${m.other.age}${waiting(m) ? '<span class="dot" aria-label="Waiting for you"></span>' : ''}</div>
      <div class="hint" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sub}</div></div>
      <span class="step s${m.level}">${STEPS[m.level]}</span></a>`;
    }).join('')}</div>`
    : `<div class="empty">${EMOBJ('kulhad')}<h2>No matches yet</h2><p class="hint">When someone you like likes you back, they appear here. You can have up to ${F} matches at a time.</p><a class="btn ghost" href="#picks" style="margin-top:12px">See my picks</a></div>`}
  </main>${navbar('chats', list.filter(waiting).length)}`);
}

// The one orchestrated motion: a masked photo slowly coming into focus.
function unmaskFx(o) {
  const ov = document.createElement('div');
  ov.className = 'celebrate';
  ov.innerHTML = `<div class="reveal-photo">${o.photos[0] ? `<img src="/api/photo/${o.photos[0].id}?u=1" alt="${esc(o.name)}">` : ''}</div>
    <h2>Unmasked.</h2><p>You and ${esc(o.name)} both chose to unmask. Photos are open now.</p>
    <button class="btn" style="min-width:220px">Back to chat</button>`;
  document.body.appendChild(ov);
  const img = ov.querySelector('img');
  const go = () => setTimeout(() => ov.querySelector('.reveal-photo').classList.add('clear'), 80);
  if (img && !img.complete) img.onload = go; else go();
  ov.querySelector('button').onclick = () => ov.remove();
}
function gameHtml(m, d) {
  const o = d.other, mt = m.meta || {};
  if (m.kind === 'tot') {
    const title = esc(mt.title || 'This or that');
    if (mt.done) {
      const mineK = mt.ans[d.me], theirK = Object.entries(mt.ans).find(([k]) => +k !== d.me)[1];
      const lab = (k) => [mineK === k ? 'you' : '', theirK === k ? esc(o.name) : ''].filter(Boolean).join(' and ');
      return `<div class="game"><h4>${title}</h4><div class="q">${esc(mt.a)} or ${esc(mt.b)}?</div>
        <div class="opts"><button disabled class="${mineK === 'a' ? 'pick1' : ''}">${esc(mt.a)}${lab('a') ? `<br><small style="margin:0;font-weight:500">${lab('a')}</small>` : ''}</button><button disabled class="${mineK === 'b' ? 'pick1' : ''}">${esc(mt.b)}${lab('b') ? `<br><small style="margin:0;font-weight:500">${lab('b')}</small>` : ''}</button></div>
        <small>${mineK === theirK ? 'You picked the same.' : 'You picked differently. Make your case.'}</small></div>`;
    }
    if (mt.mine) return `<div class="game"><h4>${title}</h4><div class="q">${esc(mt.a)} or ${esc(mt.b)}?</div><small>You picked ${esc(mt[mt.mine])}. Answers show once ${esc(o.name)} picks too.</small></div>`;
    return `<div class="game"><h4>${title}</h4><div class="q">${esc(mt.a)} or ${esc(mt.b)}?</div><div class="opts"><button data-tot="${m.id}" data-c="a">${esc(mt.a)}</button><button data-tot="${m.id}" data-c="b">${esc(mt.b)}</button></div><small>${esc(o.name)} won’t see your pick until they choose too.</small></div>`;
  }
  if (m.kind === 'ttl') {
    const mineGame = mt.by === d.me;
    const guessed = mt.guess !== null && mt.guess !== undefined;
    if (!mineGame && !guessed) {
      return `<div class="game"><h4>Two truths, one lie, from ${esc(o.name)}</h4><div class="q">Which one is the lie?</div><div class="st">${mt.st.map((s, k) => `<button data-ttl="${m.id}" data-g="${k}">${esc(s)}</button>`).join('')}</div></div>`;
    }
    const rows = mt.st.map((s, k) => `<div class="${k === mt.lie ? 'lie' : ''}">${esc(s)}${k === mt.lie ? '<br><small style="margin:4px 0 0;color:inherit">The lie</small>' : ''}${guessed && k === mt.guess && k !== mt.lie ? `<br><small style="margin:4px 0 0">${mineGame ? esc(o.name) + '’s guess' : 'Your guess'}</small>` : ''}</div>`).join('');
    return `<div class="game"><h4>Two truths, one lie, from ${mineGame ? 'you' : esc(o.name)}</h4><div class="st">${rows}</div><small>${guessed ? (mt.guess === mt.lie ? 'Spotted.' : 'Fooled.') : `Waiting for ${esc(o.name)} to guess.`}</small></div>`;
  }
  if (m.kind === 'qa') {
    if (mt.done) {
      const theirs = Object.entries(mt.ans).find(([k]) => +k !== d.me);
      return `<div class="game"><h4>Question for both</h4><div class="q">${esc(mt.q)}</div><div class="st"><div><small style="margin:0 0 4px">You</small>${esc(mt.ans[d.me])}</div><div><small style="margin:0 0 4px">${esc(o.name)}</small>${esc(theirs ? theirs[1] : '')}</div></div></div>`;
    }
    if (mt.mine) return `<div class="game"><h4>Question for both</h4><div class="q">${esc(mt.q)}</div><div class="st"><div><small style="margin:0 0 4px">Your answer</small>${esc(mt.mine)}</div></div><small>${esc(o.name)}’s answer opens when they reply.</small></div>`;
    return `<div class="game"><h4>Question for both</h4><div class="q">${esc(mt.q)}</div><button class="lightbtn" style="width:100%" data-qa="${m.id}">Answer</button><small>${esc(o.name)} sees your answer only after they answer too.</small></div>`;
  }
  if (m.kind === 'song') {
    const mine = mt.by === d.me, qy = encodeURIComponent(mt.title + ' ' + (mt.artist || ''));
    return `<div class="game"><h4>Song swap from ${mine ? 'you' : esc(o.name)}</h4><div class="q">${esc(mt.title)}</div>${mt.artist ? `<small class="plat">${esc(mt.artist)}</small>` : ''}${mt.why ? `<p class="why">${esc(mt.why)}</p>` : ''}
      <div class="opts links"><a href="https://www.youtube.com/results?search_query=${qy}" target="_blank" rel="noopener">YouTube</a><a href="https://open.spotify.com/search/${qy}" target="_blank" rel="noopener">Spotify</a></div>
      ${mine ? '' : '<button class="darkbtn" data-songback="1" style="margin-top:10px;width:100%">Swap one back</button>'}</div>`;
  }
  if (m.kind === 'watch') {
    const mine = mt.by === d.me, inMe = !!(mt.in || {})[d.me], inThem = Object.keys(mt.in || {}).some((k) => +k !== d.me);
    return `<div class="game watch"><h4>Watch together${mine ? '' : ', from ' + esc(o.name)}</h4><div class="q">${esc(mt.title)}</div><small class="plat">On ${esc(mt.platform)}, ${esc(fmtWhen(mt.at))}</small>
      <div class="wcount" data-watch-at="${esc(mt.at)}">${watchLabel(mt.at)}</div>
      ${!inMe ? `<button class="lightbtn" style="width:100%" data-wjoin="${m.id}">I’m in</button>` : `<small>${inThem ? 'You’re both in. When the countdown hits zero, press play on your own screen.' : `Waiting for ${esc(o.name)} to join.`}</small>`}</div>`;
  }
  if (m.kind === 'plan') return planMsgHtml(m, d);
  if (m.kind === 'likenote') {
    const mine = m.sender_id === d.me;
    const what = mt.label ? (mine ? `You paused on ${esc(o.name)}’s ${esc(mt.label)}` : `${esc(o.name)} paused on your ${esc(mt.label)}`) : (mine ? `You liked ${esc(o.name)}` : `${esc(o.name)} liked you`);
    return `<div class="lnmsg ${mine ? 'me' : 'them'}"><small>${I('heart')}${what}</small>${mt.text ? `<q>${esc(mt.text)}</q>` : ''}${mt.photo ? `<img src="/api/photo/${esc(mt.photo)}?l=${d.level}" alt="">` : ''}${m.body ? `<p>${esc(m.body)}</p>` : ''}${mt.intent_label ? `<span class="lyint">Up for: ${esc(mt.intent_label)}</span>` : ''}</div>`;
  }
  return '';
}
function planMsgHtml(m, d) {
  const o = d.other, p = (d.plans || []).find((x) => x.id === (m.meta || {}).plan_id);
  if (!p) return '';
  const who = p.by_me ? 'You' : esc(o.name);
  const place = `${p.what ? `<small class="plat">${esc(p.what)}</small>` : ''}<div class="q">${esc(p.place)}</div>${p.area ? `<small class="plat">${esc(p.area)}</small>` : ''}`;
  if (p.status === 'proposed') {
    const open = p.slots.filter((t) => new Date(t).getTime() > nowS());
    if (p.by_me) return `<div class="game plan"><h4>You suggested a date</h4>${place}<div class="st">${p.slots.map((t) => `<div>${esc(fmtWhen(t))}</div>`).join('')}</div><small>Waiting for ${esc(o.name)} to pick a time.</small><button class="darkbtn" data-pact="cancel" data-pid="${p.id}" style="margin-top:10px;width:100%">Cancel suggestion</button></div>`;
    return `<div class="game plan"><h4>${who} suggested a date</h4>${place}<div class="st">${p.slots.map((t, k) => new Date(t).getTime() > nowS() ? `<button data-pact="accept" data-pid="${p.id}" data-slot="${k}">${esc(fmtWhen(t))}</button>` : `<div class="past">${esc(fmtWhen(t))}, passed</div>`).join('')}</div>
      <small>${open.length ? 'Tap a time to set the date.' : 'These times have passed.'}</small>
      <div style="display:flex;gap:8px;margin-top:10px"><button class="darkbtn" style="flex:1" data-pother="${p.id}">Other times</button><button class="darkbtn" style="flex:1" data-pact="decline" data-pid="${p.id}">Not this time</button></div></div>`;
  }
  if (p.status === 'confirmed') return `<div class="game plan set"><h4>Date set</h4>${place}<div class="when">${I('calendar')}${esc(fmtWhen(p.chosen))}</div><small>Directions, calendar and sharing are pinned at the top of this chat.</small></div>`;
  return `<div class="game plan off"><h4>${who} suggested a date</h4>${place}<small>${p.status === 'declined' ? 'Not this time.' : 'Cancelled.'}</small></div>`;
}
// The pinned bar: a set date's tools before it, and a private check-in after it.
function pinnedPlan(d) {
  const p = [...(d.plans || [])].reverse().find((x) => x.status === 'confirmed' && new Date(x.chosen).getTime() > nowS() - 7 * 864e5);
  if (!p) return '';
  const t = new Date(p.chosen).getTime(), n = nowS();
  if (n < t + 2 * 36e5) {
    return `<div class="pinbar"><div class="ph1">${I('calendar')}<span><b>${esc(fmtWhen(p.chosen))}</b>${esc(p.place)}${p.area ? ', ' + esc(p.area) : ''}</span></div>
      <div class="pacts"><a class="darkbtn sm" href="${esc(dirUrl(p))}" target="_blank" rel="noopener">${I('pin')}Directions</a><button class="darkbtn sm" data-ics="${p.id}">${I('calendar')}Calendar</button><button class="darkbtn sm" data-sharep="${p.id}">${I('share')}Tell a friend</button>${n >= t - 36e5 && !p.my_safe ? `<button class="lightbtn sm" data-safe="${p.id}">${I('home')}Home safe</button>` : ''}</div>
      ${n < t - 36e5 ? `<button class="linkbtn pcancel" data-pact="cancel" data-pid="${p.id}">Cancel this date</button>` : ''}</div>`;
  }
  if (!p.my_feedback) {
    return `<div class="pinbar"><div class="ph1">${I('star')}<span><b>How was your date?</b>Only you see this. It helps us keep PAUSE safe.</span></div>
      <div class="pacts"><button class="lightbtn sm" data-fb="again" data-pid="${p.id}">See again</button><button class="darkbtn sm" data-fb="not" data-pid="${p.id}">Not for me</button><button class="darkbtn sm" data-fb="report" data-pid="${p.id}">${I('flag')}Report</button></div></div>`;
  }
  return '';
}
const FLAG_TEXT = {
  money: 'This message mentions money or payments. Never send money to someone you haven’t met, and report it if they insist.',
  crypto: 'Crypto or “investment” offers are the most common dating scam. Don’t invest or transfer anything.',
  otp: 'Never share an OTP or verification code with anyone, including a match.',
  link: 'Be careful with links from people you haven’t met. Don’t log in or pay through them.'
};
function watchTimes() {
  const now = new Date(), out = [['15', 'In 15 minutes', new Date(+now + 15 * 6e4)], ['30', 'In 30 minutes', new Date(+now + 30 * 6e4)], ['60', 'In an hour', new Date(+now + 60 * 6e4)]];
  const nine = new Date(now); nine.setHours(21, 0, 0, 0);
  if (nine - now > 30 * 6e4) out.push(['t9', 'Today at 9 pm', nine]);
  const tm = new Date(nine); tm.setDate(tm.getDate() + 1); out.push(['m9', 'Tomorrow at 9 pm', tm]);
  return out;
}
function openGames(id, o, refresh, start) {
  const sh = openSheet(`<h3>Play with ${esc(o.name)}</h3><p class="hint" style="margin:0">Good for breaking the ice, or when the chat goes quiet.</p>
    <button class="gamecard" data-g="qa" type="button"><span class="circ">${I('chat')}</span><span><b>Question for both</b><span class="hint">You both answer the same question. Answers open when you’ve both replied.</span></span></button>
    <div class="gamecard"><span class="circ">${I('split')}</span><span style="flex:1"><b>This or that</b><span class="hint">Answers show only when you’ve both picked.</span>
      <span class="decks"><button type="button" class="pill" data-deck="tot">Classic</button><button type="button" class="pill" data-deck="blr">Bangalore</button><button type="button" class="pill" data-deck="wyr">Would you rather</button></span></span></div>
    <button class="gamecard" data-g="ttl" type="button"><span class="circ">${I('list3')}</span><span><b>Two truths, one lie</b><span class="hint">Write three things about you. They guess which one isn’t true.</span></span></button>
    <form id="ttlf" class="gform" hidden>
      ${[0, 1, 2].map((k) => `<div class="field" style="flex-direction:row;align-items:center;gap:10px"><input type="radio" name="lie" value="${k}" aria-label="Statement ${k + 1} is the lie" ${k === 2 ? 'checked' : ''} style="width:20px;height:20px;flex:none;accent-color:#0B4A5C"><input id="st${k}" maxlength="120" placeholder="${['I’ve ridden to Ladakh on a bike', 'I make a very good biryani', 'I’ve never watched Sholay'][k]}" style="flex:1" required></div>`).join('')}
      <p class="hint" style="margin-top:-4px">Select the circle next to your lie.</p>
      <button class="btn block">Send</button></form>
    <button class="gamecard" data-g="song" type="button"><span class="circ">${I('music')}</span><span><b>Song swap</b><span class="hint">Send a song that says something about you. We add YouTube and Spotify links.</span></span></button>
    <form id="songf" class="gform" hidden>
      <div class="field"><label for="sgt">Song</label><input id="sgt" maxlength="80" required placeholder="Tum Se Hi"></div>
      <div class="field"><label for="sga">Artist</label><input id="sga" maxlength="60" placeholder="Mohit Chauhan"></div>
      <div class="field"><label for="sgw">Why this one? (optional)</label><input id="sgw" maxlength="120" placeholder="My go-to song for long drives"></div>
      <button class="btn block">Send song</button></form>
    <button class="gamecard" data-g="watch" type="button"><span class="circ">${I('play')}</span><span><b>Watch together</b><span class="hint">Pick a show and a start time. You both press play at the countdown, each on your own app.</span></span></button>
    <form id="watchf" class="gform" hidden>
      <div class="field"><label for="wt">What</label><input id="wt" maxlength="80" required placeholder="A movie, or an episode of a show"></div>
      <div class="row"><div class="field"><label for="wp">Where</label><select id="wp">${CFG.platforms.map((x) => `<option>${esc(x)}</option>`).join('')}</select></div>
      <div class="field"><label for="ww">When</label><select id="ww">${watchTimes().map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}<option value="c">Pick a time</option></select></div></div>
      <div class="field" id="wcf" hidden><label for="wc">Start time</label><input id="wc" type="datetime-local"></div>
      <p class="hint" style="margin-top:-4px">There are no calls on PAUSE. Chat while you watch.</p>
      <button class="btn block">Send invite</button></form>`);
  sh.classList.add('tall');
  const send = async (body) => { try { await api(`/matches/${id}/game`, { method: 'POST', body }); closeSheet(); refresh(); } catch (x) { toast(x.message); } };
  const showForm = (f) => { sh.querySelectorAll('.gform').forEach((x) => { x.hidden = x.id !== f; }); const box = sh.querySelector('#' + f); box.scrollIntoView({ block: 'center' }); const inp = box.querySelector('input:not([type=radio])'); if (inp) inp.focus(); };
  sh.querySelector('[data-g="qa"]').onclick = () => send({ type: 'qa' });
  sh.querySelectorAll('[data-deck]').forEach((b) => b.onclick = () => send({ type: 'tot', deck: b.dataset.deck }));
  sh.querySelector('[data-g="ttl"]').onclick = () => showForm('ttlf');
  sh.querySelector('[data-g="song"]').onclick = () => showForm('songf');
  sh.querySelector('[data-g="watch"]').onclick = () => showForm('watchf');
  sh.querySelector('#ww').onchange = () => { sh.querySelector('#wcf').hidden = sh.querySelector('#ww').value !== 'c'; };
  sh.querySelector('#ttlf').onsubmit = (e) => { e.preventDefault(); send({ type: 'ttl', lie: +sh.querySelector('input[name=lie]:checked').value, statements: [0, 1, 2].map((k) => sh.querySelector('#st' + k).value) }); };
  sh.querySelector('#songf').onsubmit = (e) => { e.preventDefault(); send({ type: 'song', title: sh.querySelector('#sgt').value, artist: sh.querySelector('#sga').value, why: sh.querySelector('#sgw').value }); };
  sh.querySelector('#watchf').onsubmit = (e) => {
    e.preventDefault();
    const k = sh.querySelector('#ww').value;
    const at = k === 'c' ? new Date(sh.querySelector('#wc').value) : (watchTimes().find((x) => x[0] === k) || [])[2];
    if (!at || isNaN(at)) { toast('Pick a start time'); return; }
    send({ type: 'watch', title: sh.querySelector('#wt').value, platform: sh.querySelector('#wp').value, at: at.toISOString() });
  };
  if (start === 'qa') sh.querySelector('[data-g="qa"]').classList.add('hl');
  if (['ttl', 'song', 'watch'].includes(start)) showForm(start + 'f');
}
function quickTimes() {
  const now = new Date(), out = [];
  const at = (n, h) => { const x = new Date(now); x.setDate(x.getDate() + n); x.setHours(h, 0, 0, 0); return x; };
  out.push(at(1, 19));
  for (let n = 0; n <= 7; n++) { const wd = at(n, 12).getDay(); if (wd === 6) out.push(at(n, 11), at(n, 17)); if (wd === 0) out.push(at(n, 10), at(n, 18)); }
  const seen = new Set();
  return out.filter((t) => t - now > 60 * 6e4 && !seen.has(+t) && seen.add(+t)).sort((a, b) => a - b).slice(0, 5);
}
async function openPlanner(id, o, d, draft = {}, refresh) {
  try { [SPOTS, IDEAS] = await Promise.all([SPOTS || api('/spots'), IDEAS || api('/ideas')]); } catch (x) { toast(x.message); return; }
  let spot = draft.spot || '', idea = IDEAS.find((x) => x.id === draft.idea) || null;
  const times = new Map();
  const ordered = idea ? [...SPOTS].sort((a, b) => idea.spots.includes(b.id) - idea.spots.includes(a.id)) : SPOTS;
  const sh = openSheet(`<h3>Plan a date with ${esc(o.name)}</h3>
    ${idea ? `<div class="pidea">${I('star')}<span><small>Idea</small><b>${esc(idea.title)}</b></span><button class="linkbtn" id="noidea" type="button">Remove</button></div>` : ''}
    ${d.level === 0 ? `<div class="note" style="margin:10px 0">${I('mask')}<span>You’re both still masked. Unmask before you meet, so you can recognise each other.</span></div>` : ''}
    <span class="flabel" style="display:block;margin-top:12px">Where</span>
    <div class="spots compact pspots" role="group" aria-label="Places">${ordered.map((sp) => `<button type="button" class="spot" data-spot="${sp.id}" aria-pressed="${spot === sp.id}"><div><b>${esc(sp.name)}</b><small>${esc(sp.kind)}, ${esc(sp.area)}</small></div>${idea && idea.spots.includes(sp.id) ? '<span class="sug">Suggested</span>' : ''}</button>`).join('')}</div>
    <div class="field" style="margin-top:10px"><label for="pplace">Or somewhere else</label><input id="pplace" maxlength="80" autocomplete="off" placeholder="Name of a café, park or place" value="${esc(draft.place || '')}"></div>
    <span class="flabel">When (pick up to 3)</span>
    <div class="chips" id="ptimes" style="margin-top:8px">${quickTimes().map((t) => `<button type="button" class="pill" data-t="${t.toISOString()}" aria-pressed="false" aria-label="${esc(fmtWhen(t))}">${esc(fmtShort(t))}</button>`).join('')}</div>
    <div class="row" style="margin-top:12px;align-items:flex-end"><div class="field" style="margin:0"><label for="pdt">Another time</label><input id="pdt" type="datetime-local"></div><button type="button" class="btn ghost" id="padd" style="flex:none;min-height:48px">Add</button></div>
    <p class="hint">${esc(o.name)} picks one of your times, or suggests others. A busy public place is best for a first meeting.</p>
    <div class="err" id="perr" role="alert"></div>
    <button class="btn block" id="psend" type="button">Send plan</button>`);
  sh.classList.add('tall');
  const syncSpots = () => sh.querySelectorAll('[data-spot]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.spot === spot)));
  sh.querySelectorAll('[data-spot]').forEach((b) => b.onclick = () => { spot = spot === b.dataset.spot ? '' : b.dataset.spot; if (spot) sh.querySelector('#pplace').value = ''; syncSpots(); });
  sh.querySelector('#pplace').oninput = () => { if (sh.querySelector('#pplace').value.trim()) { spot = ''; syncSpots(); } };
  if (sh.querySelector('#noidea')) sh.querySelector('#noidea').onclick = () => { idea = null; sh.querySelector('.pidea').remove(); };
  const bindTime = (b) => b.onclick = () => {
    const on = b.getAttribute('aria-pressed') === 'true';
    if (!on && [...sh.querySelectorAll('#ptimes [aria-pressed="true"]')].length >= 3) { toast('Up to three times'); return; }
    b.setAttribute('aria-pressed', String(!on));
  };
  sh.querySelectorAll('#ptimes .pill').forEach(bindTime);
  sh.querySelector('#padd').onclick = () => {
    const v = sh.querySelector('#pdt').value; const t = v ? new Date(v) : null;
    if (!t || isNaN(t) || t - Date.now() < 30 * 6e4) { toast('Pick a time at least half an hour from now'); return; }
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pill'; b.dataset.t = t.toISOString(); b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', fmtWhen(t)); b.textContent = fmtShort(t);
    sh.querySelector('#ptimes').appendChild(b); bindTime(b); b.click(); sh.querySelector('#pdt').value = '';
  };
  if (spot) { const b = sh.querySelector(`[data-spot="${spot}"]`); if (b) b.scrollIntoView({ block: 'nearest' }); }
  sh.querySelector('#psend').onclick = async () => {
    const slots = [...sh.querySelectorAll('#ptimes [aria-pressed="true"]')].map((b) => b.dataset.t);
    const place = sh.querySelector('#pplace').value.trim();
    if (!spot && !place) { sh.querySelector('#perr').textContent = 'Choose a place, or type one.'; return; }
    if (!slots.length) { sh.querySelector('#perr').textContent = 'Pick at least one time.'; return; }
    try { await api(`/matches/${id}/plans`, { method: 'POST', body: { spot_id: spot, place, idea_id: idea ? idea.id : '', slots } }); closeSheet(); toast('Plan sent'); if (refresh) refresh(); }
    catch (x) { sh.querySelector('#perr').textContent = x.message; }
  };
}
function endMatchSheet(id, o) {
  return new Promise((resolve) => {
    let pick = 0;
    const sh = openSheet(`<h3>End this match?</h3><p class="hint" style="margin:0 0 14px">The chat closes and one of your five slots frees up. Send ${esc(o.name)} a kind note, or end it quietly.</p>
      <div class="pons" role="radiogroup" aria-label="Goodbye note">${CFG.goodbyes.map((g, k) => `<button type="button" class="pon" role="radio" data-gb="${k}" aria-pressed="${k === 0}" aria-checked="${k === 0}"><span>${esc(g)}</span></button>`).join('')}<button type="button" class="pon" role="radio" data-gb="-1" aria-pressed="false" aria-checked="false"><span>No note</span></button></div>
      <div style="display:flex;gap:10px;margin-top:16px"><button class="btn ghost" style="flex:1" id="gbno" type="button">Keep chatting</button><button class="btn danger" style="flex:1" id="gbok" type="button">End match</button></div>`);
    const done = (v) => { closeSheet(); resolve(v); };
    document.querySelector('.sheet-bg').onclick = () => done(false);
    sh.querySelectorAll('[data-gb]').forEach((b) => b.onclick = () => { pick = +b.dataset.gb; sh.querySelectorAll('[data-gb]').forEach((x) => { const on = x === b; x.setAttribute('aria-pressed', String(on)); x.setAttribute('aria-checked', String(on)); }); });
    sh.querySelector('#gbno').onclick = () => done(false);
    sh.querySelector('#gbok').onclick = async () => { try { await api(`/matches/${id}/close`, { method: 'POST', body: { note: pick } }); done(true); } catch (x) { toast(x.message); } };
  });
}
async function reportFlow(o) {
  const reason = await dialog({ title: 'Report ' + o.name, body: 'A member of our team reviews every report. Reporting also blocks them.', input: 'What happened?', ok: 'Report and block', danger: true });
  if (reason === false) return false;
  await api('/report/' + o.id, { method: 'POST', body: { reason } }); toast('Reported and blocked'); return true;
}
async function chatView(id) {
  let data;
  try { data = await api('/matches/' + id); } catch (x) { toast(x.message); location.hash = 'chats'; return; }
  setSkew(data.server_now);
  let lastLevel = data.level;
  const sig = (d) => JSON.stringify([d.level, d.pending_by, d.closed, d.extended, d.started, d.messages.length, d.messages.map((m) => (m.meta ? JSON.stringify(m.meta) : '')).join('|'), (d.plans || []).map((p) => p.status + p.my_feedback + p.my_safe).join()]);
  let firstDraw = true;
  const draw = (d) => {
    const o = d.other;
    const prev = el('msg'), hadFocus = prev && document.activeElement === prev;
    const keep = prev ? { v: prev.value, a: prev.selectionStart, b: prev.selectionEnd } : null;
    const nearBottom = firstDraw || window.innerHeight + window.scrollY >= document.body.scrollHeight - 160;
    const msgs = d.messages.map((m) => {
      if (m.system) return `<div class="m sys">${esc(m.body)}</div>`;
      if (['tot', 'ttl', 'qa', 'song', 'watch', 'plan', 'likenote'].includes(m.kind)) return gameHtml(m, d);
      const mine = m.sender_id === d.me;
      return `<div class="m ${mine ? 'me' : 'them'}">${esc(m.body)}</div>${!mine && m.flag ? `<div class="warn">${I('alert')}<span>${FLAG_TEXT[m.flag] || FLAG_TEXT.link}</span></div>` : ''}`;
    }).join('');
    let reveal = '';
    if (!d.closed && d.level < 2) {
      const what = d.level === 0 ? 'unmask' : 'share numbers';
      if (d.pending_by && d.pending_by !== d.me) {
        reveal = `<div class="revealbox"><div><b>${esc(o.name)}</b> is ready to ${what}. It happens only if you agree too.</div>
          <div style="display:flex;gap:10px"><button class="lightbtn" style="flex:1" data-r="approve">${d.level === 0 ? `${I('mask')}Unmask` : `${I('phone')}Share numbers`}</button><button class="darkbtn" style="flex:1" data-r="decline">Not yet</button></div></div>`;
      } else if (d.pending_by === d.me) {
        reveal = `<div class="revealbox"><div>Waiting for ${esc(o.name)}. It happens only when you both agree.</div><button class="darkbtn" data-r="cancel">Cancel request</button></div>`;
      } else {
        reveal = `<div style="padding:0 14px 6px">${d.level === 0 ? `<button class="lightbtn" style="width:100%" data-r="request">${I('mask')}Unmask</button>` : `<button class="darkbtn" style="width:100%" data-r="request">${I('phone')}Share numbers</button>`}</div>`;
      }
    }
    const contact = d.level >= 2 && o.phone ? `<div class="revealbox"><div style="display:flex;align-items:center;gap:10px">${I('phone')}<span>${esc(o.name)}: <a href="tel:+91${esc(o.phone)}" style="color:#FFE3A3">+91 ${esc(o.phone)}</a></span></div><div style="font-size:13px;color:#8FB4B8">Meeting for the first time? Choose a busy public place and share your plan with a friend.</div></div>` : '';
    const cs = clockState(d);
    const quietFor = leftLabel(nowS() - new Date(d.last_activity).getTime());
    const fadebar = !d.closed && cs.show ? `<div class="fadebar ${cs.urgent ? 'urgent' : ''}">${ring(cs.frac)}<span>${!d.started ? `Say hi within ${leftLabel(cs.ms)}, or this match fades.` : `Quiet for ${quietFor}. This match fades in ${leftLabel(cs.ms)} unless one of you writes.`}</span>${cs.canExtend ? '<button class="darkbtn sm" id="extend" type="button">Need more time</button>' : ''}</div>` : '';
    const texts = d.messages.filter((m) => !m.system && m.kind === 'text').slice(-4);
    const flat = texts.length >= 4 && texts.every((m) => m.body.trim().length <= 12);
    const nudgeOn = !d.closed && (cs.show || flat) && !sessionStorage.getItem('nudge:' + id);
    const nudge = nudgeOn ? `<div class="nudge"><span>${!d.started ? 'Start with' : 'Stuck?'}</span><button type="button" data-quick="qa">Question for both</button><button type="button" data-quick="tot">This or that</button><button type="button" class="nx" id="nx" aria-label="Hide suggestions">${I('x')}</button></div>` : '';
    const pin = d.closed ? '' : pinnedPlan(d);
    render(`<div class="night">
      <header class="chathead">
        <a class="back" href="#chats" aria-label="Back to chats" style="width:36px">${I('back')}</a>
        ${o.photos[0] ? `<img class="av" style="width:42px;height:42px;border-radius:21px" src="/api/photo/${o.photos[0].id}?l=${d.level}" alt="${esc(o.name)}">` : `<span class="av" style="width:42px;height:42px;border-radius:21px">${initial(o.name)}</span>`}
        <div style="flex:1;min-width:0"><div style="font-weight:600">${esc(o.name)}, ${o.age}</div><small>${o.id_verified ? 'ID verified' : 'Verified'}, ${esc(o.city)}${d.kundli ? `, kundli ${d.kundli.total} of 36` : ''}</small></div>
        ${d.closed ? '' : `<button aria-label="Plan a date" id="pbtn" class="hbtn">${I('calendar')}</button>`}
        <button aria-label="Chat options" id="mbtn" class="hbtn">${I('dots')}</button>
      </header>
      <div class="steps" aria-label="Progress">${STEPS.map((l, k) => `<div class="${k <= d.level ? 'on' : ''}"><i></i>${l}</div>`).join('')}</div>
      ${fadebar}${pin}
      ${d.level >= 1 && o.photos.length ? `<div style="display:flex;gap:8px;padding:12px 16px;overflow-x:auto">${o.photos.map((p) => `<img src="/api/photo/${p.id}?l=${d.level}" alt="Photo of ${esc(o.name)}" style="height:132px;border-radius:12px">`).join('')}</div>` : ''}
      ${contact}
      <div class="msgs ${nudgeOn ? 'pad' : ''}" id="msgs">${msgs}${d.closed ? `<div class="m sys">${d.ended_reason === 'faded' ? 'This match faded.' : 'This chat is closed.'}</div>` : ''}</div>
      ${d.closed ? '' : `<div class="dock"><div>${reveal}${nudge}<form class="composer" id="cf"><button type="button" class="ib" id="gbtn" aria-label="Play a game">${I('dice')}</button><label for="msg" class="sr">Message</label><input id="msg" autocomplete="off" placeholder="Message ${esc(o.name)}" maxlength="1000"><button class="ib send" aria-label="Send">${I('send')}</button></form></div></div>`}
    </div>`, true);
    const input = el('msg');
    if (input && keep) { input.value = keep.v; if (hadFocus) { input.focus({ preventScroll: true }); try { input.setSelectionRange(keep.a, keep.b); } catch (e) { /* ignore */ } } }
    if (nearBottom) window.scrollTo(0, document.body.scrollHeight);
    firstDraw = false;
    const call = (fn) => async () => { try { await fn(); refresh(); } catch (x) { toast(x.message); } };
    document.querySelectorAll('[data-r]').forEach((b) => b.onclick = call(() => api(`/matches/${id}/reveal`, { method: 'POST', body: { action: b.dataset.r } })));
    document.querySelectorAll('[data-tot]').forEach((b) => b.onclick = call(() => api(`/matches/${id}/game/${b.dataset.tot}`, { method: 'POST', body: { choice: b.dataset.c } })));
    document.querySelectorAll('[data-ttl]').forEach((b) => b.onclick = call(() => api(`/matches/${id}/game/${b.dataset.ttl}`, { method: 'POST', body: { guess: +b.dataset.g } })));
    document.querySelectorAll('[data-wjoin]').forEach((b) => b.onclick = call(() => api(`/matches/${id}/game/${b.dataset.wjoin}`, { method: 'POST', body: { join: true } })));
    document.querySelectorAll('[data-qa]').forEach((b) => b.onclick = async () => {
      const g = d.messages.find((m) => m.id === +b.dataset.qa);
      const a = await dialog({ title: g ? g.meta.q : 'Your answer', input: 'Your answer', ok: 'Send answer' });
      if (a) call(() => api(`/matches/${id}/game/${b.dataset.qa}`, { method: 'POST', body: { answer: a } }))();
    });
    document.querySelectorAll('[data-songback]').forEach((b) => b.onclick = () => openGames(id, o, refresh, 'song'));
    document.querySelectorAll('[data-quick]').forEach((b) => b.onclick = call(() => api(`/matches/${id}/game`, { method: 'POST', body: { type: b.dataset.quick } })));
    if (el('nx')) el('nx').onclick = () => { sessionStorage.setItem('nudge:' + id, '1'); draw(data); };
    if (el('extend')) el('extend').onclick = call(() => api(`/matches/${id}/extend`, { method: 'POST' }));
    document.querySelectorAll('[data-pact]').forEach((b) => b.onclick = async () => {
      if (b.dataset.pact === 'cancel' && !(await dialog({ title: 'Cancel this plan?', body: o.name + ' will see that you cancelled.', ok: 'Cancel plan', cancel: 'Keep it', danger: true }))) return;
      call(() => api('/plans/' + b.dataset.pid, { method: 'POST', body: { action: b.dataset.pact, slot: b.dataset.slot } }))();
    });
    document.querySelectorAll('[data-pother]').forEach((b) => b.onclick = () => { const p = d.plans.find((x) => x.id === +b.dataset.pother); openPlanner(id, o, d, { spot: p.spot_id, place: p.spot_id ? '' : p.place, idea: p.idea_id }, refresh); });
    const planOf = (pid) => d.plans.find((x) => x.id === +pid);
    document.querySelectorAll('[data-ics]').forEach((b) => b.onclick = () => downloadIcs(planOf(b.dataset.ics), o.name));
    document.querySelectorAll('[data-sharep]').forEach((b) => b.onclick = () => shareWithFriend(planOf(b.dataset.sharep), o.name));
    document.querySelectorAll('[data-safe]').forEach((b) => b.onclick = async () => {
      try { await api('/plans/' + b.dataset.safe, { method: 'POST', body: { action: 'safe' } }); } catch (x) { toast(x.message); return; }
      const num = (ME.trusted_phone || '').replace(/\D/g, '').slice(-10);
      if (num.length === 10) window.open('https://wa.me/91' + num + '?text=' + encodeURIComponent('Home safe. Thanks for keeping an eye out.'), '_blank'); else toast('Marked home safe');
      refresh();
    });
    document.querySelectorAll('[data-fb]').forEach((b) => b.onclick = async () => {
      const v = b.dataset.fb;
      try { await api('/plans/' + b.dataset.pid, { method: 'POST', body: { action: 'feedback', value: v } }); } catch (x) { toast(x.message); return; }
      if (v === 'again') { toast('Lovely. Plan the next one when you’re ready.'); refresh(); }
      if (v === 'not') { if (await endMatchSheet(id, o)) { location.hash = 'chats'; return; } refresh(); }
      if (v === 'report') { if (await reportFlow(o)) { location.hash = 'chats'; return; } refresh(); }
    });
    if (el('gbtn')) el('gbtn').onclick = () => openGames(id, o, refresh);
    if (el('pbtn')) el('pbtn').onclick = () => openPlanner(id, o, d, {}, refresh);
    if (el('cf')) el('cf').onsubmit = async (e) => {
      e.preventDefault();
      const v = el('msg').value.trim(); if (!v) return;
      const send = (confirmIt) => api(`/matches/${id}/messages`, { method: 'POST', body: { body: v, confirm: confirmIt } });
      try { await send(false); el('msg').value = ''; refresh(); }
      catch (x) {
        if (x.data && x.data.nudge) { if (await dialog({ title: 'Send this?', body: x.message, ok: 'Send anyway', cancel: 'Edit message' })) { try { await send(true); el('msg').value = ''; refresh(); } catch (y) { toast(y.message); } } }
        else toast(x.message);
      }
    };
    el('mbtn').onclick = () => {
      if (document.querySelector('.menu')) { document.querySelector('.menu').remove(); return; }
      const menu = document.createElement('div'); menu.className = 'menu';
      menu.innerHTML = `${d.closed ? '' : `<button data-a="plan">${I('calendar')}Plan a date</button>`}<button data-a="safety">${I('shield')}Safety tools</button>${d.closed ? '' : `<button data-a="close">${I('minus')}End match politely</button>`}<button data-a="report">${I('flag')}Report</button><button data-a="block">${I('block')}Block</button>`;
      document.querySelector('.night').appendChild(menu);
      menu.onclick = async (e) => {
        const b = e.target.closest('button'); if (!b) return;
        const a = b.dataset.a;
        menu.remove();
        if (a === 'plan') return openPlanner(id, o, d, {}, refresh);
        if (a === 'safety') { sessionStorage.setItem('back', '#chat/' + id); location.hash = 'safety'; return; }
        if (a === 'close' && await endMatchSheet(id, o)) location.hash = 'chats';
        if (a === 'report' && await reportFlow(o)) location.hash = 'chats';
        if (a === 'block' && await dialog({ title: 'Block ' + o.name + '?', body: 'You won’t see each other again and this chat ends.', ok: 'Block', danger: true })) { await api('/block/' + o.id, { method: 'POST' }); location.hash = 'chats'; }
      };
    };
    if (d.level > lastLevel && d.level === 1) unmaskFx(o);
    lastLevel = d.level;
    clearInterval(tickTimer);
    if (document.querySelector('[data-watch-at]')) tickTimer = setInterval(tickWatch, 1000);
  };
  let last = sig(data);
  const refresh = async () => {
    const typing = el('msg') && el('msg').value;
    try { data = await api('/matches/' + id); } catch (e) { return; }
    setSkew(data.server_now);
    last = sig(data);
    draw(data);
    if (typing && el('msg')) el('msg').value = typing;
  };
  draw(data);
  // Arriving from an idea or a spot in Plans: open the planner (or the game) straight away.
  let draft = null;
  try { draft = JSON.parse(sessionStorage.getItem('planDraft') || 'null'); sessionStorage.removeItem('planDraft'); } catch (e) { draft = null; }
  if (draft && !data.closed) { if (draft.game) openGames(id, data.other, refresh, draft.game); else openPlanner(id, data.other, data, draft, refresh); }
  pollTimer = setInterval(async () => {
    if (document.querySelector('.sheet,.menu')) return;
    try { const d = await api('/matches/' + id); setSkew(d.server_now); const s = sig(d); if (s !== last) { last = s; data = d; draw(d); } } catch (e) { /* ignore */ }
  }, 4000);
}

// ---------- safety ----------
function safetyView() {
  const m = ME;
  const info = (icon, title, sub) => `<div class="toggle"><span class="circ">${I(icon)}</span><div class="tx"><b>${title}</b><span>${sub}</span></div></div>`;
  const back = sessionStorage.getItem('back') || (m.status !== 'verified' ? '#verify' : '#profile');
  sessionStorage.removeItem('back');
  render(`<main class="screen">
    <a href="${esc(back)}" class="backlink">${I('back')}${back === '#profile' ? 'Profile' : 'Back'}</a>
    <div class="top"><h1>Safety</h1></div>
    ${toggleRow('pz', 'pause', 'Take a pause', 'Hide from picks for a while. Your open chats stay.', m.paused)}
    <h2 class="section-t">Always on</h2>
    <div class="card" style="padding:2px 16px">
      ${info('drop', 'Photo watermark', 'Every photo you see carries a faint watermark with your account code, so a leaked screenshot can be traced.')}
      ${info('alert', 'Scam warnings', 'Messages asking for money, OTPs, crypto or containing links are flagged. Numbers and handles stay locked until you both share.')}
      ${info('id', 'One person, one account', 'An ID, Instagram or LinkedIn can be linked to only one account, and banned members can’t reuse them.')}
    </div>
    <h2 class="section-t">Contact shield</h2>
    <div class="card" style="padding:4px 16px 16px">
      ${toggleRow('hc', 'building', 'Hide me from my company', 'People who list the same company never see you.', m.hide_company)}
      <div class="field"><label for="co">My company (never shown)</label><input id="co" value="${esc(m.company)}"></div>
      <div class="field"><label for="hp">Hide me from these numbers</label><textarea id="hp" placeholder="One number per line: relatives, exes, colleagues">${esc((m.hidden_phones || []).join('\n'))}</textarea><span class="hint">They never see you, and you never see them.</span></div>
      <button class="btn block" id="saveshield">Save contact shield</button>
    </div>
    <h2 class="section-t">Before a first meeting</h2>
    <div class="card" style="padding:16px">
      <div class="row"><div class="field"><label for="tn">Trusted person</label><input id="tn" value="${esc(m.trusted_name)}" placeholder="Name"></div>
      <div class="field"><label for="tp">Their number</label><input id="tp" type="tel" value="${esc(m.trusted_phone)}"></div></div>
      <div class="field"><label for="plan">Date plan</label><input id="plan" placeholder="Saturday 7:30 pm, coffee with Rohan at the café on 12th Main"></div>
      <button class="btn block" id="share">${I('calendar')}Send plan on WhatsApp</button>
      <p class="hint">Sends your plan and asks them to call if they haven’t heard from you within an hour. Dates you set with the planner in a chat have a Share with a friend button that fills this in for you.</p>
    </div>
    <a class="btn danger block" href="tel:112" style="margin-top:18px">${I('phone')}Emergency: call 112</a>
    <button class="btn ghost block" id="alert" style="margin-top:10px">${I('pin')}Send my location to my trusted person</button>
    <p class="hint" style="margin-top:24px">Questions about a rule or a problem? <button class="linkbtn" data-ask type="button">Ask for help</button> or contact our <a href="/grievance" target="_blank">grievance officer</a>.</p>
    <button class="btn ghost block" id="del" style="margin-top:16px;color:var(--claret);border-color:#F2C2B8">Delete my account and data</button>
  </main>${m.status === 'verified' ? navbar('profile') : ''}`);
  el('pz').onchange = async () => { try { ME = await api('/me', { method: 'PUT', body: { paused: el('pz').checked } }); toast(ME.paused ? 'Paused. You’re hidden from picks.' : 'You’re back in picks.'); } catch (x) { toast(x.message); } };
  el('saveshield').onclick = async () => {
    try { ME = await api('/me', { method: 'PUT', body: { hide_company: el('hc').checked, company: el('co').value, hidden_phones: el('hp').value.split(/\n|,/) } }); toast('Contact shield saved'); } catch (x) { toast(x.message); }
  };
  const saveTrusted = () => api('/me', { method: 'PUT', body: { trusted_name: el('tn').value, trusted_phone: el('tp').value } }).then((u) => (ME = u)).catch(() => {});
  el('share').onclick = async () => {
    await saveTrusted();
    if (!el('tp').value) { toast('Add your trusted person’s number first.'); return; }
    const text = `Hi ${el('tn').value || ''}, I’m going on a date: ${el('plan').value || '(details)'}. If you don’t hear from me within an hour after it starts, please call me. Sent from PAUSE.`;
    window.open('https://wa.me/91' + el('tp').value.replace(/\D/g, '').slice(-10) + '?text=' + encodeURIComponent(text), '_blank');
  };
  el('alert').onclick = async () => {
    await saveTrusted();
    if (!el('tp').value) { toast('Add your trusted person’s number first.'); return; }
    const send = (loc) => window.open('https://wa.me/91' + el('tp').value.replace(/\D/g, '').slice(-10) + '?text=' + encodeURIComponent('I need help. Please call me now.' + (loc ? ' My location: ' + loc : '')), '_blank');
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition((p) => send(`https://maps.google.com/?q=${p.coords.latitude},${p.coords.longitude}`), () => send(''), { timeout: 5000 });
    else send('');
  };
  el('del').onclick = async () => {
    if (await dialog({ title: 'Delete your account?', body: 'Your profile, photos, chats and data are deleted permanently. This can’t be undone. If you only need a break, use Take a pause instead.', ok: 'Delete everything', danger: true })) { await api('/me', { method: 'DELETE' }); location.href = '/'; }
  };
}

// ---------- time and countdowns ----------
let SKEW = 0; // server clock minus this device's clock, so countdowns agree on both phones
const nowS = () => Date.now() + SKEW;
const setSkew = (iso) => { const t = new Date(iso).getTime(); if (t) SKEW = t - Date.now(); };
const left = (iso) => new Date(iso).getTime() - nowS();
function leftLabel(ms) {
  if (ms <= 0) return 'a moment';
  if (ms >= 36 * 36e5) { const d = Math.round(ms / 864e5); return `${d} day${d > 1 ? 's' : ''}`; }
  if (ms >= 36e5) { const h = Math.ceil(ms / 36e5); return `${h} hour${h > 1 ? 's' : ''}`; }
  const m = Math.max(1, Math.ceil(ms / 6e4)); return `${m} min`;
}
function ring(frac, cls = '') {
  const r = 10, c = 2 * Math.PI * r, f = Math.max(0.02, Math.min(1, frac));
  return `<svg class="ring ${cls}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="${r}" class="bg"/><circle cx="12" cy="12" r="${r}" class="fg" stroke-dasharray="${(c * f).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 12 12)"/></svg>`;
}
// When to show a match's countdown: before anyone says hi, after a quiet day, and in the last two days.
function clockState(c) {
  const ms = left(c.deadline);
  const total = (c.quiet_days + (c.extended ? c.extend_days : 0)) * 864e5;
  const quiet = nowS() - new Date(c.last_activity).getTime();
  const urgent = ms < 864e5;
  return { ms, frac: ms / total, urgent, show: !c.started || quiet > 864e5 || ms < 2 * 864e5,
    canExtend: !c.extended && ms > 0 && ms < c.extend_days * 864e5,
    text: !c.started ? `Say hi: ${leftLabel(ms)} left` : urgent ? `Fades in ${leftLabel(ms)}` : `Quiet. Fades in ${leftLabel(ms)}` };
}
const WHEN_FMT = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const fmtWhen = (t) => WHEN_FMT.format(new Date(t));
// "Sat 28, 11 am": short enough for two chips a row.
function fmtShort(t) {
  const d = new Date(t), h = d.getHours(), m = d.getMinutes();
  const day = d.toLocaleDateString('en-IN', { weekday: 'short' }) + ' ' + d.getDate();
  return `${day}, ${h % 12 || 12}${m ? ':' + String(m).padStart(2, '0') : ''} ${h < 12 ? 'am' : 'pm'}`;
}
function watchLabel(at) {
  const ms = left(at);
  if (ms > 60000) return `Starts in ${leftLabel(ms)}`;
  if (ms > 0) return String(Math.ceil(ms / 1000));
  if (ms > -60000) return 'Press play now';
  if (ms > -3 * 36e5) return 'Started. Enjoy the show.';
  return 'Watched together';
}
function tickWatch() {
  const els = document.querySelectorAll('[data-watch-at]');
  if (!els.length) { clearInterval(tickTimer); return; }
  els.forEach((e) => { const ms = left(e.dataset.watchAt); e.textContent = watchLabel(e.dataset.watchAt); e.classList.toggle('go', ms <= 10000 && ms > -60000); });
}

// ---------- like sheet: "What made you pause?" ----------
function likedYouBox(p) {
  const ly = p.liked_you;
  if (!ly) return '';
  const what = ly.label ? `${esc(p.name)} paused on your ${esc(ly.label)}` : `${esc(p.name)} liked you`;
  return `<div class="likedyou"><div class="lyh">${I('heart')}<b>${what}</b></div>
    ${ly.photo ? `<img src="/api/photo/${esc(ly.photo)}" alt="Your photo">` : ''}
    ${ly.text ? `<p class="lyq">${ly.q ? `<small>${esc(ly.q)}</small>` : ''}${esc(ly.text)}</p>` : ''}
    ${ly.note ? `<p class="lynote">${esc(ly.note)}</p>` : ''}
    ${ly.intent ? `<span class="lyint">Up for: ${esc(ly.intent)}</span>` : ''}
    <small class="lyhint">Like back and it’s a match.</small></div>`;
}
function likeSheet(p) {
  return new Promise((resolve) => {
    let about = '', intent = '', done = false;
    const opts = [];
    if (p.prompt_a) opts.push(['prompt', `<small>${esc(p.prompt_q)}</small><span>${esc(p.prompt_a)}</span>`]);
    if (p.bio) opts.push(['bio', `<small>About ${esc(p.name)}</small><span>${esc(p.bio.length > 110 ? p.bio.slice(0, 107) + '…' : p.bio)}</span>`]);
    const photos = p.masked ? [] : (p.photos || []);
    const sh = openSheet(`<h3>What made you pause?</h3>
      <p class="hint" style="margin:0 0 14px">Tap what you liked and add a line. ${esc(p.name)} sees it with your like. Both are optional.</p>
      ${opts.length || photos.length ? `<div class="pons" role="group" aria-label="What you liked">${opts.map(([k, h]) => `<button type="button" class="pon" data-about="${k}" aria-pressed="false">${h}</button>`).join('')}
        ${photos.length ? `<div class="ponph">${photos.map((ph, k) => `<button type="button" class="pon ph" data-about="photo:${k}" aria-pressed="false" aria-label="Photo ${k + 1}"><img src="/api/photo/${ph.id}" alt=""></button>`).join('')}</div>` : ''}</div>` : ''}
      <div class="field" style="margin-top:14px"><label for="lnote">Add a line</label><input id="lnote" maxlength="140" autocomplete="off" placeholder="Say something they can reply to"></div>
      <span class="flabel">Up for</span>
      <div class="chips" style="margin:8px 0 14px">${Object.entries(CFG.intents || {}).map(([k, v]) => `<button type="button" class="pill" data-intent="${k}" aria-pressed="false">${esc(v)}</button>`).join('')}</div>
      <div class="err" id="lerr" role="alert"></div>
      <button class="btn block" id="lsend" type="button">${p.liked_you ? 'Like back' : p.masked ? 'Send like, stay masked' : 'Send like'}</button>`);
    sh.classList.add('tall');
    const finish = (v) => { if (done) return; done = true; closeSheet(); resolve(v); };
    document.querySelector('.sheet-bg').onclick = () => finish({ sent: false });
    const note = sh.querySelector('#lnote');
    const HOLD = { prompt: 'Ask about their answer, or say why it made you smile', bio: 'Pick one thing from their bio to ask about', photo: 'What’s the story behind this one?' };
    sh.querySelectorAll('[data-about]').forEach((b) => b.onclick = () => {
      about = about === b.dataset.about ? '' : b.dataset.about;
      sh.querySelectorAll('[data-about]').forEach((o) => o.setAttribute('aria-pressed', String(o.dataset.about === about)));
      note.placeholder = HOLD[about.split(':')[0]] || 'Say something they can reply to';
    });
    sh.querySelectorAll('[data-intent]').forEach((b) => b.onclick = () => {
      intent = intent === b.dataset.intent ? '' : b.dataset.intent;
      sh.querySelectorAll('[data-intent]').forEach((o) => o.setAttribute('aria-pressed', String(o.dataset.intent === intent)));
    });
    const send = async () => {
      const btn = sh.querySelector('#lsend'); if (btn.disabled) return; btn.disabled = true;
      try { const r = await api('/like/' + p.id, { method: 'POST', body: { kind: 'like', about, note: note.value, intent } }); finish({ sent: true, r }); }
      catch (x) { btn.disabled = false; if (x.data && x.data.focus_full) return finish({ sent: false, full: true, error: x.message }); sh.querySelector('#lerr').textContent = x.message; }
    };
    sh.querySelector('#lsend').onclick = send;
    note.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } };
    (sh.querySelector('[data-about]') || note).focus({ preventScroll: true });
  });
}

// ---------- plans: ideas, map, yours ----------
let IDEAS = null;
const VIBES = [['', 'All'], ['first', 'First date'], ['budget', 'Under ₹500'], ['sober', 'No alcohol'], ['rainy', 'Rainy day'], ['active', 'Active'], ['late', 'Late night'], ['home', 'Stay in']];
const COST = ['', 'Under ₹500', '₹500 to ₹1,500', 'Over ₹1,500'];
const plansHead = (tab) => `<div class="top"><h1>Plans</h1>${catTag(ME.mode)}</div>
  <div class="seg" role="tablist"><a href="#plans" role="tab" aria-selected="${tab === 'ideas'}">Ideas</a><a href="#plans/map" role="tab" aria-selected="${tab === 'map'}">Map</a><a href="#plans/yours" role="tab" aria-selected="${tab === 'yours'}">Your plans</a></div>`;
function plansView(arg) {
  if (arg === 'map') return spotsView();
  if (arg === 'yours') return yoursView();
  return ideasView();
}
const dirUrl = (p) => p.lat != null ? `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.place + (p.area ? ', ' + p.area : '') + ', Bangalore')}`;
function downloadIcs(p, name) {
  if (!p || !p.chosen) return;
  const s = new Date(p.chosen), e = new Date(s.getTime() + 2 * 36e5);
  const f = (x) => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const tx = (v) => String(v).replace(/[\\,;]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PAUSE//Date plan//EN', 'BEGIN:VEVENT', `UID:pause-plan-${p.id}@pause`, `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(s)}`, `DTEND:${f(e)}`, `SUMMARY:${tx((p.what || 'Date') + ' with ' + name)}`, `LOCATION:${tx(p.place + (p.area ? ', ' + p.area : '') + ', Bangalore')}`,
    'DESCRIPTION:Planned on PAUSE. Tell a friend where you’re going.', 'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Your date is in 2 hours', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'pause-date.ics';
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
function shareWithFriend(p, name) {
  if (!p) return;
  const text = `I’m meeting ${name} (a match from PAUSE) at ${p.place}${p.area ? ', ' + p.area : ''} on ${fmtWhen(p.chosen)}. If you don’t hear from me within an hour after it starts, please call me.`;
  const num = (ME.trusted_phone || '').replace(/\D/g, '').slice(-10);
  window.open((num.length === 10 ? 'https://wa.me/91' + num : 'https://wa.me/') + '?text=' + encodeURIComponent(text), '_blank');
}
// From an idea or a spot: choose which match to plan with, then open that chat with the planner ready.
async function planWith(draft) {
  let chats;
  try { chats = (await api('/matches')).chats; } catch (x) { toast(x.message); return; }
  if (!chats.length) {
    if (await dialog({ title: 'Match with someone first', body: 'Plans happen inside a chat, so you’ll need a match. Your picks are waiting.', ok: 'See my picks', cancel: 'Not now' })) location.hash = 'picks';
    return;
  }
  const sh = openSheet(`<h3>Who with?</h3><p class="hint" style="margin:0 0 12px">${esc(draft.label)}</p>
    <div class="card list mlist">${chats.map((c) => `<button type="button" data-m="${c.id}">${c.level >= 1 && c.other.photos[0] ? `<img class="av" src="/api/photo/${c.other.photos[0].id}" alt="">` : `<span class="av">${initial(c.other.name)}</span>`}<span><b>${esc(c.other.name)}, ${c.other.age}</b><small>${STEPS[c.level]}</small></span>${I('chev')}</button>`).join('')}</div>`);
  sh.querySelectorAll('[data-m]').forEach((b) => b.onclick = () => { sessionStorage.setItem('planDraft', JSON.stringify(draft)); closeSheet(); location.hash = 'chat/' + b.dataset.m; });
}
async function ideasView() {
  render(`<main class="screen">${plansHead('ideas')}<p class="hint">Loading ideas…</p></main>${navbar('plans')}`);
  try { [IDEAS, SPOTS] = await Promise.all([IDEAS || api('/ideas'), SPOTS || api('/spots')]); } catch (x) { toast(x.message); return; }
  let vibe = sessionStorage.getItem('vibe') || '';
  const card = (x) => {
    const where = (x.spots || []).map((id) => SPOTS.find((sp) => sp.id === id)).filter(Boolean).map((sp) => sp.name);
    return `<article class="idea"><div class="ihead"><b>${esc(x.title)}</b><small>${esc(x.when)}, ${COST[x.cost]}</small></div>
      <p>${esc(x.blurb)}</p>${where.length ? `<small class="iwhere">${I('pin')}${esc(where.join(', '))}</small>` : ''}
      <button class="btn ghost" data-idea="${x.id}" type="button">${x.game ? `${I('play')}Start with a match` : `${I('calendar')}Plan with a match`}</button></article>`;
  };
  const draw = () => {
    const list = IDEAS.filter((x) => !vibe || x.vibes.includes(vibe));
    render(`<main class="screen fade-in">${plansHead('ideas')}
      <p class="hint" style="margin:-4px 0 12px">Date ideas for Bangalore. Pick one and plan it with a match.</p>
      <div class="chips xchips" role="group" aria-label="Filter ideas">${VIBES.map(([k, v]) => `<button type="button" class="pill" data-vibe="${k}" aria-pressed="${vibe === k}">${v}</button>`).join('')}</div>
      <div class="ideas">${list.map(card).join('')}</div>
    </main>${navbar('plans')}`);
    document.querySelectorAll('[data-vibe]').forEach((b) => b.onclick = () => { vibe = b.dataset.vibe; sessionStorage.setItem('vibe', vibe); draw(); });
    document.querySelectorAll('[data-idea]').forEach((b) => b.onclick = () => { const x = IDEAS.find((i) => i.id === b.dataset.idea); planWith({ idea: x.id, game: x.game || '', label: x.title }); });
  };
  draw();
}
async function yoursView() {
  render(`<main class="screen">${plansHead('yours')}<p class="hint">Loading your plans…</p></main>${navbar('plans')}`);
  let list = [];
  try { list = await api('/plans'); } catch (x) { toast(x.message); }
  const n = nowS();
  const t = (p) => new Date(p.chosen).getTime();
  const groups = [
    ['Waiting for you', list.filter((p) => p.status === 'proposed' && !p.by_me && !p.closed)],
    ['Coming up', list.filter((p) => p.status === 'confirmed' && t(p) + 2 * 36e5 > n)],
    ['How did it go?', list.filter((p) => p.status === 'confirmed' && t(p) + 2 * 36e5 <= n && !p.my_feedback)],
    ['Waiting for them', list.filter((p) => p.status === 'proposed' && p.by_me && !p.closed)]
  ].filter((g) => g[1].length);
  const row = (p) => {
    const av = p.other.photo ? `<img class="av" src="/api/photo/${p.other.photo}" alt="">` : `<span class="av">${initial(p.other.name)}</span>`;
    const fb = p.status === 'confirmed' && t(p) + 2 * 36e5 <= n && !p.my_feedback;
    const open = p.slots.filter((x) => new Date(x).getTime() > n).length;
    const line = p.status === 'confirmed' ? `${fmtWhen(p.chosen)}, with ${p.other.name}`
      : p.by_me ? `You offered ${p.slots.length === 1 ? 'one time' : p.slots.length + ' times'}. Waiting for ${p.other.name}.`
      : open ? `${p.other.name} offered ${open === 1 ? 'one time' : open + ' times'}. Pick one in the chat.` : `${p.other.name}’s times have passed. Suggest new ones.`;
    const body = `${av}<div class="prt"><b>${esc(p.place)}</b>${p.what ? `<small>${esc(p.what)}</small>` : ''}<span>${esc(line)}</span>
      ${fb ? `<div class="pacts light"><button class="btn sm" data-fb="again" data-pid="${p.id}">See again</button><button class="btn ghost sm" data-fb="not" data-pid="${p.id}">Not for me</button></div>` : ''}</div>`;
    return fb || p.closed ? `<div class="planrow">${body}</div>` : `<a class="planrow" href="#chat/${p.match_id}">${body}${I('chev')}</a>`;
  };
  render(`<main class="screen fade-in">${plansHead('yours')}
    ${groups.length ? groups.map(([h, g]) => `<h2 class="section-t">${h}</h2><div class="card plist">${g.map(row).join('')}</div>`).join('')
    : `<div class="empty">${EMOBJ('kulhad')}<h2>No plans yet</h2><p class="hint">Pick an idea, or tap the calendar button in any chat to suggest a place and a few times.</p><a class="btn ghost" href="#plans" style="margin-top:12px">Browse ideas</a></div>`}
  </main>${navbar('plans')}`);
  document.querySelectorAll('[data-fb]').forEach((b) => b.onclick = async () => {
    try { await api('/plans/' + b.dataset.pid, { method: 'POST', body: { action: 'feedback', value: b.dataset.fb } }); } catch (x) { toast(x.message); return; }
    if (b.dataset.fb === 'not') { const p = list.find((x) => x.id === +b.dataset.pid); if (await endMatchSheet(p.match_id, p.other)) toast('Match ended. Thanks for telling us.'); return yoursView(); }
    toast('Thanks. Plan the next one when you’re ready.'); yoursView();
  });
}

route();

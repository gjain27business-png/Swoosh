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
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
};
const I = (name, extra = '') => `<svg class="ic ${extra}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`;
const AV = (who, opt) => (window.PauseAvatar ? PauseAvatar.svg(who, opt) : '');
const EMAV = (who, opt) => `<span class="emav" aria-hidden="true">${AV(who, opt)}</span>`;
const WORDMARK = '<span class="wordmark light"><i class="mk" aria-hidden="true"><b></b><b></b></i>pause</span>';

const CAT = {
  steady: { name: 'Steady', icon: 'steady', line: 'Dating that’s going somewhere' },
  forever: { name: 'Forever', icon: 'forever', line: 'Marriage-minded. Kundli optional.' },
  afterdark: { name: 'After Dark', icon: 'moon', line: 'Casual and honest. Still fully verified.' }
};
const GENDERS = { woman: 'Woman', man: 'Man', nonbinary: 'Non-binary' };
const STEPS = ['Masked', 'Unmasked', 'Numbers shared'];
let ME = null;
let CFG = { brand: 'PAUSE', live_cities: ['Bangalore', 'Delhi NCR'], focus: 5, religions: [], diets: [], nakshatras: [], rashis: [] };
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
  return `<nav class="navbar" aria-label="Main"><div>${item('picks', 'Picks', 'heart')}${item('chats', 'Chats', 'chat', badge)}${item('safety', 'Safety', 'shield')}${item('profile', 'Profile', 'user')}<a href="#" data-ask role="button">${I('help')}Help</a></div></nav>`;
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

// ---------- routing ----------
async function route() {
  clearInterval(pollTimer); clearInterval(tickTimer);
  document.querySelectorAll('.celebrate,.toast,.ask,.ask-bg').forEach((e) => e.remove());
  closeSheet();
  await cfgReady;
  const [view, arg] = location.hash.replace(/^#/, '').split('/');
  if (view === 'signup' || view === 'login') return authView(view);
  try { ME = await api('/me'); } catch (e) { return authView('signup'); }
  const profileDone = ME.name && ME.gender && ME.dob && ME.city && ME.interested.length && ME.photos.length;
  if (view === 'profile' || !profileDone) return profileView(!profileDone);
  if (view === 'safety') return safetyView();
  if (view === 'destiny') return destinyView(arg || ME.mode);
  if (view === 'kundli') return kundliView();
  if (ME.status !== 'verified') return verifyView();
  if (view === 'chats') return chatsView();
  if (view === 'chat' && arg) return chatView(arg);
  if (view === 'drop') return dropView();
  return picksView();
}
window.addEventListener('hashchange', route);

// ---------- auth ----------
function authView(mode) {
  const signup = mode === 'signup';
  render(`<main class="screen fade-in" style="padding-top:24px">
    <div class="authhero">${WORDMARK}<div class="ahs" aria-hidden="true"><span class="a1">${AV('ananya')}</span><span class="a2">${AV('kabir')}</span><span class="stk mint s1">${I('heart')}It’s mutual!</span><span class="stk s2">Chai pe chalein?</span></div></div>
    <h1 style="font-size:42px;margin:28px 0 12px">${signup ? 'Hit pause on swiping.' : 'Welcome back.'}</h1>
    <p class="hint" style="font-size:15px;margin:0 0 24px">${signup ? 'Every member is ID-verified. You keep five conversations at a time, and photos stay masked until you both choose to unmask. Live in Bangalore and Delhi NCR.' : 'Log in with your mobile number.'}</p>
    <form id="f">
      <div class="field"><label for="phone">Mobile number</label><input id="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="10-digit number" required></div>
      <div class="field"><label for="pw">Password</label><input id="pw" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" minlength="8" required placeholder="At least 8 characters"></div>
      ${signup ? '<label style="display:flex;gap:10px;align-items:flex-start;font-size:14px;margin-bottom:14px"><input id="agree" type="checkbox" style="width:20px;height:20px;margin-top:1px;flex:none;accent-color:#0B4A5C" required><span>I’m 18 or older and agree to the <a href="/terms" target="_blank">Terms</a> and <a href="/privacy" target="_blank">Privacy Policy</a>.</span></label>' : ''}
      <div class="err" id="err" role="alert"></div>
      <button class="btn block" type="submit">${signup ? 'Create account' : 'Log in'}</button>
    </form>
    <p style="text-align:center;margin-top:22px;font-size:15px">${signup ? 'Already a member? <a href="#login">Log in</a>' : 'New to PAUSE? <a href="#signup">Create an account</a>'}</p>
    <p style="text-align:center"><button class="linkbtn" data-ask type="button">Questions before you join?</button></p>
  </main>`);
  el('f').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await api(signup ? '/signup' : '/login', { method: 'POST', body: { phone: el('phone').value, password: el('pw').value, agree: signup ? el('agree').checked : true } });
      location.hash = signup ? 'profile' : 'picks'; route();
    } catch (x) { el('err').textContent = x.message; }
  };
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
      <div style="flex:1"><div style="font-weight:600;display:flex;gap:8px;align-items:center">${esc(m.name || 'Your profile')} ${m.status === 'verified' ? `<span class="vtick">${I('check')}Verified</span>` : ''}</div>
      <div class="hint">${onboarding ? 'Step 1 of 2. Next you’ll verify your ID.' : `Profile ${pct}% complete`}</div><div class="bar"><i style="width:${pct}%"></i></div></div></div>
    <form id="pf">
      <div class="field"><span class="flabel">Photos</span><div class="photos">${photoSlots}</div><span class="hint">Add one to four. Everyone who sees them sees a faint watermark with their own account code.</span></div>
      <div class="field"><label for="fname">First name</label><input id="fname" value="${esc(m.name)}" maxlength="40" required autocomplete="given-name"></div>
      <div class="row">
        <div class="field"><label for="dob">Date of birth</label><input id="dob" type="date" value="${m.dob ? m.dob.slice(0, 10) : ''}" required></div>
        <div class="field"><label for="citysel">City</label><select id="citysel">${[...CFG.live_cities, 'Other'].map((c) => `<option ${(c === 'Other' ? (m.city && !CFG.live_cities.includes(m.city)) : m.city === c) ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
          <input id="city" value="${esc(CFG.live_cities.includes(m.city) ? '' : m.city)}" placeholder="Your city" style="display:${m.city && !CFG.live_cities.includes(m.city) ? 'block' : 'none'};margin-top:8px" aria-label="Your city"></div>
      </div>
      <div class="field"><span class="flabel">I am</span><div class="chips">${pills('gender', GENDERS, m.gender, false)}</div></div>
      <div class="field"><span class="flabel">Show me</span><div class="chips">${pills('interested', GENDERS, m.interested, true)}</div></div>

      <h2 class="section-t">Category</h2>
      <div class="catgrid" role="group" aria-label="Category">${Object.entries(CAT).map(([k, c]) => `<button type="button" class="catcard" data-cat="${k}" aria-pressed="${k === cat}"><span class="circ">${I(c.icon)}</span><span><b>${c.name}</b><span class="l">${c.line}</span></span><span class="tick" aria-hidden="true"></span></button>`).join('')}</div>
      <p class="hint" style="margin:10px 0 0">You only meet people in the same category. You can switch once a week.</p>

      <h2 class="section-t">Settings for this category</h2>
      ${toggleRow('masked', 'mask', 'Masked', 'Your photos stay hidden until you and the other person both tap Unmask. It works both ways.', m.masked)}
      <div id="destinyrow"></div>
      <div id="extras"></div>

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
  const s = ME.status;
  if (s === 'pending') {
    render(`<main class="screen fade-in" style="padding-top:64px">
      <span class="circ" style="width:56px;height:56px;border-radius:28px">${I('shield')}</span>
      <h1 style="font-size:34px;margin:24px 0 10px">You’re in the queue.</h1>
      <p class="hint" style="font-size:15px">A member of our team is checking your ID and selfie, usually within a few hours. Once we decide, both images are deleted and only your verified status is kept.</p>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:28px">
        <button class="btn" id="re">Check status</button>
        ${(ME.destiny_done || []).includes(ME.mode) ? '' : `<a class="btn ghost" href="#destiny/${ME.mode}">Answer Destiny questions meanwhile</a>`}
        <a class="btn ghost" href="#profile">Edit profile</a>
        <a class="btn ghost" href="#safety">Set up safety</a>
      </div></main>`);
    el('re').onclick = route;
    return;
  }
  render(`<main class="screen">
    <div class="top"><h1 style="font-size:32px">Verify it’s you</h1></div>
    <p class="hint" style="font-size:15px;margin-top:-6px">Step 2 of 2. Every member goes through the same check, which is why there are no fake profiles on PAUSE.</p>
    ${s === 'rejected' ? `<div class="note" style="margin-bottom:16px">${I('alert')}<span>Your last check didn’t pass${ME.reject_reason ? ': ' + esc(ME.reject_reason) : ''}. Please try again with clearer photos.</span></div>` : ''}
    <form id="vf">
      <div class="field"><label for="idt">ID type</label><select id="idt"><option>Aadhaar</option><option>PAN</option><option>Driving licence</option><option>Voter ID</option><option>Passport</option></select></div>
      <div class="field"><label for="idn">ID number</label><input id="idn" autocomplete="off" required minlength="6"><span class="hint">Stored only as a one-way code, so one ID can’t open two accounts. Never shown to anyone.</span></div>
      <div class="field"><label for="idi">Photo of your ID (front)</label><input id="idi" type="file" accept="image/*" required></div>
      <div class="field"><label for="sf">A selfie, facing the camera in good light</label><input id="sf" type="file" accept="image/*" capture="user" required></div>
      <div class="note" style="margin-bottom:16px">${I('lock')}<span>A person compares your selfie with your ID and photos. Both images are deleted as soon as we decide.</span></div>
      <div class="err" id="err" role="alert"></div>
      <button class="btn block" type="submit" id="vb">Submit for verification</button>
    </form>
    <p style="text-align:center;margin-top:16px"><a href="#profile">Edit profile</a></p>
  </main>`);
  el('vf').onsubmit = async (e) => {
    e.preventDefault();
    const btn = el('vb'); btn.disabled = true; btn.textContent = 'Uploading…';
    try {
      await api('/me/verify', { method: 'POST', body: { id_type: el('idt').value, id_number: el('idn').value, id_image: await compress(el('idi').files[0], 1600), selfie: await compress(el('sf').files[0]) } });
      ME.status = 'pending'; verifyView();
    } catch (x) { el('err').textContent = x.message; btn.disabled = false; btn.textContent = 'Submit for verification'; }
  };
}

// ---------- picks ----------
function pickCard(p) {
  const photo = p.photos[0] ? `<img src="/api/photo/${p.photos[0].id}" alt="${p.masked ? 'Masked photo' : 'Photo of ' + esc(p.name)}">` : '';
  const badges = [];
  if (p.destiny) badges.push(`<span class="d">${I('star')}${p.destiny.pct}% Destiny match</span>`);
  if (p.kundli) badges.push(`<span>${I('kundli')}Kundli ${p.kundli.total} of 36</span>`);
  if (p.zodiac) badges.push(`<span>${esc(p.zodiac.name)}</span>`);
  const mine = (ME.tags || []).map((t) => t.toLowerCase());
  const shared = (p.tags || []).filter((t) => mine.includes(t.toLowerCase())).slice(0, 2);
  const facts = [['Height', p.height_cm ? fmtHeight(p.height_cm) : ''], ['Food', p.diet], ['Religion', p.religion], ['Manglik', p.manglik ? (p.manglik === 'yes' ? 'Yes' : 'No') : '']].filter((f) => f[1]);
  return `<article class="card pick fade-in" id="card">
    <div class="ph">${photo}${p.masked ? `<span class="masklabel">${I('mask')}Masked until you both unmask</span>` : ''}
      <div class="over"><h2>${esc(p.name)}, ${p.age}</h2>
        <div class="city">${esc(p.city)}<span class="vtick">${I('check')}Verified</span></div>
        ${badges.length ? `<div class="badges">${badges.join('')}</div>` : ''}</div>
    </div>
    <div class="body">
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
    return screen(`<div class="empty">${EMAV('isha')}<h2>PAUSE isn’t in ${esc(ME.city)} yet</h2>
      <p class="hint">We’re live in ${esc(CFG.live_cities.join(' and '))}. Your verified profile is saved, and your picks start the day your city opens.</p>
      <a class="btn ghost" href="#profile" style="margin-top:12px">Change city</a></div>`);
  }
  if (data.focus_full) {
    return screen(`<div class="empty">${EMAV('meera')}<h2>You have five chats open</h2>
      <p class="hint">Everyone on PAUSE keeps up to ${CFG.focus} conversations at a time. Close one politely to make room for someone new.</p>
      <a class="btn" href="#chats" style="margin-top:12px">Go to chats</a></div>`);
  }
  const picks = data.picks;
  let i = 0;
  const show = () => {
    const p = picks[i];
    if (!p) {
      return screen(`<div class="empty">${EMAV('kabir')}<h2>That’s everyone for today</h2>
        <p class="hint">PAUSE shows a few verified, compatible people each day instead of an endless stack. New picks arrive tomorrow, or widen your age range to see more now.</p>
        <a class="btn ghost" href="#profile" style="margin-top:12px">Adjust preferences</a></div>`);
    }
    screen(`<div class="counter">${i + 1} of ${picks.length}</div>
      ${pickCard(p)}
      <div class="actions">
        <button class="round" id="pass" aria-label="Pass on ${esc(p.name)}">${I('x')}</button>
        <button class="btn" id="like" style="flex:1;min-height:56px;border-radius:28px">${p.masked ? 'Like, stay masked' : 'Like'}</button>
      </div>
      <p class="hint" style="text-align:center">If ${esc(p.name)} likes you back, a chat opens. You’re using ${data.active} of ${CFG.focus} chats.</p>`);
    const card = el('card');
    const act = async (kind) => {
      card.classList.add(kind === 'like' ? 'out-right' : 'out-left');
      try {
        const r = await api('/like/' + p.id, { method: 'POST', body: { kind } });
        if (r.matched) { data.active++; celebrate(p, r.match_id, r.masked); }
      } catch (x) { toast(x.message); if (x.data && x.data.focus_full) { setTimeout(picksView, 600); return; } }
      setTimeout(() => { i++; show(); }, 280);
    };
    el('pass').onclick = () => act('pass');
    el('like').onclick = () => act('like');
  };
  show();
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
    try { const r = await api('/like/' + p.id, { method: 'POST', body: { kind } }); if (r.matched) { celebrate(p, r.match_id, r.masked); return; } toast(kind === 'like' ? 'Liked. If it’s mutual, a chat opens.' : 'Passed. The next match arrives tomorrow at 9.'); location.hash = 'picks'; }
    catch (x) { toast(x.message); }
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
  const data = await api('/matches').catch(() => ({ focus: CFG.focus, chats: [] }));
  const list = data.chats, F = data.focus;
  const slots = Array.from({ length: F }, (_, k) => { const c = list[k]; return c ? `<i>${c.level >= 1 && c.other.photos[0] ? `<img src="/api/photo/${c.other.photos[0].id}" alt="">` : initial(c.other.name)}</i>` : '<i class="free"></i>'; }).join('');
  const waiting = (m) => m.pending_by && m.pending_by !== ME.id;
  render(`<main class="screen fade-in"><div class="top"><h1>Chats</h1>${catTag(ME.mode)}</div>
    <div class="focus"><div class="slots" aria-hidden="true">${slots}</div><div><b>${list.length} of ${F} chats open</b><small>${list.length >= F ? 'Close one to meet someone new.' : 'Everyone keeps up to five at a time.'}</small></div></div>
    ${list.length ? `<div class="card list" style="overflow:hidden">${list.map((m) => `<a href="#chat/${m.id}">
      ${m.other.photos[0] ? `<img class="av" src="/api/photo/${m.other.photos[0].id}" alt="">` : `<span class="av">${initial(m.other.name)}</span>`}
      <div style="flex:1;min-width:0"><div style="font-weight:600;display:flex;align-items:center;gap:8px">${esc(m.other.name)}, ${m.other.age}${waiting(m) ? '<span class="dot" aria-label="Waiting for you"></span>' : ''}</div>
      <div class="hint" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${waiting(m) ? (m.level === 0 ? `${esc(m.other.name)} is ready to unmask` : `${esc(m.other.name)} wants to share numbers`) : esc(m.last || '')}</div></div>
      <span class="step s${m.level}">${STEPS[m.level]}</span></a>`).join('')}</div>`
    : `<div class="empty">${EMAV('ananya')}<h2>No chats yet</h2><p class="hint">When someone you like likes you back, your chat appears here. You can keep ${F} open at a time.</p><a class="btn ghost" href="#picks" style="margin-top:12px">See my picks</a></div>`}
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
    if (mt.done) {
      const mineK = mt.ans[d.me], theirK = Object.entries(mt.ans).find(([k]) => +k !== d.me)[1];
      const lab = (k) => [mineK === k ? 'you' : '', theirK === k ? esc(o.name) : ''].filter(Boolean).join(' and ');
      return `<div class="game"><h4>This or that</h4><div class="q">${esc(mt.a)} or ${esc(mt.b)}?</div>
        <div class="opts"><button disabled class="${mineK === 'a' ? 'pick1' : ''}">${esc(mt.a)}${lab('a') ? `<br><small style="margin:0;font-weight:500">${lab('a')}</small>` : ''}</button><button disabled class="${mineK === 'b' ? 'pick1' : ''}">${esc(mt.b)}${lab('b') ? `<br><small style="margin:0;font-weight:500">${lab('b')}</small>` : ''}</button></div>
        <small>${mineK === theirK ? 'You picked the same.' : 'You picked differently. Make your case.'}</small></div>`;
    }
    if (mt.mine) return `<div class="game"><h4>This or that</h4><div class="q">${esc(mt.a)} or ${esc(mt.b)}?</div><small>You picked ${esc(mt[mt.mine])}. Answers show once ${esc(o.name)} picks too.</small></div>`;
    return `<div class="game"><h4>This or that</h4><div class="q">${esc(mt.a)} or ${esc(mt.b)}?</div><div class="opts"><button data-tot="${m.id}" data-c="a">${esc(mt.a)}</button><button data-tot="${m.id}" data-c="b">${esc(mt.b)}</button></div><small>${esc(o.name)} won’t see your pick until they choose too.</small></div>`;
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
  return '';
}
const FLAG_TEXT = {
  money: 'This message mentions money or payments. Never send money to someone you haven’t met, and report it if they insist.',
  crypto: 'Crypto or “investment” offers are the most common dating scam. Don’t invest or transfer anything.',
  otp: 'Never share an OTP or verification code with anyone, including a match.',
  link: 'Be careful with links from people you haven’t met. Don’t log in or pay through them.'
};
function openGames(id, o, refresh) {
  const sh = openSheet(`<h3>Play with ${esc(o.name)}</h3><p class="hint" style="margin:0">A light way to get talking before you unmask.</p>
    <button class="gamecard" id="gTot"><span class="circ">${I('split')}</span><span><b>This or that</b><span class="hint">You both pick. Answers show only when you’ve both chosen.</span></span></button>
    <button class="gamecard" id="gTtl"><span class="circ">${I('list3')}</span><span><b>Two truths, one lie</b><span class="hint">Write three things about you. They guess which one isn’t true.</span></span></button>
    <form id="ttlf" style="display:none;margin-top:16px">
      ${[0, 1, 2].map((k) => `<div class="field" style="flex-direction:row;align-items:center;gap:10px"><input type="radio" name="lie" value="${k}" aria-label="Statement ${k + 1} is the lie" ${k === 2 ? 'checked' : ''} style="width:20px;height:20px;flex:none;accent-color:#0B4A5C"><input id="st${k}" maxlength="120" placeholder="${['I’ve ridden to Ladakh on a bike', 'I make a very good biryani', 'I’ve never watched Sholay'][k]}" style="flex:1" required></div>`).join('')}
      <p class="hint" style="margin-top:-4px">Select the circle next to your lie.</p>
      <button class="btn block">Send</button></form>`);
  sh.querySelector('#gTot').onclick = async () => { try { await api(`/matches/${id}/game`, { method: 'POST', body: { type: 'tot' } }); closeSheet(); refresh(); } catch (x) { toast(x.message); } };
  sh.querySelector('#gTtl').onclick = () => { sh.querySelector('#ttlf').style.display = 'block'; sh.querySelector('#st0').focus(); };
  sh.querySelector('#ttlf').onsubmit = async (e) => {
    e.preventDefault();
    const lie = +sh.querySelector('input[name=lie]:checked').value;
    try { await api(`/matches/${id}/game`, { method: 'POST', body: { type: 'ttl', lie, statements: [0, 1, 2].map((k) => sh.querySelector('#st' + k).value) } }); closeSheet(); refresh(); } catch (x) { toast(x.message); }
  };
}
async function chatView(id) {
  let data;
  try { data = await api('/matches/' + id); } catch (x) { toast(x.message); location.hash = 'chats'; return; }
  let lastLevel = data.level;
  const sig = (d) => JSON.stringify([d.level, d.pending_by, d.closed, d.messages.length, d.messages.map((m) => (m.meta ? JSON.stringify(m.meta) : '')).join('|')]);
  const draw = (d) => {
    const o = d.other;
    const msgs = d.messages.map((m) => {
      if (m.system) return `<div class="m sys">${esc(m.body)}</div>`;
      if (m.kind === 'tot' || m.kind === 'ttl') return gameHtml(m, d);
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
    const contact = d.level >= 2 && o.phone ? `<div class="revealbox"><div style="display:flex;align-items:center;gap:10px">${I('phone')}<span>${esc(o.name)}: <a href="tel:+91${esc(o.phone)}" style="color:#FFE3A3">+91 ${esc(o.phone)}</a></span></div><div style="font-size:13px;color:#8FB4B8">Meeting for the first time? Choose a busy public place and share your plan from Safety.</div></div>` : '';
    render(`<div class="night">
      <header class="chathead">
        <a class="back" href="#chats" aria-label="Back to chats" style="width:36px">${I('back')}</a>
        ${o.photos[0] ? `<img class="av" style="width:42px;height:42px;border-radius:21px" src="/api/photo/${o.photos[0].id}?l=${d.level}" alt="${esc(o.name)}">` : `<span class="av" style="width:42px;height:42px;border-radius:21px">${initial(o.name)}</span>`}
        <div style="flex:1;min-width:0"><div style="font-weight:600">${esc(o.name)}, ${o.age}</div><small>Verified, ${esc(o.city)}${d.kundli ? `, kundli ${d.kundli.total} of 36` : ''}</small></div>
        <button aria-label="Chat options" id="mbtn" style="background:none;border:none;width:44px;height:44px;cursor:pointer;display:flex;align-items:center;justify-content:center">${I('dots')}</button>
      </header>
      <div class="steps" aria-label="Progress">${STEPS.map((l, k) => `<div class="${k <= d.level ? 'on' : ''}"><i></i>${l}</div>`).join('')}</div>
      ${d.level >= 1 && o.photos.length ? `<div style="display:flex;gap:8px;padding:12px 16px;overflow-x:auto">${o.photos.map((p) => `<img src="/api/photo/${p.id}?l=${d.level}" alt="Photo of ${esc(o.name)}" style="height:132px;border-radius:12px">`).join('')}</div>` : ''}
      ${contact}
      <div class="msgs" id="msgs">${msgs}${d.closed ? '<div class="m sys">This chat is closed.</div>' : ''}</div>
      ${d.closed ? '' : `<div class="dock"><div>${reveal}<form class="composer" id="cf"><button type="button" class="ib" id="gbtn" aria-label="Play a game">${I('dice')}</button><label for="msg" class="sr">Message</label><input id="msg" autocomplete="off" placeholder="Message ${esc(o.name)}" maxlength="1000"><button class="ib send" aria-label="Send">${I('send')}</button></form></div></div>`}
    </div>`, true);
    window.scrollTo(0, document.body.scrollHeight);
    document.querySelectorAll('[data-r]').forEach((b) => b.onclick = async () => {
      try { await api(`/matches/${id}/reveal`, { method: 'POST', body: { action: b.dataset.r } }); refresh(); } catch (x) { toast(x.message); }
    });
    document.querySelectorAll('[data-tot]').forEach((b) => b.onclick = async () => { try { await api(`/matches/${id}/game/${b.dataset.tot}`, { method: 'POST', body: { choice: b.dataset.c } }); refresh(); } catch (x) { toast(x.message); } });
    document.querySelectorAll('[data-ttl]').forEach((b) => b.onclick = async () => { try { await api(`/matches/${id}/game/${b.dataset.ttl}`, { method: 'POST', body: { guess: +b.dataset.g } }); refresh(); } catch (x) { toast(x.message); } });
    if (el('gbtn')) el('gbtn').onclick = () => openGames(id, o, refresh);
    if (el('cf')) el('cf').onsubmit = async (e) => {
      e.preventDefault();
      const v = el('msg').value.trim(); if (!v) return;
      const send = (confirmIt) => api(`/matches/${id}/messages`, { method: 'POST', body: { body: v, confirm: confirmIt } });
      try { await send(false); el('msg').value = ''; refresh(); }
      catch (x) {
        if (x.data && x.data.nudge) { if (confirm(x.message)) { try { await send(true); el('msg').value = ''; refresh(); } catch (y) { toast(y.message); } } }
        else toast(x.message);
      }
    };
    el('mbtn').onclick = () => {
      if (document.querySelector('.menu')) { document.querySelector('.menu').remove(); return; }
      const menu = document.createElement('div'); menu.className = 'menu';
      menu.innerHTML = `<button data-a="date">${I('calendar')}Share date plan</button><button data-a="close">${I('minus')}Close chat politely</button><button data-a="report">${I('flag')}Report</button><button data-a="block">${I('block')}Block</button>`;
      document.querySelector('.night').appendChild(menu);
      menu.onclick = async (e) => {
        const b = e.target.closest('button'); if (!b) return;
        const a = b.dataset.a;
        if (a === 'date') { location.hash = 'safety'; return; }
        if (a === 'close' && confirm('Close this chat? It frees one of your five chats.')) { await api(`/matches/${id}/close`, { method: 'POST' }); location.hash = 'chats'; }
        if (a === 'report') { const reason = prompt('What happened? A member of our team reviews every report.'); if (reason !== null) { await api('/report/' + o.id, { method: 'POST', body: { reason } }); toast('Reported and blocked'); location.hash = 'chats'; } }
        if (a === 'block' && confirm('Block ' + o.name + '?')) { await api('/block/' + o.id, { method: 'POST' }); location.hash = 'chats'; }
      };
    };
    if (d.level > lastLevel && d.level === 1) unmaskFx(o);
    lastLevel = d.level;
  };
  let last = sig(data);
  const refresh = async () => {
    const typing = el('msg') && el('msg').value;
    try { data = await api('/matches/' + id); } catch (e) { return; }
    last = sig(data);
    draw(data);
    if (typing && el('msg')) el('msg').value = typing;
  };
  draw(data);
  pollTimer = setInterval(async () => {
    if (document.querySelector('.sheet') || (document.activeElement && document.activeElement.id === 'msg' && document.activeElement.value)) return;
    try { const d = await api('/matches/' + id); const s = sig(d); if (s !== last) { last = s; data = d; draw(d); } } catch (e) { /* ignore */ }
  }, 4000);
}

// ---------- safety ----------
function safetyView() {
  const m = ME;
  const info = (icon, title, sub) => `<div class="toggle"><span class="circ">${I(icon)}</span><div class="tx"><b>${title}</b><span>${sub}</span></div></div>`;
  render(`<main class="screen">
    <div class="top"><h1>Safety</h1></div>
    ${toggleRow('pz', 'pause', 'Take a pause', 'Hide from picks for a while. Your open chats stay.', m.paused)}
    <h2 class="section-t">Always on</h2>
    <div class="card" style="padding:2px 16px">
      ${info('drop', 'Photo watermark', 'Every photo you see carries a faint watermark with your account code, so a leaked screenshot can be traced.')}
      ${info('alert', 'Scam warnings', 'Messages asking for money, OTPs, crypto or containing links are flagged. Numbers and handles stay locked until you both share.')}
      ${info('id', 'One ID, one account', 'A banned member’s ID can’t be used to sign up again.')}
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
      <p class="hint">Sends your plan and asks them to call if they haven’t heard from you within an hour.</p>
    </div>
    <a class="btn danger block" href="tel:112" style="margin-top:18px">${I('phone')}Emergency: call 112</a>
    <button class="btn ghost block" id="alert" style="margin-top:10px">${I('pin')}Send my location to my trusted person</button>
    <p class="hint" style="margin-top:24px">Questions about a rule or a problem? <button class="linkbtn" data-ask type="button">Ask for help</button> or contact our <a href="/grievance" target="_blank">grievance officer</a>.</p>
    <button class="btn ghost block" id="del" style="margin-top:16px;color:var(--claret);border-color:#F2C2B8">Delete my account and data</button>
  </main>${m.status === 'verified' ? navbar('safety') : ''}`);
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
    if (confirm('Delete your account, photos, chats and data permanently? This can’t be undone. If you only need a break, use Take a pause instead.')) { await api('/me', { method: 'DELETE' }); location.href = '/'; }
  };
}

route();

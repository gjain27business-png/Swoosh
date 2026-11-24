// PAUSE web app (mobile-first PWA). Plain JS, hash routing.
const $root = document.getElementById('root');
const el = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CAT = {
  steady: { name: 'Steady', em: '💞', line: 'Dating that’s going somewhere', tint: ['#FFE4E0', '#A8231B'] },
  forever: { name: 'Forever', em: '💍', line: 'Marriage-minded. Kundli optional.', tint: ['#FFF0D3', '#7D5000'] },
  afterdark: { name: 'After Dark', em: '🌙', line: 'Casual and honest. Still fully verified.', tint: ['#ECE7FF', '#4630C8'] }
};
const GENDERS = { woman: 'Woman', man: 'Man', nonbinary: 'Non-binary' };
const STEPS = ['🎭 Masked', '😊 Unmasked', '📞 Numbers'];
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
  if (!r.ok) { const e = new Error(data.error || 'Something went wrong'); e.status = r.status; e.data = data; throw e; }
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
    img.onerror = () => reject(new Error('Could not read that image'));
    img.src = URL.createObjectURL(file);
  });
}
document.addEventListener('contextmenu', (e) => { if (e.target.tagName === 'IMG') e.preventDefault(); });

const mark = (s = 30) => `<svg width="${s}" height="${s}" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="18" fill="#16121D"/><rect x="17" y="18" width="11" height="31" rx="5.5" fill="#FF6A5C"/><rect x="36" y="13" width="11" height="36" rx="5.5" fill="#8B74FF"/></svg>`;
const svg = (p, s = 22, w = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const icon = {
  back: svg('<path d="M15 18l-6-6 6-6"/>'),
  heart: svg('<path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z"/>'),
  chat: svg('<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.6A8 8 0 1 1 21 12z"/>'),
  shield: svg('<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  x: svg('<path d="M6 6l12 12M18 6L6 18"/>', 22, 2.2),
  dots: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
  send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', 14)
};
const catChip = (m, href) => { const c = CAT[m] || CAT.steady; return href ? `<a class="cat ${m}" href="${href}">${c.em} ${c.name}</a>` : `<span class="cat ${m}">${c.em} ${c.name}</span>`; };
const swChip = (label, on, href) => `<a class="sw ${on ? 'on' : ''}" href="${href}">${label} ${on ? 'on' : 'off'}</a>`;
const fmtHeight = (cm) => { if (!cm) return ''; let ft = Math.floor(cm / 30.48), inch = Math.round(cm / 2.54 - ft * 12); if (inch === 12) { ft++; inch = 0; } return `${ft}′${inch}″`; };
function navbar(active, badge = 0) {
  const item = (href, label, ic, b) => `<a href="#${href}" ${active === href ? 'aria-current="page"' : ''}>${ic}${label}${b ? `<span class="badge">${b}</span>` : ''}</a>`;
  return `<nav class="navbar" aria-label="Main"><div>${item('picks', 'Picks', icon.heart)}${item('chats', 'Chats', icon.chat, badge)}${item('safety', 'Safety', icon.shield)}${item('profile', 'Profile', icon.user)}<a href="#" data-ask role="button"><span class="askdot" aria-hidden="true">?</span>Ask</a></div></nav>`;
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
function confetti(host) {
  const c = document.createElement('div'); c.className = 'confetti';
  const cols = ['#FF6A5C', '#8B74FF', '#F2B33D', '#fff', '#CDBFFF'];
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + '%'; p.style.background = cols[i % cols.length];
    p.style.animationDelay = Math.random() * 0.8 + 's'; p.style.animationDuration = 1.6 + Math.random() * 1.4 + 's';
    c.appendChild(p);
  }
  host.appendChild(c);
}

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
const heroArt = `<svg viewBox="0 0 390 250" width="100%" height="100%" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <defs><filter id="hb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="38"/></filter></defs>
  <circle cx="70" cy="70" r="90" fill="#FF6A5C" opacity=".5" filter="url(#hb)"/><circle cx="330" cy="190" r="100" fill="#6A4DF4" opacity=".6" filter="url(#hb)"/>
  <g transform="translate(146 42)">
    <rect x="0" y="26" width="42" height="150" rx="21" fill="#FF6A5C"/><rect x="-6" y="58" width="54" height="18" rx="9" fill="#16121D"/>
    <ellipse cx="12" cy="67" rx="6" ry="4.5" fill="#FF6A5C"/><ellipse cx="30" cy="67" rx="6" ry="4.5" fill="#FF6A5C"/>
    <rect x="56" y="0" width="42" height="176" rx="21" fill="#8B74FF"/><rect x="50" y="34" width="54" height="18" rx="9" fill="#16121D"/>
    <ellipse cx="68" cy="43" rx="6" ry="4.5" fill="#8B74FF"/><ellipse cx="86" cy="43" rx="6" ry="4.5" fill="#8B74FF"/>
    <path d="M49 106c-6-5-12-9-12-15a6 6 0 0 1 12-2 6 6 0 0 1 12 2c0 6-6 10-12 15z" fill="#fff"/>
  </g>
  <g fill="#fff"><circle cx="64" cy="190" r="2"/><circle cx="316" cy="46" r="2.5"/><circle cx="292" cy="96" r="1.5"/><circle cx="100" cy="120" r="1.5"/></g>
</svg>`;
function authView(mode) {
  const signup = mode === 'signup';
  render(`<main class="screen fade-in" style="padding-top:22px">
    <div class="authhero">${heroArt}</div>
    <a class="logo" href="/" style="margin-top:22px">${mark(32)}${esc(CFG.brand)}</a>
    <h1 style="font-size:40px;line-height:1.02;margin:16px 0 10px">${signup ? 'Hit pause<br>on swiping.' : 'Welcome back'}</h1>
    <p class="hint" style="font-size:15px;margin:0 0 22px">${signup ? 'Everyone is ID-verified. 5 chats at a time. Stay masked till you both unmask. Live in Bangalore &amp; Delhi NCR.' : 'Log in with your mobile number.'}</p>
    <form id="f">
      <div class="field"><label for="phone">Mobile number</label><input id="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="98xxxxxx10" required></div>
      <div class="field"><label for="pw">Password</label><input id="pw" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" minlength="8" required></div>
      ${signup ? '<label style="display:flex;gap:10px;align-items:flex-start;font-size:14px;margin-bottom:14px"><input id="agree" type="checkbox" style="width:20px;height:20px;margin-top:1px;flex:none" required><span>I am 18 or older and agree to the <a href="/terms" target="_blank">Terms</a> and <a href="/privacy" target="_blank">Privacy Policy</a>.</span></label>' : ''}
      <div class="err" id="err" role="alert"></div>
      <button class="btn block" type="submit" style="min-height:54px">${signup ? 'Create account' : 'Log in'}</button>
    </form>
    <p style="text-align:center;margin-top:20px;font-size:15px">${signup ? 'Already on PAUSE? <a href="#login">Log in</a>' : 'New here? <a href="#signup">Create an account</a>'}</p>
    <p style="text-align:center"><button class="linkbtn" data-ask type="button">Questions? Ask ${esc(CFG.brand)}</button></p>
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
const toggleRow = (id, em, title, sub, checked, extra = '') => `<div class="toggle"><div class="em">${em}</div><div class="tx"><b>${title}</b><span>${sub}</span>${extra}</div><label class="tg"><input type="checkbox" id="${id}" ${checked ? 'checked' : ''} aria-label="${esc(title)}"><i></i></label></div>`;
function profileView(onboarding) {
  const m = ME;
  let cat = m.mode;
  const pills = (name, opts, selected, multi) => Object.entries(opts).map(([k, v]) =>
    `<button type="button" class="pill" data-group="${name}" data-multi="${multi ? 1 : 0}" data-val="${k}" aria-pressed="${(multi ? selected.includes(k) : selected === k) ? 'true' : 'false'}">${esc(v)}</button>`).join('');
  const photoSlots = [0, 1, 2, 3].map((i) => {
    const p = m.photos[i];
    return p ? `<div class="slot"><img src="/api/photo/${p.id}" alt="Your photo ${i + 1}"><button type="button" class="x" data-del="${p.id}" aria-label="Remove photo ${i + 1}">×</button></div>`
      : `<label class="slot" style="cursor:pointer;font-size:28px;color:var(--muted)">+<input type="file" accept="image/*" class="sr" data-add="1" aria-label="Add photo"></label>`;
  }).join('');
  const parts = [m.photos.length, m.name, m.dob, m.city, m.gender, m.prompt_a, m.bio, (m.tags || []).length];
  const pct = Math.round(parts.filter(Boolean).length / parts.length * 100);
  const opt = (list, v, blank) => `<option value="">${blank}</option>` + list.map((x) => `<option ${x === v ? 'selected' : ''}>${esc(x)}</option>`).join('');
  render(`<main class="screen">
    <div class="top"><h1>${onboarding ? 'Your profile' : 'Profile'}</h1>${onboarding ? '' : '<button class="btn ghost" id="logout" style="min-height:40px">Log out</button>'}</div>
    <div class="profilehead">${m.photos[0] ? `<img class="av" style="width:56px;height:56px" src="/api/photo/${m.photos[0].id}" alt="">` : '<span class="av" style="width:56px;height:56px"></span>'}
      <div style="flex:1"><div style="font-weight:600">${esc(m.name || 'Your profile')} ${m.status === 'verified' ? '<span class="vbadge">Verified</span>' : ''}</div>
      <div class="hint">${onboarding ? 'Step 1 of 2 — next you’ll verify your ID' : `Profile ${pct}% complete`}</div><div class="bar"><i style="width:${pct}%"></i></div></div></div>
    <form id="pf">
      <div class="field"><span class="flabel">Photos (1–4)</span><div class="photos">${photoSlots}</div><span class="hint">Others see them watermarked. With 🎭 Masked on, they stay hidden until you both unmask.</span></div>
      <div class="field"><label for="fname">First name</label><input id="fname" value="${esc(m.name)}" maxlength="40" required autocomplete="given-name"></div>
      <div class="row">
        <div class="field"><label for="dob">Date of birth</label><input id="dob" type="date" value="${m.dob ? m.dob.slice(0, 10) : ''}" required></div>
        <div class="field"><label for="citysel">City</label><select id="citysel">${[...CFG.live_cities, 'Other'].map((c) => `<option ${(c === 'Other' ? (m.city && !CFG.live_cities.includes(m.city)) : m.city === c) ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
          <input id="city" value="${esc(CFG.live_cities.includes(m.city) ? '' : m.city)}" placeholder="Your city" style="display:${m.city && !CFG.live_cities.includes(m.city) ? 'block' : 'none'};margin-top:8px" aria-label="Your city"></div>
      </div>
      <div class="field"><span class="flabel">I am</span><div class="chips">${pills('gender', GENDERS, m.gender, false)}</div></div>
      <div class="field"><span class="flabel">Show me</span><div class="chips">${pills('interested', GENDERS, m.interested, true)}</div></div>

      <h2 class="section-t">Your category</h2>
      <div class="catgrid" role="group" aria-label="Category">${Object.entries(CAT).map(([k, c]) => `<button type="button" class="catcard ${k}" data-cat="${k}" aria-pressed="${k === cat}"><span class="em">${c.em}</span><span><b>${c.name}</b><span class="l">${c.line}</span></span></button>`).join('')}</div>
      <p class="hint" style="margin:8px 0 0">You only meet people in the same category. You can switch once a week.</p>

      <h2 class="section-t">Your switches</h2>
      ${toggleRow('masked', '🎭', 'Masked', 'Photos stay hidden until you both tap Unmask. Works both ways.', m.masked)}
      <div id="destinyrow"></div>
      <div id="extras"></div>

      <h2 class="section-t">About you</h2>
      <div class="row">
        <div class="field"><label for="diet">Food</label><select id="diet">${opt(CFG.diets, m.diet, 'Prefer not to say')}</select></div>
        <div class="field"><label for="height">Height (cm)</label><input id="height" type="number" inputmode="numeric" min="120" max="220" value="${m.height_cm || ''}" placeholder="170"></div>
      </div>
      <div class="field"><label for="pa">${esc(m.prompt_q)}</label><input id="pa" value="${esc(m.prompt_a)}" maxlength="200"></div>
      <div class="field"><label for="bio">About me</label><textarea id="bio" maxlength="300">${esc(m.bio)}</textarea></div>
      <div class="field"><label for="tags">Interests (comma separated, up to 6)</label><input id="tags" value="${esc((m.tags || []).join(', '))}" placeholder="Trekking, Chai, Old Hindi songs"></div>

      <h2 class="section-t">Who you see</h2>
      <div class="row">
        <div class="field"><label for="amin">Age from</label><input id="amin" type="number" min="18" max="80" value="${m.age_min}"></div>
        <div class="field"><label for="amax">Age to</label><input id="amax" type="number" min="18" max="80" value="${m.age_max}"></div>
      </div>
      ${toggleRow('anycity', '🧭', 'Other cities too', 'Also show me people outside my city.', m.any_city)}
      <div class="err" id="err" role="alert"></div>
      <button class="btn block" type="submit" style="min-height:54px">${onboarding ? 'Save and continue' : 'Save'}</button>
    </form>
  </main>${onboarding ? '' : navbar('profile')}`);

  const drawCat = () => {
    const done = (ME.destiny_done || []).includes(cat);
    el('destinyrow').innerHTML = done
      ? toggleRow('destiny', '🔮', 'Destiny', `One hand-picked ${CAT[cat].name} match every night at 9 pm.`, ME.destiny && cat === ME.mode, `<div><button type="button" class="linkbtn" data-goto="destiny/${cat}">Edit my answers</button></div>`)
      : `<div class="toggle"><div class="em">🔮</div><div class="tx"><b>Destiny</b><span>Answer 12 quick ${CAT[cat].name} questions (3 min). Get a match % and a 9 pm drop.</span></div><button type="button" class="btn" style="min-height:40px;padding:0 14px" data-goto="destiny/${cat}">Start</button></div>`;
    if (cat === 'forever') {
      const ch = ME.chart;
      el('extras').innerHTML = `<div class="toggle" style="flex-wrap:wrap"><div class="em">🪔</div><div class="tx"><b>Kundli</b><span>${ME.kundli_on && ch ? `On · Moon in ${esc(ch.rashi_name)}, ${esc(ch.nak_name)} nakshatra` : 'Optional. Show guna score (out of 36) on Forever picks.'}</span></div><button type="button" class="btn ghost" style="min-height:40px;padding:0 14px" data-goto="kundli">${ME.kundli_on ? 'Edit' : 'Set up'}</button></div>
        <div class="row"><div class="field"><label for="religion">Religion</label><select id="religion">${opt(CFG.religions, ME.religion, 'Prefer not to say')}</select></div></div>
        ${toggleRow('samerel', '🛕', 'Same religion only', 'Only show me people who share my religion.', ME.same_religion)}`;
    } else {
      el('extras').innerHTML = ME.zodiac ? toggleRow('zodiac', ME.zodiac.sign, 'Show my zodiac', `Shows “${ME.zodiac.sign} ${ME.zodiac.name}” on your card. Optional, never a filter.`, ME.show_zodiac) : '';
    }
    bindGoto();
  };
  const bindGoto = () => document.querySelectorAll('[data-goto]').forEach((b) => b.onclick = async () => { await saveDraft(); location.hash = b.dataset.goto; });
  drawCat();
  document.querySelectorAll('.catcard').forEach((b) => b.onclick = () => {
    cat = b.dataset.cat;
    document.querySelectorAll('.catcard').forEach((o) => o.setAttribute('aria-pressed', o === b ? 'true' : 'false'));
    if (cat === 'afterdark' && !el('masked').checked) { el('masked').checked = true; toast('🎭 Masked switched on — most people keep it on in After Dark. You can turn it off.'); }
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
    if (!d.gender || !d.interested.length) { errEl.textContent = 'Choose who you are and who you want to see.'; return; }
    if (!ME.photos.length) { errEl.textContent = 'Add at least one photo.'; return; }
    try { ME = await api('/me', { method: 'PUT', body: d }); toast('Saved'); location.hash = 'picks'; route(); }
    catch (x) { errEl.textContent = x.message; }
  };
}

// ---------- verification ----------
function verifyView() {
  const s = ME.status;
  if (s === 'pending') {
    render(`<main class="screen fade-in" style="text-align:center;padding-top:60px">
      <svg width="140" height="120" viewBox="0 0 140 120" aria-hidden="true"><circle cx="70" cy="60" r="54" fill="#ECE7FF"/><path d="M70 22l30 12v24c0 18-12 30-30 36-18-6-30-18-30-36V34z" fill="#fff" stroke="#16121D" stroke-width="3"/><rect x="58" y="44" width="11" height="26" rx="5.5" fill="#FF6A5C"/><rect x="73" y="40" width="11" height="30" rx="5.5" fill="#8B74FF"/><circle cx="104" cy="88" r="14" fill="#1E9E5A"/><path d="M98 88l4 4 8-8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <h1 style="font-size:30px;margin:24px 0 10px">You’re in the queue</h1>
      <p class="hint" style="font-size:15px">A real person is checking your ID and selfie — usually a few hours. Once approved we delete both and keep only the ✅ tick.</p>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:26px">
        <button class="btn" id="re">Check again</button>
        ${(ME.destiny_done || []).includes(ME.mode) ? '' : `<a class="btn ghost" href="#destiny/${ME.mode}">🔮 Meanwhile: answer Destiny questions</a>`}
        <a class="btn ghost" href="#profile">Edit profile</a>
        <a class="btn ghost" href="#safety">Set up safety</a>
      </div></main>`);
    el('re').onclick = route;
    return;
  }
  render(`<main class="screen">
    <div class="top"><h1 style="font-size:30px;line-height:1.1">Prove you’re you</h1></div>
    <p class="hint" style="font-size:15px;margin-top:-6px">Step 2 of 2. Everyone does exactly the same check — that’s why there are no fakes on PAUSE.</p>
    ${s === 'rejected' ? `<div class="note" style="background:#FBE9E7;margin-bottom:14px">Your last check didn’t pass${ME.reject_reason ? ': ' + esc(ME.reject_reason) : ''}. Please try again.</div>` : ''}
    <form id="vf">
      <div class="field"><label for="idt">ID type</label><select id="idt"><option>Aadhaar</option><option>PAN</option><option>Driving licence</option><option>Voter ID</option><option>Passport</option></select></div>
      <div class="field"><label for="idn">ID number</label><input id="idn" autocomplete="off" required minlength="6"><span class="hint">Stored only as a one-way code so one ID can’t make two accounts. Never shown to anyone.</span></div>
      <div class="field"><label for="idi">Photo of your ID (front)</label><input id="idi" type="file" accept="image/*" required></div>
      <div class="field"><label for="sf">Selfie — face the camera, good light</label><input id="sf" type="file" accept="image/*" capture="user" required></div>
      <div class="note" style="margin-bottom:14px">${icon.lock}<span>A real person compares your selfie with your ID and photos. Both images are deleted as soon as we decide.</span></div>
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
const orbArt = `<svg width="120" height="100" viewBox="0 0 120 100" aria-hidden="true"><defs><radialGradient id="og" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#CDBFFF"/><stop offset="1" stop-color="#6A4DF4"/></radialGradient></defs><circle cx="60" cy="50" r="34" fill="url(#og)"/><circle cx="18" cy="22" r="3" fill="#CDBFFF"/><circle cx="102" cy="28" r="2.5" fill="#FF6A5C"/><circle cx="96" cy="80" r="3" fill="#F2B33D"/><circle cx="20" cy="74" r="2" fill="#FF6A5C"/></svg>`;
const pauseArt = `<svg width="120" height="100" viewBox="0 0 120 100" aria-hidden="true"><circle cx="60" cy="50" r="40" fill="#F3EDE5"/><rect x="44" y="28" width="12" height="44" rx="6" fill="#FF6A5C"/><rect x="64" y="24" width="12" height="48" rx="6" fill="#8B74FF"/></svg>`;
function pickCard(p) {
  const c = CAT[ME.mode];
  const photo = p.photos[0] ? `<img src="/api/photo/${p.photos[0].id}" alt="${p.masked ? 'Hidden photo' : 'Photo of ' + esc(p.name)}">` : '';
  const badges = [];
  if (p.destiny) badges.push(`<span class="d">🔮 ${p.destiny.pct}% Destiny</span>`);
  if (p.kundli) badges.push(`<span class="k">🪔 ${p.kundli.total}/36 · ${esc(p.kundli.label)}</span>`);
  if (p.zodiac) badges.push(`<span>${p.zodiac.sign} ${esc(p.zodiac.name)}</span>`);
  const mine = (ME.tags || []).map((t) => t.toLowerCase());
  (p.tags || []).filter((t) => mine.includes(t.toLowerCase())).slice(0, 2).forEach((t) => badges.push(`<span>You both: ${esc(t)}</span>`));
  const facts = [p.height_cm ? '📏 ' + fmtHeight(p.height_cm) : '', p.diet ? '🍽️ ' + p.diet : '', p.religion ? '🛕 ' + p.religion : '', p.manglik ? (p.manglik === 'yes' ? 'Manglik' : 'Not manglik') : ''].filter(Boolean);
  return `<article class="card pick fade-in" id="card">
    <div class="ph">${photo}${p.masked ? '<div class="mask"><div class="big">🎭</div><span>Masked · unmask together in chat</span></div>' : ''}
      <div class="over"><h2>${esc(p.name)}, ${p.age} <span class="vbadge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>Verified</span></h2>
        <div style="font-size:14px;opacity:.9;margin-top:4px">${esc(p.city)}</div>
        ${badges.length ? `<div class="badges">${badges.join('')}</div>` : ''}</div>
    </div>
    <div class="body">
      ${p.destiny && p.destiny.reasons.length ? `<ul class="reasons">${p.destiny.reasons.map((r) => `<li>🔮 ${esc(r)}</li>`).join('')}</ul>` : ''}
      ${p.prompt_a ? `<div class="prompt" style="background:${c.tint[0]}"><small style="color:${c.tint[1]}">${esc(p.prompt_q)}</small><p>${esc(p.prompt_a)}</p></div>` : ''}
      ${p.bio ? `<p style="margin:0;font-size:15px;line-height:1.55">${esc(p.bio)}</p>` : ''}
      ${facts.length ? `<div class="chips">${facts.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
      ${p.tags.length ? `<div class="chips">${p.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
    </div>
  </article>`;
}
function celebrate(other, matchId, masked) {
  const ph = !masked && other.photos[0] ? `<img src="/api/photo/${other.photos[0].id}" alt="">` : '🎭';
  const mine = !masked && ME.photos[0] ? `<img src="/api/photo/${ME.photos[0].id}" alt="">` : '🎭';
  const ov = document.createElement('div');
  ov.className = 'celebrate'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'It’s mutual');
  ov.innerHTML = `<div class="pair"><div>${mine}</div><div>${ph}</div></div>
    <h2 style="margin:6px 0 0;font-size:38px">It’s mutual.</h2>
    <p style="margin:0;color:#C9C3D4;max-width:300px;line-height:1.5">You and ${esc(other.name)} liked each other.${masked ? ' You’re both masked — talk, play a game, and unmask when you’re both ready.' : ' Say hi — numbers stay private until you both share.'}</p>
    <a class="btn" href="#chat/${matchId}" style="background:#fff;color:#110E18;border-color:#fff;min-width:240px">Open chat</a>
    <button class="btn ghost" style="color:#fff;border-color:#3B3449;min-width:240px" id="keep">Keep looking</button>`;
  document.body.appendChild(ov);
  confetti(ov);
  ov.querySelector('a').onclick = () => ov.remove();
  ov.querySelector('#keep').onclick = () => ov.remove();
}
function countdown(iso) {
  const ms = new Date(iso) - Date.now();
  if (ms <= 0) return 'any moment';
  const h = Math.floor(ms / 36e5), m = Math.floor((ms % 36e5) / 6e4);
  return h ? `${h}h ${m}m` : `${m}m`;
}
function destinyStrip(drop) {
  if (!ME.destiny) {
    const done = (ME.destiny_done || []).includes(ME.mode);
    return `<button type="button" class="strip light" style="width:100%;text-align:left;cursor:pointer;font:inherit" id="dOn"><span class="orb">🔮</span><div style="flex:1"><b>${done ? 'Switch Destiny on' : 'Try Destiny'}</b><div class="hint">${done ? 'Your answers are saved. One hand-picked match every night at 9.' : '12 quick questions → match % and one hand-picked match every night at 9.'}</div></div><span aria-hidden="true">→</span></button>`;
  }
  if (!drop) return '';
  if (drop.state === 'waiting') {
    const last = drop.last && drop.last.pick && !drop.last.acted ? `<a href="#drop" style="display:block;font-size:13px;color:#CDBFFF;margin-top:4px">Yesterday’s: ${esc(drop.last.pick.name)} · ${drop.last.score}% — still waiting for you →</a>` : '';
    return `<div class="strip"><span class="orb">🔮</span><div style="flex:1"><b>Tonight’s Destiny drop</b><div style="font-size:13px;opacity:.8">Lands at 9 pm · in <span id="cd" data-at="${drop.opens_at}">${countdown(drop.opens_at)}</span></div>${last}</div></div>`;
  }
  if (drop.state === 'ready') {
    if (drop.acted) return `<div class="strip"><span class="orb">🔮</span><div style="flex:1"><b>You ${drop.acted === 'like' ? 'liked' : 'passed on'} tonight’s Destiny</b><div style="font-size:13px;opacity:.8">Next drop tomorrow at 9 pm.</div></div></div>`;
    return `<a class="strip ready" href="#drop"><span class="orb">🔮</span><div style="flex:1"><b>Tonight’s Destiny: ${esc(drop.pick.name)}</b><div style="font-size:13px;opacity:.85">${drop.score}% match · tap to see why</div></div><span aria-hidden="true">→</span></a>`;
  }
  if (drop.state === 'empty') return '<div class="strip"><span class="orb">🔮</span><div style="flex:1"><b>No Destiny match tonight</b><div style="font-size:13px;opacity:.8">More verified people join every day. Next drop tomorrow at 9 pm.</div></div></div>';
  return '';
}
async function picksView() {
  const head = () => `<div class="top"><h1>Picks</h1>${catChip(ME.mode, '#profile')}</div>
    <div class="chips" style="margin:-4px 0 14px">${swChip('🎭 Masked', ME.masked, '#profile')}${swChip('🔮 Destiny', ME.destiny, ME.destiny ? '#profile' : '#destiny/' + ME.mode)}${ME.mode === 'forever' ? `<a class="sw ${ME.kundli_on ? 'on' : ''}" href="#kundli">🪔 Kundli ${ME.kundli_on ? 'on' : 'off'}</a>` : ''}</div>`;
  render(`<main class="screen">${head()}<p class="hint">Finding your people…</p></main>${navbar('picks')}`);
  let data = { live: true, picks: [] }, drop = null;
  try { [data, drop] = await Promise.all([api('/picks'), ME.destiny ? api('/destiny/drop').catch(() => null) : null]); } catch (x) { toast(x.message); }
  const strip = destinyStrip(drop);
  const bindStrip = () => {
    if (el('dOn')) el('dOn').onclick = async () => {
      if (!(ME.destiny_done || []).includes(ME.mode)) { location.hash = 'destiny/' + ME.mode; return; }
      ME = await api('/me', { method: 'PUT', body: { destiny: true } }); picksView();
    };
    if (el('cd')) tickTimer = setInterval(() => { const c = el('cd'); if (c) c.textContent = countdown(c.dataset.at); }, 30000);
  };
  const screen = (inner) => { render(`<main class="screen fade-in">${head()}${strip}${inner}</main>${navbar('picks')}`); bindStrip(); };
  if (!data.live) {
    return screen(`<div class="empty">${pauseArt}<h2>We’re not in ${esc(ME.city)} yet</h2>
      <p class="hint">PAUSE is live in ${esc(CFG.live_cities.join(' and '))}. Your verified profile is saved — you’ll get picks the day your city opens.</p>
      <a class="btn ghost" href="#profile" style="margin-top:10px">Change city</a></div>`);
  }
  if (data.focus_full) {
    return screen(`<div class="empty">${pauseArt}<h2>You’re in focus mode 🎯</h2>
      <p class="hint">You’re talking to ${CFG.focus} people — that’s the limit for everyone on PAUSE. Close a chat politely to open a slot for someone new.</p>
      <a class="btn" href="#chats" style="margin-top:10px">Go to my chats</a></div>`);
  }
  const picks = data.picks;
  let i = 0;
  const show = () => {
    const p = picks[i];
    if (!p) {
      return screen(`<div class="empty">${orbArt}<h2>That’s everyone for now</h2>
        <p class="hint">PAUSE shows a handful of verified, compatible people instead of endless swiping. New picks tomorrow — or widen your age range to see more now.</p>
        <a class="btn ghost" href="#profile" style="margin-top:10px">Adjust filters</a></div>`);
    }
    screen(`<div class="dots" aria-label="Pick ${i + 1} of ${picks.length}">${picks.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      ${pickCard(p)}
      <div class="actions">
        <button class="round" id="pass" aria-label="Pass on ${esc(p.name)}">${icon.x}</button>
        <button class="btn" id="like" style="flex:1;min-height:60px;border-radius:30px">${p.masked ? '🎭 Like — chat masked' : '💞 Like'}</button>
      </div>
      <p class="hint" style="text-align:center">If ${esc(p.name)} likes you back, a chat opens. ${data.active}/${CFG.focus} chats in use.</p>`);
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
  render(`<main class="screen"><div class="top"><h1>🔮 Destiny</h1></div><p class="hint">Opening tonight’s drop…</p></main>${navbar('picks')}`);
  let drop;
  try { drop = await api('/destiny/drop'); } catch (x) { toast(x.message); location.hash = 'picks'; return; }
  const d = drop.state === 'ready' ? drop : drop.last;
  if (!d || !d.pick) { location.hash = 'picks'; return; }
  const p = d.pick;
  render(`<main class="screen fade-in"><div class="top"><a href="#picks" aria-label="Back to picks" style="display:flex;width:44px;height:44px;align-items:center">${icon.back}</a><h1 style="flex:1">🔮 ${drop.state === 'ready' ? 'Tonight’s' : 'Yesterday’s'} Destiny</h1></div>
    <p class="hint" style="margin-top:-6px">Out of everyone in ${esc(CAT[ME.mode].name)}, this is your closest match on the Destiny questions: <b>${d.score}%</b>.</p>
    ${pickCard(p)}
    ${d.acted ? `<p class="hint" style="text-align:center;margin-top:16px">You ${d.acted === 'like' ? 'liked' : 'passed on'} this Destiny.</p>` : `<div class="actions"><button class="round" id="pass" aria-label="Pass">${icon.x}</button><button class="btn" id="like" style="flex:1;min-height:60px;border-radius:30px">${p.masked ? '🎭 Like — chat masked' : '💞 Like'}</button></div>`}
  </main>${navbar('picks')}`);
  if (d.acted) return;
  const act = async (kind) => {
    try { const r = await api('/like/' + p.id, { method: 'POST', body: { kind } }); if (r.matched) { celebrate(p, r.match_id, r.masked); return; } toast(kind === 'like' ? 'Liked. If it’s mutual, a chat opens.' : 'Passed. Next drop tomorrow at 9.'); location.hash = 'picks'; }
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
    render(`<div class="qwrap fade-in" style="align-items:center;justify-content:center;text-align:center;position:relative;overflow:hidden">
      <div style="font-size:84px;filter:drop-shadow(0 0 30px rgba(106,77,244,.8))">🔮</div>
      <h2 style="margin:18px 0 8px">Destiny unlocked ✨</h2>
      <p style="opacity:.8;max-width:300px;line-height:1.5;margin:0 0 26px">${here ? 'Your picks now show a match %. Every night at 9 pm you get one hand-picked match with the reasons you fit.' : `Saved for ${CAT[mode].name}. It switches on when you move to that category.`}</p>
      <a class="btn" href="#${ME.status === 'verified' ? 'picks' : 'profile'}" style="background:#fff;color:#110E18;border-color:#fff;min-width:240px">${ME.status === 'verified' ? 'See my picks' : 'Back to my profile'}</a></div>`, true);
    confetti(document.querySelector('.qwrap'));
  };
  const draw = () => {
    if (i >= qs.length) return finish();
    const qq = qs[i];
    render(`<div class="qwrap fade-in">
      <div style="display:flex;align-items:center;gap:12px"><button id="qb" aria-label="Back" style="background:none;border:none;color:#fff;width:40px;height:40px;cursor:pointer">${icon.back}</button>
        <div class="qbar" style="flex:1"><i style="width:${(i / qs.length) * 100}%"></i></div><span style="font-size:13px;opacity:.7">${i + 1}/${qs.length}</span></div>
      <div style="margin-top:18px;display:flex;gap:8px">${catChip(mode)}<span class="sw on">🔮 Destiny</span></div>
      <h2>${esc(qq.q)}</h2>
      <div role="group" aria-label="${esc(qq.q)}">${qq.opts.map((o, k) => `<button class="qopt" data-k="${k}" aria-pressed="${ans[qq.id] === k}">${esc(o)}</button>`).join('')}</div>
      <p style="margin-top:auto;padding-top:20px;font-size:13px;opacity:.6;text-align:center">Only used to rank your matches. Never shown on your profile.</p></div>`, true);
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
    <div class="top"><a href="#profile" aria-label="Back to profile" style="display:flex;width:44px;height:44px;align-items:center">${icon.back}</a><h1 style="flex:1">🪔 Kundli</h1>${catChip('forever')}</div>
    ${m.mode !== 'forever' ? '<div class="note" style="margin-bottom:14px">Kundli is used in Forever 💍 only. You can set it up now; it shows when you’re in Forever.</div>' : ''}
    ${m.kundli_on && ch ? `<div class="kres" style="margin-bottom:16px"><b>🌙 Moon in ${esc(ch.rashi_name)}</b><div style="margin-top:4px">${esc(ch.nak_name)} nakshatra · pada ${ch.pada}${m.manglik !== 'unknown' ? ' · ' + (m.manglik === 'yes' ? 'Manglik' : 'Not manglik') : ''}</div></div>` : ''}
    <div class="chips" style="margin-bottom:14px"><button type="button" class="pill" data-m="time" aria-pressed="${method === 'time'}">From birth time</button><button type="button" class="pill" data-m="manual" aria-pressed="${method === 'manual'}">I know my Rashi &amp; Nakshatra</button></div>
    <form id="kf">
      <div id="byTime">
        <div class="row"><div class="field"><label for="bt">Birth time</label><input id="bt" type="time" value="${esc(m.birth_time)}"></div>
        <div class="field"><label for="bp">Birth city</label><input id="bp" value="${esc(m.birth_place)}" placeholder="Bhilai"></div></div>
        <p class="hint" style="margin-top:-6px">Uses your date of birth (${esc(m.dob || 'add it in your profile')}) and Indian Standard Time.</p>
      </div>
      <div id="byHand" class="row">
        <div class="field"><label for="ra">Rashi (Moon sign)</label><select id="ra">${CFG.rashis.map((r, k) => `<option value="${k}" ${ch && ch.rashi === k ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></div>
        <div class="field"><label for="nk">Nakshatra</label><select id="nk">${CFG.nakshatras.map((n, k) => `<option value="${k}" ${ch && ch.nak === k ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label for="mg">Manglik</label><select id="mg"><option value="unknown">Not sure</option><option value="yes" ${m.manglik === 'yes' ? 'selected' : ''}>Yes</option><option value="no" ${m.manglik === 'no' ? 'selected' : ''}>No</option></select></div>
      <div class="err" id="err" role="alert"></div>
      <button class="btn block" type="submit">${m.kundli_on ? 'Update kundli' : 'Switch kundli on'}</button>
    </form>
    ${m.kundli_on ? `<h2 class="section-t">Only show matches with at least</h2>
      <div class="chips">${[[0, 'Any score'], [18, '18+ guna'], [24, '24+ guna'], [28, '28+ guna']].map(([v, l]) => `<button type="button" class="pill" data-min="${v}" aria-pressed="${m.kundli_min === v}">${l}</button>`).join('')}</div>
      <p class="hint">A higher minimum means fewer picks. Most families look for 18 or more.</p>
      <button class="btn ghost block" id="koff" style="margin-top:18px">Turn kundli off</button>` : ''}
    <p class="hint" style="margin-top:20px">Ashtakoota guna milan (36 points) with Lahiri ayanamsa. Your family pandit may differ by a point or two. Scores only show when both people have kundli on.</p>
  </main>${navbar('profile')}`);
  const sync = () => { el('byTime').style.display = method === 'time' ? 'block' : 'none'; el('byHand').style.display = method === 'manual' ? 'flex' : 'none'; };
  sync();
  document.querySelectorAll('[data-m]').forEach((b) => b.onclick = () => { method = b.dataset.m; document.querySelectorAll('[data-m]').forEach((o) => o.setAttribute('aria-pressed', o === b ? 'true' : 'false')); sync(); });
  el('kf').onsubmit = async (e) => {
    e.preventDefault();
    try {
      ME = await api('/me/kundli', { method: 'PUT', body: { method, birth_time: el('bt').value, birth_place: el('bp').value, rashi: el('ra').value, nakshatra: el('nk').value, manglik: el('mg').value } });
      toast('Kundli saved 🪔'); kundliView();
    } catch (x) { el('err').textContent = x.message; }
  };
  document.querySelectorAll('[data-min]').forEach((b) => b.onclick = async () => { ME = await api('/me', { method: 'PUT', body: { kundli_min: +b.dataset.min } }); kundliView(); });
  if (el('koff')) el('koff').onclick = async () => { ME = await api('/me/kundli', { method: 'PUT', body: { kundli_on: false } }); toast('Kundli off'); kundliView(); };
}

// ---------- chats ----------
async function chatsView() {
  render(`<main class="screen"><div class="top"><h1>Chats</h1></div><p class="hint">Loading…</p></main>${navbar('chats')}`);
  const data = await api('/matches').catch(() => ({ focus: CFG.focus, chats: [] }));
  const list = data.chats, F = data.focus;
  const slots = Array.from({ length: F }, (_, k) => { const c = list[k]; return c ? `<i>${c.level >= 1 && c.other.photos[0] ? `<img src="/api/photo/${c.other.photos[0].id}" alt="">` : '🎭'}</i>` : '<i class="free"></i>'; }).join('');
  const waiting = (m) => m.pending_by && m.pending_by !== ME.id;
  render(`<main class="screen fade-in"><div class="top"><h1>Chats</h1>${catChip(ME.mode)}</div>
    <div class="focus"><div class="slots" aria-hidden="true">${slots}</div><div style="flex:1"><b>Focus ${F}</b><div style="font-size:13px;opacity:.75">${list.length} of ${F} open${list.length >= F ? ' · close one to meet someone new' : ''}</div></div></div>
    ${list.length ? `<div class="card list" style="overflow:hidden">${list.map((m) => `<a href="#chat/${m.id}">
      ${m.other.photos[0] ? `<img class="av" src="/api/photo/${m.other.photos[0].id}" alt="">` : '<span class="av"></span>'}
      <div style="flex:1;min-width:0"><div style="font-weight:600;display:flex;align-items:center;gap:8px">${esc(m.other.name)}, ${m.other.age}${waiting(m) ? '<span style="width:8px;height:8px;border-radius:4px;background:var(--accent)" aria-label="Waiting for you"></span>' : ''}</div>
      <div class="hint" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${waiting(m) ? (m.level === 0 ? '🎭 Ready to unmask — your turn' : '📞 Wants to share numbers') : esc(m.last || '')}</div></div>
      <span class="step s${m.level}">${STEPS[m.level]}</span></a>`).join('')}</div>`
    : `<div class="empty">${pauseArt}<h2>No chats yet</h2><p class="hint">When someone you like likes you back, your chat appears here. You can have ${F} open at a time.</p><a class="btn ghost" href="#picks" style="margin-top:10px">See my picks</a></div>`}
  </main>${navbar('chats', list.filter(waiting).length)}`);
}

function unmaskFx(o) {
  const ov = document.createElement('div');
  ov.className = 'celebrate unmaskfx';
  ov.innerHTML = `<div class="big" aria-hidden="true">🎭</div><h2 style="margin:0;font-size:36px">Unmasked ✨</h2>
    <div class="pair"><div>${ME.photos[0] ? `<img src="/api/photo/${ME.photos[0].id}" alt="">` : ''}</div><div>${o.photos[0] ? `<img src="/api/photo/${o.photos[0].id}?u=1" alt="${esc(o.name)}">` : ''}</div></div>
    <p style="margin:0;color:#C9C3D4;max-width:300px">You both chose to unmask. Say something nice 😊</p>
    <button class="btn" style="background:#fff;color:#110E18;border-color:#fff;min-width:220px">See photos</button>`;
  document.body.appendChild(ov);
  confetti(ov);
  ov.querySelector('button').onclick = () => ov.remove();
}
function gameHtml(m, d) {
  const o = d.other, mt = m.meta || {};
  if (m.kind === 'tot') {
    if (mt.done) {
      const mineK = mt.ans[d.me], theirK = Object.entries(mt.ans).find(([k]) => +k !== d.me)[1];
      return `<div class="game"><h4>This or that</h4><div class="q">${esc(mt.a)} or ${esc(mt.b)}?</div>
        <div class="opts"><button disabled class="${mineK === 'a' ? 'pick1' : ''}">${esc(mt.a)}${mineK === 'a' ? ' · you' : ''}${theirK === 'a' ? ' · ' + esc(o.name) : ''}</button><button disabled class="${mineK === 'b' ? 'pick1' : ''}">${esc(mt.b)}${mineK === 'b' ? ' · you' : ''}${theirK === 'b' ? ' · ' + esc(o.name) : ''}</button></div>
        <small>${mineK === theirK ? 'Same vibe ✨' : 'Opposites 😄'}</small></div>`;
    }
    if (mt.mine) return `<div class="game"><h4>This or that</h4><div class="q">${esc(mt.a)} or ${esc(mt.b)}?</div><small>You picked ${esc(mt[mt.mine])}. Waiting for ${esc(o.name)}… answers show when you’ve both picked.</small></div>`;
    return `<div class="game"><h4>This or that</h4><div class="q">${esc(mt.a)} or ${esc(mt.b)}?</div><div class="opts"><button data-tot="${m.id}" data-c="a">${esc(mt.a)}</button><button data-tot="${m.id}" data-c="b">${esc(mt.b)}</button></div><small>${esc(o.name)} won’t see your pick until they choose too.</small></div>`;
  }
  if (m.kind === 'ttl') {
    const mineGame = mt.by === d.me;
    const guessed = mt.guess !== null && mt.guess !== undefined;
    if (!mineGame && !guessed) {
      return `<div class="game"><h4>2 truths, 1 lie · by ${esc(o.name)}</h4><div class="q">Which one is the lie?</div><div class="st">${mt.st.map((s, k) => `<button data-ttl="${m.id}" data-g="${k}">${esc(s)}</button>`).join('')}</div></div>`;
    }
    const rows = mt.st.map((s, k) => `<div class="${k === mt.lie ? 'lie' : ''}">${esc(s)}${k === mt.lie ? ' · 🤥 lie' : ''}${guessed && k === mt.guess ? (mineGame ? ` · ${esc(o.name)}’s guess` : ' · your guess') : ''}</div>`).join('');
    return `<div class="game"><h4>2 truths, 1 lie · by ${mineGame ? 'you' : esc(o.name)}</h4><div class="st">${rows}</div><small>${guessed ? (mt.guess === mt.lie ? 'Spotted 🕵️' : 'Fooled 😄') : `Waiting for ${esc(o.name)} to guess…`}</small></div>`;
  }
  return '';
}
const FLAG_TEXT = {
  money: '⚠️ This message mentions money or payments. Never send money to someone you haven’t met — report it if they push.',
  crypto: '⚠️ Crypto or “investment” talk is the #1 dating scam. Don’t invest or transfer anything.',
  otp: '⚠️ Never share an OTP or verification code with anyone — not even a match.',
  link: '⚠️ Be careful with links from people you haven’t met. Don’t log in or pay through them.'
};
function openGames(id, o, refresh) {
  const sh = openSheet(`<h3>🎲 Play with ${esc(o.name)}</h3><p class="hint" style="margin:0">The easiest way to break the ice before you unmask.</p>
    <button class="gamecard" id="gTot"><span style="font-size:28px">⚖️</span><span><b>This or that</b><span class="hint">You both pick. Answers show only when you’ve both chosen.</span></span></button>
    <button class="gamecard" id="gTtl"><span style="font-size:28px">🤥</span><span><b>2 truths, 1 lie</b><span class="hint">Write three things about you. They guess the lie.</span></span></button>
    <form id="ttlf" style="display:none;margin-top:14px">
      ${[0, 1, 2].map((k) => `<div class="field" style="flex-direction:row;align-items:center;gap:10px"><input type="radio" name="lie" value="${k}" aria-label="Statement ${k + 1} is the lie" ${k === 2 ? 'checked' : ''} style="width:22px;height:22px;flex:none"><input id="st${k}" maxlength="120" placeholder="${['I’ve been to Ladakh on a bike', 'I can cook biryani', 'I’ve never seen Sholay'][k]}" style="flex:1" required></div>`).join('')}
      <p class="hint" style="margin-top:-4px">Tick the circle next to your lie.</p>
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
      return `<div class="m ${mine ? 'me' : 'them'}">${esc(m.body)}</div>${!mine && m.flag ? `<div class="warn">${FLAG_TEXT[m.flag] || FLAG_TEXT.link}</div>` : ''}`;
    }).join('');
    let reveal = '';
    if (!d.closed && d.level < 2) {
      const what = d.level === 0 ? 'unmask 🎭' : 'share numbers 📞';
      if (d.pending_by && d.pending_by !== d.me) {
        reveal = `<div class="revealbox"><div><b>${esc(o.name)}</b> is ready to ${what}. It happens only if you say yes too.</div>
          <div style="display:flex;gap:10px"><button class="lightbtn" style="flex:1" data-r="approve">${d.level === 0 ? 'Unmask 🎭' : 'Share numbers'}</button><button class="darkbtn" style="flex:1" data-r="decline">Not yet</button></div></div>`;
      } else if (d.pending_by === d.me) {
        reveal = `<div class="revealbox"><div>Waiting for ${esc(o.name)}… it happens only when you both tap.</div><button class="darkbtn" data-r="cancel">Cancel</button></div>`;
      } else {
        reveal = `<div style="padding:0 14px 6px">${d.level === 0 ? '<button class="unmaskbtn" data-r="request">🎭 Unmask</button>' : '<button class="darkbtn" style="width:100%" data-r="request">📞 Share numbers</button>'}</div>`;
      }
    }
    const contact = d.level >= 2 && o.phone ? `<div class="revealbox"><div>📞 ${esc(o.name)}: <a href="tel:+91${esc(o.phone)}" style="color:#CDBFFF">+91 ${esc(o.phone)}</a></div><div style="font-size:13px;color:#A9A3B5">First meet? Pick a busy public place and share your plan from Safety.</div></div>` : '';
    render(`<div class="night">
      <header class="chathead">
        <a href="#chats" aria-label="Back to chats" style="width:40px;height:44px;display:flex;align-items:center;justify-content:center">${icon.back}</a>
        ${o.photos[0] ? `<img class="av" style="width:44px;height:44px" src="/api/photo/${o.photos[0].id}?l=${d.level}" alt="${esc(o.name)}">` : '<span class="av"></span>'}
        <div style="flex:1;min-width:0"><div style="font-weight:600">${esc(o.name)}, ${o.age}</div><div style="font-size:12px;color:#A9A3B5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">✅ Verified · ${esc(o.city)}${d.kundli ? ` · 🪔 ${d.kundli.total}/36` : ''}</div></div>
        <button aria-label="Chat options" id="mbtn" style="background:none;border:none;width:44px;height:44px;cursor:pointer">${icon.dots}</button>
      </header>
      <div class="steps" aria-label="Progress">${STEPS.map((l, k) => `<div class="${k <= d.level ? 'on' : ''}"><i></i>${l}</div>`).join('')}</div>
      ${d.level >= 1 && o.photos.length ? `<div style="display:flex;gap:8px;padding:10px 16px;overflow-x:auto">${o.photos.map((p) => `<img src="/api/photo/${p.id}?l=${d.level}" alt="Photo of ${esc(o.name)}" style="height:130px;border-radius:12px">`).join('')}</div>` : ''}
      ${contact}
      <div class="msgs" id="msgs">${msgs}${d.closed ? '<div class="m sys">This chat is closed.</div>' : ''}</div>
      ${d.closed ? '' : `<div class="dock"><div>${reveal}<form class="composer" id="cf"><button type="button" class="ib" id="gbtn" aria-label="Play a game">🎲</button><label for="msg" class="sr">Message</label><input id="msg" autocomplete="off" placeholder="Message ${esc(o.name)}…" maxlength="1000"><button class="ib send" aria-label="Send">${icon.send}</button></form></div></div>`}
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
      menu.innerHTML = '<button data-a="date">🛡️ Share date plan</button><button data-a="close">🙏 Close chat politely</button><button data-a="report">🚩 Report</button><button data-a="block">⛔ Block</button>';
      document.querySelector('.night').appendChild(menu);
      menu.onclick = async (e) => {
        const a = e.target.dataset.a; if (!a) return;
        if (a === 'date') { location.hash = 'safety'; return; }
        if (a === 'close' && confirm('Close this chat? It frees one of your 5 slots.')) { await api(`/matches/${id}/close`, { method: 'POST' }); location.hash = 'chats'; }
        if (a === 'report') { const reason = prompt('What happened? A real person reviews every report.'); if (reason !== null) { await api('/report/' + o.id, { method: 'POST', body: { reason } }); toast('Reported and blocked'); location.hash = 'chats'; } }
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
  render(`<main class="screen">
    <div class="top"><h1>Safety</h1></div>
    ${toggleRow('pz', '⏸️', 'Take a pause', 'Hide from picks for a while. Your open chats stay.', m.paused)}
    <h2 class="section-t">Built in</h2>
    <div class="card" style="padding:4px 16px">
      <div class="toggle" style="border:none;padding:12px 0;margin:0"><div class="em">💧</div><div class="tx"><b>Screenshot shield</b><span>Every photo you see carries a faint watermark with your account code, so leaks can be traced.</span></div></div>
      <div class="toggle" style="border:none;padding:12px 0;margin:0"><div class="em">⚠️</div><div class="tx"><b>Scam shield</b><span>We flag messages asking for money, OTPs, crypto or links. Numbers and handles stay locked until you both share.</span></div></div>
      <div class="toggle" style="border:none;padding:12px 0;margin:0"><div class="em">🪪</div><div class="tx"><b>One ID, one account</b><span>Banned means banned — their ID can’t sign up again.</span></div></div>
    </div>
    <h2 class="section-t">Contact shield</h2>
    <div class="card" style="padding:6px 16px 16px">
      ${toggleRow('hc', '🏢', 'Hide me from my company', 'People with the same company never see you.', m.hide_company)}
      <div class="field"><label for="co">My company (never shown)</label><input id="co" value="${esc(m.company)}"></div>
      <div class="field"><label for="hp">Hide me from these numbers (one per line)</label><textarea id="hp" placeholder="Relatives, exes, colleagues">${esc((m.hidden_phones || []).join('\n'))}</textarea><span class="hint">They never see you, and you never see them.</span></div>
      <button class="btn block" id="saveshield">Save shield</button>
    </div>
    <h2 class="section-t">Safe date kit</h2>
    <div class="card" style="padding:16px">
      <div class="row"><div class="field"><label for="tn">Trusted person</label><input id="tn" value="${esc(m.trusted_name)}" placeholder="Didi"></div>
      <div class="field"><label for="tp">Their number</label><input id="tp" type="tel" value="${esc(m.trusted_phone)}"></div></div>
      <div class="field"><label for="plan">Date plan</label><input id="plan" placeholder="Sat 7:30 pm, coffee with Rohan at [place]"></div>
      <button class="btn block" id="share">Send plan on WhatsApp</button>
      <p class="hint">Sends your plan and asks them to call you if they don’t hear back within an hour.</p>
    </div>
    <a class="btn danger block" href="tel:112" style="margin-top:16px;min-height:60px">🚨 Emergency — call 112</a>
    <button class="btn ghost block" id="alert" style="margin-top:10px">📍 Send my location to my trusted person</button>
    <p class="hint" style="margin-top:22px">Need help with a rule or a problem? <button class="linkbtn" data-ask type="button">Ask ${esc(CFG.brand)}</button> · <a href="/grievance" target="_blank">Grievance officer</a></p>
    <button class="btn ghost block" id="del" style="margin-top:18px;color:var(--accent);border-color:var(--accent)">Delete my account and data</button>
  </main>${m.status === 'verified' ? navbar('safety') : ''}`);
  el('pz').onchange = async () => { try { ME = await api('/me', { method: 'PUT', body: { paused: el('pz').checked } }); toast(ME.paused ? '⏸️ Paused — you’re hidden from picks' : '▶️ You’re back in picks'); } catch (x) { toast(x.message); } };
  el('saveshield').onclick = async () => {
    try { ME = await api('/me', { method: 'PUT', body: { hide_company: el('hc').checked, company: el('co').value, hidden_phones: el('hp').value.split(/\n|,/) } }); toast('Shield saved'); } catch (x) { toast(x.message); }
  };
  const saveTrusted = () => api('/me', { method: 'PUT', body: { trusted_name: el('tn').value, trusted_phone: el('tp').value } }).then((u) => (ME = u)).catch(() => {});
  el('share').onclick = async () => {
    await saveTrusted();
    if (!el('tp').value) { toast('Add your trusted person’s number first'); return; }
    const text = `Hi ${el('tn').value || ''}, I’m going on a date: ${el('plan').value || '(details)'}. If you don’t hear from me within an hour after it starts, please call me. — sent from PAUSE`;
    window.open('https://wa.me/91' + el('tp').value.replace(/\D/g, '').slice(-10) + '?text=' + encodeURIComponent(text), '_blank');
  };
  el('alert').onclick = async () => {
    await saveTrusted();
    if (!el('tp').value) { toast('Add your trusted person’s number first'); return; }
    const send = (loc) => window.open('https://wa.me/91' + el('tp').value.replace(/\D/g, '').slice(-10) + '?text=' + encodeURIComponent('I need help. Please call me now.' + (loc ? ' My location: ' + loc : '')), '_blank');
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition((p) => send(`https://maps.google.com/?q=${p.coords.latitude},${p.coords.longitude}`), () => send(''), { timeout: 5000 });
    else send('');
  };
  el('del').onclick = async () => {
    if (confirm('Delete your account, photos, chats and data permanently? This cannot be undone. (Need a break instead? Use Take a pause.)')) { await api('/me', { method: 'DELETE' }); location.href = '/'; }
  };
}

route();

// Swoosh web app (mobile-first PWA). Plain JS, hash routing.
const $root = document.getElementById('root');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MODES = { serious: 'Serious dating', marriage: 'Marriage-minded', fling: 'Fling', vibe: 'Just for the vibe' };
const MODE_HINT = { serious: 'Looking for a real relationship', marriage: 'Ready to settle down', fling: 'Something light — same verification and safety', vibe: 'No labels yet — just talk and see' };
const GENDERS = { woman: 'Woman', man: 'Man', nonbinary: 'Non-binary' };
let ME = null;
let LIVE = ['Bangalore', 'Delhi NCR'];
fetch('/api/config').then((r) => r.json()).then((c) => { if (c.live_cities) LIVE = c.live_cities; }).catch(() => {});
let pollTimer = null;

async function api(path, opts = {}) {
  const r = await fetch('/api' + path, {
    method: opts.method || 'GET',
    headers: opts.body ? { 'Content-Type': 'application/json' } : {},
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin'
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(data.error || 'Something went wrong'); e.status = r.status; throw e; }
  return data;
}
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 3200);
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
const icon = {
  back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
  heart: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z"/></svg>',
  chat: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
  shield: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg>',
  user: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  x: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  moon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  lock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  dots: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
  send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
};
function navbar(active) {
  const item = (href, label, ic) => `<a href="#${href}" ${active === href ? 'aria-current="page"' : ''}>${ic}${label}</a>`;
  return `<nav class="navbar" aria-label="Main"><div>${item('picks', 'Picks', icon.heart)}${item('chats', 'Chats', icon.chat)}${item('safety', 'Safety', icon.shield)}${item('profile', 'Profile', icon.user)}</div></nav>`;
}
function render(html, dark = false) {
  document.body.style.background = dark ? 'var(--night)' : '';
  $root.innerHTML = html;
  window.scrollTo(0, 0);
}

// ---------- routing ----------
async function route() {
  clearInterval(pollTimer);
  document.querySelectorAll('.celebrate,.toast').forEach((e) => e.remove());
  const [view, arg] = location.hash.replace(/^#/, '').split('/');
  if (view === 'signup' || view === 'login') return authView(view);
  try { ME = await api('/me'); } catch (e) { return authView('signup'); }
  const profileDone = ME.name && ME.gender && ME.dob && ME.city && ME.interested.length && ME.photos.length;
  if (view === 'profile' || !profileDone) return profileView(!profileDone);
  if (view === 'safety') return safetyView();
  if (ME.status !== 'verified') return verifyView();
  if (view === 'chats') return chatsView();
  if (view === 'chat' && arg) return chatView(arg);
  return picksView();
}
window.addEventListener('hashchange', route);

// ---------- auth ----------
function authView(mode) {
  const signup = mode === 'signup';
  render(`<main class="screen fade-in" style="padding-top:24px">
    <div class="authhero" aria-hidden="true">
      <div class="bl" style="width:220px;height:220px;background:#C23B2F;opacity:.55;left:-40px;top:-60px"></div>
      <div class="bl" style="width:240px;height:240px;background:#6C5CE7;opacity:.55;right:-60px;top:20px"></div>
      <svg viewBox="0 0 390 220" width="100%" height="100%" style="position:relative">
        <defs><filter id="ab"><feGaussianBlur stdDeviation="7"/></filter></defs>
        <g transform="translate(110 70)"><circle r="46" fill="#5B5266"/><g filter="url(#ab)"><circle cy="-6" r="20" fill="#C9A99A"/><path d="M-34 40 C-30 12, 30 12, 34 40Z" fill="#2E5A88"/></g></g>
        <g transform="translate(280 120)"><circle r="46" fill="#E9D8C8"/><circle cy="-6" r="20" fill="#D9B5A2"/><path d="M-18 -10 C-18 -34, 18 -34, 18 -10 C15 -20, 6 -24, 0 -24 C-6 -24, -15 -20, -18 -10Z" fill="#2B1E1E"/><circle cx="-7" cy="-4" r="2" fill="#2B1E1E"/><circle cx="7" cy="-4" r="2" fill="#2B1E1E"/><path d="M-6 5 q6 5 12 0" fill="none" stroke="#2B1E1E" stroke-width="2" stroke-linecap="round"/><path d="M-34 40 C-30 12, 30 12, 34 40Z" fill="#C23B2F"/></g>
        <path d="M150 90 C190 70, 220 140, 240 118" fill="none" stroke="#F6F5F2" stroke-width="2" stroke-dasharray="4 6" stroke-linecap="round"/>
        <g transform="translate(196 104)"><rect x="-38" y="-14" width="76" height="28" rx="14" fill="#F6F5F2"/><text x="0" y="5" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="600" fill="#17161C">Verified</text></g>
      </svg>
    </div>
    <a class="logo" href="/" style="margin-top:24px"><img src="/icon.svg" width="32" height="32" alt="">Swoosh</a>
    <h1 style="font-size:38px;line-height:1.05;margin:18px 0 10px">${signup ? 'Talk first.<br>Reveal when you\'re ready.' : 'Welcome back'}</h1>
    <p class="hint" style="font-size:15px;margin:0 0 24px">${signup ? 'Every person here is ID-verified. Free for women. Live in Bangalore &amp; Delhi NCR.' : 'Log in with your mobile number.'}</p>
    <form id="f">
      <div class="field"><label for="phone">Mobile number</label><input id="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="98xxxxxx10" required></div>
      <div class="field"><label for="pw">Password</label><input id="pw" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" minlength="8" required></div>
      ${signup ? `<label style="display:flex;gap:10px;align-items:flex-start;font-size:14px;margin-bottom:14px"><input id="agree" type="checkbox" style="width:20px;height:20px;margin-top:1px;flex:none" required><span>I am 18 or older and agree to the <a href="/terms" target="_blank">Terms</a> and <a href="/privacy" target="_blank">Privacy Policy</a>.</span></label>` : ''}
      <div class="err" id="err" role="alert"></div>
      <button class="btn block" type="submit" style="min-height:54px">${signup ? 'Create account' : 'Log in'}</button>
    </form>
    <p style="text-align:center;margin-top:20px;font-size:15px">${signup ? 'Already on Swoosh? <a href="#login">Log in</a>' : 'New here? <a href="#signup">Create an account</a>'}</p>
  </main>`);
  document.getElementById('f').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await api(signup ? '/signup' : '/login', { method: 'POST', body: { phone: phone.value, password: pw.value, agree: signup ? agree.checked : true } });
      location.hash = signup ? 'profile' : 'picks'; route();
    } catch (x) { document.getElementById('err').textContent = x.message; }
  };
}

// ---------- profile ----------
function profileView(onboarding) {
  const m = ME;
  const pills = (name, opts, selected, multi) => Object.entries(opts).map(([k, v]) =>
    `<button type="button" class="pill" data-group="${name}" data-multi="${multi ? 1 : 0}" data-val="${k}" aria-pressed="${(multi ? selected.includes(k) : selected === k) ? 'true' : 'false'}">${esc(v)}</button>`).join('');
  const photoSlots = [0, 1, 2, 3].map((i) => {
    const p = m.photos[i];
    return p ? `<div class="slot"><img src="/api/photo/${p.id}" alt="Your photo ${i + 1}"><button type="button" class="x" data-del="${p.id}" aria-label="Remove photo ${i + 1}">×</button></div>`
      : `<label class="slot" style="cursor:pointer;font-size:28px;color:var(--muted)">+<input type="file" accept="image/*" class="sr" data-add="1" aria-label="Add photo"></label>`;
  }).join('');
  render(`<main class="screen">
    <div class="top"><h1>${onboarding ? 'Your profile' : 'Edit profile'}</h1>${onboarding ? '' : '<button class="btn ghost" id="logout" style="min-height:40px">Log out</button>'}</div>
    ${(() => { const parts = [m.photos.length, m.name, m.dob, m.city, m.gender, m.prompt_a, m.bio, (m.tags || []).length]; const pct = Math.round(parts.filter(Boolean).length / parts.length * 100);
      return `<div class="profilehead">${m.photos[0] ? `<img class="av" style="width:56px;height:56px" src="/api/photo/${m.photos[0].id}" alt="">` : '<span class="av" style="width:56px;height:56px"></span>'}
      <div style="flex:1"><div style="font-weight:600">${esc(m.name || 'Your profile')} ${m.status === 'verified' ? '<span class="vbadge">Verified</span>' : ''}</div>
      <div class="hint">${onboarding ? 'Step 1 of 2 — next you\'ll verify your ID' : `Profile ${pct}% complete`}</div><div class="bar"><i style="width:${pct}%"></i></div></div></div>`; })()}
    <form id="pf">
      <div class="field"><span style="font-size:13px;font-weight:500">Photos (1–4). They stay blurred until you reveal them in a chat.</span><div class="photos">${photoSlots}</div></div>
      <div class="field"><label for="name">First name</label><input id="name" value="${esc(m.name)}" maxlength="40" required></div>
      <div class="row">
        <div class="field"><label for="dob">Date of birth</label><input id="dob" type="date" value="${m.dob ? m.dob.slice(0, 10) : ''}" required></div>
        <div class="field"><label for="citysel">City</label><select id="citysel">${[...LIVE, 'Other'].map((c) => `<option ${(c === 'Other' ? (m.city && !LIVE.includes(m.city)) : m.city === c) ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
          <input id="city" value="${esc(LIVE.includes(m.city) ? '' : m.city)}" placeholder="Your city" style="display:${m.city && !LIVE.includes(m.city) ? 'block' : 'none'};margin-top:8px" aria-label="Your city"></div>
      </div>
      <div class="field"><span style="font-size:13px;font-weight:500">I am</span><div class="chips">${pills('gender', GENDERS, m.gender, false)}</div></div>
      <div class="field"><span style="font-size:13px;font-weight:500">Show me</span><div class="chips">${pills('interested', GENDERS, m.interested, true)}</div></div>
      <div class="field"><span style="font-size:13px;font-weight:500">Mode — you only meet people in the same mode</span><div class="chips">${pills('mode', MODES, m.mode, false)}</div><span class="hint" id="modehint">${esc(MODE_HINT[m.mode])}</span></div>
      <div class="row">
        <div class="field"><label for="amin">Age from</label><input id="amin" type="number" min="18" max="80" value="${m.age_min}"></div>
        <div class="field"><label for="amax">Age to</label><input id="amax" type="number" min="18" max="80" value="${m.age_max}"></div>
      </div>
      <label class="switch"><input type="checkbox" id="anycity" ${m.any_city ? 'checked' : ''}><span>Show me people from other cities too</span></label>
      <div class="field" style="margin-top:14px"><label for="pa">${esc(m.prompt_q)}</label><input id="pa" value="${esc(m.prompt_a)}" maxlength="200"></div>
      <div class="field"><label for="bio">About me</label><textarea id="bio" maxlength="300">${esc(m.bio)}</textarea></div>
      <div class="field"><label for="tags">Interests (comma separated, up to 6)</label><input id="tags" value="${esc(m.tags.join(', '))}" placeholder="Vegetarian, Trekking, Hindi"></div>
      <div class="err" id="err" role="alert"></div>
      <button class="btn block" type="submit">${onboarding ? 'Save and continue' : 'Save'}</button>
    </form>
  </main>${onboarding ? '' : navbar('profile')}`);

  document.querySelectorAll('.pill').forEach((b) => b.onclick = () => {
    if (b.dataset.multi === '1') b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    else document.querySelectorAll(`.pill[data-group="${b.dataset.group}"]`).forEach((o) => o.setAttribute('aria-pressed', o === b ? 'true' : 'false'));
    if (b.dataset.group === 'mode') document.getElementById('modehint').textContent = MODE_HINT[b.dataset.val];
  });
  citysel.onchange = () => { city.style.display = citysel.value === 'Other' ? 'block' : 'none'; };
  const pick = (g) => [...document.querySelectorAll(`.pill[data-group="${g}"][aria-pressed="true"]`)].map((b) => b.dataset.val);
  const lo = document.getElementById('logout');
  if (lo) lo.onclick = async () => { await api('/logout', { method: 'POST' }); location.hash = 'login'; };
  document.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => { ME.photos = await api('/me/photos/' + b.dataset.del, { method: 'DELETE' }); await saveDraft(); profileView(onboarding); });
  document.querySelectorAll('[data-add]').forEach((inp) => inp.onchange = async () => {
    if (!inp.files[0]) return;
    try { await saveDraft(); ME.photos = await api('/me/photos', { method: 'POST', body: { image: await compress(inp.files[0]) } }); profileView(onboarding); } catch (x) { toast(x.message); }
  });
  const collect = () => ({
    name: name.value, dob: dob.value || null, city: citysel.value === 'Other' ? city.value : citysel.value, gender: pick('gender')[0], interested: pick('interested'),
    mode: pick('mode')[0], age_min: amin.value, age_max: amax.value, any_city: anycity.checked,
    prompt_a: pa.value, bio: bio.value, tags: tags.value.split(',').map((t) => t.trim()).filter(Boolean)
  });
  async function saveDraft() { try { Object.assign(ME, await api('/me', { method: 'PUT', body: collect() })); } catch (e) { /* draft save is best effort */ } }
  document.getElementById('pf').onsubmit = async (e) => {
    e.preventDefault();
    const d = collect();
    const errEl = document.getElementById('err');
    if (!d.gender || !d.interested.length) return errEl.textContent = 'Choose who you are and who you want to see.';
    if (!ME.photos.length) return errEl.textContent = 'Add at least one photo.';
    try { ME = await api('/me', { method: 'PUT', body: d }); toast('Saved'); location.hash = ME.status === 'verified' ? 'picks' : 'verify'; route(); }
    catch (x) { errEl.textContent = x.message; }
  };
}

// ---------- verification ----------
function verifyView() {
  const s = ME.status;
  if (s === 'pending') {
    return render(`<main class="screen fade-in" style="text-align:center;padding-top:64px">
      <svg width="140" height="120" viewBox="0 0 140 120" aria-hidden="true"><circle cx="70" cy="60" r="54" fill="#E6F4EC"/><path d="M70 22l30 12v24c0 18-12 30-30 36-18-6-30-18-30-36V34z" fill="#fff" stroke="#17161C" stroke-width="3"/><circle cx="70" cy="56" r="10" fill="#C9A99A"/><path d="M54 80c4-8 10-12 16-12s12 4 16 12" fill="none" stroke="#17161C" stroke-width="3" stroke-linecap="round"/><circle cx="104" cy="88" r="14" fill="#1E9E5A"/><path d="M98 88l4 4 8-8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <h1 style="font-size:30px;margin:24px 0 10px">You're in the queue</h1>
      <p class="hint" style="font-size:15px">We're checking your ID and selfie by hand. This usually takes a few hours. Once approved, we delete both and keep only a "verified" tick.</p>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:28px">
        <button class="btn" id="re">Check again</button>
        <a class="btn ghost" href="#profile">Edit profile</a>
        <a class="btn ghost" href="#safety">Set up safety</a>
      </div></main>`) || (document.getElementById('re').onclick = route);
  }
  render(`<main class="screen">
    <div class="top"><h1 style="font-size:30px;line-height:1.1">Prove you're you</h1></div>
    <p class="hint" style="font-size:15px;margin-top:-6px">Step 2 of 2. Everyone does exactly the same check — that's why there are no fakes here.</p>
    ${s === 'rejected' ? `<div class="note" style="background:#FBE9E7;margin-bottom:14px">Your last check didn't pass${ME.reject_reason ? ': ' + esc(ME.reject_reason) : ''}. Please try again.</div>` : ''}
    <form id="vf">
      <div class="field"><label for="idt">ID type</label><select id="idt"><option>Aadhaar</option><option>PAN</option><option>Driving licence</option><option>Voter ID</option><option>Passport</option></select></div>
      <div class="field"><label for="idn">ID number</label><input id="idn" autocomplete="off" required minlength="6"><span class="hint">Stored only as a one-way code so the same ID can't make two accounts. Never shown to anyone.</span></div>
      <div class="field"><label for="idi">Photo of your ID (front)</label><input id="idi" type="file" accept="image/*" required></div>
      <div class="field"><label for="sf">Selfie — face the camera, good light</label><input id="sf" type="file" accept="image/*" capture="user" required></div>
      <div class="note" style="margin-bottom:14px">${icon.lock}<span>A real person compares your selfie with your ID and photos. Both images are deleted as soon as we decide.</span></div>
      <div class="err" id="err" role="alert"></div>
      <button class="btn block" type="submit" id="vb">Submit for verification</button>
    </form>
    <p style="text-align:center;margin-top:16px"><a href="#profile">Edit profile</a></p>
  </main>`);
  document.getElementById('vf').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('vb'); btn.disabled = true; btn.textContent = 'Uploading…';
    try {
      await api('/me/verify', { method: 'POST', body: { id_type: idt.value, id_number: idn.value, id_image: await compress(idi.files[0], 1600), selfie: await compress(sf.files[0]) } });
      ME.status = 'pending'; verifyView();
    } catch (x) { document.getElementById('err').textContent = x.message; btn.disabled = false; btn.textContent = 'Submit for verification'; }
  };
}

// ---------- picks ----------
const MODE_COLORS = { serious: ['#FBE4E0', '#9C2A20'], marriage: ['#FBF0D9', '#7A4F00'], fling: ['#EDEAFF', '#4B3CC4'], vibe: ['#DFF3EF', '#0E6B5C'] };
const modeChip = (m, href) => `<${href ? `a href="${href}"` : 'span'} class="modechip" style="background:${MODE_COLORS[m][0]};color:${MODE_COLORS[m][1]}">${esc(MODES[m])}</${href ? 'a' : 'span'}>`;
const moonArt = `<svg width="120" height="96" viewBox="0 0 120 96" aria-hidden="true"><circle cx="60" cy="48" r="36" fill="#EDEAFF"/><path d="M72 22a28 28 0 1 0 14 40 22 22 0 0 1-14-40z" fill="#6C5CE7"/><circle cx="22" cy="20" r="3" fill="#C9C2FF"/><circle cx="100" cy="30" r="2.5" fill="#C9C2FF"/><circle cx="96" cy="78" r="3" fill="#F4A99C"/><circle cx="16" cy="70" r="2" fill="#F4A99C"/></svg>`;
function whyMatch(p) {
  const mine = (ME.tags || []).map((t) => t.toLowerCase());
  const shared = (p.tags || []).filter((t) => mine.includes(t.toLowerCase())).slice(0, 2).map((t) => `You both: ${t}`);
  const out = [...shared];
  if (p.mode === ME.mode) out.push(MODES[p.mode]);
  if (p.city && p.city === ME.city) out.push(`Also in ${p.city}`);
  return out.slice(0, 3);
}
function celebrate(other, matchId) {
  const ph = other.photos[0] ? `<img src="/api/photo/${other.photos[0].id}" alt="">` : '';
  const mine = ME.photos[0] ? `<img src="/api/photo/${ME.photos[0].id}" alt="">` : '';
  const el = document.createElement('div');
  el.className = 'celebrate'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', "It's mutual");
  el.innerHTML = `<div class="pair"><div>${mine}</div><div>${ph}</div></div>
    <h2 style="margin:6px 0 0;font-size:36px">It's mutual.</h2>
    <p style="margin:0;color:#C9C5D2;max-width:300px;line-height:1.5">You and ${esc(other.name)} liked each other. Your chat opens in dark mode — photos stay blurred until you both reveal.</p>
    <a class="btn" href="#chat/${matchId}" style="background:#fff;color:#121117;border-color:#fff;min-width:240px">Open dark-mode chat</a>
    <button class="btn ghost" style="color:#fff;border-color:#3A3645;min-width:240px" id="keep">Keep looking</button>`;
  document.body.appendChild(el);
  el.querySelector('a').onclick = () => el.remove();
  el.querySelector('#keep').onclick = () => el.remove();
}
async function picksView() {
  if (!LIVE.includes(ME.city)) {
    return render(`<main class="screen fade-in"><div class="top"><h1>Today's picks</h1>${modeChip(ME.mode, '#profile')}</div>
      <div class="empty">${moonArt}<h2>We're not in ${esc(ME.city)} yet</h2>
      <p class="hint">Swoosh is live in ${esc(LIVE.join(' and '))} right now. Your verified profile is saved, and you'll get picks the day your city opens.</p>
      <a class="btn ghost" href="#profile" style="margin-top:10px">Change city</a></div></main>${navbar('picks')}`);
  }
  render(`<main class="screen"><div class="top"><h1>Today's picks</h1>${modeChip(ME.mode, '#profile')}</div><p class="hint">Finding your people…</p></main>${navbar('picks')}`);
  let picks = [];
  try { picks = await api('/picks'); } catch (x) { toast(x.message); }
  let i = 0;
  const show = () => {
    const p = picks[i];
    const head = `<div class="top"><h1>Today's picks</h1>${modeChip(ME.mode, '#profile')}</div>`;
    if (!p) {
      return render(`<main class="screen fade-in">${head}<div class="empty">${moonArt}
        <h2>That's everyone for today</h2>
        <p class="hint">Swoosh shows a handful of verified, compatible people a day instead of endless swiping. New picks tomorrow — or widen your age range to see more now.</p>
        <a class="btn ghost" href="#profile" style="margin-top:10px">Adjust filters</a></div></main>${navbar('picks')}`);
    }
    const why = whyMatch(p);
    render(`<main class="screen">${head}
      <div class="dots" aria-label="Pick ${i + 1} of ${picks.length}">${picks.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <article class="card pick fade-in" id="card">
        <div class="ph">${p.photos[0] ? `<img src="/api/photo/${p.photos[0].id}" alt="Blurred photo of ${esc(p.name)}">` : ''}
          <div class="lockbadge" style="z-index:1">${icon.lock} Photos unlock in chat</div>
          <div class="over"><h2>${esc(p.name)}, ${p.age} <span class="vbadge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>Verified</span></h2>
            <div style="font-size:14px;opacity:.9;margin-top:4px">${esc(p.city)}</div>
            ${why.length ? `<div class="why">${why.map((w) => `<span>${esc(w)}</span>`).join('')}</div>` : ''}</div>
        </div>
        <div class="body">
          ${p.prompt_a ? `<div style="padding:14px 16px;border-radius:16px;background:${MODE_COLORS[p.mode][0]}"><div style="font-size:12px;font-weight:600;color:${MODE_COLORS[p.mode][1]}">${esc(p.prompt_q)}</div><div style="margin-top:6px;font-size:17px;line-height:1.4;font-family:'Space Grotesk',sans-serif;font-weight:500">${esc(p.prompt_a)}</div></div>` : ''}
          ${p.bio ? `<p style="margin:0;font-size:15px;line-height:1.55">${esc(p.bio)}</p>` : ''}
          ${p.tags.length ? `<div class="chips">${p.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
        </div>
      </article>
      <div class="actions">
        <button class="round" id="pass" aria-label="Pass on ${esc(p.name)}">${icon.x}</button>
        <button class="btn" id="like" style="flex:1;min-height:60px;border-radius:30px">${icon.moon} Like — chat in dark mode</button>
      </div>
      <p class="hint" style="text-align:center">If ${esc(p.name)} likes you back, a dark-mode chat opens.</p>
    </main>${navbar('picks')}`);
    const card = document.getElementById('card');
    const act = async (kind) => {
      card.classList.add(kind === 'like' ? 'out-right' : 'out-left');
      try {
        const r = await api('/like/' + p.id, { method: 'POST', body: { kind } });
        if (r.matched) celebrate(p, r.match_id);
      } catch (x) { toast(x.message); }
      setTimeout(() => { i++; show(); }, 280);
    };
    document.getElementById('pass').onclick = () => act('pass');
    document.getElementById('like').onclick = () => act('like');
  };
  show();
}

// ---------- chats ----------
async function chatsView() {
  render(`<main class="screen"><div class="top"><h1>Chats</h1></div><p class="hint">Loading…</p></main>${navbar('chats')}`);
  const list = await api('/matches').catch(() => []);
  render(`<main class="screen fade-in"><div class="top"><h1>Chats</h1><span class="chip">${list.length}/5 active</span></div>
    ${list.length ? `<div class="card list" style="overflow:hidden">${list.map((m) => `<a href="#chat/${m.id}">
      <span class="ring" style="--p:${(m.level + 1) * 25}%">${m.other.photos[0] ? `<img class="av" src="/api/photo/${m.other.photos[0].id}" alt="">` : '<span class="av"></span>'}</span>
      <div style="flex:1;min-width:0"><div style="font-weight:600;display:flex;align-items:center;gap:8px">${esc(m.other.name)}, ${m.other.age}${m.pending_by && m.pending_by !== ME.id ? '<span style="width:8px;height:8px;border-radius:4px;background:var(--accent)" aria-label="Reveal request waiting"></span>' : ''}</div>
      <div class="hint" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.last || '')}</div></div>
      <span class="chip" style="background:#EDEAFF;color:#4B3CC4">${esc(m.levels[m.level])}</span></a>`).join('')}</div>
      <p class="hint" style="margin-top:14px">The ring around each photo shows how far you've revealed.</p>`
    : `<div class="empty">${moonArt}<h2>No chats yet</h2><p class="hint">When someone you like likes you back, your dark-mode chat appears here.</p><a class="btn ghost" href="#picks" style="margin-top:10px">See today's picks</a></div>`}
  </main>${navbar('chats')}`);
}

async function chatView(id) {
  let data;
  try { data = await api('/matches/' + id); } catch (x) { toast(x.message); location.hash = 'chats'; return; }
  const draw = (d) => {
    const o = d.other;
    const next = d.levels[d.level + 1];
    let reveal = '';
    if (d.level < 3) {
      if (d.pending_by && d.pending_by !== d.me && d.i_decide) {
        reveal = `<div class="revealbox"><div>${icon.lock} ${esc(o.name)} asked to reveal: <strong>${esc(next)}</strong>. Only you decide. Reveals are mutual.</div>
          <div style="display:flex;gap:10px"><button class="lightbtn" style="flex:1" data-r="approve">Reveal ${esc(next.toLowerCase())}</button><button class="darkbtn" style="flex:1" data-r="decline">Not yet</button></div></div>`;
      } else if (d.pending_by === d.me) {
        reveal = `<div class="revealbox">Waiting for ${esc(o.name)} to approve: <strong>${esc(next)}</strong>.</div>`;
      } else {
        const label = d.i_am_decider_type === 'me' ? `Reveal ${next.toLowerCase()}` : `Ask to reveal ${next.toLowerCase()}`;
        reveal = `<div style="padding:0 16px"><button class="darkbtn" style="width:100%" data-r="request">${icon.lock} ${esc(label)}</button></div>`;
      }
    }
    const contact = d.level >= 3 && o.phone ? `<div class="revealbox">Contact revealed: <a href="tel:${esc(o.phone)}" style="color:#C9C2FF">${esc(o.phone)}</a></div>` : '';
    render(`<div class="night">
      <header class="chathead">
        <a href="#chats" aria-label="Back to chats" style="width:44px;height:44px;display:flex;align-items:center;justify-content:center">${icon.back}</a>
        ${o.photos[0] ? `<img class="av" style="width:44px;height:44px" src="/api/photo/${o.photos[0].id}?l=${d.level}" alt="${esc(o.name)}">` : '<span class="av"></span>'}
        <div style="flex:1"><div style="font-weight:600">${esc(o.name)}, ${o.age}</div><div style="font-size:12px;color:#A9A5B4">Verified · ${esc(o.city)} · ${esc(MODES[o.mode])}</div></div>
        <button aria-label="Chat options" id="mbtn" style="background:none;border:none;width:44px;height:44px;cursor:pointer">${icon.dots}</button>
      </header>
      <div class="steps" aria-label="Reveal progress">${d.levels.map((l, i) => `<div class="${i <= d.level ? 'on' : ''}"><i></i>${esc(l)}</div>`).join('')}</div>
      ${d.level >= 2 && o.photos.length > 1 ? `<div style="display:flex;gap:8px;padding:10px 16px;overflow-x:auto">${o.photos.map((p) => `<img src="/api/photo/${p.id}?l=${d.level}" alt="Photo of ${esc(o.name)}" style="height:120px;border-radius:12px">`).join('')}</div>` : ''}
      ${contact}
      <div class="msgs" id="msgs">${d.messages.map((m) => `<div class="m ${m.system ? 'sys' : (m.sender_id === d.me ? 'me' : 'them')}">${esc(m.body)}</div>`).join('')}</div>
      <div style="position:fixed;left:0;right:0;bottom:76px"><div style="max-width:480px;margin:0 auto">${reveal}</div></div>
      <div class="composer"><form id="cf"><label for="msg" class="sr">Message</label><input id="msg" autocomplete="off" placeholder="Message ${esc(o.name)}…" maxlength="1000"><button class="round" style="width:46px;height:46px;border:none;background:var(--violet)" aria-label="Send">${icon.send}</button></form></div>
    </div>`, true);
    window.scrollTo(0, document.body.scrollHeight);
    document.querySelectorAll('[data-r]').forEach((b) => b.onclick = async () => {
      try { await api(`/matches/${id}/reveal`, { method: 'POST', body: { action: b.dataset.r } }); refresh(); } catch (x) { toast(x.message); }
    });
    document.getElementById('cf').onsubmit = async (e) => {
      e.preventDefault();
      const v = msg.value.trim(); if (!v) return;
      try { await api(`/matches/${id}/messages`, { method: 'POST', body: { body: v } }); refresh(); } catch (x) { toast(x.message); }
    };
    document.getElementById('mbtn').onclick = () => {
      if (document.querySelector('.menu')) return document.querySelector('.menu').remove();
      const menu = document.createElement('div'); menu.className = 'menu';
      menu.innerHTML = '<button data-a="date">Share date plan</button><button data-a="close">Close chat politely</button><button data-a="report">Report</button><button data-a="block">Block</button>';
      document.querySelector('.night').appendChild(menu);
      menu.onclick = async (e) => {
        const a = e.target.dataset.a; if (!a) return;
        if (a === 'date') { location.hash = 'safety'; return; }
        if (a === 'close' && confirm('Close this chat? It frees a slot for someone new.')) { await api(`/matches/${id}/close`, { method: 'POST' }); location.hash = 'chats'; }
        if (a === 'report') { const reason = prompt('What happened? Our team reviews every report.'); if (reason !== null) { await api('/report/' + o.id, { method: 'POST', body: { reason } }); toast('Reported and blocked'); location.hash = 'chats'; } }
        if (a === 'block' && confirm('Block ' + o.name + '?')) { await api('/block/' + o.id, { method: 'POST' }); location.hash = 'chats'; }
      };
    };
  };
  const refresh = async () => {
    const typing = document.getElementById('msg') && document.getElementById('msg').value;
    try { data = await api('/matches/' + id); } catch (e) { return; }
    draw(data);
    if (typing) document.getElementById('msg').value = typing;
  };
  draw(data);
  let lastCount = data.messages.length, lastLevel = data.level, lastPending = data.pending_by;
  pollTimer = setInterval(async () => {
    if (document.activeElement && document.activeElement.id === 'msg' && document.activeElement.value) return;
    try {
      const d = await api('/matches/' + id);
      if (d.messages.length !== lastCount || d.level !== lastLevel || d.pending_by !== lastPending) {
        lastCount = d.messages.length; lastLevel = d.level; lastPending = d.pending_by; data = d; draw(d);
      }
    } catch (e) { /* ignore poll errors */ }
  }, 4000);
}

// ---------- safety ----------
function safetyView() {
  const m = ME;
  render(`<main class="screen">
    <div class="top"><h1>Safety &amp; privacy</h1></div>
    <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);font-family:Inter">Contact shield</h2>
    <div class="card" style="padding:4px 16px 16px">
      <label class="switch"><input type="checkbox" id="hc" ${m.hide_company ? 'checked' : ''}><span style="flex:1">Hide me from people at my company</span></label>
      <div class="field" style="margin-top:12px"><label for="co">My company (never shown)</label><input id="co" value="${esc(m.company)}"></div>
      <div class="field"><label for="hp">Hide me from these numbers (one per line)</label><textarea id="hp" placeholder="Relatives, exes, colleagues">${esc((m.hidden_phones || []).join('\n'))}</textarea><span class="hint">They will never see you, and you won't see them.</span></div>
      <button class="btn block" id="saveshield">Save shield</button>
    </div>

    <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);font-family:Inter;margin-top:28px">Safe date kit</h2>
    <div class="card" style="padding:16px">
      <div class="row"><div class="field"><label for="tn">Trusted person</label><input id="tn" value="${esc(m.trusted_name)}" placeholder="Didi"></div>
      <div class="field"><label for="tp">Their number</label><input id="tp" type="tel" value="${esc(m.trusted_phone)}"></div></div>
      <div class="field"><label for="plan">Date plan</label><input id="plan" placeholder="Sat 7:30 pm, coffee with Rohan at [place]"></div>
      <button class="btn block" id="share">Send plan on WhatsApp</button>
      <p class="hint">Sends your plan and asks them to call you if they don't hear back within an hour.</p>
    </div>
    <a class="btn danger block" id="sos" href="tel:112" style="margin-top:16px;min-height:60px">Emergency — call 112</a>
    <button class="btn ghost block" id="alert" style="margin-top:10px">Alert my trusted person now</button>

    <div class="note" style="margin-top:24px">You can report anyone from the chat menu, even before photos are revealed. Banned means banned — one ID, one account.</div>
    <button class="btn ghost block" id="del" style="margin-top:24px;color:var(--accent);border-color:var(--accent)">Delete my account and data</button>
  </main>${m.status === 'verified' ? navbar('safety') : ''}`);
  saveshield.onclick = async () => {
    try { ME = await api('/me', { method: 'PUT', body: { hide_company: hc.checked, company: co.value, hidden_phones: hp.value.split(/\n|,/) } }); toast('Shield saved'); } catch (x) { toast(x.message); }
  };
  const saveTrusted = () => api('/me', { method: 'PUT', body: { trusted_name: tn.value, trusted_phone: tp.value } }).then((u) => (ME = u)).catch(() => {});
  share.onclick = async () => {
    await saveTrusted();
    if (!tp.value) return toast('Add your trusted person\'s number first');
    const text = `Hi ${tn.value || ''}, I'm going on a date: ${plan.value || '(details)'}. If you don't hear from me within an hour after it starts, please call me. — sent from Swoosh`;
    window.open('https://wa.me/91' + tp.value.replace(/\D/g, '').slice(-10) + '?text=' + encodeURIComponent(text), '_blank');
  };
  document.getElementById('alert').onclick = async () => {
    await saveTrusted();
    if (!tp.value) return toast('Add your trusted person\'s number first');
    const send = (loc) => window.open('https://wa.me/91' + tp.value.replace(/\D/g, '').slice(-10) + '?text=' + encodeURIComponent('I need help. Please call me now.' + (loc ? ' My location: ' + loc : '')), '_blank');
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition((p) => send(`https://maps.google.com/?q=${p.coords.latitude},${p.coords.longitude}`), () => send(''), { timeout: 5000 });
    else send('');
  };
  del.onclick = async () => {
    if (confirm('Delete your account, photos, chats and data permanently? This cannot be undone.')) { await api('/me', { method: 'DELETE' }); location.href = '/'; }
  };
}

route();

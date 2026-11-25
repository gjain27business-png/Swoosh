// PAUSE help: answers rules, how-tos and account questions on the website and in the app.
// It never sees anyone's chats. Anything it can't answer becomes a ticket for a person.
(function () {
  if (window.AskPause) return;
  const CSS = `
  .ask-bg{position:fixed;inset:0;background:rgba(20,10,28,.5);z-index:70}
  .ask{position:fixed;left:0;right:0;bottom:0;z-index:71;max-width:480px;margin:0 auto;background:#fff;color:#24152F;border-radius:22px 22px 0 0;display:flex;flex-direction:column;max-height:86vh;font-family:'Plus Jakarta Sans',system-ui,sans-serif;animation:askup .3s cubic-bezier(.2,.8,.2,1) both;box-shadow:0 -24px 60px -24px rgba(29,18,41,.45)}
  @keyframes askup{from{transform:translateY(100%)}}
  @media (min-width:760px){.ask{left:auto;right:24px;bottom:24px;width:400px;border-radius:20px;max-height:640px}}
  .ask-h{display:flex;align-items:center;gap:12px;padding:18px 18px 16px;border-bottom:1px solid #EEE6EB}
  .ask-av{width:38px;height:38px;border-radius:19px;background:linear-gradient(135deg,#FF8A5B,#F0466E 50%,#7B3FA0);display:flex;align-items:center;justify-content:center;gap:3px;flex:none}
  .ask-av i{display:block;width:3px;height:13px;border-radius:2px;background:#FFF4EC}
  .ask-h b{font-family:'Bricolage Grotesque',system-ui,sans-serif;font-weight:800;letter-spacing:-.03em;font-size:21px;color:#3D1450}
  .ask-h small{display:block;color:#6E6276;font-size:12px;margin-top:2px}
  .ask-x{margin-left:auto;width:38px;height:38px;border:1px solid #EEE6EB;background:#fff;border-radius:19px;cursor:pointer;color:#24152F;display:flex;align-items:center;justify-content:center}
  .ask-b{flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:8px;min-height:220px}
  .ask-m{max-width:88%;padding:10px 14px;font-size:14px;line-height:1.5;white-space:pre-wrap}
  .ask-m.bot{align-self:flex-start;background:#F6EEF2;border-radius:16px 16px 16px 6px}
  .ask-m.you{align-self:flex-end;background:#C92E5C;color:#fff;border-radius:16px 16px 6px 16px}
  .ask-c{display:flex;flex-wrap:wrap;gap:6px}
  .ask-c button{min-height:36px;padding:0 12px;border-radius:999px;border:1px solid #DDD0D8;background:#fff;font-size:13px;cursor:pointer;color:#24152F;font-family:inherit}
  .ask-c button:hover{border-color:#C92E5C}
  .ask-f{display:flex;gap:8px;padding:12px 14px calc(12px + env(safe-area-inset-bottom));border-top:1px solid #EEE6EB}
  .ask-f input{flex:1;min-width:0;min-height:46px;padding:0 14px;border-radius:23px;border:1px solid #DDD0D8;font-size:16px;font-family:inherit}
  .ask-f button,.ask-t button{min-height:46px;padding:0 18px;border-radius:23px;border:none;background:#C92E5C;color:#fff;font-weight:600;cursor:pointer;font-family:inherit}
  .ask-t{display:flex;flex-direction:column;gap:8px;background:#FBF7F8;border:1px solid #EEE6EB;border-radius:14px;padding:12px}
  .ask-t textarea,.ask-t input{min-height:44px;padding:10px 12px;border-radius:10px;border:1px solid #DDD0D8;font:inherit;font-size:15px}
  .ask-t button{border-radius:12px}
  .ask :focus-visible{outline:2px solid #F4A63A;outline-offset:2px}`;
  const DEFAULT_CHIPS = ['How does Masked work?', 'What is Destiny?', 'Why only five chats?', 'Is my verification done?', 'Kundli matching', 'Safety and emergencies', 'Report someone', 'Talk to a person'];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  async function post(path, body) {
    const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Something went wrong. Try again.');
    return d;
  }
  function open(question) {
    if (document.querySelector('.ask')) return;
    if (!document.getElementById('ask-css')) { const s = document.createElement('style'); s.id = 'ask-css'; s.textContent = CSS; document.head.appendChild(s); }
    const bg = document.createElement('div'); bg.className = 'ask-bg';
    const box = document.createElement('div'); box.className = 'ask'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'PAUSE help');
    box.innerHTML = `<div class="ask-h"><span class="ask-av" aria-hidden="true"><i></i><i></i></span><div><b>Help</b><small>Rules, safety, verification and how PAUSE works</small></div><button class="ask-x" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="ask-b" aria-live="polite"></div>
      <form class="ask-f"><label for="ask-in" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Your question</label><input id="ask-in" autocomplete="off" placeholder="Ask a question, in English or Hinglish" maxlength="300"><button>Ask</button></form>`;
    document.body.append(bg, box);
    const body = box.querySelector('.ask-b');
    const close = () => { bg.remove(); box.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    bg.onclick = close; box.querySelector('.ask-x').onclick = close;
    const say = (text, who = 'bot') => { const m = document.createElement('div'); m.className = 'ask-m ' + who; m.textContent = text; body.appendChild(m); body.scrollTop = body.scrollHeight; };
    const chips = (list) => {
      const c = document.createElement('div'); c.className = 'ask-c';
      c.innerHTML = list.map((t) => `<button type="button">${esc(t)}</button>`).join('');
      c.querySelectorAll('button').forEach((b) => b.onclick = () => ask(b.textContent));
      body.appendChild(c); body.scrollTop = body.scrollHeight;
    };
    const ticket = () => {
      const t = document.createElement('form'); t.className = 'ask-t';
      t.innerHTML = `<label style="font-size:13px;font-weight:600" for="ask-tm">Message for our team</label><textarea id="ask-tm" maxlength="1000" required placeholder="What happened? Please don’t include ID numbers."></textarea>
        <input id="ask-tc" maxlength="80" placeholder="Phone or email (skip if you’re logged in)" aria-label="Phone or email"><button>Send to our team</button>`;
      t.onsubmit = async (e) => {
        e.preventDefault();
        try { await post('/api/help/ticket', { message: t.querySelector('#ask-tm').value, contact: t.querySelector('#ask-tc').value }); t.remove(); say('Sent. A member of our team will reply, usually within 24 hours.'); }
        catch (x) { say(x.message); }
      };
      body.appendChild(t); body.scrollTop = body.scrollHeight;
      t.querySelector('textarea').focus();
    };
    async function ask(q) {
      if (!q.trim()) return;
      say(q, 'you');
      try {
        const r = await post('/api/help', { q });
        say(r.answer);
        if (r.human) ticket(); else if (r.chips) chips(r.chips.slice(0, 4));
      } catch (x) { say('We couldn’t reach the server. In an emergency, call 112.'); }
    }
    box.querySelector('.ask-f').onsubmit = (e) => { e.preventDefault(); const i = box.querySelector('#ask-in'); const v = i.value; i.value = ''; ask(v); };
    say('Ask about rules, safety, verification or how anything works. This help can’t see anyone’s chats. In an emergency, call 112.');
    chips(DEFAULT_CHIPS);
    if (question) ask(question); else setTimeout(() => box.querySelector('#ask-in').focus(), 50);
  }
  window.AskPause = { open };
  document.addEventListener('click', (e) => { const t = e.target.closest && e.target.closest('[data-ask]'); if (t) { e.preventDefault(); open(t.dataset.ask || ''); } });
})();

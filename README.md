# PAUSE

Verified, slow dating for India (MVP). Node + Express + Postgres. Live in Bangalore and Delhi NCR.

- `/` website · `/app` the app (installable PWA) · `/admin` verification, reports, scam flags and help tickets
- Env vars: `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD`, `NODE_ENV=production`, optional `BRAND_NAME`, `LIVE_CITIES`, `DESTINY_DROP_HOUR` (default 21 = 9 pm IST)
- Run locally: `npm install && npm start` (expects Postgres at `postgres://swoosh:swoosh@localhost:5432/swoosh`)

## Product rules
- **Categories:** Steady 💞 · Forever 💍 · After Dark 🌙. You only meet people in your category; switch once a week.
- **Switches in every category:** 🎭 Masked (photos hidden until both tap Unmask) · 🔮 Destiny (12-question quiz per category → match %, and one hand-picked match every night at 9 pm IST).
- **Reveal steps:** Masked → Unmasked → Numbers shared. Each step needs both people. Numbers/handles are blocked in chat until shared.
- **Focus 5:** everyone can have at most 5 open chats. People at 5 don't appear in picks.
- **Kundli (Forever only, optional):** Moon sign from birth time (astronomy-engine + Lahiri ayanamsa) or picked by hand; Ashtakoota guna milan out of 36; optional minimum score filter. Zodiac badge is optional in Steady and After Dark.
- **Safety:** ID + selfie checked by a person (images deleted after decision); one ID = one account (HMAC of ID number); per-viewer photo watermarks; scam flags (money/UPI, crypto, OTP, links); "are you sure?" nudge for abusive words; contact & workplace shield; Take a pause; report/block/ban; SOS to a trusted contact.
- **Ask PAUSE:** rule-based help bot (`help.js`), never reads chats; hands off to a human ticket.
- **Games in chat:** This or that, 2 truths 1 lie.

Files: `server.js` (API), `kundli.js`, `destiny.js`, `help.js`, `public/` (site, app, admin).

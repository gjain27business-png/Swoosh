# Swoosh

Verified, privacy-first dating web app (MVP). Node + Express + Postgres.

- `/` landing page · `/app` the app (installable PWA) · `/admin` verification & reports queue
- Env vars: `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD`, `NODE_ENV=production`, optional `BRAND_NAME`
- Run locally: `npm install && npm start` (expects Postgres at `postgres://swoosh:swoosh@localhost:5432/swoosh`)

Core rules: every user verified (ID + selfie, reviewed by hand, images deleted after decision); one ID = one account (HMAC of ID number);
mutual filters + same mode for picks; dark-mode chat with step-by-step reveal (in man–woman matches the woman decides);
contact details blocked in chat until the Contact step; contact & workplace shield; report/block/ban.

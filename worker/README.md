# Cenote Conditions Worker

Cloudflare Worker + D1 backend for the conditions submission flow.

## Endpoints
- `GET  /conditions/recent` — latest report per cenote, last 30 days
- `POST /conditions` — submit a report; body:
  ```json
  {
    "cenote_slug": "gran-cenote",
    "crowd_level": "low|medium|high",
    "visibility_m": 25,
    "water_clarity": "clear|cloudy",
    "notes": "free text up to 200 chars",
    "contributor_name": "optional, up to 40 chars",
    "turnstile_token": "from the Turnstile widget"
  }
  ```

## First-time deploy (free tier)

```bash
cd worker
npm install
npx wrangler login

# Create D1 database — paste the returned database_id into wrangler.toml
npx wrangler d1 create cenote-conditions

# Initialise schema (remote)
npm run db:init

# Set Turnstile secret (get from dash.cloudflare.com → Turnstile → site)
npx wrangler secret put TURNSTILE_SECRET

# Optional: salt for IP hashing (any random string)
npx wrangler secret put RATE_SALT

# Deploy
npm run deploy
```

The deploy URL will look like `https://cenote-conditions.<account>.workers.dev`.
Wire it into the frontend by editing `../app.js` → `API_BASE`.

## Updating ALLOWED_ORIGINS

Add your production domain to the comma-separated list in `wrangler.toml`,
then redeploy. CORS rejects any other origin.

## Local dev

```bash
npm run db:init-local
npm run dev   # http://localhost:8787
```

Turnstile is skipped locally if you don't `wrangler secret put TURNSTILE_SECRET`,
so you can test the full submit flow without a site key.

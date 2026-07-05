# cenote-map — Handoff (2026-07-05)

Live site: https://paulrenzi.github.io/cenote-map/ · Repo: paulrenzi/cenote-map (branch `main`)
Local path: `C:\Users\paulm\cenote-map` (cwd resets between Bash calls — `cd` each time).
Live version: app/styles/manifest `?v=24`, SW `CACHE = cenote-map-v18`.
Deploy: commit → push → poll `gh api repos/paulrenzi/cenote-map/pages/builds/latest --jq .status` until `built` → curl live asset with cache-buster. Bump `?v=` in index.html + sw.js and the SW `CACHE` name on every shell change.

## Done this cycle (v24)
- **"Up next" nav defaults to first cenote selected** — removed the furthest-first auto-sort in `planLegs()`; route follows selection order and only changes via the ▲▼ chip controls.
- **Navigate opens the real Google place card** — `singleMapsUrl()` now uses `/maps/search/?api=1&query_place_id=…` (photos + formal address + reviews + Google's own Directions button) for the 59 cenotes with a verified `place_id`; directions-link fallback otherwise.
- Prior shipped: proof-layer Tier-1 (open-now/closes-at, Closest-to-me GPS sort, crowd pill) and Tier-2 ratings/reviews (`★ 4.3 · N reviews` on cards + detail pages).

## THE GAP — not photo-competitive yet (#1 priority)
Cards show a rating pill but **no images**. This is the main reason users still bounce to Google Maps / TripAdvisor. **Goal: get photo-competitive with them first, then monetize bookings.** Do not start monetization until photos land.

### Photos — DATA + RENDER CODE DONE (2026-07-05); only the worker deploy is left
Everything except the Cloudflare Worker deploy is committed and shipped-safe (with
`PHOTO_PROXY=""` nothing renders — cards/heroes fall back to the painted placeholder,
so this is live already with zero visible change):
- **Multi-photo backfill done.** `scripts/backfill_places.py` now captures the full
  `photos[]` array (up to 10 refs/cenote). Re-ran it: **60/82 matched, 598 photo refs**
  (59 cenotes × 10). Merged into `data/cenotes.json` as `google_photo_names[]` +
  `google_photo_attributions[]` (single `google_photo_name` kept for back-compat).
- **Card render done** (`app.js`): precedence local curated → Google proxy first photo
  → painted placeholder, with a `.photo-credit` attribution overlay. Gated on
  `CONFIG.PHOTO_PROXY`.
- **Detail-page carousel done** (`generate-pages.py`): Google hero + up to-10-tile
  gallery + per-author "Photo: X · Google" credits + og:image/JSON-LD. Gated on the
  `PHOTO_PROXY` env var (must match `CONFIG.PHOTO_PROXY`).

**THE ONE REMAINING STEP — Paul deploys the worker (interactive, one time):**
```
wrangler login                                   # OAuth in browser
cd C:\Users\paulm\cenote-map\worker-photos
wrangler deploy                                  # prints the URL, e.g. https://cenote-photos.<sub>.workers.dev
type ..\.env | findstr PLACES_API_KEY            # copy the key value
echo <PLACES_API_KEY> | wrangler secret put PLACES_API_KEY
```
No Workers-capable Cloudflare credential exists on this machine (the `cfat_` token in
shopify-analytics/.env lists accounts but 401s on `/workers/scripts`; cached wrangler
OAuth expired 2026-06-02), so this genuinely needs Paul's interactive `wrangler login`.

**Then (Claude) — go-live is 3 edits + regenerate + deploy:**
1. Set `CONFIG.PHOTO_PROXY` in `app.js` to the deployed worker origin.
2. `PHOTO_PROXY=<origin> python generate-pages.py` (regenerates detail pages with real photo URLs).
3. Bump `?v=` in index.html + sw.js and the SW `CACHE` name; commit, push, deploy.
Smoke-test one card image loads and one detail-page gallery before calling it done.

## After photos — monetization (ordered, ad-free promise stands)
1. **Affiliate tours / activities** — GetYourGuide / Viator deep links per cenote (highest intent, no inventory risk).
2. **Driver / transfer referral** — most visitors need a ride; referral link or booking form.
3. **Email capture** — gate a trip-planner PDF export on email; build a list.
4. **Ticket commission** — direct entry-fee booking where operators allow (last; needs operator relationships).
See `memory/project_cenote_map_monetization_roadmap.md` for the full 4-phase plan.

## Guardrails
- NEVER commit .env/tokens/credentials (`.env` holds `PLACES_API_KEY`); never print secrets.
- Don't fabricate prices/depth/visibility/ratings — null is honest. 23 undocumented community cenotes stay null.
- Don't tighten the backfill match radius or use nearest-only (cross-matches dense Homún/Cuzamá clusters). Matcher is name-confirmed; 12km is just a bound.
- GitHub Pages runners had transient failures 2026-07-04 — if a run jams "queued," cancel and push an empty commit to re-trigger.
- Commit trailer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

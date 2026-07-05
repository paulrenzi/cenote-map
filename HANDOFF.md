# cenote-map — Handoff (2026-07-04)

Live site: https://paulrenzi.github.io/cenote-map/ · Repo: paulrenzi/cenote-map (branch `main`)
Local path: `C:\Users\paulm\cenote-map` (cwd resets between Bash calls — `cd` each time).
Deploy: commit → push → poll `gh api repos/paulrenzi/cenote-map/pages/builds/latest --jq .status` until `built` → curl live asset with cache-buster.

## Done this cycle
- **Maps links open the real Google listing** (name + locality, `place_id` optional upgrade path) so users see reviews / verify the cenote exists. `app.js` ~line 640: `REGION_LOCALITY`, `mapsDest()`, `singleMapsUrl()`, `planMapsUrl()`.
- **Data enrichment** in `data/cenotes.json` (82 cenotes): prices 29→**71/82**, opening_type 28→**60/82**, amenities 35→**60/82**. Remaining blanks are genuinely undocumented community cenotes (Homún ejido, Cuzamá cart circuit) + Sacred Cenote (view-only) — do NOT fabricate.

## Next task: kill the two "escape hatches" (why users leave for Maps / TripAdvisor)
Users leave for **trust/proof** (Maps = "is it real, open now, what's it look like"; TripAdvisor = "reviews"). The planning layer is solid; the proof layer is missing. Priority order:

### Tier 1 — zero-cost, ship immediately (no API key needed)
1. **"Open now" live status** — `hours` is static text (e.g. `"08:00-17:00"`). Compute open/closed + "closes 5 PM" against device clock in JS. Handles ranges + null hours gracefully.
2. **Closest-to-you sorting** — `navigator.geolocation` → haversine vs each `coords` → "23 min / 18 km away" + sort option. Maps' main superpower.
3. **Surface crowd / best-time** — data already has `eco.crowd_pressure`; add a "go before 10am" hint where `crowd_pressure: high`. Check it's actually rendered in the card UI (`app.js`).

### Tier 2 — the big unlock, needs Paul's Google login (5 min)
4. **Photos + Google ratings/review-count per cenote** — THE #1 gap. A directory with no images loses to Maps' photo carousel every time. Same blocker for both: a **Google Places API key**. Enabling the Places API (New) requires authenticating AS Paul (project owner) — a security boundary; no SA/token/script bypasses it. Once enabled, one pass backfills `place_id`, rating, review count, and a photo reference for all 82. Then `singleMapsUrl`/`planMapsUrl` auto-upgrade to exact `destination_place_id` (code already checks for `c.place_id`).
   - Google Cloud projects on hand: **EmuNexus** (proj# 716109928961, has a working YouTube AIza key) and **umbrella-arcades-feed** (proj# 987413506322, GA4 SA — SA lacks serviceusage rights, dead end for auto-enable).

## Guardrails
- NEVER commit .env/tokens/credentials; never print secrets.
- Don't fabricate prices/depth/visibility — null is honest.
- Commit trailer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

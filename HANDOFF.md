# cenote-map — Handoff (2026-07-04)

Live site: https://paulrenzi.github.io/cenote-map/ · Repo: paulrenzi/cenote-map (branch `main`)
Local path: `C:\Users\paulm\cenote-map` (cwd resets between Bash calls — `cd` each time).
Deploy: commit → push → poll `gh api repos/paulrenzi/cenote-map/pages/builds/latest --jq .status` until `built` → curl live asset with cache-buster.

## Done this cycle
- **Maps links open the real Google listing** (name + locality, `place_id` optional upgrade path) so users see reviews / verify the cenote exists. `app.js` ~line 640: `REGION_LOCALITY`, `mapsDest()`, `singleMapsUrl()`, `planMapsUrl()`.
- **Data enrichment** in `data/cenotes.json` (82 cenotes): prices 29→**71/82**, opening_type 28→**60/82**, amenities 35→**60/82**. Remaining blanks are genuinely undocumented community cenotes (Homún ejido, Cuzamá cart circuit) + Sacred Cenote (view-only) — do NOT fabricate.

## Next task: kill the two "escape hatches" (why users leave for Maps / TripAdvisor)
Users leave for **trust/proof** (Maps = "is it real, open now, what's it look like"; TripAdvisor = "reviews"). The planning layer is solid; the proof layer is missing. Priority order:

### Tier 1 — SHIPPED 2026-07-04 (v21, SW cache v15) ✅
1. **"Open now" live status** — `openPill()` in `app.js`. Parses `hours` ("08:10-16:45"), computes open/closed + "closes 5 PM"/"opens 8 AM" against **America/Cancún** wall-clock (fixed UTC-5, via `Intl.DateTimeFormat` + `cancunNowMinutes()`) — NOT device clock, since users browse from other timezones. Null/malformed/overnight hours stay silent. EN 12h, ES 24h. Sits in the primary meta row next to price.
2. **Closest-to-you sorting** — `state.sortMode` ('base'|'me') + "Closest to me" button (`#locate-btn`). Click → `navigator.geolocation` → `state.liveCoords` → haversine sort; existing `_km` "km · ~min" label reused. Picking a "staying in" base resets to drive-time sort. Counter switches to "closest to you". Denied geolocation shows an inline hint.
3. **Crowd hint** — `crowdPill()` renders "Fills up by 10am — go early" where `eco.crowd_pressure: high` (secondary meta row, distinct from live user-report `conditionPill`).

### Tier 2 — the big unlock, needs Paul's Google login (5 min)
4. **Photos + Google ratings/review-count per cenote** — THE #1 gap. A directory with no images loses to Maps' photo carousel every time. Same blocker for both: a **Google Places API key**. Enabling the Places API (New) requires authenticating AS Paul (project owner) — a security boundary; no SA/token/script bypasses it. Once enabled, one pass backfills `place_id`, rating, review count, and a photo reference for all 82. Then `singleMapsUrl`/`planMapsUrl` auto-upgrade to exact `destination_place_id` (code already checks for `c.place_id`).
   - Google Cloud projects on hand: **EmuNexus** (proj# 716109928961, has a working YouTube AIza key) and **umbrella-arcades-feed** (proj# 987413506322, GA4 SA — SA lacks serviceusage rights, dead end for auto-enable).

## Guardrails
- NEVER commit .env/tokens/credentials; never print secrets.
- Don't fabricate prices/depth/visibility — null is honest.
- Commit trailer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

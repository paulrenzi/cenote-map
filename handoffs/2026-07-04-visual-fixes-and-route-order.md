# cenote-map — visual fixes + day-plan route ordering (2026-07-04)

## Current version: v20 (cache-bust `?v=20` across app.js/sw.js/index.html/generate-pages.py)

## What shipped this session

**Commit `5646892`** — visual critique follow-through + user-reported bugs:
- Card meta pills split into primary tier (cost/skill/transit, solid fill) vs. secondary tier (activities/condition/kids/sunscreen, quiet bordered style) — decision-critical facts no longer visually compete with filler tags.
- Single-stop day plans skip the itinerary modal and jump straight to Google Maps (modal only repeated what the tray already showed); tray button relabels to "Get directions" in that case.
- Fixed itinerary modal action buttons (Open route / Email me this / Copy share link) wrapping/cramming on mobile — now stack full-width instead of one flex row.
- Fixed inverted tray minimize/expand chevron — was showing ▲ while expanded (should be ▼ = minimize) and ▼ while minimized (should be ▲ = expand). Root cause: swapped ternary in the SVG `<polyline>` points.
- Fixed "Add to day" pill touching the "Directions" button with zero gap — `.plan-btn` had `margin-left: auto` which ate the entire `.card-foot` flex gap. Removed the auto-margin, added an explicit `gap` on `.card-foot`.

**Commit `baf73e2`** — day-plan route ordering:
- Added `state.liveCoords`, populated from the existing geolocation base-detection flow (`detectAndApplyLocationBase`) — first real caching of the visitor's live coords for reuse elsewhere.
- `planLegs()` now sorts stops by distance from origin (live coords, falling back to selected base) **descending** — furthest stop first, closest last. This feeds both the itinerary list and `planMapsUrl()`, so the Google Maps link goes: current location → furthest cenote → ...→ closest cenote (destination), an out-and-back loop instead of whatever order stops were tapped in. No `optimize:true` on the Maps URL, so Google won't re-shuffle this order.
- Verified via Playwright with a mocked geolocation fix (20.4230,-87.3260) and 3 planned stops — confirmed waypoint order was 6.07km → 3.07km from origin, destination was the closest at 2.60km.

Both commits pushed to `https://github.com/paulrenzi/cenote-map.git main`.

## Verification method
Playwright (Python, headless chromium) used throughout — not just code read-through:
- Screenshot fragments of cards/modal/tray for visual review (not full-page).
- `page.eval_on_selector` to read live `aria-label`/`points` attributes on the chevron before/after the fix.
- Scripted click-through (add 3 stops to plan, open itinerary) + `haversineKm` distance check in a standalone Python script to confirm the actual sort order in the generated Maps URL.

## Not touched this session (still open, from the standing critique)
- Critique #2 — map zoom/clustering to the selected base's region (proposed only).
- Critique #3 — photo branding audit across all 82 cenote photos (proposed only, needs manual visual pass, not something to batch-fix blind).
- Monetization roadmap (see `TODO.md`) — Phase 1 blocked on Paul's own affiliate program signup, Phase 3 blocked on a Cloudflare API token that can't create Pages/D1/Workers.

## Gotchas for next session
- `generate-pages.py` must be re-run after any version bump — it regenerates all 82 `cenotes/*.html` pages + sitemap.xml + robots.txt from templates. Don't hand-edit the generated files.
- Cache-bust version must be bumped in lockstep across all 4 files (`sed -i 's/v=N/v=N+1/g' app.js sw.js index.html generate-pages.py`) or the service worker will serve stale JS/CSS.
- `state.liveCoords` is only populated if geolocation succeeds within the existing detection flow — it can be `null`. `planLegs()` already falls back to the selected base's coords in that case; don't assume it's always set.

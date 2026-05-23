# Riviera Maya Cenote Map

A fast, free, independent trip planner for the cenotes of Quintana Roo — from Cancún down to Tulum. Vanilla HTML/CSS/JS, GitHub Pages hosted, free-tier everything.

## Stack
- Static site: vanilla HTML/CSS/JS, no framework
- Map: [MapLibre GL JS](https://maplibre.org) via CDN, lazy-loaded on scroll
- Tiles: [OpenFreeMap](https://openfreemap.org) (Positron style — free, no key)
- Fonts: Fraunces + Manrope via Google Fonts (preconnected)
- PWA: app-shell cache via service worker
- i18n: EN + ES, swap via `?lang=` query param
- Hosting: GitHub Pages
- Build: `build.ps1` (terser + image compress)

## Project layout
```
index.html              Page shell
styles.css              Visual system (matches akumalwildlife.com)
app.js                  Map, filter, distance-from-base, render
sw.js                   Service worker (app-shell cache)
manifest.webmanifest    PWA manifest
data/cenotes.json       Cenote dataset (one record per cenote)
data/bases.json         Common accommodation hubs for distance sort
images/hero.webp        Hero photo
compress.py             jpg/png -> webp helper
build.ps1               Minify + validate
```

## Data model

Each cenote in `data/cenotes.json` has bilingual content, geo coords, activity tags, skill floor, access notes, current price, ownership, and a `verified` date that drives a freshness badge in the UI. See the `_schema_notes` block at the top of the file.

## Adding a cenote
1. Edit `data/cenotes.json` — copy the nearest existing record as a template.
2. Set `verified` to today's date.
3. Commit. GitHub Pages picks it up on push.

## Running locally
Any static server works:
```
python -m http.server 8000
```
Then open http://localhost:8000.

## Conditions backend (optional)

The `worker/` directory holds a Cloudflare Worker + D1 backend for live
"how was it today" reports. The frontend degrades gracefully if it isn't
deployed — the Report button just doesn't render.

To turn it on:
1. Follow `worker/README.md` to deploy and get the workers.dev URL.
2. Create a Turnstile site at dash.cloudflare.com → Turnstile (free).
3. In `app.js`, fill in:
   ```js
   const CONFIG = {
     API_BASE: "https://cenote-conditions.<acct>.workers.dev",
     TURNSTILE_SITE_KEY: "0x4AAA..."
   };
   ```
4. Commit — GitHub Pages picks it up on push.

## Roadmap (Phase 2+)
- Multi-day trip planner (TSP over selected cenotes with hours-of-operation windows)
- Light-beam timing widget per cenote (SunCalc.js + opening orientation)
- Per-cenote detail pages with photos + amenities
- Trusted-contributor accounts for dive shops
- Embeddable "latest conditions" widget for partner sites

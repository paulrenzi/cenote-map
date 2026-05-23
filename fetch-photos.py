"""
Wikimedia Commons photo fetcher for cenotes.

For each cenote in data/cenotes.json without a photo entry in data/photos.json,
search Commons, pick a CC-licensed landscape image, download, resize to 1200px
wide, save as WebP under images/cenotes/<slug>.webp, and record attribution.

Manual overrides: edit data/photo_overrides.json with {slug: commons_file_title}
to force a specific Wikimedia file when auto-search picks badly.

Usage:
  python fetch-photos.py [--force]   # --force re-fetches even cached entries
"""
import json, sys, urllib.parse, urllib.request, time, io
from pathlib import Path
from PIL import Image

ROOT          = Path(__file__).parent
CENOTES_FILE  = ROOT / "data" / "cenotes.json"
PHOTOS_FILE   = ROOT / "data" / "photos.json"
OVERRIDES     = ROOT / "data" / "photo_overrides.json"
OUT_DIR       = ROOT / "images" / "cenotes"
USER_AGENT    = "cenote-map/0.2 (paulmichaelrenzi@gmail.com) PIL Pillow"
TARGET_W      = 1200
QUALITY       = 80
ALLOWED_LIC   = ("cc0", "public domain", "cc by", "cc-by")  # accept BY / BY-SA / CC0; reject NC / ND
REJECT_LIC    = ("-nc", " nc", "-nd", " nd")
REJECT_EXT    = (".pdf", ".djvu", ".svg", ".ogv", ".webm", ".gif", ".tif", ".tiff")
# Words that strongly indicate a historical-book scan or off-topic file
REJECT_TITLE  = ("prehistoria", "obra postuma", "su pasado", "su presente",
                 "manuscrito", "Codex".lower(), "diccionario", " 18th",
                 " 19th", " 1800s", " 1900s", "mapa", "estampa")

OUT_DIR.mkdir(parents=True, exist_ok=True)

def http_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)

def http_bytes(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

def search_commons(query, limit=10):
    qs = urllib.parse.urlencode({
        "action": "query", "list": "search", "srsearch": query,
        "srnamespace": 6, "srlimit": str(limit), "format": "json"
    })
    data = http_json(f"https://commons.wikimedia.org/w/api.php?{qs}")
    return [m["title"] for m in data.get("query", {}).get("search", [])]

def file_info(titles):
    if not titles:
        return {}
    qs = urllib.parse.urlencode({
        "action": "query", "titles": "|".join(titles),
        "prop": "imageinfo", "iiprop": "url|extmetadata|size",
        "iiurlwidth": str(TARGET_W), "format": "json"
    })
    data = http_json(f"https://commons.wikimedia.org/w/api.php?{qs}")
    out = {}
    for _pid, p in data.get("query", {}).get("pages", {}).items():
        ii = (p.get("imageinfo") or [{}])[0]
        if not ii:
            continue
        out[p["title"]] = ii
    return out

def license_ok(ii):
    lic = ((ii.get("extmetadata") or {}).get("LicenseShortName") or {}).get("value", "").lower()
    if not lic:
        return False
    if any(bad in lic for bad in REJECT_LIC):
        return False
    return any(good in lic for good in ALLOWED_LIC)

def is_landscape(ii):
    # source size (full image)
    w = ii.get("width") or 0
    h = ii.get("height") or 0
    return w >= h * 1.05  # mildly landscape

def artist_text(ii):
    meta = (ii.get("extmetadata") or {})
    raw = (meta.get("Artist") or {}).get("value", "")
    # Strip HTML, keep text only
    import re
    txt = re.sub(r"<[^>]+>", "", raw).strip()
    return txt or "Unknown"

def title_ok(title):
    low = title.lower()
    if any(low.endswith(ext) for ext in REJECT_EXT): return False
    if any(w in low for w in REJECT_TITLE): return False
    return True

def pick_best(titles, infos):
    """Pick first CC-licensed, landscape, real-photo file."""
    for t in titles:
        if not title_ok(t): continue
        ii = infos.get(t)
        if not ii: continue
        if not license_ok(ii): continue
        if not is_landscape(ii): continue
        return t, ii
    # Second pass: drop landscape requirement but keep title/license filters
    for t in titles:
        if not title_ok(t): continue
        ii = infos.get(t)
        if ii and license_ok(ii):
            return t, ii
    return None, None

def process_cenote(c, photos, overrides, force=False):
    slug = c["slug"]
    out_file = OUT_DIR / f"{slug}.webp"
    if not force and slug in photos and out_file.exists():
        return None  # already done

    override = overrides.get(slug)
    if override == "SKIP":
        return {"slug": slug, "status": "skip_per_override"}
    if override:
        titles = [override if override.startswith("File:") else f"File:{override}"]
    else:
        # Search strategies — most specific first
        q = c["name_en"].replace("(", "").replace(")", "")
        candidates = []
        for query in [f"{q} cenote Mexico", f"Cenote {q.split('(')[0].strip()}", q]:
            candidates += search_commons(query, limit=8)
            if len(candidates) >= 10:
                break
        # Dedup, preserve order
        seen = set(); titles = []
        for t in candidates:
            if t not in seen:
                seen.add(t); titles.append(t)
        titles = titles[:15]

    if not titles:
        return {"slug": slug, "status": "no_search_results"}

    infos = file_info(titles)
    chosen, ii = pick_best(titles, infos)
    if not chosen:
        return {"slug": slug, "status": "no_cc_landscape"}

    url = ii.get("thumburl") or ii.get("url")
    if not url:
        return {"slug": slug, "status": "no_url"}

    raw = http_bytes(url)
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    if im.width > TARGET_W:
        h = round(im.height * TARGET_W / im.width)
        im = im.resize((TARGET_W, h), Image.LANCZOS)
    im.save(out_file, "WEBP", quality=QUALITY, method=6)

    meta = (ii.get("extmetadata") or {})
    photos[slug] = {
        "file": f"images/cenotes/{slug}.webp",
        "credit": artist_text(ii),
        "license": (meta.get("LicenseShortName") or {}).get("value", "unknown"),
        "source": ii.get("descriptionurl") or "",
        "wikimedia_title": chosen
    }
    return {"slug": slug, "status": "ok", "file": chosen,
            "license": photos[slug]["license"],
            "credit": photos[slug]["credit"], "bytes": out_file.stat().st_size}

def main():
    force = "--force" in sys.argv
    cenotes = json.load(CENOTES_FILE.open(encoding="utf-8"))["cenotes"]
    photos = {}
    if PHOTOS_FILE.exists():
        photos = json.load(PHOTOS_FILE.open(encoding="utf-8"))
    overrides = {}
    if OVERRIDES.exists():
        overrides = json.load(OVERRIDES.open(encoding="utf-8"))

    print(f"Processing {len(cenotes)} cenotes …")
    for c in cenotes:
        try:
            result = process_cenote(c, photos, overrides, force=force)
            if result is None:
                print(f"  {c['slug']:24s} cached")
            else:
                tag = result["status"]
                if tag == "ok":
                    print(f"  {c['slug']:24s} OK  {result['bytes']//1024:4d}KB  {result['license']:14s}  {result['file'][:60]}")
                else:
                    print(f"  {c['slug']:24s} SKIP {tag}")
            time.sleep(0.6)  # be nice to Commons
        except Exception as e:
            print(f"  {c['slug']:24s} ERR  {type(e).__name__}: {e}")

    PHOTOS_FILE.write_text(json.dumps(photos, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote {PHOTOS_FILE} ({len(photos)} entries)")

if __name__ == "__main__":
    sys.exit(main() or 0)

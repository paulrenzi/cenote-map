"""
Gallery fetcher — pulls MULTIPLE verified photos for a cenote and writes a
`gallery` array into data/photos.json (plus keeps `file` = the first image as
the card/hero primary, so nothing that reads the old single-photo shape breaks).

Unlike fetch-photos.py (auto-search, one image), this uses an EXPLICIT source
map so every image is subject-verified by hand — the site's whole pitch is a
verified unique photo per cenote, so we never let fuzzy search attach a
wrong-subject image just to hit a count.

Each source is a Wikimedia Commons "File:" title. Attribution (artist, license,
descriptionurl) is pulled live from Commons imageinfo. Images are resized to
1200px wide WebP under images/cenotes/<slug>-<n>.webp.

Usage:  python fetch-gallery.py
"""
import json, io, time, urllib.parse, urllib.request, re
from pathlib import Path
from PIL import Image

ROOT        = Path(__file__).parent
PHOTOS_FILE = ROOT / "data" / "photos.json"
OUT_DIR     = ROOT / "images" / "cenotes"
UA          = "cenote-map/0.3 (paulmichaelrenzi@gmail.com) PIL Pillow"
TARGET_W    = 1200
QUALITY     = 80

# slug -> ordered list of Commons File: titles (first = primary/hero).
# Only slugs with hand-verified subject matches go here.
GALLERY = {
    "kantun-chi": [
        "File:20230321 - Kantun Chi - 6.jpg",
        "File:20230321 - Kantun Chi - 9.jpg",
        "File:20230321 - Kantun Chi - 25.jpg",
    ],
    "sac-actun": [
        "File:Cenote Nohoch Nah Chich.jpg",
        "File:Cenote Calimba.jpg",
    ],
    "el-pit": [
        "File:The Pit - Profundo - Cenote (4317117052).jpg",
        "File:The Pit - Profundo - Cenote (4317117458).jpg",
    ],
    "tankah": [
        "File:Casa Cenote in Mexico (42877772324).jpg",
        "File:Snorkeling in the Casa Cenote in Mexico (29725069898).jpg",
        "File:Diving in the Casa Cenote in Mexico Casa Cenote in Mexico (41787128060).jpg",
    ],
    # Direct Flickr sources (via Openverse), not on Wikimedia Commons — dict form.
    "nicte-ha": [
        {
            "url": "https://live.staticflickr.com/65535/52615169725_7422e2f0d8_b.jpg",
            "credit": "woodleywonderworks",
            "license": "CC BY 2.0",
            "source": "https://www.flickr.com/photos/73645804@N00/52615169725",
        },
        {
            "url": "https://live.staticflickr.com/65535/52615169780_3594149144_b.jpg",
            "credit": "woodleywonderworks",
            "license": "CC BY 2.0",
            "source": "https://www.flickr.com/photos/73645804@N00/52615169780",
        },
    ],
}

OUT_DIR.mkdir(parents=True, exist_ok=True)

def http_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def http_bytes(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read()

def info(titles):
    qs = urllib.parse.urlencode({
        "action": "query", "titles": "|".join(titles),
        "prop": "imageinfo", "iiprop": "url|extmetadata|size",
        "iiurlwidth": str(TARGET_W), "format": "json"
    })
    data = http_json(f"https://commons.wikimedia.org/w/api.php?{qs}")
    out = {}
    for _pid, p in data.get("query", {}).get("pages", {}).items():
        ii = (p.get("imageinfo") or [{}])[0]
        if ii:
            out[p["title"]] = ii
    return out

def artist(ii):
    raw = ((ii.get("extmetadata") or {}).get("Artist") or {}).get("value", "")
    return re.sub(r"<[^>]+>", "", raw).strip() or "Unknown"

def main():
    photos = json.loads(PHOTOS_FILE.read_text(encoding="utf-8")) if PHOTOS_FILE.exists() else {}

    for slug, items in GALLERY.items():
        commons_titles = [it for it in items if isinstance(it, str)]
        infos = info(commons_titles) if commons_titles else {}
        gallery = []
        for n, item in enumerate(items, 1):
            if isinstance(item, str):
                title = item
                ii = infos.get(title)
                if not ii:
                    print(f"  {slug}: MISSING {title}")
                    continue
                src_url = ii.get("thumburl") or ii.get("url")
                meta = (ii.get("extmetadata") or {})
                credit = artist(ii)
                license_ = (meta.get("LicenseShortName") or {}).get("value", "unknown")
                source = ii.get("descriptionurl") or ""
                wikimedia_title = title
            else:
                src_url = item["url"]
                credit = item["credit"]
                license_ = item["license"]
                source = item["source"]
                wikimedia_title = None

            raw = http_bytes(src_url)
            im = Image.open(io.BytesIO(raw)).convert("RGB")
            if im.width > TARGET_W:
                h = round(im.height * TARGET_W / im.width)
                im = im.resize((TARGET_W, h), Image.LANCZOS)
            rel = f"images/cenotes/{slug}-{n}.webp"
            im.save(ROOT / rel, "WEBP", quality=QUALITY, method=6)
            entry = {
                "file": rel,
                "credit": credit,
                "license": license_,
                "source": source,
            }
            if wikimedia_title:
                entry["wikimedia_title"] = wikimedia_title
            gallery.append(entry)
            print(f"  {slug}-{n}: OK  {(ROOT/rel).stat().st_size//1024}KB  {source}")
            time.sleep(0.4)

        if gallery:
            primary = dict(gallery[0])
            primary["gallery"] = gallery
            photos[slug] = primary

    PHOTOS_FILE.write_text(json.dumps(photos, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\nWrote {PHOTOS_FILE} ({len(photos)} entries)")

if __name__ == "__main__":
    main()

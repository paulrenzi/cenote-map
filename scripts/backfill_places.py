#!/usr/bin/env python3
"""Backfill place_id + rating + review count + one photo ref for each cenote
using the Google Places API (New).

Blocked until the Places API (New) is enabled on the EmuNexus GCP project and a
Places-authorised key exists. Then:

    # cenote-map/.env  (gitignored)
    PLACES_API_KEY=AIza...

    python scripts/backfill_places.py            # dry run -> data/places-backfill.json
    python scripts/backfill_places.py --execute  # merge staged results into cenotes.json

Design notes:
  * Text Search is biased to each cenote's own coords and the match is REJECTED
    if the top result lands > MATCH_RADIUS_KM away — obscure community cenotes
    share names and we would rather leave a field null than point at the wrong
    place (honest-null rule).
  * Nothing is written to cenotes.json in dry-run mode; results land in a
    staging file so the matches can be eyeballed before they go live.
  * Photos: we store the photo resource *name* + author attribution only. Google
    Places photo bytes have usage/attribution terms — how (or whether) to render
    them is a display decision, not something this script bakes in.
"""
import argparse
import json
import math
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "cenotes.json"
STAGING = ROOT / "data" / "places-backfill.json"
SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
FIELD_MASK = (
    "places.id,places.displayName,places.location,"
    "places.rating,places.userRatingCount,places.photos,places.formattedAddress"
)
# Our stored coords are coarse (some rounded to 2 decimals ≈ several km), so
# distance is only a sanity bound — the real gate is name similarity. A
# name-confirmed hit up to MATCH_RADIUS_KM away beats a merely-close neighbour,
# which is what prevents dense clusters (Homún/Cuzamá) from cross-matching.
MATCH_RADIUS_KM = 12.0
NAME_MIN_CONTAINMENT = 0.6   # fraction of our significant tokens found in the candidate
CLOSE_KM = 0.35              # near-exact coords: accept on weak name overlap
R_KM = 6371.0

# Dropped before token comparison — generic words that carry no identity.
STOPWORDS = {
    "cenote", "cenotes", "el", "la", "las", "los", "de", "del", "y",
    "ecopark", "eco", "park", "parque", "salida", "entrada", "the",
}

# Locality hint per region so the text query disambiguates (mirrors the
# REGION_LOCALITY map already used for Maps deep-links in app.js).
REGION_LOCALITY = {
    "tulum": "Tulum, Quintana Roo",
    "playa": "Playa del Carmen, Quintana Roo",
    "akumal": "Akumal, Quintana Roo",
    "cancun": "Cancún, Quintana Roo",
    "puerto_morelos": "Puerto Morelos, Quintana Roo",
    "valladolid": "Valladolid, Yucatán",
    "homun": "Homún, Yucatán",
    "cuzama": "Cuzamá, Yucatán",
    "merida": "Mérida, Yucatán",
}


def load_env():
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())
    key = os.environ.get("PLACES_API_KEY", "")
    if not key:
        sys.exit("PLACES_API_KEY not set (cenote-map/.env or environment).")
    return key


def haversine_km(a, b):
    d_lat = math.radians(b[0] - a[0])
    d_lng = math.radians(b[1] - a[1])
    s = (math.sin(d_lat / 2) ** 2
         + math.cos(math.radians(a[0])) * math.cos(math.radians(b[0]))
         * math.sin(d_lng / 2) ** 2)
    return 2 * R_KM * math.asin(math.sqrt(s))


def search_place(key, cenote):
    locality = REGION_LOCALITY.get(cenote.get("region"), "Quintana Roo, Mexico")
    query = f"{cenote['name_es']} cenote, {locality}"
    lat, lng = cenote["coords"]
    body = {
        "textQuery": query,
        "locationBias": {
            "circle": {"center": {"latitude": lat, "longitude": lng},
                       "radius": 5000.0}
        },
        "maxResultCount": 5,
    }
    req = urllib.request.Request(
        SEARCH_URL,
        data=json.dumps(body).encode("utf-8"),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": FIELD_MASK,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8")).get("places", [])
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:300]
        print(f"  ! HTTP {e.code}: {detail}")
        return None


def name_tokens(s):
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(ch for ch in s if not unicodedata.combining(ch)).lower()
    toks = re.findall(r"[a-z0-9]+", s)
    return {t for t in toks if t not in STOPWORDS}


def containment(ours, theirs):
    """Fraction of our significant tokens present in the candidate name."""
    if not ours:
        return 0.0
    return len(ours & theirs) / len(ours)


def best_match(cenote, places):
    """Best name-confirmed candidate within MATCH_RADIUS_KM, else None.

    Ranks by (name containment desc, distance asc). Distance is only a coarse
    bound because our stored coords are approximate; identity comes from the
    name so neighbouring cenotes in dense clusters don't cross-match.
    """
    ours = name_tokens(cenote["name_es"]) | name_tokens(cenote["name_en"])
    ranked = []
    for p in places:
        loc = p.get("location") or {}
        if "latitude" not in loc:
            continue
        km = haversine_km(cenote["coords"], (loc["latitude"], loc["longitude"]))
        if km > MATCH_RADIUS_KM:
            continue
        cand = name_tokens((p.get("displayName") or {}).get("text", ""))
        cont = containment(ours, cand)
        # Accept on a solid name overlap, OR on near-exact coords with any overlap.
        if cont >= NAME_MIN_CONTAINMENT or (km <= CLOSE_KM and cont > 0):
            ranked.append((cont, -km, p, km))
    if not ranked:
        return None, None
    ranked.sort(key=lambda r: (r[0], r[1]), reverse=True)
    cont, _neg, p, km = ranked[0]
    return p, km


def stage(key, cenotes):
    out = []
    for i, c in enumerate(cenotes, 1):
        print(f"[{i}/{len(cenotes)}] {c['name_en']}", flush=True)
        places = search_place(key, c)
        if places is None:  # hard API error — stop rather than burn quota blind
            sys.exit("Aborting: Places API error (see above). Fix key/enablement.")
        match, km = best_match(c, places)
        if not match:
            print("  - no match within radius; leaving null")
            out.append({"slug": c["slug"], "matched": False})
        else:
            photos = match.get("photos") or []
            # Full photo set (up to 10) so the client can show a carousel, not a
            # single image. Each ref carries its own author attribution, which
            # Google's terms require we display alongside the image.
            photo_set = [
                {
                    "name": p.get("name"),
                    "attribution": [
                        a.get("displayName") for a in p.get("authorAttributions", [])
                    ],
                }
                for p in photos if p.get("name")
            ]
            first = photo_set[0] if photo_set else {}
            rec = {
                "slug": c["slug"],
                "matched": True,
                "match_km": round(km, 3),
                "place_id": match["id"],
                "matched_name": (match.get("displayName") or {}).get("text"),
                "formatted_address": match.get("formattedAddress"),
                "rating": match.get("rating"),
                "review_count": match.get("userRatingCount"),
                "photo_name": first.get("name"),
                "photo_attribution": first.get("attribution", []),
                "photos": photo_set,
            }
            out.append(rec)
            print(f"  ok {rec['matched_name']} · {rec['rating']}"
                  f" ({rec['review_count']} reviews) · {km:.2f} km")
        time.sleep(0.15)  # polite pacing
    STAGING.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nStaged {sum(r['matched'] for r in out)}/{len(out)} matches -> {STAGING}")
    print("Review it, then re-run with --execute to merge into cenotes.json.")


def execute(cenotes_doc):
    if not STAGING.exists():
        sys.exit("No staging file. Run the dry pass first.")
    staged = {r["slug"]: r for r in json.loads(STAGING.read_text(encoding="utf-8"))}
    n = 0
    for c in cenotes_doc["cenotes"]:
        r = staged.get(c["slug"])
        if not r or not r.get("matched"):
            continue
        c["place_id"] = r["place_id"]
        if r.get("rating") is not None:
            c["google_rating"] = r["rating"]
        if r.get("review_count") is not None:
            c["google_review_count"] = r["review_count"]
        if r.get("photo_name"):
            c["google_photo_name"] = r["photo_name"]
            c["google_photo_attribution"] = r["photo_attribution"]
        # Full photo set for the carousel. Older staging files lack "photos";
        # fall back to the single ref so a re-run isn't required to keep parity.
        photo_set = r.get("photos")
        if photo_set is None and r.get("photo_name"):
            photo_set = [{"name": r["photo_name"], "attribution": r.get("photo_attribution", [])}]
        if photo_set:
            c["google_photo_names"] = [p["name"] for p in photo_set]
            c["google_photo_attributions"] = [p.get("attribution", []) for p in photo_set]
        n += 1
    DATA.write_text(json.dumps(cenotes_doc, indent=2, ensure_ascii=False) + "\n",
                    encoding="utf-8")
    print(f"Merged {n} cenotes into {DATA}.")


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--execute", action="store_true",
                    help="merge staged results into cenotes.json")
    args = ap.parse_args()
    doc = json.loads(DATA.read_text(encoding="utf-8"))
    if args.execute:
        execute(doc)
    else:
        stage(load_env(), doc["cenotes"])


if __name__ == "__main__":
    main()

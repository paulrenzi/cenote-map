"""
Generate one static HTML detail page per cenote under cenotes/<slug>.html
plus sitemap.xml. Re-run after any change to data/cenotes.json or
data/photos.json.

Output:
  cenotes/<slug>.html  — bilingual detail page per cenote
  sitemap.xml          — for Google indexing
"""
import json, html, re
from pathlib import Path

ROOT = Path(__file__).parent
SITE = "https://paulrenzi.github.io/cenote-map"
OUT_DIR = ROOT / "cenotes"
OUT_DIR.mkdir(exist_ok=True)

cenotes = json.loads((ROOT / "data" / "cenotes.json").read_text(encoding="utf-8"))["cenotes"]
photos  = json.loads((ROOT / "data" / "photos.json").read_text(encoding="utf-8")) if (ROOT / "data" / "photos.json").exists() else {}

# ── Static labels (EN + ES) ────────────────────────────────────────
L = {
    "back":           ("All cenotes",                "Todos los cenotes"),
    "h_at_glance":    ("At a glance",                "De un vistazo"),
    "h_activities":   ("Activities",                 "Actividades"),
    "h_skill":        ("Skill level",                "Nivel"),
    "h_access":       ("Access",                     "Acceso"),
    "h_amenities":    ("Amenities",                  "Servicios"),
    "h_cost":         ("Cost & ownership",           "Precio y propietario"),
    "h_eco":          ("Eco & etiquette",            "Ecología y etiqueta"),
    "h_map":          ("Where it is",                "Dónde está"),
    "depth":          ("Depth",                      "Profundidad"),
    "viz":            ("Typical visibility",         "Visibilidad típica"),
    "hours":          ("Hours",                      "Horario"),
    "cost":           ("Entry",                      "Entrada"),
    "free":           ("Free",                       "Gratis"),
    "unknown":        ("not posted",                 "no publicado"),
    "kids":           ("Kid-friendly",               "Para niños"),
    "wheelchair":     ("Wheelchair access",          "Acceso silla de ruedas"),
    "road":           ("Road",                       "Carretera"),
    "parking":        ("Parking",                    "Estacionamiento"),
    "collectivo":     ("Collectivo stop",            "Para colectivo"),
    "fourwd":         ("4×4 required",               "Se requiere 4×4"),
    "yes":            ("Yes",                        "Sí"),
    "no":             ("No",                         "No"),
    "credit":         ("Photo:",                     "Foto:"),
    "no_photo":       ("First-party photo coming soon. Have one? Email paul@akumalscooters.com.",
                       "Foto propia próximamente. ¿Tienes una? Escribe a paul@akumalscooters.com."),
    "footer_eco":     ("Cenotes are sacred to the Maya and fragile freshwater systems — skip the sunscreen, take your trash with you, and tip the local crew.",
                       "Los cenotes son sagrados para los mayas y sistemas de agua dulce frágiles — no uses bloqueador, llévate tu basura, y propina al equipo local."),
}

REGIONS = {
    "akumal":          ("Akumal",                "Akumal"),
    "tulum":           ("Tulum",                 "Tulum"),
    "riviera_central": ("Akumal – Playa corridor", "Corredor Akumal – Playa"),
    "puerto_morelos":  ("Puerto Morelos jungle", "Selva de Puerto Morelos"),
    "coba":            ("Cobá",                  "Cobá"),
    "chichen":         ("Chichén Itzá area",     "Zona de Chichén Itzá"),
    "valladolid":      ("Valladolid",            "Valladolid"),
}

ACTIVITIES = {
    "swim":         ("Swim",            "Nadar"),
    "snorkel":      ("Snorkel",         "Snorkel"),
    "cavern_dive":  ("Cavern dive",     "Buceo de caverna"),
    "cave_dive":    ("Cave dive (cert)","Buceo de cueva (cert)"),
    "cliff_jump":   ("Cliff jump",      "Salto de altura"),
    "zip_line":     ("Zip line",        "Tirolesa"),
    "rappel":       ("Rappel",          "Rappel"),
}

SKILLS = {
    "none":        ("No swimming required",    "Sin nadar requerido"),
    "swimmer":     ("Open to swimmers",        "Abierto a nadadores"),
    "open_water":  ("Open Water cert required","Cert. Open Water"),
    "cavern_cert": ("Cavern cert required",    "Cert. caverna"),
    "cave_cert":   ("Cave cert required",      "Cert. cueva"),
}

ROAD = {
    "paved":        ("Paved",            "Pavimentada"),
    "dirt_easy":    ("Easy dirt",        "Terracería fácil"),
    "dirt_rough":   ("Rough dirt",       "Terracería difícil"),
    "four_wd":      ("4×4 only",         "Solo 4×4"),
}

OWNERSHIP = {
    "ejido":           ("Ejido (community land)",   "Ejido"),
    "community":       ("Community-owned",          "Comunitario"),
    "private_mx":      ("Private (Mexican)",        "Privado (mexicano)"),
    "private_foreign": ("Private (foreign-owned)",  "Privado (extranjero)"),
    "unknown":         ("Ownership unknown",        "Propietario desconocido"),
}

ECO_SUNSCREEN = {
    "none_allowed":      ("No sunscreen permitted (rinse before entry)",  "Bloqueador prohibido (enjuagar antes)"),
    "biodegradable_only":("Biodegradable sunscreen only",                "Solo bloqueador biodegradable"),
    "any":               ("Sunscreen permitted",                         "Bloqueador permitido"),
}

ECO_CROWD = {
    "low":    ("Low crowd pressure",    "Poca afluencia"),
    "medium": ("Medium crowd pressure", "Afluencia media"),
    "high":   ("High crowd pressure",   "Mucha afluencia"),
}

# Pretty labels for amenity enum values (English source, ES translated)
AMENITIES = {
    "showers":               ("Showers", "Regaderas"),
    "lockers":               ("Lockers", "Lockers"),
    "restrooms":             ("Restrooms", "Sanitarios"),
    "restaurant":            ("Restaurant", "Restaurante"),
    "picnic_area":           ("Picnic area", "Área de picnic"),
    "life_vest_rental":      ("Life vest rental", "Renta de chaleco"),
    "snorkel_rental":        ("Snorkel rental", "Renta de snorkel"),
    "kayak_rental":          ("Kayak rental", "Renta de kayak"),
    "guide_available":       ("Guide available", "Guía disponible"),
    "guided_only":           ("Guided entry only", "Solo entrada guiada"),
    "zip_line":              ("Zip line", "Tirolesa"),
    "rope_swing":            ("Rope swing", "Columpio de cuerda"),
    "rappel":                ("Rappel", "Rappel"),
    "ladder":                ("Ladder access", "Escalera"),
    "stairs":                ("Stairs", "Escaleras"),
    "wooden_walkway":        ("Wooden walkway", "Pasarela de madera"),
    "stone_platform":        ("Stone platform", "Plataforma de piedra"),
    "diving_platform":       ("Diving platform", "Plataforma de salto"),
    "jump_platforms":        ("Jump platforms", "Plataformas de salto"),
    "shallow_kids_area":     ("Shallow kids' area", "Área para niños"),
    "spider_monkey_sanctuary": ("Spider monkey sanctuary", "Santuario de mono araña"),
    "tank_fill":             ("Tank fills", "Llenado de tanques"),
}

def esc(s): return html.escape(str(s), quote=True)
def strip_html(s): return re.sub(r"<[^>]+>", "", s or "").strip()
def lbl(key, lang): return L[key][0 if lang == "en" else 1]

def cost_text(c, lang):
    if c.get("cost_mxn") is None: return lbl("unknown", lang)
    if c["cost_mxn"] == 0: return lbl("free", lang)
    return f"${c['cost_mxn']} MXN"

def two_lang_attrs(en, es):
    return f'data-en="{esc(en)}" data-es="{esc(es)}"'

def render_pill_list(items, dictionary, lang):
    out = []
    for it in items:
        en, es = dictionary.get(it, (it.replace("_", " ").capitalize(), it.replace("_", " ").capitalize()))
        label = en if lang == "en" else es
        attrs = two_lang_attrs(en, es)
        out.append(f'<li class="pill" {attrs}>{esc(label)}</li>')
    return "\n          ".join(out)

def make_page(c, lang="en"):
    slug = c["slug"]
    name = c[f"name_{lang}"]
    summary = c[f"summary_{lang}"]
    other_lang = "es" if lang == "en" else "en"
    name_other = c[f"name_{other_lang}"]
    summary_other = c[f"summary_{other_lang}"]

    region_en, region_es = REGIONS.get(c.get("region", ""), ("Quintana Roo", "Quintana Roo"))
    region_label = region_en if lang == "en" else region_es

    photo = photos.get(slug)
    hero_img_tag = (
        f'<img class="detail-hero-bg" src="../{esc(photo["file"])}" alt="{esc(name)}" fetchpriority="high" />'
        if photo else
        '<div class="detail-hero-bg detail-hero-bg--painted" aria-hidden="true"></div>'
    )
    preload_tag = (
        f'<link rel="preload" as="image" href="../{esc(photo["file"])}" fetchpriority="high" />'
        if photo else ""
    )
    # A gallery is any photo entry carrying 2+ images. Falls back to the
    # single primary when absent, so older single-photo entries are unaffected.
    gallery_imgs = (photo or {}).get("gallery") or ([photo] if photo else [])

    def credit_line(p):
        credit_txt = strip_html(p.get("credit", "Unknown"))
        lic = p.get("license", "")
        src = p.get("source", "")
        if "wikimedia" in src or "wikipedia" in src:
            host = "Wikimedia Commons"
        elif "flickr" in src:
            host = "Flickr"
        else:
            host = "source"
        return (f'{esc(lbl("credit", lang))} {esc(credit_txt)}, {esc(lic)} · '
                f'<a href="{esc(src)}" target="_blank" rel="noreferrer">{host}</a>')

    photo_credit_html = ""
    if gallery_imgs:
        photo_credit_html = "\n      ".join(
            f'<p class="footer-credit">{credit_line(p)}</p>' for p in gallery_imgs
        )

    gallery_html = ""
    if len(gallery_imgs) > 1:
        tiles = "\n          ".join(
            f'<a class="gallery-tile" href="../{esc(p["file"])}" target="_blank" rel="noreferrer">'
            f'<img loading="lazy" decoding="async" src="../{esc(p["file"])}" alt="{esc(name)}" /></a>'
            for p in gallery_imgs
        )
        h_en, h_es = "Photos", "Fotos"
        gallery_html = (
            f'<section class="detail-section">\n'
            f'        <h2 {two_lang_attrs(h_en, h_es)}>{esc(h_en if lang=="en" else h_es)}</h2>\n'
            f'        <div class="detail-gallery">\n          {tiles}\n        </div>\n'
            f'      </section>'
        )

    # At-a-glance pills
    glance = []
    cost_en = cost_text(c, "en")
    cost_es = cost_text(c, "es")
    glance.append(
        '<span class="glance-pill" '
        + two_lang_attrs(f"Entry · {cost_en}", f"Entrada · {cost_es}")
        + '>' + esc(lbl("cost", lang) + " · " + (cost_en if lang == "en" else cost_es)) + '</span>'
    )
    if c.get("hours"):
        hrs = c["hours"]
        glance.append(
            '<span class="glance-pill" '
            + two_lang_attrs(f"Hours · {hrs}", f"Horario · {hrs}")
            + '>' + esc(lbl("hours", lang) + " · " + hrs) + '</span>'
        )
    if c.get("depth_m"):
        d = c["depth_m"]
        glance.append(
            '<span class="glance-pill" '
            + two_lang_attrs(f"Depth · {d}m", f"Profundidad · {d}m")
            + '>' + esc(lbl("depth", lang) + " · " + f"{d}m") + '</span>'
        )
    if c.get("typical_visibility_m"):
        v = c["typical_visibility_m"]
        glance.append(
            '<span class="glance-pill" '
            + two_lang_attrs(f"Viz · ~{v}m", f"Visibilidad · ~{v}m")
            + '>' + esc(lbl("viz", lang) + " · ~" + f"{v}m") + '</span>'
        )

    # Access dl
    access = c.get("access", {}) or {}
    road_en, road_es = ROAD.get(access.get("road"), (access.get("road", "?"), access.get("road", "?")))
    yes_en, no_en = "Yes", "No"
    yes_es, no_es = "Sí", "No"
    def bool_lbl(b):
        if b is True:  return (yes_en, yes_es)
        if b is False: return (no_en, no_es)
        return ("—", "—")

    park_en, park_es = bool_lbl(access.get("parking"))
    coll_en, coll_es = bool_lbl(access.get("collectivo_stops"))
    fwd_en,  fwd_es  = bool_lbl(access.get("four_wd_needed"))
    kid_en,  kid_es  = bool_lbl(c.get("kid_friendly"))
    wch_en,  wch_es  = bool_lbl(c.get("wheelchair"))

    def dl_row(label_key, en_val, es_val):
        en_label, es_label = L[label_key]
        en = en_val if isinstance(en_val, str) else str(en_val)
        es = es_val if isinstance(es_val, str) else str(es_val)
        return (f'<div class="dl-row"><dt {two_lang_attrs(en_label, es_label)}>{esc(en_label if lang=="en" else es_label)}</dt>'
                f'<dd {two_lang_attrs(en, es)}>{esc(en if lang=="en" else es)}</dd></div>')

    access_dl = "\n        ".join([
        dl_row("road",       road_en, road_es),
        dl_row("parking",    park_en, park_es),
        dl_row("collectivo", coll_en, coll_es),
        dl_row("fourwd",     fwd_en,  fwd_es),
        dl_row("kids",       kid_en,  kid_es),
        dl_row("wheelchair", wch_en,  wch_es),
    ])

    activity_pills = render_pill_list(c.get("activities", []), ACTIVITIES, lang)
    amenity_pills  = render_pill_list(c.get("amenities", []),  AMENITIES,  lang)

    skill = c.get("skill_min", "none")
    skill_en, skill_es = SKILLS.get(skill, (skill, skill))

    own = c.get("ownership", "unknown")
    own_en, own_es = OWNERSHIP.get(own, (own, own))

    eco = c.get("eco", {}) or {}
    sun_en, sun_es     = ECO_SUNSCREEN.get(eco.get("sunscreen_rule", "any"), ("Sunscreen rules not posted", "Reglas de bloqueador no publicadas"))
    crowd_en, crowd_es = ECO_CROWD.get(eco.get("crowd_pressure", "medium"), ("", ""))

    # JSON-LD TouristAttraction
    jsonld = {
        "@context": "https://schema.org",
        "@type": "TouristAttraction",
        "name": name,
        "description": summary,
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": c["coords"][0],
            "longitude": c["coords"][1]
        },
        "url": f"{SITE}/cenotes/{slug}.html",
        "address": {"@type": "PostalAddress", "addressCountry": "MX", "addressRegion": "Quintana Roo"},
        "isAccessibleForFree": c.get("cost_mxn") == 0,
        "publicAccess": True
    }
    if photo:
        jsonld["image"] = f"{SITE}/{photo['file']}"

    title_en = f"{c['name_en']} — Riviera Maya cenote guide"
    title_es = f"{c['name_es']} — Guía de cenotes de la Riviera Maya"
    desc_en = strip_html(c["summary_en"])[:155]
    desc_es = strip_html(c["summary_es"])[:155]

    no_photo_notice = ""
    if not photo:
        en, es = L["no_photo"]
        no_photo_notice = f'<p class="no-photo-notice" {two_lang_attrs(en, es)}>{esc(en if lang=="en" else es)}</p>'

    eco_lines = [esc(sun_en if lang == "en" else sun_es)]
    if crowd_en:
        eco_lines.append(esc(crowd_en if lang == "en" else crowd_es))

    page = f"""<!DOCTYPE html>
<html lang="{lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{esc(title_en if lang == "en" else title_es)}</title>
    <meta name="description" content="{esc(desc_en if lang == "en" else desc_es)}" />
    <link rel="canonical" href="{SITE}/cenotes/{slug}.html" />
    <link rel="alternate" hreflang="en" href="{SITE}/cenotes/{slug}.html" />
    <link rel="alternate" hreflang="es" href="{SITE}/cenotes/{slug}.html?lang=es" />
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💧</text></svg>" />
    <link rel="manifest" href="../manifest.webmanifest?v=10" />
    <meta name="theme-color" content="#0a8a9e" />

    <meta property="og:type" content="article" />
    <meta property="og:title" content="{esc(title_en if lang == "en" else title_es)}" />
    <meta property="og:description" content="{esc(desc_en if lang == "en" else desc_es)}" />
    <meta property="og:url" content="{SITE}/cenotes/{slug}.html" />
    {f'<meta property="og:image" content="{SITE}/{photo["file"]}" />' if photo else ""}

    <script type="application/ld+json">
{json.dumps(jsonld, indent=2, ensure_ascii=False)}
    </script>

    {preload_tag}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,800&family=Manrope:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="../styles.css?v=10" />
  </head>
  <body>
    <header class="detail-hero">
      {hero_img_tag}
      <div class="detail-hero-overlay" aria-hidden="true"></div>
      <div class="detail-hero-content">
        <a class="back-link" href="../" {two_lang_attrs("← " + L["back"][0], "← " + L["back"][1])}>← {esc(lbl("back", lang))}</a>
        <p class="detail-eyebrow" {two_lang_attrs(region_en, region_es)}>{esc(region_label)}</p>
        <h1 class="detail-title" {two_lang_attrs(c["name_en"], c["name_es"])}>{esc(name)}</h1>
        <div class="detail-quick">
          {chr(10).join(["          " + g for g in glance])}
        </div>
      </div>
    </header>

    <main class="detail-shell">
      <p class="lead" {two_lang_attrs(summary_other if lang == "es" else summary, summary if lang == "es" else summary_other)}>{esc(summary)}</p>

      {no_photo_notice}

      {gallery_html}

      <section class="detail-section">
        <h2 {two_lang_attrs(L["h_activities"][0], L["h_activities"][1])}>{esc(lbl("h_activities", lang))}</h2>
        <ul class="pill-list">
          {activity_pills}
        </ul>
        <p class="skill-note" {two_lang_attrs(skill_en, skill_es)}><strong>{esc(lbl("h_skill", lang))}:</strong> {esc(skill_en if lang == "en" else skill_es)}</p>
      </section>

      <section class="detail-section">
        <h2 {two_lang_attrs(L["h_access"][0], L["h_access"][1])}>{esc(lbl("h_access", lang))}</h2>
        <dl class="detail-grid">
        {access_dl}
        </dl>
      </section>

      <section class="detail-section">
        <h2 {two_lang_attrs(L["h_amenities"][0], L["h_amenities"][1])}>{esc(lbl("h_amenities", lang))}</h2>
        <ul class="pill-list">
          {amenity_pills if amenity_pills else '<li class="pill" data-en="None listed" data-es="No se listan">None listed</li>'}
        </ul>
      </section>

      <section class="detail-section">
        <h2 {two_lang_attrs(L["h_cost"][0], L["h_cost"][1])}>{esc(lbl("h_cost", lang))}</h2>
        <p {two_lang_attrs("Entry " + cost_en + " · " + own_en, "Entrada " + cost_es + " · " + own_es)}>
          {esc(lbl("cost", lang) + " " + (cost_en if lang == "en" else cost_es) + " · " + (own_en if lang == "en" else own_es))}
        </p>
      </section>

      <section class="detail-section">
        <h2 {two_lang_attrs(L["h_eco"][0], L["h_eco"][1])}>{esc(lbl("h_eco", lang))}</h2>
        <ul class="eco-list">
          {chr(10).join(["          <li>" + line + "</li>" for line in eco_lines])}
        </ul>
      </section>

      <section class="detail-section">
        <h2 {two_lang_attrs(L["h_map"][0], L["h_map"][1])}>{esc(lbl("h_map", lang))}</h2>
        <div id="mini-map"
             class="mini-map"
             data-lat="{c['coords'][0]}"
             data-lng="{c['coords'][1]}"
             data-name="{esc(name)}"></div>
      </section>
    </main>

    <footer class="footer">
      <p {two_lang_attrs(L["footer_eco"][0], L["footer_eco"][1])}>{esc(lbl("footer_eco", lang))}</p>
      {photo_credit_html}
    </footer>

    <script>
      // Tiny inline lang-switch + lazy mini-map. Keeps detail pages
      // self-contained — no extra app.js dependency.
      (() => {{
        const url = new URL(location.href);
        const lang = (url.searchParams.get("lang") || navigator.language || "en").toLowerCase().startsWith("es") ? "es" : "en";
        if (lang !== "{lang}") {{
          document.documentElement.lang = lang;
          document.querySelectorAll("[data-" + lang + "]").forEach(el => {{
            const v = el.getAttribute("data-" + lang);
            if (v) {{ el.textContent = v; }}
          }});
        }}

        // Lazy-load MapLibre for the single-cenote mini map
        const m = document.getElementById("mini-map");
        if (!m || !("IntersectionObserver" in window)) return;
        const io = new IntersectionObserver((entries) => {{
          if (!entries.some(e => e.isIntersecting)) return;
          io.disconnect();
          const css = document.createElement("link");
          css.rel = "stylesheet";
          css.href = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
          document.head.appendChild(css);
          const s = document.createElement("script");
          s.src = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
          s.onload = () => {{
            const lat = parseFloat(m.dataset.lat);
            const lng = parseFloat(m.dataset.lng);
            const map = new maplibregl.Map({{
              container: m,
              style: "https://tiles.openfreemap.org/styles/positron",
              center: [lng, lat],
              zoom: 12,
              attributionControl: {{ compact: true }}
            }});
            map.addControl(new maplibregl.NavigationControl({{ showCompass: false }}), "top-right");
            const el = document.createElement("div");
            el.style.cssText = "width:20px;height:20px;border-radius:50%;background:#0a8a9e;border:3px solid #fff;box-shadow:0 2px 8px rgba(10,28,38,0.4);";
            new maplibregl.Marker({{ element: el }}).setLngLat([lng, lat]).addTo(map);
          }};
          document.head.appendChild(s);
        }}, {{ rootMargin: "200px" }});
        io.observe(m);
      }})();
    </script>
  </body>
</html>
"""
    return page

# ── Generate pages ────────────────────────────────────────────────
print(f"Generating {len(cenotes)} detail pages …")
for c in cenotes:
    out = OUT_DIR / f"{c['slug']}.html"
    out.write_text(make_page(c, lang="en"), encoding="utf-8")
    print(f"  {c['slug']:24s} -> {out.relative_to(ROOT)}")

# ── Sitemap ───────────────────────────────────────────────────────
urls = [f"{SITE}/"] + [f"{SITE}/cenotes/{c['slug']}.html" for c in cenotes]
sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u in urls:
    sitemap.append(f"  <url><loc>{u}</loc></url>")
sitemap.append("</urlset>")
(ROOT / "sitemap.xml").write_text("\n".join(sitemap) + "\n", encoding="utf-8")
(ROOT / "robots.txt").write_text(
    f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n", encoding="utf-8"
)
print(f"\nWrote sitemap.xml ({len(urls)} URLs) + robots.txt")

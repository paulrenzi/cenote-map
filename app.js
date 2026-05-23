(() => {
  "use strict";

  const I18N = {
    en: {
      "hero.eyebrow": "Riviera Maya · Quintana Roo",
      "hero.title": "Riviera Maya<br />Cenotes",
      "hero.tagline": "A trip planner for the open swims, snorkel caverns, and dive sites that ring Cancún, Playa, Akumal, and Tulum. Filter by what you want to do, sort by distance from where you’re staying, and trust the current price & hours.",
      "strip.base": "Staying in",
      "strip.activity": "I want to",
      "strip.kids": "Kid-friendly only",
      "activity.any": "Anything",
      "activity.swim": "Swim",
      "activity.snorkel": "Snorkel",
      "activity.cavern_dive": "Cavern dive",
      "activity.cave_dive": "Cave dive (cert)",
      "activity.cliff_jump": "Cliff jump",
      "results.headline": "Cenotes near you",
      "results.count": (n) => `${n} cenote${n === 1 ? "" : "s"} · sorted by drive time`,
      "results.empty": "No cenotes match those filters. Try widening the activity or turning off kid-friendly.",
      "card.km": (km) => `${km} km · ~${minutesDrive(km)} min`,
      "card.cost.free": "Free",
      "card.cost.mxn": (p) => `$${p} MXN`,
      "card.cost.unknown": "Price n/a",
      "card.skill.swimmer": "Swimmer",
      "card.skill.cavern_cert": "Cavern cert",
      "card.skill.cave_cert": "Cave cert",
      "card.kids": "Kid-friendly",
      "card.verified": (d) => `Verified ${d}`,
      "support.eyebrow": "Plan the day",
      "support.body": "Cenote Map is a free, independent planner built by Akumal locals. Booking with our partner businesses keeps it online and ad-free.",
      "footer.text": "Cenotes are sacred to the Maya and fragile freshwater systems — skip the sunscreen, take your trash with you, and tip the local crew."
    },
    es: {
      "hero.eyebrow": "Riviera Maya · Quintana Roo",
      "hero.title": "Cenotes de la<br />Riviera Maya",
      "hero.tagline": "Un planificador para los nados, snorkel en caverna y sitios de buceo de Cancún a Tulum. Filtra por actividad, ordena por distancia desde donde te hospedas, y confía en los precios y horarios actuales.",
      "strip.base": "Te hospedas en",
      "strip.activity": "Quiero",
      "strip.kids": "Solo para niños",
      "activity.any": "Cualquier cosa",
      "activity.swim": "Nadar",
      "activity.snorkel": "Hacer snorkel",
      "activity.cavern_dive": "Buceo de caverna",
      "activity.cave_dive": "Buceo de cueva (cert)",
      "activity.cliff_jump": "Saltar de altura",
      "results.headline": "Cenotes cerca de ti",
      "results.count": (n) => `${n} cenote${n === 1 ? "" : "s"} · ordenados por tiempo`,
      "results.empty": "Ningún cenote coincide. Prueba ampliando la actividad o quitando «solo para niños».",
      "card.km": (km) => `${km} km · ~${minutesDrive(km)} min`,
      "card.cost.free": "Gratis",
      "card.cost.mxn": (p) => `$${p} MXN`,
      "card.cost.unknown": "Precio n/d",
      "card.skill.swimmer": "Nadador",
      "card.skill.cavern_cert": "Cert. caverna",
      "card.skill.cave_cert": "Cert. cueva",
      "card.kids": "Para niños",
      "card.verified": (d) => `Verificado ${d}`,
      "support.eyebrow": "Planea el día",
      "support.body": "Cenote Map es un planificador gratuito e independiente hecho por locales de Akumal. Reservar con nuestros socios lo mantiene en línea y sin anuncios.",
      "footer.text": "Los cenotes son sagrados para los mayas y sistemas de agua dulce frágiles — no uses bloqueador, llévate tu basura, y propina al equipo local."
    }
  };

  const params = new URLSearchParams(location.search);
  const langPref = (params.get("lang") || navigator.language || "en").toLowerCase().startsWith("es") ? "es" : "en";
  const t = (key, ...args) => {
    const entry = I18N[langPref][key] ?? I18N.en[key] ?? key;
    return typeof entry === "function" ? entry(...args) : entry;
  };

  function applyI18n() {
    document.documentElement.lang = langPref;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = I18N[langPref][key] ?? I18N.en[key];
      if (typeof val === "string") el.innerHTML = val;
    });
    document.getElementById("lang-en")?.classList.toggle("is-active", langPref === "en");
    document.getElementById("lang-es")?.classList.toggle("is-active", langPref === "es");
  }

  // ── Geometry ───────────────────────────────────────────────────
  const R_KM = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  function haversineKm(a, b) {
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
    return 2 * R_KM * Math.asin(Math.sqrt(s));
  }
  function minutesDrive(km) {
    // Federal 307 cruise ~75 km/h between hubs; multiply by 1.25 for stops/access roads.
    return Math.max(5, Math.round((km / 75) * 60 * 1.25));
  }

  // ── State ──────────────────────────────────────────────────────
  const state = {
    cenotes: [],
    bases: [],
    baseId: null,
    activity: "",
    kidsOnly: false,
    map: null,
    markers: []
  };

  // ── Data load ──────────────────────────────────────────────────
  async function loadData() {
    const [cRes, bRes] = await Promise.all([
      fetch("data/cenotes.json"),
      fetch("data/bases.json")
    ]);
    state.cenotes = (await cRes.json()).cenotes;
    state.bases = (await bRes.json()).bases;
  }

  // ── Filter + sort ──────────────────────────────────────────────
  function visibleCenotes() {
    const base = state.bases.find((b) => b.id === state.baseId);
    const baseCoords = base?.coords;
    return state.cenotes
      .filter((c) => {
        if (state.activity && !c.activities.includes(state.activity)) return false;
        if (state.kidsOnly && !c.kid_friendly) return false;
        return true;
      })
      .map((c) => ({
        ...c,
        _km: baseCoords ? haversineKm(baseCoords, c.coords) : null
      }))
      .sort((a, b) => {
        if (a._km == null && b._km == null) return a.name_en.localeCompare(b.name_en);
        if (a._km == null) return 1;
        if (b._km == null) return -1;
        return a._km - b._km;
      });
  }

  // ── Render: base selector ──────────────────────────────────────
  function renderBases() {
    const sel = document.getElementById("base-select");
    sel.innerHTML = "";
    state.bases.forEach((b) => {
      const opt = document.createElement("option");
      opt.value = b.id;
      opt.textContent = langPref === "es" ? b.label_es : b.label_en;
      sel.appendChild(opt);
    });
    sel.value = state.baseId || state.bases[0].id;
    state.baseId = sel.value;
  }

  // ── Render: cards ──────────────────────────────────────────────
  function freshnessClass(verifiedISO) {
    if (!verifiedISO) return "stale";
    const ageDays = (Date.now() - new Date(verifiedISO).getTime()) / 86400000;
    if (ageDays < 90) return "";
    if (ageDays < 180) return "warn";
    return "stale";
  }

  function costLabel(c) {
    if (c.cost_mxn === 0) return t("card.cost.free");
    if (c.cost_mxn == null) return t("card.cost.unknown");
    return t("card.cost.mxn", c.cost_mxn);
  }

  function skillPill(c) {
    if (c.skill_min === "cave_cert") return `<span class="meta-pill skill">${t("card.skill.cave_cert")}</span>`;
    if (c.skill_min === "cavern_cert") return `<span class="meta-pill skill">${t("card.skill.cavern_cert")}</span>`;
    if (c.skill_min === "swimmer") return `<span class="meta-pill skill">${t("card.skill.swimmer")}</span>`;
    return "";
  }

  function renderCards() {
    const list = visibleCenotes();
    const wrap = document.getElementById("cards");
    const counter = document.getElementById("result-count");
    counter.textContent = t("results.count", list.length);

    if (list.length === 0) {
      wrap.innerHTML = `<div class="empty-state">${t("results.empty")}</div>`;
    } else {
      wrap.innerHTML = list.map((c) => {
        const name = langPref === "es" ? c.name_es : c.name_en;
        const summary = langPref === "es" ? c.summary_es : c.summary_en;
        const dist = c._km != null
          ? `<div class="card-distance">${t("card.km", c._km.toFixed(0))}</div>`
          : "";
        const kids = c.kid_friendly
          ? `<span class="meta-pill kids">${t("card.kids")}</span>` : "";
        const activities = c.activities.slice(0, 3).map((a) =>
          `<span class="meta-pill">${t("activity." + a)}</span>`).join("");
        const verified = c.verified
          ? `<span class="verified"><span class="verified-dot ${freshnessClass(c.verified)}"></span>${t("card.verified", c.verified)}</span>`
          : "";
        return `
          <article class="cenote-card">
            <div class="card-top">
              <h3 class="card-name">${name}</h3>
              ${dist}
            </div>
            <p class="card-summary">${summary}</p>
            <div class="card-meta">
              ${activities}
              ${skillPill(c)}
              ${kids}
              <span class="meta-pill cost">${costLabel(c)}</span>
            </div>
            <div class="card-foot">${verified}</div>
          </article>`;
      }).join("");
    }

    renderMarkers(list);
  }

  // ── Map (lazy-loaded) ──────────────────────────────────────────
  function loadMapLibre() {
    return new Promise((resolve, reject) => {
      if (window.maplibregl) return resolve(window.maplibregl);
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
      document.head.appendChild(css);
      const script = document.createElement("script");
      script.src = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
      script.onload = () => resolve(window.maplibregl);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function initMap() {
    const container = document.getElementById("map");
    container.innerHTML = `<div class="map-placeholder">Loading map…</div>`;
    try {
      const maplibregl = await loadMapLibre();
      container.innerHTML = "";
      state.map = new maplibregl.Map({
        container,
        style: "https://tiles.openfreemap.org/styles/positron",
        center: [-87.4, 20.4],
        zoom: 9.2,
        attributionControl: { compact: true }
      });
      state.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      state.map.on("load", () => renderMarkers(visibleCenotes()));
    } catch (e) {
      container.innerHTML = `<div class="map-placeholder">Map unavailable offline.</div>`;
    }
  }

  function renderMarkers(list) {
    if (!state.map || !window.maplibregl) return;
    state.markers.forEach((m) => m.remove());
    state.markers = [];

    list.forEach((c) => {
      const el = document.createElement("div");
      el.style.cssText = `
        width:18px;height:18px;border-radius:50%;
        background:#0a8a9e;border:3px solid #fff;
        box-shadow:0 2px 8px rgba(10,28,38,0.35);cursor:pointer;`;
      const name = langPref === "es" ? c.name_es : c.name_en;
      const popup = new window.maplibregl.Popup({ offset: 14, closeButton: false })
        .setHTML(`<strong>${name}</strong>${costLabel(c)}`);
      const marker = new window.maplibregl.Marker({ element: el })
        .setLngLat([c.coords[1], c.coords[0]])
        .setPopup(popup)
        .addTo(state.map);
      state.markers.push(marker);
    });

    const base = state.bases.find((b) => b.id === state.baseId);
    if (base) {
      const el = document.createElement("div");
      el.style.cssText = `
        width:14px;height:14px;border-radius:50%;
        background:#fff;border:3px solid #b14a3b;
        box-shadow:0 2px 6px rgba(10,28,38,0.4);`;
      const baseMarker = new window.maplibregl.Marker({ element: el })
        .setLngLat([base.coords[1], base.coords[0]])
        .addTo(state.map);
      state.markers.push(baseMarker);
    }
  }

  // ── Wire up ────────────────────────────────────────────────────
  function wireControls() {
    document.getElementById("base-select").addEventListener("change", (e) => {
      state.baseId = e.target.value;
      renderCards();
    });
    document.getElementById("activity-select").addEventListener("change", (e) => {
      state.activity = e.target.value;
      renderCards();
    });
    document.getElementById("kid-toggle").addEventListener("change", (e) => {
      state.kidsOnly = e.target.checked;
      renderCards();
    });

    const btn = document.getElementById("back-to-top");
    window.addEventListener("scroll", () => {
      btn.classList.toggle("is-visible", window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  function lazyLoadMapOnScroll() {
    const mapEl = document.getElementById("map");
    if (!mapEl || !("IntersectionObserver" in window)) {
      initMap();
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        initMap();
      }
    }, { rootMargin: "200px" });
    io.observe(mapEl);
  }

  async function start() {
    applyI18n();
    await loadData();
    renderBases();
    wireControls();
    renderCards();
    lazyLoadMapOnScroll();

    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }

  document.addEventListener("DOMContentLoaded", start);
})();

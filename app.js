(() => {
  "use strict";

  // ── Config — fill in after `wrangler deploy` & Turnstile site creation.
  // Leave both empty to ship the static planner without the conditions backend.
  const CONFIG = {
    API_BASE: "",            // e.g. "https://cenote-conditions.<acct>.workers.dev"
    TURNSTILE_SITE_KEY: ""   // e.g. "0x4AAA..."  (public, fine to commit)
  };

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
      "activity.zip_line": "Zip line",
      "activity.rappel": "Rappel",
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
      "card.report": "Report",
      "card.cond.low":    (d) => `Quiet · ${d}d ago`,
      "card.cond.medium": (d) => `Busy · ${d}d ago`,
      "card.cond.high":   (d) => `Packed · ${d}d ago`,
      "card.cond.viz":    (m) => ` · viz ${m}m`,
      "report.eyebrow": "Report conditions",
      "report.titlePrefix": "Conditions at",
      "report.crowd": "Crowd level",
      "report.crowd.pick": "Pick one…",
      "report.crowd.low": "Low — mostly empty",
      "report.crowd.medium": "Medium — busy but OK",
      "report.crowd.high": "High — packed",
      "report.visibility": "Visibility (m, optional)",
      "report.clarity": "Water clarity (optional)",
      "report.clarity.none": "Not sure",
      "report.clarity.clear": "Clear",
      "report.clarity.cloudy": "Cloudy",
      "report.notes": "Notes (optional, 200 chars)",
      "report.name": "Your name (optional)",
      "report.cancel": "Cancel",
      "report.submit": "Submit report",
      "report.ok": "Thanks — your report is live.",
      "report.err": "Something went wrong. Try again.",
      "report.rate": "You've sent a few reports recently — please wait an hour.",
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
      "activity.zip_line": "Tirolesa",
      "activity.rappel": "Rappel",
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
      "card.report": "Reportar",
      "card.cond.low":    (d) => `Tranquilo · hace ${d}d`,
      "card.cond.medium": (d) => `Concurrido · hace ${d}d`,
      "card.cond.high":   (d) => `Lleno · hace ${d}d`,
      "card.cond.viz":    (m) => ` · viz ${m}m`,
      "report.eyebrow": "Reportar condiciones",
      "report.titlePrefix": "Condiciones en",
      "report.crowd": "Nivel de gente",
      "report.crowd.pick": "Elige…",
      "report.crowd.low": "Bajo — casi vacío",
      "report.crowd.medium": "Medio — con gente pero bien",
      "report.crowd.high": "Alto — lleno",
      "report.visibility": "Visibilidad (m, opcional)",
      "report.clarity": "Claridad del agua (opcional)",
      "report.clarity.none": "No sé",
      "report.clarity.clear": "Clara",
      "report.clarity.cloudy": "Turbia",
      "report.notes": "Notas (opcional, 200 caracteres)",
      "report.name": "Tu nombre (opcional)",
      "report.cancel": "Cancelar",
      "report.submit": "Enviar reporte",
      "report.ok": "Gracias — tu reporte está en vivo.",
      "report.err": "Algo salió mal. Inténtalo de nuevo.",
      "report.rate": "Has enviado varios reportes recientemente — espera una hora.",
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
    markers: [],
    conditions: {},        // slug -> latest condition record
    photos: {},            // slug -> { file, credit, license, source }
    turnstileLoaded: false,
    turnstileWidgetId: null
  };

  // ── Data load ──────────────────────────────────────────────────
  async function loadData() {
    const [cRes, bRes, pRes] = await Promise.all([
      fetch("data/cenotes.json"),
      fetch("data/bases.json"),
      fetch("data/photos.json").catch(() => null)
    ]);
    state.cenotes = (await cRes.json()).cenotes;
    state.bases = (await bRes.json()).bases;
    if (pRes && pRes.ok) state.photos = await pRes.json();
  }

  async function loadConditions() {
    if (!CONFIG.API_BASE) return;
    try {
      const res = await fetch(`${CONFIG.API_BASE}/conditions/recent`);
      if (!res.ok) return;
      const data = await res.json();
      state.conditions = {};
      for (const c of (data.conditions || [])) {
        state.conditions[c.cenote_slug] = c;
      }
    } catch { /* offline / cors / down — degrade silently */ }
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

  function conditionPill(slug) {
    const c = state.conditions[slug];
    if (!c) return "";
    const ageDays = Math.max(1, Math.round((Date.now() / 1000 - c.reported_at) / 86400));
    const vizSuffix = c.visibility_m ? t("card.cond.viz", c.visibility_m) : "";
    const label = t("card.cond." + c.crowd_level, ageDays) + vizSuffix;
    return `<span class="meta-pill cond ${c.crowd_level}">${escapeHtml(label)}</span>`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
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
        const reportBtn = CONFIG.API_BASE
          ? `<button type="button" class="report-btn" data-report-slug="${escapeHtml(c.slug)}" data-report-name="${escapeHtml(name)}">${t("card.report")}</button>`
          : "";
        const photo = state.photos[c.slug];
        const media = photo
          ? `<a class="card-media" href="${escapeHtml(photo.source || photo.file)}" target="_blank" rel="noreferrer">
               <img loading="lazy" decoding="async" src="${escapeHtml(photo.file)}" alt="${escapeHtml(name)}" />
             </a>`
          : `<div class="card-media card-media--painted" aria-hidden="true"></div>`;
        return `
          <article class="cenote-card">
            ${media}
            <div class="card-body">
              <div class="card-top">
                <h3 class="card-name">${escapeHtml(name)}</h3>
                ${dist}
              </div>
              <p class="card-summary">${escapeHtml(summary)}</p>
              <div class="card-meta">
                ${conditionPill(c.slug)}
                ${activities}
                ${skillPill(c)}
                ${kids}
                <span class="meta-pill cost">${costLabel(c)}</span>
              </div>
              <div class="card-foot">${verified}${reportBtn}</div>
            </div>
          </article>`;
      }).join("");

      wrap.querySelectorAll("[data-report-slug]").forEach((btn) => {
        btn.addEventListener("click", () => openReportModal(btn.dataset.reportSlug, btn.dataset.reportName));
      });
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
        // Wide default that frames the whole Riviera Maya corridor
        // (Cancún → Tulum → Cobá → Chichén Itzá) until first render fits bounds
        bounds: [[-88.7, 20.0], [-86.7, 21.2]],
        fitBoundsOptions: { padding: 36 },
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

    const pts = [];

    list.forEach((c) => {
      const el = document.createElement("div");
      el.style.cssText = `
        width:18px;height:18px;border-radius:50%;
        background:#0a8a9e;border:3px solid #fff;
        box-shadow:0 2px 8px rgba(10,28,38,0.35);cursor:pointer;`;
      const name = langPref === "es" ? c.name_es : c.name_en;
      const popup = new window.maplibregl.Popup({ offset: 14, closeButton: false })
        .setHTML(`<strong>${escapeHtml(name)}</strong>${costLabel(c)}`);
      const lngLat = [c.coords[1], c.coords[0]];
      const marker = new window.maplibregl.Marker({ element: el })
        .setLngLat(lngLat)
        .setPopup(popup)
        .addTo(state.map);
      state.markers.push(marker);
      pts.push(lngLat);
    });

    const base = state.bases.find((b) => b.id === state.baseId);
    if (base) {
      const el = document.createElement("div");
      el.style.cssText = `
        width:14px;height:14px;border-radius:50%;
        background:#fff;border:3px solid #b14a3b;
        box-shadow:0 2px 6px rgba(10,28,38,0.4);`;
      const lngLat = [base.coords[1], base.coords[0]];
      const baseMarker = new window.maplibregl.Marker({ element: el })
        .setLngLat(lngLat)
        .addTo(state.map);
      state.markers.push(baseMarker);
      pts.push(lngLat);
    }

    if (pts.length >= 2) {
      const lngs = pts.map((p) => p[0]);
      const lats = pts.map((p) => p[1]);
      state.map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: 48, maxZoom: 12, duration: 600 }
      );
    } else if (pts.length === 1) {
      state.map.flyTo({ center: pts[0], zoom: 12, duration: 600 });
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

    // Modal close handlers
    document.querySelectorAll("[data-close-modal]").forEach((el) => {
      el.addEventListener("click", closeReportModal);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeReportModal();
    });

    document.getElementById("report-form")?.addEventListener("submit", submitReport);
  }

  // ── Report modal + Turnstile ───────────────────────────────────
  function loadTurnstile() {
    return new Promise((resolve) => {
      if (state.turnstileLoaded || !CONFIG.TURNSTILE_SITE_KEY) return resolve();
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.defer = true;
      s.onload = () => { state.turnstileLoaded = true; resolve(); };
      document.head.appendChild(s);
    });
  }

  async function openReportModal(slug, name) {
    const modal = document.getElementById("report-modal");
    const form  = document.getElementById("report-form");
    const status = document.getElementById("report-status");
    form.reset();
    status.textContent = "";
    status.className = "modal-status";
    document.getElementById("report-cenote-name").textContent = name;
    form.dataset.slug = slug;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    if (CONFIG.TURNSTILE_SITE_KEY) {
      await loadTurnstile();
      const slot = document.getElementById("turnstile-slot");
      slot.innerHTML = "";
      if (window.turnstile) {
        state.turnstileWidgetId = window.turnstile.render(slot, {
          sitekey: CONFIG.TURNSTILE_SITE_KEY,
          size: "flexible"
        });
      }
    }
  }

  function closeReportModal() {
    const modal = document.getElementById("report-modal");
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    if (state.turnstileWidgetId != null && window.turnstile) {
      try { window.turnstile.remove(state.turnstileWidgetId); } catch {}
      state.turnstileWidgetId = null;
    }
  }

  async function submitReport(e) {
    e.preventDefault();
    const form = e.target;
    const status = document.getElementById("report-status");
    const submitBtn = form.querySelector('button[type="submit"]');

    const fd = new FormData(form);
    const body = {
      cenote_slug: form.dataset.slug,
      crowd_level: fd.get("crowd_level") || "",
      visibility_m: fd.get("visibility_m") ? Number(fd.get("visibility_m")) : null,
      water_clarity: fd.get("water_clarity") || null,
      notes: fd.get("notes") || null,
      contributor_name: fd.get("contributor_name") || null
    };

    if (!body.crowd_level) {
      status.textContent = t("report.err");
      status.className = "modal-status err";
      return;
    }

    if (CONFIG.TURNSTILE_SITE_KEY && window.turnstile && state.turnstileWidgetId != null) {
      const token = window.turnstile.getResponse(state.turnstileWidgetId);
      if (!token) {
        status.textContent = t("report.err");
        status.className = "modal-status err";
        return;
      }
      body.turnstile_token = token;
    }

    submitBtn.disabled = true;
    try {
      const res = await fetch(`${CONFIG.API_BASE}/conditions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const now = Math.floor(Date.now() / 1000);
        state.conditions[body.cenote_slug] = {
          cenote_slug: body.cenote_slug,
          crowd_level: body.crowd_level,
          visibility_m: body.visibility_m,
          reported_at: now
        };
        status.textContent = t("report.ok");
        status.className = "modal-status ok";
        renderCards();
        setTimeout(closeReportModal, 1200);
      } else if (res.status === 429) {
        status.textContent = t("report.rate");
        status.className = "modal-status err";
      } else {
        status.textContent = t("report.err");
        status.className = "modal-status err";
      }
    } catch {
      status.textContent = t("report.err");
      status.className = "modal-status err";
    } finally {
      submitBtn.disabled = false;
    }
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
    loadConditions().then(() => renderCards());

    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }

  document.addEventListener("DOMContentLoaded", start);
})();

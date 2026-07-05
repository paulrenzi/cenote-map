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
      "strip.search": "Search",
      "strip.searchPlaceholder": "Name, activity, or place…",
      "results.emptySearch": "No cenotes match your search. Try fewer words or a different spelling.",
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
      "card.transit.collectivo": "Colectivo — cheapest, flag one down on the highway",
      "card.transit.taxi": "Taxi from town — easy paved drive-in",
      "card.transit.dirt": "Taxi or tour van — unpaved access road",
      "card.transit.4wd": "Private driver or 4×4 — regular taxis can't reach it",
      "card.transit.guided": "Book a tour or driver — guided entry only",
      "card.sunscreen.bio": "Biodegradable sunscreen only",
      "card.sunscreen.none": "No sunscreen allowed",
      "card.verified": (d) => `Verified ${d}`,
      "card.report": "Report",
      "card.photoSoon": "Photo coming soon",
      "card.open.now":    (close) => `Open now · closes ${close}`,
      "card.open.closed": (open) => `Closed · opens ${open}`,
      "card.crowd.high": "Fills up by 10am — go early",
      "locate.btn": "Closest to me",
      "locate.active": "Sorted by you",
      "locate.locating": "Locating…",
      "locate.denied": "Turn on location to sort by you",
      "results.countMe": (n) => `${n} cenote${n === 1 ? "" : "s"} · closest to you`,
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
      "footer.text": "Cenotes are sacred to the Maya and fragile freshwater systems — skip the sunscreen, take your trash with you, and tip the local crew.",
      "plan.add": "Add to day",
      "plan.added": "In your day",
      "plan.full": "Day is full (3)",
      "plan.title": "Your day",
      "plan.stops": (n) => `${n} stop${n === 1 ? "" : "s"}`,
      "plan.costTotal": "Entry total",
      "plan.costFrom": (p) => `$${p} MXN`,
      "plan.costUnknown": (n) => ` · +${n} priced on-site`,
      "plan.costNone": "Priced on-site",
      "plan.drive": "Drive",
      "plan.driveMin": (m) => `~${m} min`,
      "plan.view": "View itinerary",
      "plan.viewOne": "Get directions",
      "plan.clear": "Clear",
      "plan.remove": "Remove",
      "plan.moveUp": "Move up",
      "plan.moveDown": "Move down",
      "plan.share": "Copy share link",
      "plan.shared": "Link copied",
      "itin.email": "Email me this",
      "plan.far": "Heads up — these stops are spread far apart for one day.",
      "plan.minimize": "Minimize",
      "plan.expand": "Expand",
      "card.directions": "Directions",
      "itin.title": "Your cenote day",
      "itin.routeFrom": (b) => `Route from ${b}`,
      "itin.leg": (m) => `${m} min drive`,
      "itin.legStart": (b, m) => `${m} min from ${b}`,
      "itin.totalDrive": "Total driving",
      "itin.totalCost": "Entry total",
      "itin.onSite": (n) => `${n} stop${n === 1 ? "" : "s"} priced on-site`,
      "itin.partners": "Make it easy",
      "itin.close": "Close",
      "itin.openMaps": "Preview whole route",
      "itin.navStop": "Navigate here",
      "itin.upNext": "Up next",
      "itin.markDone": "Mark done",
      "itin.done": "Done",
      "itin.allDone": "All stops done — enjoy the day!",
      "plan.upNextTray": "Up next",
      "itin.prepHeading": "Before you go",
      "itin.prepBio": "Bring biodegradable sunscreen — required at some stops.",
      "itin.prepNoSun": "Sunscreen isn't allowed at some stops — rinse off before entry.",
      "itin.prepCar": "No colectivo stop at one or more of these — plan a car, taxi, or tour."
    },
    es: {
      "hero.eyebrow": "Riviera Maya · Quintana Roo",
      "hero.title": "Cenotes de la<br />Riviera Maya",
      "hero.tagline": "Un planificador para los nados, snorkel en caverna y sitios de buceo de Cancún a Tulum. Filtra por actividad, ordena por distancia desde donde te hospedas, y confía en los precios y horarios actuales.",
      "strip.base": "Te hospedas en",
      "strip.activity": "Quiero",
      "strip.kids": "Solo para niños",
      "strip.search": "Buscar",
      "strip.searchPlaceholder": "Nombre, actividad o lugar…",
      "results.emptySearch": "Ningún cenote coincide con tu búsqueda. Prueba con menos palabras u otra ortografía.",
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
      "card.transit.collectivo": "Colectivo — lo más barato, detenlo en la carretera",
      "card.transit.taxi": "Taxi desde el pueblo — entrada pavimentada fácil",
      "card.transit.dirt": "Taxi o van de tour — camino de terracería",
      "card.transit.4wd": "Chofer privado o 4×4 — un taxi normal no llega",
      "card.transit.guided": "Reserva un tour o chofer — solo entrada guiada",
      "card.sunscreen.bio": "Solo bloqueador biodegradable",
      "card.sunscreen.none": "Bloqueador prohibido",
      "card.verified": (d) => `Verificado ${d}`,
      "card.report": "Reportar",
      "card.photoSoon": "Foto próximamente",
      "card.open.now":    (close) => `Abierto · cierra ${close}`,
      "card.open.closed": (open) => `Cerrado · abre ${open}`,
      "card.crowd.high": "Se llena para las 10am — ve temprano",
      "locate.btn": "Más cerca de mí",
      "locate.active": "Ordenado por ti",
      "locate.locating": "Ubicando…",
      "locate.denied": "Activa la ubicación para ordenar por ti",
      "results.countMe": (n) => `${n} cenote${n === 1 ? "" : "s"} · más cercanos a ti`,
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
      "footer.text": "Los cenotes son sagrados para los mayas y sistemas de agua dulce frágiles — no uses bloqueador, llévate tu basura, y propina al equipo local.",
      "plan.add": "Añadir al día",
      "plan.added": "En tu día",
      "plan.full": "Día lleno (3)",
      "plan.title": "Tu día",
      "plan.stops": (n) => `${n} parada${n === 1 ? "" : "s"}`,
      "plan.costTotal": "Total entradas",
      "plan.costFrom": (p) => `$${p} MXN`,
      "plan.costUnknown": (n) => ` · +${n} con precio en sitio`,
      "plan.costNone": "Precio en sitio",
      "plan.drive": "Carretera",
      "plan.driveMin": (m) => `~${m} min`,
      "plan.view": "Ver itinerario",
      "plan.viewOne": "Cómo llegar",
      "plan.clear": "Limpiar",
      "plan.remove": "Quitar",
      "plan.moveUp": "Subir",
      "plan.moveDown": "Bajar",
      "plan.share": "Copiar enlace",
      "plan.shared": "Enlace copiado",
      "itin.email": "Envíamelo por correo",
      "plan.far": "Atención — estas paradas están muy separadas para un solo día.",
      "plan.minimize": "Minimizar",
      "plan.expand": "Expandir",
      "card.directions": "Cómo llegar",
      "itin.title": "Tu día de cenotes",
      "itin.routeFrom": (b) => `Ruta desde ${b}`,
      "itin.leg": (m) => `${m} min en auto`,
      "itin.legStart": (b, m) => `${m} min desde ${b}`,
      "itin.totalDrive": "Total en carretera",
      "itin.totalCost": "Total entradas",
      "itin.onSite": (n) => `${n} parada${n === 1 ? "" : "s"} con precio en sitio`,
      "itin.partners": "Hazlo fácil",
      "itin.close": "Cerrar",
      "itin.openMaps": "Ver ruta completa",
      "itin.navStop": "Navegar aquí",
      "itin.upNext": "Siguiente",
      "itin.markDone": "Marcar hecho",
      "itin.done": "Hecho",
      "itin.allDone": "¡Todas las paradas completadas — disfruta el día!",
      "plan.upNextTray": "Siguiente",
      "itin.prepHeading": "Antes de salir",
      "itin.prepBio": "Lleva bloqueador biodegradable — obligatorio en algunas paradas.",
      "itin.prepNoSun": "El bloqueador no está permitido en algunas paradas — enjuágate antes de entrar.",
      "itin.prepCar": "No hay parada de colectivo en una o más de estas — planea auto, taxi o tour."
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
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      // Format: "attr:key" (e.g. "placeholder:strip.searchPlaceholder")
      const [attr, key] = el.getAttribute("data-i18n-attr").split(":");
      const val = I18N[langPref][key] ?? I18N.en[key];
      if (attr && typeof val === "string") el.setAttribute(attr, val);
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

  // ── Open-now status ────────────────────────────────────────────
  // Cenotes keep local (America/Cancún) hours, and this planner's users are
  // often browsing from a device set to another timezone. Compute "now"
  // against Cancún wall-clock (fixed UTC-5, no DST in Quintana Roo) rather
  // than the device clock so the open/closed call is always correct.
  function cancunNowMinutes() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Cancun", hour12: false, hour: "2-digit", minute: "2-digit"
    }).formatToParts(new Date());
    let h = 0, m = 0;
    for (const p of parts) {
      if (p.type === "hour") h = parseInt(p.value, 10) % 24;
      if (p.type === "minute") m = parseInt(p.value, 10);
    }
    return h * 60 + m;
  }

  // "08:10-16:45" → { open: 490, close: 1005 }; anything else → null (unknown
  // hours stay silent rather than guessing).
  function parseHours(hours) {
    if (!hours || typeof hours !== "string") return null;
    const m = hours.match(/^\s*(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})\s*$/);
    if (!m) return null;
    const open = (+m[1]) * 60 + (+m[2]);
    const close = (+m[3]) * 60 + (+m[4]);
    if (close <= open) return null; // overnight/malformed — don't fake it
    return { open, close };
  }

  function fmtClock(mins) {
    const h = Math.floor(mins / 60), m = mins % 60;
    if (langPref === "es") return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const ap = h >= 12 ? "PM" : "AM";
    let hh = h % 12; if (hh === 0) hh = 12;
    return m === 0 ? `${hh} ${ap}` : `${hh}:${String(m).padStart(2, "0")} ${ap}`;
  }

  function openPill(c) {
    const hrs = parseHours(c.hours);
    if (!hrs) return "";
    const now = cancunNowMinutes();
    if (now >= hrs.open && now < hrs.close) {
      return `<span class="meta-pill open is-open">${escapeHtml(t("card.open.now", fmtClock(hrs.close)))}</span>`;
    }
    return `<span class="meta-pill open is-closed">${escapeHtml(t("card.open.closed", fmtClock(hrs.open)))}</span>`;
  }

  // Static baseline crowd hint from the verified data (distinct from live
  // visitor reports) — surfaces the "get there early" nudge on the busiest
  // cenotes, which is the single most actionable planning fact.
  function crowdPill(c) {
    if ((c.eco || {}).crowd_pressure !== "high") return "";
    return `<span class="meta-pill crowd">${escapeHtml(t("card.crowd.high"))}</span>`;
  }

  // ── State ──────────────────────────────────────────────────────
  const state = {
    cenotes: [],
    bases: [],
    baseId: null,
    activity: "",
    kidsOnly: false,
    query: "",
    plan: [],              // ordered array of slugs (max MAX_PLAN)
    visited: [],           // slugs the visitor has checked off as done
    trayMinimized: false,
    map: null,
    markers: [],
    conditions: {},        // slug -> latest condition record
    photos: {},            // slug -> { file, credit, license, source }
    turnstileLoaded: false,
    turnstileWidgetId: null,
    liveCoords: null,       // [lat, lng] from the last successful geolocation fix, if any
    sortMode: "base"        // "base" (drive time from staying-in) | "me" (GPS distance)
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

  // ── Base (staying-in) detection ─────────────────────────────────
  // Distance/drive-time on every card is computed from state.baseId, so
  // defaulting it to an arbitrary hotel zone (with no prompt to change it)
  // silently shows wrong numbers to anyone not staying there. Prefer, in
  // order: a base the visitor already picked this session (saved to
  // localStorage), then their live location (nearest base by straight-line
  // distance), then fall back to the first base in the list.
  const BASE_KEY = "cenote-base";

  function nearestBaseId(coords) {
    let bestId = null, bestKm = Infinity;
    state.bases.forEach((b) => {
      const km = haversineKm(coords, b.coords);
      if (km < bestKm) { bestKm = km; bestId = b.id; }
    });
    return bestId;
  }

  function detectBaseByLocation() {
    return new Promise((resolve) => {
      if (!("geolocation" in navigator)) return resolve(null);
      const timer = setTimeout(() => resolve(null), 3800);
      navigator.geolocation.getCurrentPosition(
        (pos) => { clearTimeout(timer); resolve([pos.coords.latitude, pos.coords.longitude]); },
        () => { clearTimeout(timer); resolve(null); },
        { maximumAge: 600000, timeout: 3500 }
      );
    });
  }

  // Synchronous — safe to call before the first render, adds no delay.
  function applySavedBase() {
    let saved = null;
    try { saved = localStorage.getItem(BASE_KEY); } catch {}
    if (saved && state.bases.some((b) => b.id === saved)) {
      state.baseId = saved;
      return true;
    }
    return false;
  }

  // Async — fires after the first render so geolocation's permission prompt
  // (or a slow GPS fix) never delays the page becoming usable. Re-renders
  // only if it lands on a different base than the placeholder default.
  async function detectAndApplyLocationBase() {
    const coords = await detectBaseByLocation();
    if (!coords) return;
    state.liveCoords = coords;
    const detected = nearestBaseId(coords);
    if (detected && detected !== state.baseId) {
      state.baseId = detected;
      renderBases();
      renderCards();
      renderTray();
    }
  }

  function saveBase(id) {
    try { localStorage.setItem(BASE_KEY, id); } catch {}
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

  // ── Search ─────────────────────────────────────────────────────
  // Fold accents + lowercase so "nicte" matches "Nicté" and "cenote azul"
  // matches regardless of diacritics.
  const fold = (s) => String(s).toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "");

  function searchHaystack(c) {
    if (c._haystack) return c._haystack;
    const activityWords = (c.activities || []).map((a) =>
      `${t("activity." + a)} ${I18N.en["activity." + a] || ""} ${I18N.es["activity." + a] || ""}`).join(" ");
    c._haystack = fold([
      c.name_en, c.name_es, c.summary_en, c.summary_es,
      c.region, activityWords
    ].join(" "));
    return c._haystack;
  }

  function matchesQuery(c) {
    if (!state.query) return true;
    const hay = searchHaystack(c);
    return fold(state.query).split(/\s+/).filter(Boolean).every((tok) => hay.includes(tok));
  }

  // ── Filter + sort ──────────────────────────────────────────────
  function visibleCenotes() {
    const base = state.bases.find((b) => b.id === state.baseId);
    const useLive = state.sortMode === "me" && state.liveCoords;
    const origin = useLive ? state.liveCoords : base?.coords;
    return state.cenotes
      .filter((c) => {
        if (state.activity && !c.activities.includes(state.activity)) return false;
        if (state.kidsOnly && !c.kid_friendly) return false;
        if (!matchesQuery(c)) return false;
        return true;
      })
      .map((c) => ({
        ...c,
        _km: origin ? haversineKm(origin, c.coords) : null
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

  function reflectLocateBtn() {
    const btn = document.getElementById("locate-btn");
    const label = document.getElementById("locate-btn-label");
    if (!btn || !label) return;
    const active = state.sortMode === "me" && state.liveCoords;
    btn.classList.toggle("is-active", !!active);
    btn.classList.remove("is-error");
    label.textContent = t(active ? "locate.active" : "locate.btn");
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

  // Ranked "best way there" for visitors without a rental car — most cenote
  // searches assume no car. Built from the access fields already verified
  // per-cenote (collectivo stop, road surface, guided-only) rather than
  // invented bus numbers or fares: cheapest/easiest real option first,
  // tour/private-driver only when the data says a taxi genuinely can't do it.
  function bestTransport(c) {
    const access = c.access || {};
    const guidedOnly = (c.amenities || []).includes("guided_only");
    if (guidedOnly) return { key: "guided", warn: false };
    if (access.four_wd_needed) return { key: "4wd", warn: true };
    if (access.collectivo_stops) return { key: "collectivo", warn: false };
    if (access.road === "dirt_easy" || access.road === "dirt_rough") return { key: "dirt", warn: true };
    return { key: "taxi", warn: false };
  }

  function transitPill(c) {
    const { key, warn } = bestTransport(c);
    return `<span class="meta-pill transit${warn ? " warn" : ""}">${t("card.transit." + key)}</span>`;
  }

  function sunscreenPill(c) {
    const rule = (c.eco || {}).sunscreen_rule;
    if (rule === "biodegradable_only") return `<span class="meta-pill prep">${t("card.sunscreen.bio")}</span>`;
    if (rule === "none_allowed") return `<span class="meta-pill prep warn">${t("card.sunscreen.none")}</span>`;
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

  // Deterministic per-slug hue shift so cenotes without photos get a
  // visually distinct (but still on-brand) painted placeholder.
  function hueFromSlug(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
    return (h % 70) - 35;
  }

  // ── Day plan ───────────────────────────────────────────────────
  const MAX_PLAN = 3;
  const PLAN_KEY = "cenote-plan";
  const VISITED_KEY = "cenote-visited";

  const cenoteBySlug = (slug) => state.cenotes.find((c) => c.slug === slug);

  function loadPlan() {
    // A ?plan= URL wins over localStorage so shared links open the same day.
    const fromUrl = params.get("plan");
    let slugs = [];
    if (fromUrl) {
      slugs = fromUrl.split(",").map((s) => s.trim()).filter(Boolean);
    } else {
      try { slugs = JSON.parse(localStorage.getItem(PLAN_KEY) || "[]"); } catch {}
    }
    // Keep only slugs that still exist, cap at MAX_PLAN.
    state.plan = slugs.filter((s) => cenoteBySlug(s)).slice(0, MAX_PLAN);
  }

  function savePlan() {
    try { localStorage.setItem(PLAN_KEY, JSON.stringify(state.plan)); } catch {}
    // Reflect the plan in the URL without a reload so it's copy-pasteable.
    const url = new URL(location.href);
    if (state.plan.length) url.searchParams.set("plan", state.plan.join(","));
    else url.searchParams.delete("plan");
    history.replaceState(null, "", url);
  }

  function togglePlan(slug) {
    const i = state.plan.indexOf(slug);
    if (i >= 0) {
      state.plan.splice(i, 1);
      const v = state.visited.indexOf(slug);
      if (v >= 0) { state.visited.splice(v, 1); saveVisited(); }
    }
    else if (state.plan.length < MAX_PLAN) state.plan.push(slug);
    savePlan();
    renderCards();
    renderTray();
  }

  function movePlan(slug, dir) {
    const i = state.plan.indexOf(slug);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= state.plan.length) return;
    [state.plan[i], state.plan[j]] = [state.plan[j], state.plan[i]];
    savePlan();
    renderTray();
    renderMarkers(visibleCenotes());
  }

  function clearPlan() {
    state.plan = [];
    state.visited = [];
    savePlan();
    saveVisited();
    renderCards();
    renderTray();
    renderMarkers(visibleCenotes());
  }

  function loadVisited() {
    let slugs = [];
    try { slugs = JSON.parse(localStorage.getItem(VISITED_KEY) || "[]"); } catch {}
    // Only keep check-offs for stops still in the plan.
    state.visited = slugs.filter((s) => state.plan.includes(s));
  }

  function saveVisited() {
    try { localStorage.setItem(VISITED_KEY, JSON.stringify(state.visited)); } catch {}
  }

  function toggleVisited(slug) {
    const i = state.visited.indexOf(slug);
    if (i >= 0) state.visited.splice(i, 1);
    else state.visited.push(slug);
    saveVisited();
    renderTray();
    if (document.getElementById("itin-modal")?.classList.contains("is-open")) openItinerary();
  }

  // First stop, in day-plan order, the visitor hasn't checked off yet.
  function nextStopSlug() {
    const { stops } = planLegs();
    const next = stops.find((c) => !state.visited.includes(c.slug));
    return next ? next.slug : null;
  }

  // Ordered coords for the day: base first (if chosen), then each stop —
  // furthest from the origin first, working back to the closest last. That
  // way the loop pushes out to the far edge early and drifts back toward
  // "home" as the day winds down, instead of doubling back and forth in
  // whatever order stops were tapped in.
  function planLegs() {
    const base = state.bases.find((b) => b.id === state.baseId);
    const origin = state.liveCoords || (base && base.coords) || null;
    const stops = state.plan.map(cenoteBySlug).filter(Boolean);
    if (origin && stops.length > 1) {
      stops.sort((a, b) => haversineKm(origin, b.coords) - haversineKm(origin, a.coords));
    }
    const points = [];
    if (base) points.push({ coords: base.coords, name: base.label_en, isBase: true });
    stops.forEach((c) => points.push({ coords: c.coords, cenote: c }));
    const legs = [];
    for (let i = 1; i < points.length; i++) {
      legs.push(minutesDrive(haversineKm(points[i - 1].coords, points[i].coords)));
    }
    return { points, legs, stops };
  }

  function planStats() {
    const { legs, stops } = planLegs();
    let knownCost = 0, unknownCount = 0, hasKnown = false;
    stops.forEach((c) => {
      if (typeof c.cost_mxn === "number" && c.cost_mxn > 0) { knownCost += c.cost_mxn; hasKnown = true; }
      else if (c.cost_mxn === 0) { hasKnown = true; }
      else unknownCount++;
    });
    const driveMin = legs.reduce((a, b) => a + b, 0);
    // Flag a plan whose stops sprawl beyond a realistic single-day loop.
    let far = false;
    for (let i = 0; i < stops.length; i++)
      for (let j = i + 1; j < stops.length; j++)
        if (haversineKm(stops[i].coords, stops[j].coords) > 80) far = true;
    return { knownCost, unknownCount, hasKnown, driveMin, far, count: stops.length };
  }

  // Town/state each region sits in. Appending it to the cenote name makes
  // Google resolve the actual place *listing* (reviews + the operator's own
  // hours/photos) instead of dropping a blank coordinate pin, while keeping
  // duplicate names (Cenote Azul, Cristalino…) from matching the wrong one.
  const REGION_LOCALITY = {
    tulum: "Tulum, Quintana Roo",
    puerto_morelos: "Puerto Morelos, Quintana Roo",
    akumal: "Akumal, Quintana Roo",
    riviera_central: "Riviera Maya, Quintana Roo",
    puerto_aventuras: "Puerto Aventuras, Quintana Roo",
    playa: "Playa del Carmen, Quintana Roo",
    coba: "Cobá, Quintana Roo",
    valladolid: "Valladolid, Yucatán",
    homun: "Homún, Yucatán",
    merida: "Mérida, Yucatán",
    cuzama: "Cuzamá, Yucatán",
    chichen_itza: "Chichén Itzá, Yucatán",
    chichen: "Chichén Itzá, Yucatán",
  };

  // Google Maps destination text for a cenote: its name plus the town/state
  // it sits in, so the link lands on the real listing the visitor can read
  // reviews on before driving out.
  function mapsDest(c) {
    const loc = REGION_LOCALITY[c.region];
    return encodeURIComponent(loc ? `${c.name_en}, ${loc}, Mexico` : `${c.name_en}, Mexico`);
  }

  // Google Maps deep link for a single cenote — no origin, so Maps uses the
  // visitor's current location (works whether they're at the resort or already out driving).
  // Optional per-cenote place_id pins the exact verified listing when we have it.
  function singleMapsUrl(c) {
    let url = `https://www.google.com/maps/dir/?api=1&destination=${mapsDest(c)}&travelmode=driving`;
    if (c.place_id) url += `&destination_place_id=${encodeURIComponent(c.place_id)}`;
    return url;
  }

  // Multi-stop Google Maps route for the whole day plan. Origin is left
  // blank on purpose — Maps then starts from wherever the visitor actually
  // is when they tap it (their live device location), not the "staying in"
  // dropdown pick, which is only a distance-sort hint and often isn't where
  // they're standing. Destination is the last stop, everything else in
  // between is a waypoint.
  function planMapsUrl() {
    const { stops } = planLegs();
    if (stops.length === 0) return null;
    const last = stops[stops.length - 1];
    const waypoints = stops.slice(0, -1);
    const PIPE = encodeURIComponent("|");
    let url = `https://www.google.com/maps/dir/?api=1&destination=${mapsDest(last)}&travelmode=driving`;
    if (last.place_id) url += `&destination_place_id=${encodeURIComponent(last.place_id)}`;
    if (waypoints.length) {
      url += `&waypoints=${waypoints.map(mapsDest).join(PIPE)}`;
      // Google requires a place id for *every* waypoint or none — only send
      // the aligned list when we have an id for each.
      if (waypoints.every((c) => c.place_id))
        url += `&waypoint_place_ids=${waypoints.map((c) => encodeURIComponent(c.place_id)).join(PIPE)}`;
    }
    return url;
  }

  // Plain-text itinerary for the "email me this" mailto: link — no backend
  // needed, so Phase 3 (email capture) ships even while the Worker/D1
  // conditions backend is undeployed. Visitor addresses it to themselves.
  function planEmailHref(stops, legs, s, baseName) {
    const lines = [];
    if (baseName) lines.push(t("itin.routeFrom", baseName));
    stops.forEach((c, i) => {
      const name = langPref === "es" ? c.name_es : c.name_en;
      const leg = legs[i];
      const legTxt = leg == null ? "" :
        (i === 0 && baseName ? t("itin.legStart", baseName, leg) : t("itin.leg", leg));
      const cost = c.cost_mxn === 0 ? t("card.cost.free")
        : (typeof c.cost_mxn === "number" ? t("card.cost.mxn", c.cost_mxn) : t("plan.costNone"));
      lines.push(`${i + 1}. ${name}${legTxt ? " — " + legTxt : ""} — ${cost}`);
    });
    lines.push("");
    lines.push(`${t("itin.totalDrive")}: ${t("plan.driveMin", s.driveMin)}`);
    const mapsUrl = planMapsUrl();
    if (mapsUrl) lines.push(mapsUrl);
    lines.push("");
    lines.push(location.href);
    const subject = t("itin.title");
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  }

  function planButton(slug) {
    const inPlan = state.plan.includes(slug);
    const full = !inPlan && state.plan.length >= MAX_PLAN;
    const label = inPlan ? t("plan.added") : full ? t("plan.full") : t("plan.add");
    return `<button type="button" class="plan-btn${inPlan ? " is-in" : ""}" ${full ? "disabled" : ""}
      data-plan-slug="${escapeHtml(slug)}" aria-pressed="${inPlan}">
      <span class="plan-btn-icon" aria-hidden="true">${inPlan ? "✓" : "+"}</span>${escapeHtml(label)}</button>`;
  }

  function renderTray() {
    let tray = document.getElementById("plan-tray");
    if (!tray) {
      tray = document.createElement("div");
      tray.id = "plan-tray";
      tray.className = "plan-tray";
      document.body.appendChild(tray);
    }
    if (state.plan.length === 0) {
      tray.classList.remove("is-open");
      tray.innerHTML = "";
      return;
    }
    const s = planStats();
    const minimized = state.trayMinimized;
    tray.classList.toggle("is-minimized", minimized);
    const minimizeBtn = `<button type="button" class="tray-minimize" data-plan-minimize
        aria-label="${escapeHtml(t(minimized ? "plan.expand" : "plan.minimize"))}"
        aria-expanded="${!minimized}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="${minimized ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}"/>
        </svg>
      </button>`;

    if (minimized) {
      const costText = s.hasKnown
        ? t("plan.costFrom", s.knownCost) + (s.unknownCount ? t("plan.costUnknown", s.unknownCount) : "")
        : t("plan.costNone");
      tray.innerHTML = `
        <div class="tray-inner tray-inner--mini" data-plan-expand-hit>
          <strong class="tray-title">${t("plan.title")}</strong>
          <span class="tray-count">${t("plan.stops", s.count)}</span>
          <span class="tray-stat tray-stat--mini">${escapeHtml(costText)}</span>
          ${minimizeBtn}
        </div>`;
      tray.querySelector("[data-plan-minimize]")?.addEventListener("click", (e) => {
        e.stopPropagation();
        state.trayMinimized = false;
        renderTray();
      });
      tray.querySelector("[data-plan-expand-hit]")?.addEventListener("click", () => {
        state.trayMinimized = false;
        renderTray();
      });
      tray.classList.add("is-open");
      renderMarkers(visibleCenotes());
      return;
    }

    const nextSlug = nextStopSlug();
    const chips = state.plan.map((slug, idx) => {
      const c = cenoteBySlug(slug);
      const name = langPref === "es" ? c.name_es : c.name_en;
      const done = state.visited.includes(slug);
      const upBtn = idx > 0
        ? `<button type="button" class="tray-move" data-plan-up="${escapeHtml(slug)}" aria-label="${t("plan.moveUp")}">▲</button>`
        : "";
      const downBtn = idx < state.plan.length - 1
        ? `<button type="button" class="tray-move" data-plan-down="${escapeHtml(slug)}" aria-label="${t("plan.moveDown")}">▼</button>`
        : "";
      return `<li class="tray-chip${done ? " is-done" : ""}">
        <button type="button" class="tray-num tray-num--check" data-plan-done="${escapeHtml(slug)}"
          aria-pressed="${done}" aria-label="${t(done ? "itin.done" : "itin.markDone")}">${done ? "✓" : idx + 1}</button>
        <span class="tray-chip-name">${escapeHtml(name)}</span>
        ${upBtn}${downBtn}
        <button type="button" class="tray-x" data-plan-remove="${escapeHtml(slug)}" aria-label="${t("plan.remove")}">×</button>
      </li>`;
    }).join("");
    const nextStop = nextSlug ? cenoteBySlug(nextSlug) : null;
    const nextName = nextStop ? (langPref === "es" ? nextStop.name_es : nextStop.name_en) : "";
    const upNextHtml = nextStop
      ? `<div class="tray-upnext">
          <span class="tray-upnext-k">${t("plan.upNextTray")}</span>
          <span class="tray-upnext-name">${escapeHtml(nextName)}</span>
          <a class="tray-upnext-nav" href="${singleMapsUrl(nextStop)}" target="_blank" rel="noreferrer">${t("itin.navStop")}</a>
        </div>`
      : `<div class="tray-upnext tray-upnext--done">${t("itin.allDone")}</div>`;
    const costText = s.hasKnown
      ? t("plan.costFrom", s.knownCost) + (s.unknownCount ? t("plan.costUnknown", s.unknownCount) : "")
      : t("plan.costNone");
    tray.innerHTML = `
      <div class="tray-inner">
        <div class="tray-head">
          <strong class="tray-title">${t("plan.title")}</strong>
          <span class="tray-count">${t("plan.stops", s.count)}</span>
          <button type="button" class="tray-clear" data-plan-clear>${t("plan.clear")}</button>
          ${minimizeBtn}
        </div>
        <ul class="tray-chips">${chips}</ul>
        ${upNextHtml}
        <div class="tray-foot">
          <div class="tray-stats">
            <span class="tray-stat"><span class="tray-stat-k">${t("plan.costTotal")}</span> ${escapeHtml(costText)}</span>
            <span class="tray-stat"><span class="tray-stat-k">${t("plan.drive")}</span> ${t("plan.driveMin", s.driveMin)}</span>
          </div>
          <button type="button" class="btn btn-primary tray-view" data-plan-view>${t(s.count === 1 ? "plan.viewOne" : "plan.view")}</button>
        </div>
        ${s.far ? `<p class="tray-warn">${t("plan.far")}</p>` : ""}
      </div>`;
    tray.classList.add("is-open");

    tray.querySelectorAll("[data-plan-remove]").forEach((b) =>
      b.addEventListener("click", () => togglePlan(b.dataset.planRemove)));
    tray.querySelectorAll("[data-plan-up]").forEach((b) =>
      b.addEventListener("click", () => movePlan(b.dataset.planUp, -1)));
    tray.querySelectorAll("[data-plan-down]").forEach((b) =>
      b.addEventListener("click", () => movePlan(b.dataset.planDown, 1)));
    tray.querySelectorAll("[data-plan-done]").forEach((b) =>
      b.addEventListener("click", () => toggleVisited(b.dataset.planDone)));
    tray.querySelector("[data-plan-clear]")?.addEventListener("click", clearPlan);
    tray.querySelector("[data-plan-view]")?.addEventListener("click", openItinerary);
    tray.querySelector("[data-plan-minimize]")?.addEventListener("click", () => {
      state.trayMinimized = true;
      renderTray();
    });
    renderMarkers(visibleCenotes());
  }

  function openItinerary() {
    const modal = document.getElementById("itin-modal");
    if (!modal) return;
    const { legs, stops } = planLegs();
    // A single-stop plan has no route to order and nothing the tray doesn't
    // already show — the modal is just an extra tap. Send straight to Maps.
    if (stops.length === 1) {
      const url = planMapsUrl();
      if (url) window.open(url, "_blank", "noopener");
      return;
    }
    const base = state.bases.find((b) => b.id === state.baseId);
    const baseName = base ? (langPref === "es" ? base.label_es : base.label_en) : "";
    const s = planStats();

    const nextSlug = nextStopSlug();
    const rows = stops.map((c, i) => {
      const name = langPref === "es" ? c.name_es : c.name_en;
      const leg = legs[i]; // leg i is the drive INTO stop i (base->s0, s0->s1, …)
      const legTxt = leg == null ? "" :
        (i === 0 && base ? t("itin.legStart", baseName, leg) : t("itin.leg", leg));
      const cost = c.cost_mxn === 0 ? t("card.cost.free")
        : (typeof c.cost_mxn === "number" ? t("card.cost.mxn", c.cost_mxn) : t("plan.costNone"));
      const hours = c.hours ? ` · ${escapeHtml(c.hours)}` : "";
      const href = `cenotes/${encodeURIComponent(c.slug)}.html${langPref === "es" ? "?lang=es" : ""}`;
      const done = state.visited.includes(c.slug);
      const isNext = c.slug === nextSlug;
      const cls = `itin-stop${done ? " is-done" : ""}${isNext ? " is-next" : ""}`;
      return `<li class="${cls}">
        <button type="button" class="itin-check" data-stop-done="${escapeHtml(c.slug)}"
          aria-pressed="${done}" aria-label="${t(done ? "itin.done" : "itin.markDone")}">${done ? "✓" : i + 1}</button>
        <div class="itin-stop-body">
          ${isNext ? `<span class="itin-badge">${t("itin.upNext")}</span>` : ""}
          ${legTxt ? `<span class="itin-leg">${escapeHtml(legTxt)}</span>` : ""}
          <a class="itin-name" href="${href}">${escapeHtml(name)}</a>
          <span class="itin-meta">${escapeHtml(cost)}${hours}</span>
        </div>
        <div class="itin-stop-actions">
          <a class="itin-nav${isNext ? " itin-nav--next" : ""}" href="${singleMapsUrl(c)}" target="_blank" rel="noreferrer">${t("itin.navStop")}</a>
          <button type="button" class="itin-done-btn" data-stop-done="${escapeHtml(c.slug)}">${t(done ? "itin.done" : "itin.markDone")}</button>
        </div>
      </li>`;
    }).join("");

    const costText = s.hasKnown
      ? t("plan.costFrom", s.knownCost) : t("plan.costNone");

    // Roll the two things people forget to plan for — transport and sunscreen
    // rules — into one glance-able list instead of making them dig into each
    // cenote's own detail page.
    const prepLines = [];
    if (stops.some((c) => (c.eco || {}).sunscreen_rule === "biodegradable_only")) prepLines.push(t("itin.prepBio"));
    if (stops.some((c) => (c.eco || {}).sunscreen_rule === "none_allowed")) prepLines.push(t("itin.prepNoSun"));
    if (stops.some((c) => bestTransport(c).key !== "collectivo")) prepLines.push(t("itin.prepCar"));
    const prepHtml = prepLines.length
      ? `<div class="itin-prep">
          <p class="itin-prep-h">${t("itin.prepHeading")}</p>
          <ul>${prepLines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>
        </div>`
      : "";

    document.getElementById("itin-body").innerHTML = `
      ${base ? `<p class="itin-route">${escapeHtml(t("itin.routeFrom", baseName))}</p>` : ""}
      <ol class="itin-stops">${rows}</ol>
      ${prepHtml}
      <div class="itin-totals">
        <div><span class="itin-tot-k">${t("itin.totalDrive")}</span> ${t("plan.driveMin", s.driveMin)}</div>
        <div><span class="itin-tot-k">${t("itin.totalCost")}</span> ${escapeHtml(costText)}
          ${s.unknownCount ? `<span class="itin-onsite">${escapeHtml(t("itin.onSite", s.unknownCount))}</span>` : ""}</div>
      </div>
      <div class="itin-actions">
        <a class="btn btn-primary" id="itin-maps" href="${planMapsUrl()}">${t("itin.openMaps")}</a>
        <a class="btn btn-ghost" id="itin-email" href="${planEmailHref(stops, legs, s, baseName)}">${t("itin.email")}</a>
        <button type="button" class="btn btn-ghost" id="itin-share">${t("plan.share")}</button>
        <span class="itin-share-ok" id="itin-share-ok" role="status"></span>
      </div>
      <div class="itin-partners">
        <p class="itin-partners-h">${t("itin.partners")}</p>
        <ul>
          <li><a href="https://akumalscooters.com" target="_blank" rel="noreferrer">Akumal Scooters</a></li>
          <li><a href="https://akumalwildlife.com" target="_blank" rel="noreferrer">Akumal Wildlife</a></li>
        </ul>
      </div>`;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    document.getElementById("itin-body").querySelectorAll("[data-stop-done]").forEach((b) =>
      b.addEventListener("click", () => toggleVisited(b.dataset.stopDone)));

    document.getElementById("itin-share")?.addEventListener("click", async () => {
      savePlan();
      const ok = document.getElementById("itin-share-ok");
      try {
        await navigator.clipboard.writeText(location.href);
        ok.textContent = t("plan.shared");
      } catch { ok.textContent = location.href; }
    });
  }

  function closeItinerary() {
    const modal = document.getElementById("itin-modal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  function renderCards() {
    const list = visibleCenotes();
    const wrap = document.getElementById("cards");
    const counter = document.getElementById("result-count");
    counter.textContent = t(state.sortMode === "me" && state.liveCoords ? "results.countMe" : "results.count", list.length);

    if (list.length === 0) {
      wrap.innerHTML = `<div class="empty-state">${t(state.query ? "results.emptySearch" : "results.empty")}</div>`;
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
        const reportBtn = CONFIG.API_BASE
          ? `<button type="button" class="report-btn" data-report-slug="${escapeHtml(c.slug)}" data-report-name="${escapeHtml(name)}">${t("card.report")}</button>`
          : "";
        const directionsBtn = `<a class="report-btn directions-btn" href="${singleMapsUrl(c)}" target="_blank" rel="noreferrer">${t("card.directions")}</a>`;
        const photo = state.photos[c.slug];
        const detailHref = `cenotes/${encodeURIComponent(c.slug)}.html${langPref === "es" ? "?lang=es" : ""}`;
        const media = photo
          ? `<a class="card-media" href="${detailHref}" aria-label="${escapeHtml(name)}">
               <img loading="lazy" decoding="async" src="${escapeHtml(photo.file)}" alt="${escapeHtml(name)}" />
             </a>`
          : `<a class="card-media card-media--painted" href="${detailHref}" aria-label="${escapeHtml(name)}" style="--hue-shift:${hueFromSlug(c.slug)}deg">
               <span class="placeholder-name">${escapeHtml(name)}</span>
               <span class="placeholder-note">${t("card.photoSoon")}</span>
             </a>`;
        return `
          <article class="cenote-card">
            ${media}
            <div class="card-body">
              <div class="card-top">
                <h3 class="card-name"><a href="${detailHref}" class="card-name-link">${escapeHtml(name)}</a></h3>
                ${dist}
              </div>
              <p class="card-summary">${escapeHtml(summary)}</p>
              <div class="card-meta card-meta-primary">
                <span class="meta-pill cost">${costLabel(c)}</span>
                ${openPill(c)}
                ${skillPill(c)}
              </div>
              <div class="card-meta card-meta-secondary">
                ${conditionPill(c.slug)}
                ${crowdPill(c)}
                ${activities}
                ${kids}
                ${sunscreenPill(c)}
              </div>
              <div class="card-meta card-meta-transit">
                ${transitPill(c)}
              </div>
              <div class="card-foot">${directionsBtn}${reportBtn}${planButton(c.slug)}</div>
            </div>
          </article>`;
      }).join("");

      wrap.querySelectorAll("[data-report-slug]").forEach((btn) => {
        btn.addEventListener("click", () => openReportModal(btn.dataset.reportSlug, btn.dataset.reportName));
      });
      wrap.querySelectorAll("[data-plan-slug]").forEach((btn) => {
        btn.addEventListener("click", () => togglePlan(btn.dataset.planSlug));
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

    drawPlanRoute();

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

  // Dashed line through base → each plan stop, plus numbered pins so the
  // day's route reads at a glance on the main map.
  function drawPlanRoute() {
    if (!state.map || !window.maplibregl || !state.map.isStyleLoaded()) return;
    const { points } = planLegs();
    const coords = points.map((p) => [p.coords[1], p.coords[0]]);
    const geo = { type: "Feature", geometry: { type: "LineString", coordinates: coords } };

    if (state.map.getSource("plan-route")) {
      state.map.getSource("plan-route").setData(coords.length >= 2 ? geo
        : { type: "Feature", geometry: { type: "LineString", coordinates: [] } });
    } else {
      state.map.addSource("plan-route", { type: "geojson", data: geo });
      state.map.addLayer({
        id: "plan-route",
        type: "line",
        source: "plan-route",
        paint: {
          "line-color": "#b14a3b",
          "line-width": 3,
          "line-dasharray": [1.5, 1.2]
        }
      });
    }

    // Numbered pins for the ordered stops.
    state.plan.forEach((slug, idx) => {
      const c = cenoteBySlug(slug);
      if (!c) return;
      const el = document.createElement("div");
      el.className = "plan-pin";
      el.textContent = String(idx + 1);
      const marker = new window.maplibregl.Marker({ element: el })
        .setLngLat([c.coords[1], c.coords[0]])
        .addTo(state.map);
      state.markers.push(marker);
    });
  }

  // ── Wire up ────────────────────────────────────────────────────
  function wireControls() {
    document.getElementById("base-select").addEventListener("change", (e) => {
      state.baseId = e.target.value;
      saveBase(state.baseId);
      // Picking a place to stay is an explicit "sort from here" — drop the
      // GPS sort so the two distance origins don't silently fight.
      state.sortMode = "base";
      reflectLocateBtn();
      renderCards();
      renderTray();
    });

    const locateBtn = document.getElementById("locate-btn");
    if (locateBtn) {
      locateBtn.addEventListener("click", async () => {
        if (state.sortMode === "me") {
          state.sortMode = "base";
          reflectLocateBtn();
          renderCards();
          return;
        }
        locateBtn.disabled = true;
        locateBtn.classList.remove("is-error");
        document.getElementById("locate-btn-label").textContent = t("locate.locating");
        const coords = await detectBaseByLocation();
        locateBtn.disabled = false;
        if (!coords) {
          locateBtn.classList.add("is-error");
          document.getElementById("locate-btn-label").textContent = t("locate.denied");
          return;
        }
        state.liveCoords = coords;
        state.sortMode = "me";
        reflectLocateBtn();
        renderCards();
      });
    }
    document.getElementById("activity-select").addEventListener("change", (e) => {
      state.activity = e.target.value;
      renderCards();
    });
    document.getElementById("kid-toggle").addEventListener("change", (e) => {
      state.kidsOnly = e.target.checked;
      renderCards();
    });
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      let searchTimer = null;
      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimer);
        const val = e.target.value;
        searchTimer = setTimeout(() => {
          state.query = val.trim();
          renderCards();
        }, 120);
      });
    }

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
      if (e.key === "Escape") { closeReportModal(); closeItinerary(); }
    });
    document.querySelectorAll("[data-close-itin]").forEach((el) => {
      el.addEventListener("click", closeItinerary);
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
    loadPlan();
    loadVisited();
    const hadSavedBase = applySavedBase();
    renderBases();
    wireControls();
    renderCards();
    renderTray();
    lazyLoadMapOnScroll();
    loadConditions().then(() => renderCards());
    if (!hadSavedBase) detectAndApplyLocationBase();

    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register("sw.js?v=20").then((reg) => {
        // Force a real network check on every visit instead of waiting for the
        // browser's lazy periodic re-fetch, which can leave a stale worker
        // running for hours after a deploy.
        reg.update().catch(() => {});
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "activated") location.reload();
          });
        });
      }).catch(() => {});
    }
  }

  document.addEventListener("DOMContentLoaded", start);
})();

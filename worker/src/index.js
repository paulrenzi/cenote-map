// Cenote conditions API — Cloudflare Worker + D1 + Turnstile
// Endpoints:
//   POST /conditions          submit a report
//   GET  /conditions/recent   latest report per cenote (last 30d)

const RECENT_WINDOW_S = 30 * 86400;
const RATE_WINDOW_S   = 60 * 60;
const RATE_MAX        = 5;
const MAX_NOTES       = 200;
const MAX_NAME        = 40;
const VALID_CROWD     = new Set(["low", "medium", "high"]);
const VALID_CLARITY   = new Set(["clear", "cloudy"]);
const SLUG_RE         = /^[a-z][a-z0-9-]{1,60}$/;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim());
    const cors = corsHeaders(origin, allowed);

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    try {
      if (req.method === "GET" && url.pathname === "/conditions/recent") {
        return json(await getRecent(env), 200, cors);
      }
      if (req.method === "POST" && url.pathname === "/conditions") {
        return json(await postCondition(req, env), 201, cors);
      }
      return json({ error: "not_found" }, 404, cors);
    } catch (err) {
      const status = err.status || 500;
      return json({ error: err.message || "internal_error" }, status, cors);
    }
  }
};

function corsHeaders(origin, allowed) {
  const ok = allowed.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" }
  });
}

function fail(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  return e;
}

async function getRecent(env) {
  const cutoff = Math.floor(Date.now() / 1000) - RECENT_WINDOW_S;
  const { results } = await env.DB.prepare(`
    SELECT cenote_slug, visibility_m, crowd_level, water_clarity, notes,
           contributor_name, reported_at
    FROM conditions c1
    WHERE reported_at >= ?
      AND reported_at = (
        SELECT MAX(reported_at) FROM conditions c2
        WHERE c2.cenote_slug = c1.cenote_slug AND c2.reported_at >= ?
      )
    ORDER BY reported_at DESC
  `).bind(cutoff, cutoff).all();
  return { conditions: results, window_days: 30 };
}

async function postCondition(req, env) {
  let body;
  try { body = await req.json(); } catch { throw fail("invalid_json"); }

  const slug = String(body.cenote_slug || "").toLowerCase();
  if (!SLUG_RE.test(slug)) throw fail("invalid_cenote_slug");

  const crowd = String(body.crowd_level || "");
  if (!VALID_CROWD.has(crowd)) throw fail("invalid_crowd_level");

  let viz = null;
  if (body.visibility_m != null) {
    viz = Number(body.visibility_m);
    if (!Number.isFinite(viz) || viz < 0 || viz > 60) throw fail("invalid_visibility_m");
    viz = Math.round(viz);
  }

  let clarity = null;
  if (body.water_clarity != null) {
    clarity = String(body.water_clarity);
    if (!VALID_CLARITY.has(clarity)) throw fail("invalid_water_clarity");
  }

  const notes = body.notes ? String(body.notes).slice(0, MAX_NOTES).trim() : null;
  const name  = body.contributor_name ? String(body.contributor_name).slice(0, MAX_NAME).trim() : null;

  // Turnstile (skipped only if no secret is configured — useful for local dev)
  if (env.TURNSTILE_SECRET) {
    const token = String(body.turnstile_token || "");
    if (!token) throw fail("missing_turnstile_token");
    const ipHeader = req.headers.get("CF-Connecting-IP") || "";
    const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ipHeader })
    });
    const result = await verify.json();
    if (!result.success) throw fail("turnstile_failed", 403);
  }

  // Rate-limit per IP hash
  const ipHash = await sha256Hex((req.headers.get("CF-Connecting-IP") || "") + "|" + (env.RATE_SALT || "rl"));
  const now = Math.floor(Date.now() / 1000);
  const winStart = now - RATE_WINDOW_S;
  await env.DB.prepare(`DELETE FROM rate_limits WHERE window_start < ?`).bind(winStart).run();
  const row = await env.DB.prepare(`SELECT count FROM rate_limits WHERE ip_hash = ?`).bind(ipHash).first();
  if (row && row.count >= RATE_MAX) throw fail("rate_limited", 429);
  if (row) {
    await env.DB.prepare(`UPDATE rate_limits SET count = count + 1 WHERE ip_hash = ?`).bind(ipHash).run();
  } else {
    await env.DB.prepare(`INSERT INTO rate_limits (ip_hash, window_start, count) VALUES (?,?,1)`)
      .bind(ipHash, now).run();
  }

  await env.DB.prepare(`
    INSERT INTO conditions
      (cenote_slug, visibility_m, crowd_level, water_clarity, notes, contributor_name, reported_at, ip_hash)
    VALUES (?,?,?,?,?,?,?,?)
  `).bind(slug, viz, crowd, clarity, notes, name, now, ipHash).run();

  return { ok: true, reported_at: now };
}

async function sha256Hex(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

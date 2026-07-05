// Cenote photo proxy — Cloudflare Worker.
//
// Fronts the Google Places (New) photo-media endpoint so the Places API key
// stays server-side (this is a public static site — a client-embedded key
// would be scrapeable). The client requests:
//
//   GET /?name=places/<id>/photos/<ref>&w=800
//
// and gets image bytes back. Strict validation keeps this from being an open
// proxy: it will ONLY ever fetch a Places photo-media URL, nothing else.
// Responses are cached at the edge because Places photo media is billed
// per-fetch and cenote photos are effectively immutable for our purposes.

const NAME_RE = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;
const MIN_W = 200;
const MAX_W = 1600;
const DEFAULT_W = 800;
const EDGE_TTL = 60 * 60 * 24 * 30; // 30d

export default {
  async fetch(req, env, ctx) {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return new Response("method_not_allowed", { status: 405 });
    }
    const url = new URL(req.url);
    const name = url.searchParams.get("name") || "";
    if (!NAME_RE.test(name)) {
      return new Response("bad_name", { status: 400 });
    }
    let w = parseInt(url.searchParams.get("w") || DEFAULT_W, 10);
    if (!Number.isFinite(w)) w = DEFAULT_W;
    w = Math.max(MIN_W, Math.min(MAX_W, w));

    if (!env.PLACES_API_KEY) {
      return new Response("not_configured", { status: 503 });
    }

    // Serve from the edge cache when possible (keyed by normalised name+width).
    const cacheKey = new Request(`${url.origin}/?name=${encodeURIComponent(name)}&w=${w}`, req);
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const upstream = `https://places.googleapis.com/v1/${name}/media`
      + `?maxWidthPx=${w}&key=${env.PLACES_API_KEY}`;
    const gres = await fetch(upstream, { redirect: "follow" });
    if (!gres.ok) {
      return new Response("upstream_error", { status: 502 });
    }

    const res = new Response(gres.body, {
      status: 200,
      headers: {
        "Content-Type": gres.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": `public, max-age=${EDGE_TTL}, immutable`,
        "Access-Control-Allow-Origin": "*",
      },
    });
    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  },
};

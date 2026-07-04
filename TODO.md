# Monetization roadmap

Site brand promise (support band copy): "free, ad-free" — banner/display ads (AdSense etc.) are ruled out, don't propose them.

## Phase 1 — Affiliate tour/transfer links (next up)
- Blocked on: Paul signing up for a tour/transfer affiliate program (Viator Partner Program or GetYourGuide Partner Hub) — needs his payout/tax info, can't be self-served on his behalf.
- Once we have a real affiliate ID: add a CTA link wherever `bestTransport(c).key` is `guided`, `4wd`, or `dirt` in app.js (cards + itinerary), pointing to a tour/transfer search pre-filtered to the cenote's region.
- Also add a general "book a driver for the day" link in the itin-partners block next to Akumal Scooters/Wildlife.

## Phase 2 — Direct driver/transfer referral (Akumal-Scooters model)
- Reuse the existing local-partner playbook (vetted drivers, referral fee, own brand) instead of a pure affiliate cut.
- Needs: vetted driver(s), liability/insurance check, a dispatch method (WhatsApp/booking form).
- Higher margin than Phase 1 once live; treat Phase 1 as the bridge until this exists.

## Phase 3 — Email capture → cross-sell
- ✅ Shipped (v15): "Email me this" mailto: link in the itinerary modal — pre-filled subject/body with stops, cost, drive time, Maps link. Zero backend, works today.
- Still open: this only lets a visitor email *themselves* the plan — it doesn't capture the address for us. To actually build a list, need the cenote-conditions Worker + D1 (blocked on a properly-scoped CLOUDFLARE_API_TOKEN — current token can't create Pages projects, D1 databases, or deploy Workers, and can't grant itself more scope either). Once that token exists: add an email input + `/subscribe` endpoint to the Worker/D1, feed into existing Umbrella Arcades email marketing flow.

## Phase 4 — Ticket/skip-the-line commission or sponsored placement
- Highest revenue-per-visitor (entry fee paid on every single visit) but requires real per-operator sales/negotiation, not code.
- Scope to the highest-traffic ~10 cenotes only (Gran Cenote, Dos Ojos, Ik Kil, Casa Cenote, etc.) — not feasible to negotiate across all 82 individually-owned sites.

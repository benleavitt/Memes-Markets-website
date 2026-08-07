# TODOS

Ship at the end of every phase. Rationale for the architecture calls lives in the
gstack decision log (`gstack-decision-search`), not here.

## Phase 0 — plumbing
- [x] git init, gstack routing, .gitignore
- [x] Decide framework, doc structure, orbit perf budget (eng review, D2-D5)
- [x] Scaffold: Next.js 15 + TS strict + Tailwind v4 + Biome + Vitest
- [x] `styles/tokens.css` generated from Figma variables (44 props + 18 type styles)
- [x] `lib/orbit.ts` — projection maths + constants, 11 tests green
- [x] `lib/episodes.ts` — RSS fetch, `hqdefault` fallback, committed fallback dataset
- [x] Assets moved into `public/brand/`
- [x] `next build` green locally — static, ISR 1h
- [ ] **BLOCKER: move the repo off a path containing `&`.** `M&M website` breaks every
      `node_modules/.bin` shim on Windows (cmd splits the path at `&`), so `npm test`,
      `npm run dev` and `npm run build` all fail. Verified working via
      `node node_modules/<pkg>/...` directly. Rename to `memes-and-markets`.
- [ ] Compress host photos — 1.3MB and 2.4MB straight off a camera (Phase 4 needs them)
- [ ] Raise or accept the JS budget: empty page is already 103kB First Load

## Phase 1 — static Home (shippable on its own) — DONE, branch `phase-1-static-home`
- [x] Wordmark fitted to viewport width (pure CSS, ratio 10.186), tagline, platform bar, one CTA, footer
- [x] Background: grid via `repeating-linear-gradient`, glow via `radial-gradient`, no `filter: blur()`
- [x] Focus-visible states, skip link, reduced-motion guard
- [x] Fixed small-white-on-red contrast — CTA label is 19px/700 to clear the large-text threshold
- [x] About stub so the footer link is not a 404
- [x] Episode list (pulled forward from Phase 2 — it is the always-works route to the content)
- [x] Cropped the logo to its ink bounds; fixed mobile horizontal overflow
- [ ] Merge to `main` and deploy a preview

## Phase 2 — the orbit
- [ ] CSS 3D transform belt, 12 cards, `preserve-3d` + one `--spin` var
- [ ] Depth via CSS `cos()`; scale + opacity + overlap only, **no blur** (D4)
- [ ] Each card is a real `<a>` with the episode title as accessible name
- [ ] Drag with momentum + snap; scroll while in view; arrow keys step one card
- [ ] `prefers-reduced-motion`: no auto-spin, no momentum
- [ ] Plain "All episodes" list below the fold as the non-JS route to content
- [ ] Measure on real mid-range Android, not throttled desktop

## Phase 3 — live player
- [ ] `<LivePlayer/>` in the root layout, outside the page slot
- [ ] Twitch Helix live status, edge route, schedule-aware TTL (20s in-window, 5min out)
- [ ] `FORCE_LIVE` env override so a Twitch outage cannot blank the hero
- [ ] Offline state: next-slot countdown computed locally from the Tue/Thu schedule
- [ ] Muted autoplay, unmute on gesture, dismissal persisted in sessionStorage
- [ ] **E2E: player survives Home → About** (load-bearing)

## Phase 4 — About, meme wall
- [ ] About: hosts (photos in `Assets/`), "as heard on", footer
- [ ] Meme wall — **rewrite copy from the real feed**; current draft is off-brand
- [ ] Trace the M logo to SVG and work it into header + footer

## Phase 5 — polish
- [ ] A11y pass, perf pass against budget (LCP < 1.5s, JS < 90KB, CLS < 0.02)
- [ ] OG images via `next/og`, JSON-LD `PodcastSeries` + `PodcastEpisode`
- [ ] Analytics: platform-button clicks, CTA clicks, sphere interaction rate

## Phase 6 — newsletter (explicitly lowest priority)
- [ ] Email in → added to the Substack list. Substack has no supported public API,
      so this needs a real decision: forward via an undocumented endpoint (fragile),
      or capture with a provider that has an API and cross-post. Do not start until
      Phases 0-5 are done.

## Deferred / not in scope
- CMS for the meme wall — a typed file is right until a non-developer needs to edit it
- YouTube Data API — RSS covers 15 episodes with no key; only needed for view counts
- Market ticker — removed from the design, `ticker/row` component left unused in Figma
- `episode/card` and `sphere/tile` Figma components — superseded, still in the file

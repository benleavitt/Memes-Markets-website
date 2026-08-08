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

## Phase 2 — the orbit — DONE, branch `phase-2-orbit`
- [x] CSS 3D transform belt, 12 cards, `preserve-3d` + one `--spin` var
- [x] Depth via CSS `cos()` in a registered `@property`; **no blur** (D4).
      Verified: front `facing:1 → opacity:1`, side `0.5 → 0.31`, back `0 → 0.08`
- [x] `backface-visibility: hidden` — without it the far cards render mirrored
- [x] Each card is a real `<a>`; no extra tab stop, arrows bubble from the focused card
- [x] Drag with smoothed + clamped momentum, snaps to a card boundary
- [x] Page-scroll rotation while in view, passive, never `preventDefault`
- [x] `prefers-reduced-motion`: no momentum, no scroll-drive
- [x] Plain episode list already shipped in Phase 1
- [ ] Measure on real mid-range Android, not throttled desktop
- [ ] Tighten the gap between the CTA and the belt on mobile (~85px of dead space)

## Phase 3 — live player — DONE, branch `phase-3-live-player`
- [x] `<LivePlayer/>` in the root layout, outside the page slot
- [x] Twitch Helix live status, edge route, schedule-aware TTL (20s in-window, 5min out)
- [x] `FORCE_LIVE` env override so a Twitch outage cannot blank the hero
- [x] Offline state: next-slot countdown computed locally, DST-correct, 10 unit tests
- [x] Muted autoplay, unmute on gesture, dismissal persisted in sessionStorage
- [x] **E2E: player survives Home → About** — stamps the DOM node and checks the
      stamp survives, so a remount cannot pass. 4 specs, green twice in a row.
- [ ] Add real `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` (route returns
      `source: "offline"` until then, which is a correct state, not an error)
- [ ] Mobile: the player is `hidden sm:block`. The brief wants it docked to a slim
      bottom bar under 640px — not built yet.

## Phase 4 — About — DONE, branch `phase-4-about`
- [x] About: hero, "Hosted by" cards with the real photos, "as heard on" row
- [x] Host photos wired through `next/image`; first one gets `priority` (it is the LCP)
- [x] Footer + disclaimer inherited from the root layout, so this page cannot lose it
- [ ] **Per-host social handles.** `content/hosts.ts` renders a links row when handles
      exist. Left empty deliberately: the brief only supplied show-level accounts and
      inventing personal ones would put fake links on a real person's bio.
- [ ] **Logo SVG — needs the source file, not a trace.** `public/brand/mm-logo.png` is
      a cropped raster and looks fine at 44px. Hand-tracing it from pixels would be an
      approximation of someone's brand mark. Ask for the original vector.
- [ ] The floating player overlaps the left host card at 1440. It is `fixed bottom-6
      left-6` per the brief. Either accept it (users can dismiss), move it bottom-right,
      or hide it on About.

## Phase 5 — polish
- [ ] A11y pass, perf pass against budget (LCP < 1.5s, JS < 90KB, CLS < 0.02)
- [ ] OG images via `next/og`, JSON-LD `PodcastSeries` + `PodcastEpisode`
- [ ] Analytics: platform-button clicks, CTA clicks, sphere interaction rate

## Phase 6 — newsletter (explicitly lowest priority)
- [ ] Email in → added to the Substack list. Substack has no supported public API,
      so this needs a real decision: forward via an undocumented endpoint (fragile),
      or capture with a provider that has an API and cross-post. Do not start until
      Phases 0-5 are done.

## Cut

**Meme wall — scrapped.** Never built in code. Removed from the Figma Home frame
and the `meme/card` component deleted. It was written from the brief's topic list
(collectibles, XRP, the petrodollar) and did not reflect the actual show, which is
mostly dating, gambling, education and philosophy. Rewriting copy for a section
nobody asked for was the wrong trade.

## Deferred / not in scope
- YouTube Data API — RSS covers 15 episodes with no key; only needed for view counts
- Market ticker — removed from the design, `ticker/row` component left unused in Figma
- `episode/card` and `sphere/tile` Figma components — superseded, still in the file
- CMS for content — nothing on the site needs non-developer editing yet

## Raised and declined (do not re-litigate)
Offered as cuts alongside the meme wall, kept deliberately:
- **Episode list on Home** stays, even though the orbit renders the same 12 as
  server-side links. Home shows them twice by design.
- **Newsletter capture** stays. Substack has no supported public API, so whatever
  ships there will be an undocumented endpoint that can break silently.
- **Mobile bottom-bar player** stays on the roadmap; the player is desktop-only
  (`hidden sm:block`) until it is built.

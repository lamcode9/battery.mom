# Lessons - battery.mom

Use this file for durable lessons that should shape future agent work in this repository. Keep detailed historical notes in `LEARNINGS.md`; keep this file shorter, action-oriented, and current.

## Operating Lessons

- Start each meaningful task by checking `agent.md`, this file, `copilot-instructions.md`, and the relevant product or data docs.
- Borrow only general workflow discipline from other projects. Do not import CentsCheck-specific design, release, privacy, or app-store rules into Battery.mom.
- For multi-step or architectural work, write a short plan before editing. Use `pipeline/PLAN.md` when the work belongs on the roadmap.
- After corrections, repeated mistakes, surprising bugs, or durable decisions, add a new lesson here so the next session does not relearn it.
- Verification is part of the work. Prefer `npm test` for logic changes, `npm run lint` for code quality, and `npm run build` for route, metadata, and Next.js integration risk.

## Product Lessons

- Battery.mom is a trust product. Do not make vague or promotional claims when a specific number, assumption, or source note would serve users better.
- User-facing copy follows the unslop pass: sentence-case headings, no em dashes in prose (use a period or a comma), no decorative emoji in headings or bullets, straight quotes. Do not change numbers, sources, or footnotes when editing voice. A lone em dash in a table cell is the missing-value mark, not a sentence dash.
- The audience spans homeowners, installers, businesses, and policymakers across Singapore, Malaysia, Indonesia, Thailand, Vietnam, and the Philippines. Keep copy plain enough for non-specialists but precise enough for professionals.
- Data-first UI beats decoration. Charts, tables, comparison cards, and clear assumptions are more valuable than ornamental hero sections.
- Placeholder or future-facing pages should still look intentional, with useful context, realistic timing, and links to live tools.

## Architecture Lessons

- Vehicles are backed by Prisma/PostgreSQL and `data/vehicles-data.json`; BESS home products currently come from `data/BESS-Home-data.json`.
- BESS pages have historically been large, monolithic files. When touching them deeply, prefer extracting domain logic into `lib/utils/` and reusable UI into focused components.
- Use the server/client split pattern for interactive routes that need metadata: `page.tsx` as the server wrapper and `page-client.tsx` for client interaction.
- Country, currency, tariff, and formatting constants have been duplicated in several places. Check `lib/constants.ts` and shared utilities before adding another copy.
- Country-specific assumptions are not always interchangeable. Residential energy rates, EV charging rates, commercial tariffs, and grid-scale BESS assumptions can intentionally differ.
- JSX whitespace gotcha: a literal space between a closing inline tag like `</strong>` and the following text can be dropped at render — seen reliably when the tag's content ends in a symbol such as `%` or `×` (e.g. `42.5%</strong> of` rendered `42.5%of`). Use an explicit `{' '}` to guarantee the space. Verify rendered text, not just source.
- Charts must live in a client component (`'use client'`). Reuse the SSR-safe `components/ResponsiveContainer.tsx` wrapper (defers recharts until after mount) rather than recharts' own `ResponsiveContainer`, to avoid server/client SVG hydration mismatches.
- Recharts `AreaChart` only draws `Area`. A `Line` child is dropped unless the chart is a `ComposedChart`. The generation stack does not add a boundary hairline, margin label, or wash: nine source hues are already the chart, and Fossil, Renewable, and Nuclear are named once in the legend under it. Coal, natural gas, and oil carry a quiet same-hue SVG grain (`generation-grain.tsx`); hydro, bioenergy, solar, wind, other renewables, and nuclear stay flat fills. Do not put that grain on the state-of-battery-power chart, which is a different two-series figure. Area animation reveals the stack with a left-to-right clip, so a shot taken mid-animation looks like the series ends early. The generation areas set `isAnimationActive={false}` so 2015–2025 is painted in full on first draw.

## Design Lessons

- Keep the existing visual system steady: emerald primary, Inter, `max-w-7xl`, white cards, gray borders, `rounded-xl`, and subtle shadows.
- Mobile at 375px is a first-class layout target. Tables, cards, charts, and controls need real responsive treatment.
- Dense energy data needs whitespace and progressive disclosure. Show the key number first, then let users inspect the details.
- Every public route should have useful metadata, accessible structure, and clear navigation back to live tools.
- A reusable design-system foundation now exists in `components/ui/` (`Container`, `Section`, `Card`, `Stat`, `Eyebrow`, `Badge`, `Button` + a `cn` helper) with tokens in `tailwind.config.ts`: an editorial `ink`/`paper`/`brand`/`gold` palette, `rounded-card`/`rounded-pill`/`rounded-panel`, `shadow-card`/`shadow-raised`, and a serif `font-display` (Newsreader via the `--font-display` var). A reusable `.reveal` scroll-in utility lives in `globals.css`. Prefer these primitives over hand-rolling boxes, inline hex, or ad-hoc `max-w-*` widths.
- The revamp direction (started June 2026) is narrative-first: the flagship story page `app/state-of-battery-power/` is the first vertical slice and the reference implementation for the new system. Propagate the primitives across existing pages (home, `/ev`, `/bess`, `/scoreboard`) rather than reintroducing per-page card/border styling. This supersedes the older "white cards, gray borders, rounded-xl" convention where the two conflict — keep the new editorial system as the forward path.
- Modern, not boxy: avoid "container in container in container with borderlines." One bordered surface per visual level — a `Card`/section owns the border; its inner groupings use a background tint (`bg-paper-200`), hairline dividers (`divide-y divide-ink/5`), or whitespace, NOT their own borders. Reserve borders for genuinely interactive controls (buttons, toggles, breadcrumb pills) where the border is the affordance. Prefer soft `shadow-card` + tint over hard outlines. This keeps dense pages (e.g. the scoreboards) feeling editorial rather than like a grid of bordered cells.
- De-nesting is a DELETE, not a recolor. A `sed` token migration (`border-gray-200` → `border-ink/10`) recolors inner borders but leaves the nesting intact — the page still reads as boxes-in-boxes. Actually remove the inner `border`/`border-*` classes (and for decorative pills/badges/eyebrows, drop the border entirely → borderless tinted). For interactive toggle/segment chips, convert selected/idle state from border-defined to FILL-defined: selected = `bg-white shadow-card` (or `bg-ink text-white`), idle = `bg-paper-200`/`bg-white/45 opacity-50`. Then VERIFY, don't assume: walk `main *` in the live preview, flag any bordered element whose nearest bordered ancestor is also bordered, excluding interactive tags and `border-t`/`border-b`-only hairline dividers. Target: zero non-interactive nested borders per route. (Energy scoreboard went 34 → 0 this way; the sed-only first pass had left all 34.)
- Watch for `sed` artifacts in class strings: chained opacity like `border-ink/10/60` (from substituting into `border-gray-200/60`) is an invalid Tailwind class that silently renders no border. Grep migrated files for `/(ink|paper|brand)\/[0-9]+\/[0-9]+/` after any token sed.
- A token sed also rewrites COMMENTS and string literals, not just classes — `s/emerald-/brand-/` turned `// emerald-500` PDF-color comments in `MarketingPDFButton.tsx` into `// brand-500` while the RGB stayed `rgb(16,185,129)`, making the comment lie. After a sed, `git diff` each file and revert any whose only change is comment/string text.
- The calculator pages are shared-component migrations more than page migrations: each pulls ~4 analysis components (commercial → ESGDashboard/CarbonCreditEstimator/BESSHeadToHead/DemandChargeHeatmap; grid → PolicyImpactSimulator/SubsidyROICalculator/BESSDeploymentMap/GridStabilityAnalysis; shared-residential → BuildingComparison/GreenCertEstimator/TenantROIPitch). Migrate the components in the same commit — the page looks unfinished until they match, and the win compounds across sibling routes. The reusable token sed is `scripts/ds-token-migrate.pl`.
- The nested-border detector needs two exclusions to measure CONTAINERS (the real complaint) and not chrome: skip tiny legend swatches (`getBoundingClientRect()` ≤ 20px both dims — a color key, not a container) and treat `border-ink/5` chart-grid cells (e.g. a scatter plot's 2×2 quadrant cross, `border-r`+`border-b` so not a pure hairline) as data-viz. A run flagging only those is effectively zero.
- Some country-gated pages (e.g. `/bess/shared-residential`) reset `selectedCountry` to `null` on mount and show a "pick a country" gate until the store is set. To exercise the real calculator in the preview, drive the `CountrySelector` — a custom `button[role=combobox]`, NOT a native `<select>`: click it, then click the option whose text matches the country. Run the detector AFTER selecting, or it only sees the gate.
- Make calculators readable as prose, not just KPI tiles: above the metric grid, add one plain-language sentence threading the key numbers ("A 205 kWh / 52 kW battery costs about RM310.5K to install, takes over 15 years to pay back, then nets about RM27.8K a year"). It stays honest even when unflattering (a modest-demand office really does take 15+ years) — on-brand, data first. Keep the detail tiles below for inspection.
- Shell gotcha (zsh): `perl -i -pe '…' $FILES` with an unquoted multi-path variable does NOT word-split in zsh — it's one filename, perl errors "No such file or directory" and changes nothing (no corruption, no edit). List files explicitly, or use `${=FILES}`.
- Data-driven components hide their nesting until rendered WITH data. The EV `ComparisonTable` only mounts its analysis cards (radar, score gauge, TCO, heatmap, smart-insights, mobile cards) when `selectedVehicles.length >= 2`; a fresh `/ev` load shows none of them, so the detector reads 0 nested while real nesting lurks. To verify, drive the actual state: select a country (`button[role=combobox]` — its options need a REAL pointer click via `preview_click`, synthetic `.click()` races the open/close), then click ≥2 QuickPick cards, scroll to mount lazy charts, THEN run the detector. The unexercised run found 0; the exercised run found 26 (SmartInsightsCards' 6 colored cards, StatsGrid's 10 stat groups, 7 WinnerBadges pills, 3 library tooltips).
- The detector must exclude Recharts' own elements (`.recharts-*`, `.recharts-tooltip-wrapper`) — they're library-rendered hover tooltips with borders, not our containers, and they pollute the count. Add `el.closest('.recharts-wrapper,.recharts-tooltip-wrapper')` to the skip list alongside interactive/hairline/tiny-swatch.
- When N inner cards are each a designed standalone bordered card but always render inside one outer frame (e.g. ComparisonTable's analysis modules in its `shadow-lg` container), prefer dropping the OUTER frame's border (one surgical change, keeps each card intact, and a borderless `shadow-lg` panel is more on-brand than a hard outline) over de-bordering every inner card.
- Next.js App Router: a nested `layout.tsx` that declares its OWN `<html>`/`<body>` to escape the root chrome does NOT work — it's flattened into the root document and the route still inherits the root layout's `<Header/>`/`<Footer/>` (this is why `/embed/*` showed the full site nav inside the iframe widgets). The "proper" fix is multiple root layouts via route groups, but that means moving every site route into a `(group)/` folder and has sharp edges (global `not-found`, metadata routes). A lower-risk fix that needs no route moves: a `'use client'` `SiteShell` that branches on `usePathname()` to render chrome for normal routes and nothing for the chrome-free ones — `usePathname()` is available during SSR for app-router client components, so the correct branch is server-rendered with NO hydration flash. Pair it with a transparent `body` (drop the global `bg-white`/`bg-paper` from `body{}` in globals.css) and let the chrome branch supply the site background via its own `bg-paper` wrapper, so the chrome-free routes (embeds) are transparent and blend into host pages. Verify the global 404 still gets chrome (it renders through SiteShell like any unmatched route).

- Node 26 / esbuild platform mismatch breaks vitest AND `tsx` scripts with a misleading "@esbuild/darwin-arm64 package is present but this platform needs the @esbuild/darwin-arm64 package instead" (same name on both sides = a version/binary mismatch, usually after a Node upgrade left a stale native binary). `npm run build` still works (Next uses webpack/SWC, not esbuild), so the env looks healthy until you run tests. Fix: `npm rebuild esbuild`, then re-run `npm test`. Don't reinstall node_modules wholesale for this.
- E2E groundwork (Playwright): the search→compare→export flow lives entirely on `/ev` and is DB-backed — the page fetches `/api/vehicles?country=…` only AFTER a country is picked, so a Playwright test must (1) open the Radix Select via `getByLabel('Select country')` then click the option (it's NOT a native `<select>`), (2) `waitForResponse` on `/api/vehicles`, (3) drive the search box (`getByLabel('Search for electric vehicles')`) → `getByRole('option')`, (4) assert the CSV `download` event. CI needs a Postgres service + `prisma db push` + `npm run db:seed` (the seed has SG Tesla + BYD available, which the spec relies on). The existing `quality` CI job deliberately has no DB; E2E is a separate job.
- Story/brand anchoring (KM correction on the Long Sunrise brief v2): never literalize the domain name into creative decisions — battery.mom does not mean a literal "mom" protagonist. Civilizational/future-of-energy storytelling anchors GLOBAL-first; Southeast Asia is the recurring "closer to home" sub-anchor (insets, one ladder stop, SEA rows on data boards), never the narrative spine. The human-scale device is "the hearth": one vignette per act, each on a different continent.

## 2026-07-09 — /sunrise build gotchas
- **Fixed background canvas + negative z-index**: a `fixed inset-0 -z-10` canvas paints
  BENEATH the opaque `bg-*` of `<main>`/`<body>` (CSS painting order: an element's own
  background paints before its negative-z descendants only within its own stacking
  context — an unpositioned parent's background still covers root-context negative-z
  children). Pattern that works: canvas at `z-0`, all page content wrapped in
  `relative z-10`, fallback bg kept on `<main>`.
- **Scroll-keyed keyframes vs real layout**: never hard-code document-fraction keyframes
  for act-based scrollytelling — section positions shift per viewport/content. Measure
  anchor elements at runtime (`getBoundingClientRect + fonts.ready + resize`) and remap
  document fraction → story progress piecewise-linearly (see `useStoryRemap` in
  `app/sunrise/page-client.tsx`).
- **Claude preview tab can wedge** on a route that once failed to compile (HMR keeps the
  Suspense fallback forever; fresh navigations still show `loading.tsx` while curl +
  headless Chromium render fine). Don't debug the app through the wedged tab — verify
  with a Playwright probe script (repo has @playwright/test; run the script from inside
  the repo so node resolves it).
- **Preview launch.json lives in the OUTER repo** (`/Users/km/Developer/Battery.mom/.claude/launch.json`,
  config name `batterymom`) — the session cwd is the wrapper repo, not the app submodule.
  Point it at `npm --prefix Battery.mom run dev` (port 9000) for live-edit verification.
- **Dark-page components on the dawn handoff**: anything rendered in Act V sits on the
  LIGHT paper/morning phase — translucent `bg-ink-900/60` surfaces wash out (use /90),
  and intro/caption text outside dark cards must be ink-toned, not paper-toned.

## 2026-07-09 — /sunrise v2 art-direction pass
- **Alpha-fading a keyframe-lerped element across a long span leaves ghosts.** The sky sun lerping alpha 1→0 over p 0.58→0.72 rendered as a dim "dead moon" smudge mid-transition. Fix: insert an explicit zero keyframe close after the last visible one (0.645) so the fade completes before the backdrop changes character.
- **Trapezoid envelopes must respect downstream scene boundaries.** The Earth-limb scene's fade-out (0.815→0.87) overlapped the sky's morning ramp (from 0.72→0.88), painting a gray planet dome over daylight. When two independent story-keyed layers coexist, diff their active ranges explicitly.
- **AI-slop tells to keep hunting in this repo's dark pages:** tracked-uppercase eyebrows, 3-stat card rows with colored numerals, translucent-dark rounded panels + backdrop-blur, pill badges, dingbat numerals, staggered reveal delays. Replacement language: hairline rules, huge Newsreader tabular figures, italic serif labels, `·` separators, paper cards on light phases.
- **A gradient is not a scene.** The single highest-leverage fix for "cinematic" pages: a horizon + ground plane + per-act silhouettes + one physically-behaved light source + film grain (seeded soft-light tile kills banding for free).

## 2026-07-10 — /sunrise v3 (copy · film cels · scrubbed title cards)
- **Baseline-mask reveals need blockified elements.** `overflow-hidden` and `transform` are ignored on non-replaced inline elements — the numeral/title masks only work because the parent is `flex` (flex items are auto-blockified). If a mask ever moves out of a flex row, add `block`/`inline-block` explicitly. Also pair `pb-N`/`-mb-N` on the h2/mask so tight `leading-[1.05]` descenders don't clip at rest.
- **Design not-yet-existing assets as a file contract.** FilmCel renders nothing until `loadeddata` and hides on `onError`, so the page ships complete with zero videos and each cel lights up when its file lands in `public/sunrise/`. Asset prompts + grade hexes + ffmpeg pipeline live in docs/sunrise-asset-prompts.html. Expected: one 404 per missing asset in console until clips are dropped in.
- **Copy pass rule that worked:** keep every figure byte-identical; spend the rewrite on rhythm (short open, long follow), verbs, and one motif callback per act (hearth→furnace→rooftop→swarm). Move sources into subs/notes so sentences stop reading like citations.
- **Flexbox crushes overflow-hidden masks silently.** `overflow-hidden` on a flex item zeroes its automatic min-size, so a long sibling (the act title) shrinks the numeral mask below its glyph width — "III" rendered as "II" and "IV" as a broken "Γ" with zero errors anywhere. Any masked element in a flex row needs `shrink-0`. Caught only by crop-zooming full-page screenshots; DOM width probes were misleading (the block inner always equals the mask width — measure glyph advance, not boxes).
- **Run-in labels + rewritten copy drift into duplication.** SeaInset renders "Closer to home — " before the copy; the v3 rewrite started the Act III line with "Closer to home," producing a doubled phrase. When a component supplies a run-in prefix, the copy field must be written headless (lowercase continuation) — note it next to the field.
- **FilmCel layout-shift tradeoff (accepted, documented):** cels render nothing until loadeddata, so a slow-loading cel above the reader inserts ~50vh of height. Mitigated by 100%-rootMargin preload, small files (0.2–2.5 MB), and browser scroll anchoring; revisit with reserved aspect-ratio placeholders only if it bites on real connections.

## 2026-07-11 — One Cinematic Work: v4 SceneStage + site unification (Phases A–C)
- **"Cinematic" means the media is the stage, not an exhibit.** v3's framed FilmCels failed
  the brief; the fix was architectural, not cosmetic: one fixed full-viewport SceneStage
  behind the words, scenes keyed to act anchors, crossfade cuts driven by a scroll
  playhead (`scrollY + 0.45vh`), and a left-anchored reading column over a directional
  scrim. When a redesign request says "not cinematic enough," check whether the media is
  IN the composition or ON it before polishing anything.
- **Storyboard-before-code gate earns its cost.** Two rounds were built beautifully wrong;
  the reviewable storyboard (per-scene shot/words/cut) caught the framing problem for the
  price of one HTML doc. For taste-critical work, gate implementation on an artifact the
  user can veto.
- **Drive scroll-keyed video state with direct DOM writes.** SceneStage sets opacity and
  play/pause on refs inside one rAF scroll handler; React re-renders only on mount/caption
  changes. Nine full-screen videos scrub smoothly. setState-per-scroll-frame here would
  re-render the whole page.
- **Cached media races React event handlers.** A video that finishes loading before
  `onLoadedData` attaches never fires it — the homepage hero stayed at opacity 0 with
  `readyState 4`. After mount, check `el.readyState >= 2` directly and set the ready state
  yourself. Applies to images (`el.complete`) too.
- **The in-app Browser pane compositor can't be trusted for full-page visual audits** (it
  rendered only a thin strip of the viewport this session). The repo-local Playwright
  probe (script inside the repo, screenshots to scratchpad) is the standard; delete the
  probe after.
- **Chart-palette migrations parallelize cleanly with a theme contract.** Writing
  lib/chart-theme.ts first (role names: primary/comparison/highlight/negative + explicit
  mapping rules like "peers get emerald-vs-gold, counterfactuals get emerald-vs-gray")
  let three agents recolor 7 files without a single conflicting judgment. Also: grep the
  prose after recoloring — one InfoTooltip still said "(red)…(blue)".

## 2026-09-22 — EV vs ICE breakdown uses value lost
- On `/calculators/ev-vs-ice`, keep the original cost-breakdown chrome: horizontal grouped bars, EV `#0E9F6E`, ICE `#A7AFA4`, original axis and tooltip style, original category order. The only semantic change: drop Purchase and Resale (negative / money-back) bars; one positive Value lost row = purchase − resale; then Energy / Fuel, Maintenance, Insurance. Do not rank by length, recolor ICE to near-black, or add a second encoding. Tooltip may show sticker and resale on the value-lost row. `evTCO` / `iceTCO` stay purchase + energy + maintenance + insurance − resale. Summary cards still show resale as a positive amount the owner gets back.

## 2026-09-21 — Malaysia no longer has a single Tariff A kWh rate
- Peninsular domestic bills under RP4 (Jul 2025–Dec 2027) are generation + capacity + network (44.43 sen/kWh at ≤1500 kWh) plus monthly AFA and a consumption-dependent Energy Efficiency Incentive. AFA and the RM10 retail charge are waived at ≤600 kWh. Do not relabel the old “Tariff A block 1–200 kWh” figure as current. Publish the official energy+capacity+network unit rate and spell out AFA/EEI, or pick a documented consumption level and show the blend.
- Vehicle catalogue prices for Malaysia change on MITI CBU rules and facelifts: Tesla Model Y Long Range AWD was dropped in Jul 2026; the 2026 Atto 3 renamed Standard/Extended to Ultra/Premium. Mark discontinued trims `isAvailable: false` rather than inventing replacement specs.
- When KM wants “what a typical reader pays”: use the GST/VAT-inclusive household bill (Singapore 34.78¢, not EMA’s 31.91¢ before GST) and a documented kWh/month blend for progressive tariffs, then footnote the official bands. Do not invent a COE add-on on top of a Singapore “from” price — only replace rows that have a sourced drive-away quote, and mark the rest as manufacturer-from.
- Tesla Powerwall 3 “97.5% efficiency” on tesla.com/datasheet is solar-to-home/grid (PV passthrough), not battery round-trip. The battery-path figure is 89% solar-to-battery-to-home/grid. Do not store 97.5 in `roundTripEfficiency`. Singapore COE-inclusive drive-away quotes move every bidding round — re-fetch PaperValue/SGCarMart the day you ship, not a May launch story.
- Singapore Tesla “RWD 110” is Category A: 110 kW, not the global RWD motor. Copying a donor Model Y RWD row leaves 220 kW / NMC / 6.9 s on a Cat A trim. Match the 110 kW, 350 Nm, 9.6 s, 201 km/h, LFP 62.5 kWh, 15.3 kWh/100 km, 175 kW DC figures from the Tesla Singapore spec (Straits Times 28 Mar 2025) when the live list still names the trim “Premium RWD 110”.

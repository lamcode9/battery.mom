# battery.mom — Master Build Plan

> **Mission:** Batteries are the new oil. battery.mom exists to give homeowners, businesses, installers, and policymakers the clearest possible data — real costs, real payback periods, real adoption rates — so the energy transition moves as fast as possible.
>
> **Principles:** No ads. No sponsors. No affiliate links. Independent data, updated monthly, with a Southeast Asia focus expanding globally.

---

## Status Legend

- [ ] Not started
- [~] In progress
- [x] Complete

---

## BATCH 0 — Foundation & Critical Fixes

*These are broken right now and hurt every visitor or crawler. Ship first.*

### 0.1 Homepage (`/`)
- [x] Design and build a real homepage to replace "Content coming soon..."
  - [x] Hero section: headline ("Clear data for the energy transition."), subheading, two CTA buttons (Compare EVs → `/ev`, Size Your Battery → `/bess/home`)
  - [x] Three-pillar feature cards: EV Comparison, Home BESS, Shared Residential BESS (with "Coming Soon" badges on Commercial & Grid)
  - [x] Live stats ribbon: vehicles tracked, countries covered, BESS products listed (fetched from API/data)
  - [x] "What you'll find here" section (icon grid) — adoption scoreboards, side-by-side comparisons, monthly datasets, straightforward breakdowns
  - [x] Minimal manifesto footer: "No ads, no sponsors, no affiliate links. Just data."
  - [x] Mobile-responsive, consistent with existing emerald/gray design system

### 0.2 Navigation & Routing Fixes
- [x] Create `/bess` index page (landing page with links to all BESS sections)
- [x] Create `/scoreboard` page with "Coming Q2 2026" — countries & metrics preview
- [x] Create `/calculators` page — hub linking live + upcoming calculators
- [x] Verify all nav links resolve without 404

### 0.3 SEO Critical Fixes
- [x] Fix `robots.txt` — change `your-domain.com` → `battery.mom`
- [x] Expand `sitemap.ts` to include `/ev`, `/bess/home`, `/bess/shared-residential`, `/bess/commercial`, `/bess/grid`, `/about`, `/scoreboard`, `/calculators`, `/insights`
- [x] Add `export const metadata` to `/ev/page.tsx` (title, description, OG)
- [x] Add `export const metadata` to all BESS pages (commercial, grid, bess index)

### 0.4 Footer & Small Fixes
- [x] Update copyright year to 2026
- [x] Update "Last full update" to February 2026
- [x] Review all hardcoded dates across the codebase — audited app/components/lib/data/content; footer copyright now `new Date().getFullYear()`, removed stale "full launch 2026" copy on /about. All other year/date literals are intentional data-vintage labels.

---

## BATCH 1 — Content Hub Pages

*These pages are promised in the nav and about page. Build real shells with clear value.*

### 1.1 Calculators Hub (`/calculators`)
- [x] Calculator directory page with cards linking to existing + future tools
  - [x] Card: Zero-Bill Calculator → `/bess/home` (already built, link out)
  - [x] Card: Shared BESS ROI → `/bess/shared-residential` (already built, link out)
  - [x] Card: EV vs ICE Total Cost of Ownership → `/calculators/ev-vs-ice` (new)
  - [x] Card: Solar Payback Calculator → `/calculators/solar-payback` (new)
  - [x] Card: EV Charging Cost Calculator → `/calculators/ev-charging-cost` (new)
- [x] Build `/calculators/ev-vs-ice` — 5/10-year TCO comparison (EV vs petrol equivalent)
- [x] Build `/calculators/solar-payback` — roof size, yield, tariff → payback + 25yr savings
- [x] Build `/calculators/ev-charging-cost` — battery, rate, distance → monthly/annual cost

### 1.2 Scoreboard (`/scoreboard`)
- [x] Country ranking dashboard for SG, MY, ID, TH, VN, PH
  - [x] EV adoption rate (% of new car sales)
  - [x] Total EVs on the road
  - [x] Charging infrastructure density
  - [x] Residential BESS penetration
  - [x] Solar installed capacity (GW)
- [~] Trend sparklines (monthly/quarterly) — deferred to Batch 3 (need historical data)
- [~] Interactive or static SEA map (color-coded by adoption stage) — deferred to Batch 3
- [x] Data source citations
- [x] "Updated monthly" badge with last-update date

### 1.3 Insights (`/insights`) — Editorial Infrastructure
- [x] Set up static content system (`/content/` directory with TSX components)
- [x] Article listing page — grid of cards with title, date, reading time, category tag
- [x] Individual article page template with proper metadata + structured data (`Article` schema)
- [x] Write 3 seed articles:
  - [x] "What is LFP vs NMC? Why it matters in tropical climates"
  - [x] "Can a 13.5 kWh battery zero your electricity bill in Malaysia?"
  - [x] "EV adoption in Southeast Asia: 2024 year in review"
- [x] RSS feed for insights

---

## BATCH 2 — Commercial & Grid BESS

*Extend the BESS offering to business and industrial users.*

### 2.1 Commercial BESS (`/bess/commercial`)
- [x] Use-case selector: Office / Retail / Factory / Data Centre (sets default load profiles)
- [x] Demand charge reduction (peak shaving) calculator
  - [x] Inputs: monthly peak demand (kW), tariff, demand charge rate
  - [x] Outputs: recommended battery size, annual savings, payback
- [x] BESS product comparison table for large systems (100+ kWh)
- [x] Revenue stacking explainer (peak shaving + backup + grid services)
- [x] Case study placeholder cards

### 2.2 Grid / Industrial BESS (`/bess/grid`)
- [x] LCOE/LCOS calculator
  - [x] Inputs: system size (MWh), cycles/yr, project lifetime, capex, O&M
  - [x] Output: $/kWh-cycle levelised cost
- [x] Regional deployment map (known grid-scale projects in SEA)
- [x] Technology comparison: LFP vs flow batteries vs sodium-ion at scale
- [x] Policy & tender tracker per country
- [x] Data table: known grid BESS installations (project, developer, MW/MWh, chemistry, year)

---

## BATCH 3 — Data Depth & Quality

*Make the existing tools richer and more trustworthy.*

### 3.1 EV Section Enhancements
- [x] Individual vehicle detail pages (`/ev/[id]`) with full spec sheet + charts
- [x] EV vs EV head-to-head comparison mode (`/ev/compare/[id1]/[id2]`) with side-by-side specs, charts, and "Compare" buttons on detail pages
- [x] Historical price tracking — PriceSnapshot model, monthly cron, price history API + chart on detail pages
- [x] User-facing "suggest a correction" flow — `/suggest-correction` with form + API + DB model
- [~] Image support — vehicle photos from manufacturers or approved sources (imageUrl field exists, needs data population)

### 3.2 BESS Section Enhancements
- [x] BESS product detail pages (`/bess/products/[slug]`) with specs, degradation curve, radar chart, pricing, backup scenarios
- [x] Installer directory or links per country
- [ ] Real customer testimonials. The /bess/case-studies quotes had no source and were removed. The page is labeled Scenarios until a documented install exists. Do not put named speech back without a source to cite.
- [x] Degradation curve visualisation (capacity over cycles/years) — included in BESS detail pages

### 3.3 Data Pipeline
- [x] Automate data freshness badge per vehicle/BESS product — DataFreshness component with color-coded staleness
- [x] Add data provenance tracking — `dataSourceUrl` + `dataLastVerified` fields on Vehicle model
- [x] Build admin dashboard for data review
- [x] API documentation page for developers — `/api-docs` with full endpoint docs

### 3.4 Technical Debt (resolved this batch)
- [x] Fixed all TypeScript errors (0 errors with `--skipLibCheck`)
- [x] Fixed ESLint unescaped entity warnings
- [x] Added footer navigation links to all new pages
- [x] Added RSS feed link to layout `<head>`
- [x] Updated sitemap with all new pages (installers, case studies, contact, contributors, etc.)
- [x] Created reusable ErrorBoundary component
- [x] Created Skeletons component library (Section, CardGrid, Table, Chart, Stats)
- [x] Fixed null-safety issue in vehicle detail page `formatCurrency`

### 3.5 InfoTooltips — Contextual Help (completed)
- [x] Built reusable `InfoTooltip` component (`/components/InfoTooltip.tsx`) — hover/focus/click, auto-repositioning, dark theme, accessible
- [x] EV detail pages (`/ev/[id]`) — 16 tooltips (Range, WLTP/EPA, Efficiency, Battery kWh, 0-100, Power, Torque, etc.)
- [x] EV vs ICE calculator — 11 tooltips (TCO, home charging, ownership, break-even, CO₂, assumptions)
- [x] Solar Payback calculator — 11 tooltips (kWp, roof quality, payback, self-sufficiency, assumptions)
- [x] EV Charging Cost calculator — 8 tooltips (efficiency, home/DC charging, petrol savings)
- [x] Scoreboard — 7 tooltips (adoption rate, charger density, EV growth, policy grades)
- [x] BESS Commercial — 12 tooltips (peak shaving, demand charges, arbitrage, revenue stacking)
- [x] BESS Grid — 10 tooltips (LCOE, LCOS, NPV, battery tech comparison)
- [x] BESS Product Detail — 9 tooltips (capacity, efficiency, DoD, degradation, LCOS)
- [x] EV Comparison — 2 tooltips (radar chart normalization, efficiency comparison)
- [x] Shared Residential BESS — 7 tooltips (system cost, per-household cost, blackout protection)

---

## BATCH 4 — Growth & Community

### 4.1 SEO & Distribution
- [x] OG image generation (dynamic per page)
- [x] Newsletter signup (monthly data digest) — `NewsletterSignup` component (card + inline variants), API route, Prisma model, homepage + footer
- [x] Social sharing cards for each calculator result — `ShareResult` component with URL state encoding, clipboard copy, Web Share API, X/Twitter/WhatsApp/Telegram; added to all 3 calculators with URL state restoration
- [x] Performance audit (Core Web Vitals, lighthouse) — removed `ignoreBuildErrors`, added security/caching headers, font `display: swap`, viewport export, preconnect, `optimizePackageImports` for date-fns
- [x] i18n groundwork (Bahasa Malaysia, Thai, Vietnamese, Bahasa Indonesia) — `lib/i18n/` dictionary system (typed base + partial locale overrides with English fallback), server `getDictionary` loader, locale config/metadata, 6 unit tests. Core chrome seeded; adoption plan (routing, switcher, wiring) in `docs/i18n-groundwork.html`. Page content + native review still pending.

### 4.2 Community Features
- [x] "Compare and share" — shareable link for any vehicle comparison
- [x] Embed widgets for other sites (comparison table, scoreboard) — 3 embed widgets (`/embed/scoreboard`, `/embed/ev-stats`, `/embed/ev-vs-ice`) + embed code generator page (`/embed-widgets`), iframe-friendly layout, CSP frame-ancestors
- [x] Feedback / contact form
- [x] Contributor credits page

---

## Technical Debt & Hygiene

- [x] Remove `ignoreBuildErrors: true` from `next.config.js` and fix all TS errors
- [x] Remove no-op `VehicleProvider` wrapper — removed from store + 3 consuming pages
- [x] Deduplicate `CURRENCY_BY_COUNTRY` / `COUNTRY_NAMES` maps (repeated in 5+ files)
- [x] Extract shared constants to `/lib/constants.ts` — `COUNTRY_NAMES`, `CURRENCY_BY_COUNTRY`, `CURRENCY_SYMBOLS`, `COUNTRY_OPTIONS`, `formatCurrency`, `formatCompact`, `formatPrice`; 16 files updated
- [x] Add unit tests for calculator functions (zero-bill, cost-per-km) — 60 tests across 2 files (`constants.test.ts`, `utils.test.ts`), Vitest framework
- [x] Add E2E tests for critical flows (search → compare → export) — Playwright (chromium) config + `e2e/compare-export.spec.ts` driving the real flow on /ev; `test:e2e` scripts; CI `e2e` job with a Postgres service + seed. Verified passing locally.
- [x] Set up CI pipeline (lint + type-check + test) — GitHub Actions workflow: lint → tsc → vitest → build
- [x] Implement proper error boundaries per section — segment-level `error.tsx` for ev / scoreboard / bess / calculators / insights (shared `SectionError`), plus a per-chart `ErrorBoundary` baked into `ResponsiveContainer` so one chart failing degrades to an inline message instead of blanking the section.
- [x] Add loading skeletons for all data-fetching pages — `loading.tsx` wired for the DB-backed dynamic routes (ev/[id], ev/compare, embed/ev-stats) using the `Skeletons` library; static/SSG routes render instantly and don't need one.

---

## Design System Notes

- **Primary:** Emerald (`#10b981` / `ev-primary`) — energy, growth, trust
- **Secondary:** Blue (`#3b82f6`) — data, technology
- **Accent:** Cyan (`#06b6d4`) — fresh, modern
- **Dark:** Slate (`#1e293b`) — authority
- **Font:** Inter — clean, readable at all sizes
- **Spacing:** Consistent `max-w-7xl` container, `px-4` mobile padding
- **Cards:** White bg, `border-gray-200`, subtle shadow, `rounded-xl`
- **Charts:** Recharts with emerald/cyan/violet palette
- **Tone:** Confident, minimal, data-first. No hype. No fluff.

---

*Last updated: 2026-06-25*

# battery.mom — Agent Brief

Single canonical, platform-agnostic agent context for **battery.mom**. Authoritative for every agent (Claude, Codex, Cursor, and any future tool). `CLAUDE.md` in this folder is a thin wrapper that imports this file. Global rules in `~/.claude/CLAUDE.md` and workspace rules in `/Users/km/Developer/AGENTS.md` also apply; nothing from those is duplicated here.

## File format rule

Always create new docs as `.html`, never `.md`. Applies to plans, audits, reports, summaries, briefs, handoffs, brainstorms, mockups, and any new deliverable file. Exception: canonical files referenced by name (CLAUDE.md, AGENTS.md, README.md, MEMORY.md, lessons.md, RELEASE_NOTES.md, package metadata, and any pre-existing `.md` already wired into the workflow or imported by code). Edits to existing `.md` files keep their format.

## Reading order

1. This file (`AGENTS.md`) — mission, stack, layout, verification rules.
2. `docs/` — deliverables relevant to the current task.
3. `prisma/schema.prisma` — DB model.
4. `README.md` — product promise and live scope.

## Role

You are the implementation partner for **battery.mom**, an independent, ad-free energy design and comparison platform for Southeast Asia.

Think like a senior product engineer, product designer, and data editor at the same time. The product earns trust through useful calculations, transparent assumptions, accessible interfaces, and clean implementation.

## General working rules (adopted from the CentsCheck agent guide)

- Work to production quality. Avoid sloppy, temporary, or unexplained changes.
- Think from first principles before changing code, especially around user trust, data interpretation, and architecture.
- Prefer the smallest change that genuinely solves the problem.
- Diagnose root causes for bugs, failing builds, broken routes, or suspicious data instead of patching symptoms.
- Verify before calling work complete. Use the narrowest useful check for the change, then broaden when the risk is higher.
- Keep a continuous learning loop. When a mistake, correction, gotcha, or reusable pattern appears, update `lessons.md`.
- For multi-step or architectural work, create or update a short plan before editing. Use `pipeline/PLAN.md` when it fits the product roadmap, otherwise keep the plan in the active task context.

Do not adopt CentsCheck-specific rules such as Flutter UI conventions, CentsCheck feature-doc requirements, pool currency rules, App Store Connect setup, or frosted-glass design mandates. Those belong to the CentsCheck app, not this project.

## Playbooks — contextual references

Use relevant sections of `/Users/km/Developer/playbooks/` when making these decisions:

- `thinking.md` — uncertainty, conflicting evidence, difficult debugging.
- `engineering.md` — architecture, implementation, performance, security.
- `design.md` — layout, interaction, visual quality, accessibility.
- `product.md` — pricing, positioning, growth, roadmap.

Do not preload all playbooks or require a full read for routine changes.

Full routing + bootstrap rule: `/Users/km/Developer/AGENTS.md` §Playbooks.

## Project Context

- Mission: help homeowners, installers, businesses, and policymakers across Southeast Asia evaluate EVs, solar, and battery storage with real numbers.
- Regions: Singapore, Malaysia, Indonesia, Thailand, Vietnam, and the Philippines.
- Trust model: no ads, no sponsors, no affiliate pressure. Data integrity is the product.
- Core live areas: EV comparison, Batteries at Home, calculators, BESS pages, insights, scoreboard, embeds, and API-style routes.

## Source Of Truth

Read these before making broad claims or structural changes:

- `README.md` for the product promise and live scope.
- `copilot-instructions.md` for product voice, design principles, and code conventions.
- `lessons.md` for current operating lessons.
- `LEARNINGS.md` for the longer historical build log.
- `pipeline/PLAN.md` and related `pipeline/*.md` files for planned product direction.
- `data/README.md`, `data/DATA-MAINTENANCE.md`, and `data/VEHICLE_DATA_FORMAT.md` before changing data flows.

## Tech Stack

- Next.js 14 App Router with TypeScript.
- Tailwind CSS with an emerald-led visual system.
- Prisma and PostgreSQL for vehicles.
- JSON-backed BESS data under `data/BESS-Home-data.json`.
- Zustand for client comparison state.
- Recharts for charts and responsive data visualization.
- Vercel hosting and cron routes.

## Workflow

1. Start by checking `lessons.md` and the relevant project docs.
2. Inspect the actual code or data path before making claims.
3. Keep edits tightly scoped to the requested behavior.
4. Preserve existing design, route, data, and component patterns unless there is a clear reason to change them.
5. Update docs or lessons when the work changes durable behavior, exposes a data assumption, or reveals a reusable gotcha.
6. Verify with the most relevant checks, such as `npm test`, `npm run lint`, or `npm run build`.
7. Report what changed and what was verified.

## Engineering Rules

- Avoid `any` unless the reason is documented close to the code.
- Do not silence TypeScript, lint, or runtime errors without explaining the specific reason.
- Keep page files lean. Use `app/[route]/page.tsx` for route metadata and server composition, with `page-client.tsx` for substantial interactivity.
- Use pure data fetchers under `lib/data-fetchers/`.
- Put domain logic in `lib/utils/` or shared helpers instead of burying calculations inside large components.
- Consolidate repeated constants in `lib/constants.ts` or a domain-specific constants module when reuse becomes clear.
- Use semantic HTML and accessible controls.
- Every user-facing route should have meaningful metadata.
- Do not add dependencies unless they clearly reduce risk or complexity.

## Design Rules

- Data first, decoration second.
- Use the existing visual language: Inter, emerald primary, white cards, gray borders, `rounded-xl`, subtle shadows, and `max-w-7xl` containers.
- Keep mobile layouts polished at 375px width.
- Use charts, tables, comparison cards, and progressive disclosure to make dense energy data understandable.
- Avoid vague marketing copy. Prefer specific numbers, assumptions, ranges, and source notes.
- Placeholder pages must still feel intentional. Avoid bare "Coming Soon" pages.

## Data Integrity Rules

- Do not invent EV, tariff, solar, incentive, or BESS values.
- Check the relevant data source before changing calculations.
- Vehicles are backed by Prisma/PostgreSQL and seeded or synced from `data/vehicles-data.json`.
- BESS home products currently load from JSON.
- Country-specific energy assumptions can differ by use case. Residential tariffs, DC charging rates, commercial tariffs, and grid-scale assumptions are not interchangeable.
- When publishing content or calculators, expose assumptions clearly enough that a user can understand the result.

## Security And Operations

- Never commit secrets, API keys, private env files, or database credentials.
- Treat admin routes, cron routes, and data mutation scripts as higher-risk areas.
- Check existing environment and deployment assumptions before changing Vercel, Prisma, cron, or database behavior.
- Prefer safe, reversible scripts for data updates.

## Verification

- `npm run lint && npm run build` before declaring done.
- Verify the zero-bill calculator on a reference case for any tariff / calculation change.

## Work journal

Fires on observable intra-session triggers — (a) a meaningful work block completes (feature shipped, fix landed, plan/audit written, commit/push), or (b) the user signals wrap-up ("alright", "ship it", "thanks", "done", "what's next"). When either fires, run `/lamonade-auto-work-journal --project "Battery.mom" --content "..."` **before closing the response**. One entry per day (appends on repeat). Same triggering style as the `tasks/lessons.md` / `tasks/todo.md` rules. Full rule: `/Users/km/Developer/CLAUDE.md` §"Work journal rule".

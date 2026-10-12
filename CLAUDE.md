# GC — Government & Citizens

Civic platform connecting citizens with government. Three account tiers: individuals, officials, organizations. Personal accounts stay separate from official roles.

- `frontend/` — Vite + React + TypeScript. Run from that folder: `npm run dev`, `npm run lint`, `npm run build`.

## Frontend map

- `src/flow.ts` — form data, step list, `next()` routing, module rules.
- `src/api.ts` — the only place screens read platform data from. `src/seed.ts` — all demo data and the three demo accounts; only `api.ts` imports it.
- `src/ui.tsx` — shared pieces (`Screen`, `Field`, `Select`, `Choices`, …). `src/index.css` — tokens and every style.
- `src/screens/` — one component per step, in `account.tsx`, `personal.tsx`, `office.tsx`. Signed-in screens: `citizen.tsx` (the five tabs) and `workspace.tsx` (office workspace), both inside `Shell` from `ui.tsx`.
- `App.tsx` maps the URL hash (`#step` or `#step/id`) to a screen, keeps the session in `sessionStorage`, and blocks signed-in screens without the right context.
- Inputs are native and uncontrolled; `Screen` reads the form into flow data. Give a control a `name` that is a key of `Data`. Passwords and codes get no `name`, so they never enter app state.
- Source design: Figma "Onboarding / Sign-in" (file key `f6oRwaMnTVgD1xIK3OkECw`). Wireframes only, no visual design yet.

## Open items

- No backend. `seed.ts`, read through `api.ts`, stands in for it; no password is checked. Only ZIP 22030 maps to a district, other addresses resolve to their state.
- Citizen tabs and the office workspace were laid out from the Access Matrix and GC 101, not from Figma designs.
- Not built: user-to-user messaging, creating polls or communities, uploading legislation, election information, committees.
- Occupation, income, household and religion lists are our own picks (NAICS, Census-style, major traditions); the spec leaves them open.
- Undecided: third-party sign-in providers, ID-check provider, organization onboarding, state and local government levels.

## Never

- Add `Co-Authored-By`, `Claude-Session`, or "Generated with" lines to commits or PRs.
- Force-push, rewrite pushed history, `git reset --hard`, `git clean`, or `--no-verify`.
- Push, open a PR, or merge unless asked.
- Read, print, or commit `.env` files, keys, or tokens. Only `VITE_`-prefixed public values in frontend code.
- Put real personal data in code, fixtures, logs, or commits. Fake data only.
- Log tokens, passwords, or demographic fields.
- Add analytics, tracking, or third-party scripts.
- Use `dangerouslySetInnerHTML`, `eval`, `any`, or `@ts-ignore`.
- Collect citizenship documents. Political identity is always optional.

## Ask first

- Adding or upgrading a dependency.
- Deleting or moving files.
- Changing config, CI, or anything touching auth, roles, or the access matrix.
- Any requirement that is unclear or conflicts between docs. Do not invent product behavior.

## Scope

- Do only what was asked. No drive-by refactors, renames, or extra files (docs, READMEs, tests) unless requested.
- Smallest change that works. Native platform and existing code before new code or libraries.
- `npm run lint && npm run build` must pass before any commit.

## Product rules

- "GC Sign-In Flows / Demographics" spec wins over "GC 101" where they conflict.
- "GC Master Access Matrix V3" defines what each tier can see and do.
- Every screen works from 390px to 1440px. Onboarding and citizen screens are designed phone-first; office, agency, and org workspaces desktop-first.
- WCAG 2.2 AA: semantic HTML, labelled inputs, keyboard access, visible focus, sufficient contrast.

## Replies

- Short. Numbered steps. No recaps.

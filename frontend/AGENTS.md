# AGENTS.md

Operational map for AI coding agents (and humans) working in **liquid-glass**.

When docs and code disagree, **prefer the code and this file**, then update the stale doc in the same change.

---

## What this project is

A **frontend-only** starter: React + Vite + TypeScript with a complete **liquid glass** design system.

It is **not** a full product. Demo pages and demo auth exist only to prove the shell, login gate, tokens, and primitives. Product work should replace `src/pages/`, swap the mock session for real auth, and extend `App.tsx` (or introduce a real router).

---

## Repository layout

```text
.
├── AGENTS.md
├── README.md
├── doc/design-system.md
├── public/backgrounds/     # stage photos
├── src/
│   ├── App.tsx             # demo auth gate + shell + page switcher
│   ├── main.tsx            # applyRandomBackground + installLiquidLens
│   ├── components/auth/    # LoginPanel
│   ├── components/layout/  # AppShell
│   ├── components/ui/      # GlassPanel, Button, GlassInput, GlassSelect, Badge
│   ├── lib/                # background, i18n, liquidLens, session, storage
│   ├── pages/              # demo Home / Components / Settings
│   └── styles/             # tokens.css + global.css
└── package.json            # npm scripts
```

---

## Hard rules for agents

1. **Keep the liquid-glass look coherent.** Prefer tokens in `src/styles/tokens.css` over new hex/rgba literals. If a new surface needs a color, add a token first when it will be reused.
2. **CSS modules for component styles.** Match the existing pattern (`Component.tsx` + `Component.module.css`). Do not introduce Tailwind / styled-components unless the user explicitly asks.
3. **Interactive controls that should feel “glass” get `glass-lens`.** The class is global; pointer tracking is installed once in `main.tsx` via `installLiquidLens()`.
4. **Do not strip reduced-motion support** in `global.css`.
5. **Stage backgrounds stay under `public/backgrounds/`.** Update `BACKGROUND_IMAGES` in `src/lib/background.ts` when adding/removing files. Keep total asset weight reasonable for a template.
6. **Package manager is npm only** in this repo. Do not add a second lockfile (pnpm/yarn) without an explicit request.
7. **Node 20+.** Scripts: `npm run dev` / `build` / `lint` / `preview`.
8. **No product business logic in the template core.** Keep this repo generic: shell + UI primitives + demo auth + docs.
9. **i18n:** user-facing demo strings live in `src/lib/i18n.ts` (`en` + `zh` + `ja`). New demo UI should add all three languages.
10. **Path alias:** `@/*` → `src/*` (Vite + tsconfig). Use it for imports.
11. **Demo auth is intentional.** `src/lib/session.ts` stores a sessionStorage demo session (`demo` / `demo`). Replace it when integrating a real backend — keep `LoginPanel` presentation separate from credential verification.

---

## Design system (short)

| Concern | Where |
| --- | --- |
| Colors, glass, radii, motion, spacing | `src/styles/tokens.css` |
| Body stage bg, `.glass-lens`, animations | `src/styles/global.css` |
| Sign-in screen | `src/components/auth/LoginPanel.*` |
| Sidebar + hero workspace | `src/components/layout/AppShell.*` |
| Panels / buttons / fields / badges | `src/components/ui/*` |
| Random stage photo | `src/lib/background.ts` |
| Pointer lens tracking | `src/lib/liquidLens.ts` |
| Demo session | `src/lib/session.ts` |

Full write-up: [`doc/design-system.md`](doc/design-system.md).

### Shell contract

`AppShell` is generic over page ids:

- Pass `pages: { id, label, description, icon? }[]`
- Control `activePageId` + `onPageChange` from the parent
- Brand / tagline / language / optional user+logout slots are props

Do **not** hardcode product page ids inside `AppShell`.

### Auth contract

- `LoginPanel` is presentational: language switcher, username/password, async `onSubmit`
- Parent owns success/failure and session persistence
- Demo credentials live only in `src/lib/session.ts`

### Primitive contract

- `GlassPanel` — frosted container (`--glass-bg`, blur, shadow)
- `Button` — `primary` | `secondary` | `ghost` | `danger` (lens on by default)
- `GlassInput` — labeled glass text field
- `GlassSelect` — custom frosted listbox (`src/components/ui/GlassSelect.*`); **do not use native `<select>`** for UI chrome (OS menus break the glass look). API: controlled `value` + `options: { value, label }[]` + `onChange`
- `Badge` — `neutral` | `accent` | `success` | `warn` | `danger`, optional pulse

Prefer composing these before inventing one-off panel chrome.

---

## Boot sequence (do not break casually)

`main.tsx` must keep this order:

1. Import `global.css` (tokens + glass utilities)
2. `applyRandomBackground()` — sets `--app-bg-image`
3. `installLiquidLens()` — document-level pointer tracking for `.glass-lens`
4. React `createRoot(...).render(<App />)`

Removing step 2 or 3 silently degrades the brand look.

---

## Testing / verification

There is no unit-test suite by default. Before finishing UI work:

```bash
npm run lint
npm run build
```

Manual check:

1. Load app → login gate appears
2. Sign in with `demo` / `demo`
3. Open Home → Components → Settings
4. Confirm glass panels, lens hover, language toggle (custom glass menu — not OS select), logout returns to login
5. Switch language to 日本語 and confirm shell + login + settings copy
6. Confirm mobile sidebar collapse (`max-width: 960px`)
7. On a phone / narrow viewport: stage photo stays readable, safe-area padding holds under notches, login + shell touch targets feel full-width, horizontal nav scrolls without clipping
8. On mobile: language + signed-in account are hidden behind the top-right three-line button (not floating mid-chrome)

---

## What not to do

- Do not commit `.env`, `node_modules/`, or `dist/`.
- Do not replace CSS modules with inline style sprawl for layout chrome.
- Do not add heavy UI frameworks “for convenience” without being asked — this template’s value is a light, owned design system.
- Do not rename design tokens in a breaking way without updating all consumers and `doc/design-system.md`.
- Do not hardcode real production credentials into the demo login path.

---

## Spawning a new product from this template

1. Copy the repo or use “Use this template” on GitHub.
2. Rename package / title / brand strings.
3. Replace `src/pages/*` and wire routes in `App.tsx` (or add React Router if multi-URL navigation is required).
4. Keep `styles/`, `AppShell`, `LoginPanel`, `ui/`, `liquidLens`, and `background` unless the product intentionally rebrands.
5. Replace `src/lib/session.ts` with real auth; keep `LoginPanel` UI.
6. Add API client modules under `src/api/` when a backend exists; optional `VITE_API_BASE_URL` is already reserved.

---

## Where to read more

| Need | Doc |
| --- | --- |
| Human quick start | `README.md` |
| Tokens, glass recipe, customization | `doc/design-system.md` |

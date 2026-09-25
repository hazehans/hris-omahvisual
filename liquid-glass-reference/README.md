# Liquid Glass

Reusable **React + TypeScript + Vite** frontend starter with a complete **liquid glass** UI system.

Use this as the default visual + layout baseline for product UIs: frosted panels, stage photo backgrounds, pointer-tracked glass lens controls, a sign-in screen, and a responsive app shell.

## Features

- **Design tokens** (`src/styles/tokens.css`) — colors, glass blur, radii, motion, spacing
- **Global liquid glass utilities** (`src/styles/global.css`) — stage background, `.glass-lens`, enter animations, reduced-motion support
- **Login screen** — frosted two-column sign-in gate with demo session (`demo` / `demo`)
- **App shell** — sticky sidebar nav, hero header, language switcher, live badge, logout
- **UI primitives** — `GlassPanel`, `Button`, `GlassInput`, custom glass `GlassSelect` (no native OS menus), `Badge`
- **Stage backgrounds** — random photo per browser tab from `public/backgrounds/` (mobile-tuned cover + veil)
- **Mobile-ready shell** — safe areas, `dvh`, sticky top chrome, scroll-snap nav, touch-sized controls
- **i18n scaffold** — English + 中文 + 日本語 copy table in `src/lib/i18n.ts`
- **Demo pages** — Home, Components, Settings (replace with product pages)

## Quick start

Requires **Node.js 20+**.

```bash
cp .env.example .env   # optional
npm install
npm run dev
```

Open `http://localhost:5173` on this machine. The dev server listens on all interfaces (`host: true`), so other devices on the same local network/subnet can use `http://<your-lan-ip>:5173` (Vite prints the Network URL on startup).

Demo sign-in: **`demo` / `demo`**.

Other scripts:

```bash
npm run build    # typecheck + production build
npm run preview  # preview production build
npm run lint     # oxlint
```

## Project layout

```text
.
├── AGENTS.md                 # agent/operator map for this template
├── README.md
├── doc/
│   └── design-system.md      # how the liquid-glass look works
├── public/
│   ├── backgrounds/          # stage photos (1–11.jpeg)
│   └── favicon.svg
└── src/
    ├── App.tsx               # demo app: auth gate + page routing + shell wiring
    ├── main.tsx              # bootstrap: bg + liquid lens + React root
    ├── components/
    │   ├── auth/LoginPanel.* # glass sign-in screen
    │   ├── layout/AppShell.* # product shell (sidebar + hero)
    │   └── ui/               # reusable glass primitives
    ├── lib/
    │   ├── background.ts     # random stage background
    │   ├── i18n.ts           # en/zh/ja strings
    │   ├── liquidLens.ts     # pointer-tracked .glass-lens sheen
    │   ├── session.ts        # demo auth session helpers
    │   └── storage.ts        # brand localStorage helpers
    ├── pages/                # demo pages (replace for product work)
    └── styles/
        ├── tokens.css
        └── global.css
```

## Using this as a product starter

1. Clone / copy this repo (or use it as a GitHub template).
2. Rename `package.json` `name`, `index.html` title, and brand strings in `src/lib/i18n.ts`.
3. Replace demo pages under `src/pages/` with product screens.
4. Wire real auth: keep `LoginPanel` UI, swap `src/lib/session.ts` / `App.tsx` handlers for your API.
5. Extend `AppPageId` + `pages` in `App.tsx` (or your router).
6. Keep styling on **CSS modules + design tokens** — avoid hardcoding colors when a token exists.
7. Add `glass-lens` to interactive controls that should get the liquid highlight.
8. Drop product-specific stage photos into `public/backgrounds/` and update `BACKGROUND_IMAGES` if needed.

See [`doc/design-system.md`](doc/design-system.md) for token and component contracts, and [`AGENTS.md`](AGENTS.md) for agent conventions.

## Stack

| Piece | Choice |
| --- | --- |
| Framework | React 19 |
| Language | TypeScript (strict-ish Vite defaults) |
| Bundler | Vite 8 |
| Styling | CSS modules + CSS custom properties |
| Lint | oxlint |
| Package manager | npm |

No router, state library, or UI kit is required. Add them only when the product needs them.

## Environment

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Optional backend origin for product apps |
| `VITE_BG_SESSION_KEY` | Optional sessionStorage key for stage background |

## License

Use freely in your own products. Customize branding, tokens, and pages as needed.

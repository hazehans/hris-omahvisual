# Liquid Glass design system

This document describes the visual system shipped by **liquid-glass**.  
Implementation source of truth: `src/styles/tokens.css`, `src/styles/global.css`, `src/components/**`.

## Aesthetic intent

**Dark stage + light frosted glass controls.**

- Full-viewport stage photo (random per session) under a dark gradient veil
- Soft blue / violet ambient glows
- Translucent panels with backdrop blur and inset highlight edges
- Interactive controls gain a **pointer-tracked radial sheen** (liquid lens)
- Motion is liquid (ease-out curves, short rise/flow enters), with `prefers-reduced-motion` kill-switch

## Tokens (`src/styles/tokens.css`)

### Color

| Token | Role |
| --- | --- |
| `--color-bg-0` / `--color-bg-1` | Deep stage bases |
| `--color-ink` / `--color-ink-muted` / `--color-ink-soft` | Primary / secondary / tertiary text |
| `--color-line` / `--color-line-strong` | Dividers / borders |
| `--color-accent` / `--color-accent-strong` / `--color-accent-soft` | Brand blue |
| `--color-link` | Links (cyan) |
| `--color-warn` / `--color-danger` / `--color-success` | Status |
| `--color-surface*` | Soft fill surfaces |

### Glass

| Token | Role |
| --- | --- |
| `--glass-bg` / `--glass-bg-strong` | Panel fill |
| `--glass-border` | Default glass edge |
| `--glass-blur` / `--glass-blur-soft` / `--glass-blur-login` | Backdrop filters |
| `--glass-lens-bg` | Static lens gradient (optional) |
| `--shadow-glass` / `--shadow-lens` / `--shadow-float` | Elevation |

### Shape, type, motion, space

- Radii: `--radius-sm` (12) → `--radius-md` (18) → `--radius-lg` (28) → pill
- Fonts: SF Pro / system stack (`--font-display`, `--font-body`, `--font-mono`)
- Motion: `--motion-fast|med|slow` + `--ease-liquid` / `--ease-spring`
- Spacing: `--space-1` … `--space-7`
- Layout: `--sidebar-width`, `--panel-max`, `--header-height`

**Rule:** if a value will appear twice, it belongs in tokens.

## Global utilities (`src/styles/global.css`)

### Stage background

`body` layers:

1. Dark diagonal veil  
2. Accent radial glows  
3. `var(--app-bg-image)` cover photo (set by `applyRandomBackground()`)

Mobile tuning (`global.css`):

- `background-attachment: fixed` only on fine-pointer desktop (≥961px); phones use `scroll` to avoid iOS/Android fixed-bg jank
- ≤960px repositions the stage photo to `center top` and uses a stronger vertical veil for readable glass UI
- ≤640px slightly reduces glass blur cost for smoother scroll
- Prefer `100dvh` + `env(safe-area-inset-*)` so browser chrome and notches do not clip the stage

### `.glass-lens`

Add this class to buttons, nav items, selects, and cards that should react to the pointer.

- `--lens-x` / `--lens-y` are updated by `installLiquidLens()`
- Pseudo-elements draw the radial sheen + inset rim
- Hover/active slightly lifts scale; disabled via reduced-motion media query

### Enter animations

- `.liquid-rise` — vertical soft unblur (panels)
- `.liquid-flow` — diagonal soft unblur (page main content)

`AppShell` applies `liquid-flow` on `<main>` when the page id changes.  
`LoginPanel` uses `liquid-rise` on the stage, intro, and form.

## Login screen

`LoginPanel` (`src/components/auth/LoginPanel.*`) is the signed-out entry:

- Centered frosted stage card (two-column on wide screens)
- Brand mark glyph derived from the current brand string
- Username / password fields with glass focus rings
- Primary pill submit with lens
- Language switcher in the top-right corner

Wire real auth by replacing the demo handlers in `App.tsx` / `src/lib/session.ts` while keeping this presentation component.

Demo credentials (template only): `demo` / `demo`.

## Layout shell

`AppShell` provides:

- Sticky left sidebar (collapses to horizontal, scroll-snap nav under 960px)
- Profile avatar row + tagline
- Nav buttons with optional description reveal on hover/active
- Language select + optional user/logout footer on desktop
- On ≤960px: language + signed-in account collapse into a top-right three-line menu (hamburger) so they do not block the stage/content
- Hero with brand eyebrow, page title/description, live badge
- Safe-area padding, `100dvh` min-heights, and sticky mobile top chrome for phones

Product apps own **page list + active id**. The shell stays domain-agnostic.

## Primitives

### `GlassPanel`

Standard frosted container for page content. Uses:

```css
background: var(--glass-bg);
backdrop-filter: var(--glass-blur);
box-shadow: var(--shadow-glass);
border-radius: var(--radius-lg);
```

### `Button`

Variants:

| Variant | Look |
| --- | --- |
| `primary` | Blue gradient pill + lens |
| `secondary` | Translucent white fill |
| `ghost` | Borderless |
| `danger` | Red-tinted glass |

### `GlassInput`

Labeled text field with focus ring using accent blue (`0 0 0 4px rgba(10,132,255,0.16)`).

### `GlassSelect`

Custom liquid-glass listbox (not a native `<select>`). Uses a frosted trigger + **portaled** floating menu so the OS system dropdown never appears and ancestor `overflow: hidden` (e.g. `GlassPanel`, shell) cannot clip the list.

| Prop | Notes |
| --- | --- |
| `value` / `options` / `onChange` | Controlled; each option is `{ value, label, disabled? }` |
| `label` | Optional field label; omit and pass `aria-label` for compact controls |
| `size` | `default` (forms) · `compact` (sidebar) · `pill` (login corner) |
| `placement` | Preferred `bottom` / `top`; auto-flips when space is tight |
| `fullWidth` | Default `true`; set `false` for inline / pill switchers |

**Menu layering:** the listbox is rendered with `createPortal(..., document.body)` and `position: fixed` (`z-index: 10000`). Coords track the trigger on open, scroll (capture), and resize, and stay inside the viewport.

Keyboard: Arrow keys, Home/End, Enter/Space, Escape. Click outside closes the menu. Selected option shows a check mark with accent tint.

### `Badge`

Compact status chips; `pulse` reuses the global `lensPulse` keyframes for “live” dots.

## Stage backgrounds

- Files: `public/backgrounds/1.jpeg` … `11.jpeg`
- Registry: `BACKGROUND_IMAGES` in `src/lib/background.ts`
- Persistence: `sessionStorage` key `liquid-glass-bg-image` (override with `VITE_BG_SESSION_KEY`)

To rebrand:

1. Replace JPEGs  
2. Update the registry list  
3. Optionally change the session key so old tabs do not stick to missing files  

## Customization recipes

### Rebrand colors

Edit accent tokens in `tokens.css`:

```css
--color-accent: #0a84ff;
--color-accent-strong: #409cff;
--color-accent-soft: rgba(10, 132, 255, 0.18);
```

Ambient glows in `global.css` body / `AppShell` `.stageGlow` use the same blue/violet family — update together.

### New product page

1. Create `src/pages/MyPage.tsx` + CSS module  
2. Wrap content in `GlassPanel`  
3. Add id/labels to `i18n.ts` and `App.tsx` pages array  
4. Use `Button` / `GlassInput` / `GlassSelect` / `Badge` before inventing new chrome  
   (`GlassSelect` is controlled: `value` + `options` + `onChange` — never native `<select>`)  

### Disable random backgrounds

Remove or no-op `applyRandomBackground()` in `main.tsx`, and set a solid `background-image` on `body` or drop `--app-bg-image`.

### Skip the login gate

In `App.tsx`, render `AppShell` directly (or set an initial session). Keep `LoginPanel` available for products that need auth.

### Light theme

Not shipped. The system is designed for dark stage + light glass. A light theme would need a parallel token set and re-tuned borders/shadows (do not invert naively).

## Accessibility notes

- Focus rings: global `:focus-visible` uses `--color-accent`
- Reduced motion: all transitions/animations collapse under `prefers-reduced-motion`
- Nav items expose `aria-current="page"`
- Decorative stage glows are `aria-hidden`
- Form controls keep `font-size: 16px` to avoid iOS focus zoom
- Touch devices suppress sticky hover-lift on `.glass-lens`
- Login / shell honor notch safe areas via `env(safe-area-inset-*)`

## Performance notes

- Backdrop-filter is GPU-friendly but costly on low-end devices — avoid stacking many large blurred panels
- Background JPEGs are relatively large (~1–5MB each); for production products, consider compressed WebP/AVIF derivatives and a smaller default set
- Liquid lens uses a single rAF-throttled `pointermove` listener on `document`

# smartTV for Browser

A **smart-TV home screen that runs in your browser**. It behaves like a real
TV: an animated power-on boot, a 10-foot interface you drive with a remote-style
**D-pad**, glassy app tiles that glow and scale on focus, an idle screensaver,
and an installable **PWA** so you can run it full-screen on any device.

## 📺 Using smartTV

It's built around remote-control navigation — no mouse required.

| Action        | Keys                 | On-screen remote |
| ------------- | -------------------- | ---------------- |
| Move focus    | Arrow keys (← ↑ → ↓) | D-pad            |
| Open the app  | `Enter`              | **OK**           |
| Back / close  | `Esc` or `Backspace` | **Back**         |
| Open settings | `m` or the ⚙ button  | **Menu**         |

- **Opening an app** plays a launch splash, then hands off to the channel's
  website directly — like a real TV OS launching an app full-screen. To get
  _back_ to smartTV from any channel, install the **companion extension** (see
  [`extension/`](extension/)), which adds a Home button + an `Alt+Shift+H`
  Home hotkey to every channel site.
- **Settings** (⚙ bottom-left, `Menu`, or the remote) lets you show/hide each
  app and change the tile size. Choices are saved to `localStorage` and restored
  on your next visit.
- **On-screen remote** (bottom-right) mirrors every hotkey for mouse/touch use.
- **Screensaver**: after ~45s idle, an ambient clock fades in; any key dismisses it.
- **Install as an app**: use your browser's _Install_ / _Add to Home Screen_ to
  run smartTV full-screen, offline-capable, like a native TV launcher.

## 🧑‍💻 Development

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build
npm run start        # serve the production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

### Adding or editing apps

Apps live in [`src/config/services.json`](src/config/services.json). Each entry:

```json
"netflix": {
  "name": "Netflix",
  "logo": "/logo-netflix.svg",
  "link": "https://www.netflix.com",
  "backgroundColor": "#0b0b0b"
}
```

Drop the logo SVG in `public/` and reference it via `logo`. If you omit `logo`
(set it to `""`), the tile renders a styled **text wordmark** of `name` instead —
add an optional `textColor` for contrast on light backgrounds.

## 🏗️ Architecture

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS 4** (CSS-first config + design tokens in `globals.css`)
- **Motion** (Framer Motion) for the boot, focus springs, splash and screensaver
- **@noriginmedia/norigin-spatial-navigation** for geometry-based D-pad focus
- **PWA**: native `app/manifest.ts` + a hand-authored service worker
  (`public/sw.js`) caching the app shell — no build-tool coupling

```
src/
├─ app/            layout, page, providers (spatial nav + SW), manifest, globals
├─ components/     tv-shell, boot-sequence, status-bar, app-grid, app-tile,
│                  settings-panel, on-screen-remote, screensaver, launch-splash,
│                  wordmark
├─ hooks/          use-persisted-state, use-idle, use-tv-keys
├─ lib/            services (typed config helpers)
└─ config/         services.json
```

## ♿ Accessibility

Tiles and controls are real focusable elements with `aria-label`s; the spatial
cursor mirrors onto real DOM focus (screen-reader friendly), and all animation
honours `prefers-reduced-motion`.

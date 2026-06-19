# smartTV Home (companion extension)

A tiny cross-browser (Manifest V3) extension that makes smartTV feel like a real
TV OS. Press **Alt+Shift+H** on any channel to pop up the **smartTV launcher**
overlay — go Home or jump straight to another channel — then dismiss it with the
same key or `Esc`. Nothing is shown on the page until you summon it, just like a
remote's launcher button.

It does **not** strip security headers or embed sites; it only overlays a way to
navigate.

## How it works

- A **content script** (`launcher.js`, plus the generated `channels.js`) is
  injected into the channel domains from the smartTV config. It does nothing
  visible until summoned, then renders a launcher overlay in a **Shadow DOM**
  (isolated from the host site's styles).
- A **background service worker** (`background.js`) handles the
  `toggle-launcher` command (Alt+Shift+H) and relays a toggle message to the
  active tab.
- The Home target URL is configurable on the **options page** (defaults to
  `http://localhost:3000/` for local development).

## The manifest is generated

`manifest.json` is produced from `src/config/services.json` so the extension is
scoped to exactly the channel domains smartTV knows about (a smaller, friendlier
install prompt than `<all_urls>`). Regenerate it after editing services:

```bash
npm run build:extension   # from the repo root
```

## Load it

**Chrome / Edge**

1. Go to `chrome://extensions`, enable **Developer mode**.
2. **Load unpacked** → select this `extension/` folder.
3. Open the extension's **options** and set your smartTV URL (or keep the
   `localhost:3000` default).

**Firefox**

1. Go to `about:debugging#/runtime/this-firefox`.
2. **Load Temporary Add-on** → select `extension/manifest.json`.

Then open any channel from smartTV — on the channel page, press **Alt+Shift+H**
to bring up the launcher (Home + channel switcher), and the same key or `Esc` to
dismiss it.

> Customise the shortcut in Chrome at `chrome://extensions/shortcuts`, or in
> Firefox via Add-ons Manager → ⚙ → Manage Extension Shortcuts.

## Notes & limits

- The launcher can't be summoned on browser-internal pages (`chrome://`,
  `about:`, the add-on stores, the PDF viewer) — those aren't channels.
- For production, set the options URL to your deployed smartTV origin.

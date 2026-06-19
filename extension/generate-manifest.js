import { readFileSync, writeFileSync, rmSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const publicDir = join(here, "../public")
const services = JSON.parse(
  readFileSync(join(here, "../src/config/services.json"), "utf8"),
)

// Single-source the channel domains from services.json so the extension only
// asks for access to the sites it actually augments (friendlier install prompt).
const matches = [
  ...new Set(
    Object.values(services)
      .map((service) => {
        try {
          return `${new URL(service.link).origin}/*`
        } catch {
          return null
        }
      })
      .filter(Boolean),
  ),
].sort()

// Inline each logo as a base64 data URI directly in channels.js — no
// web_accessible_resources, no getURL, no Firefox reload quirks.
rmSync(join(here, "logos"), { recursive: true, force: true })

const MIME = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
}

const toDataUri = (assetPath) => {
  const clean = assetPath.replace(/^\//, "")
  const mime =
    MIME[clean.slice(clean.lastIndexOf("."))] ?? "application/octet-stream"
  const data = readFileSync(join(publicDir, clean))
  return `data:${mime};base64,${data.toString("base64")}`
}

// Carry `icon` and `logo` separately so the launcher can render them exactly
// like the website: full-bleed for the app icon, contained for the wordmark.
const channels = Object.values(services).map((service) => ({
  name: service.name,
  link: service.link,
  backgroundColor: service.backgroundColor,
  textColor: service.textColor ?? null,
  icon: service.icon ? toDataUri(service.icon) : null,
  logo: service.logo ? toDataUri(service.logo) : null,
}))

const manifest = {
  manifest_version: 3,
  name: "smartTV Home",
  version: "0.1.0",
  description:
    "Press Alt+Shift+H on any channel to open the smartTV launcher — jump home or switch channels, like a remote.",
  permissions: ["storage", "tabs"],
  // Chrome MV3 uses `service_worker`; Firefox MV3 uses `scripts`. Declaring both
  // keeps one manifest working in both — each browser uses what it supports.
  background: {
    service_worker: "background.js",
    scripts: ["background.js"],
  },
  options_ui: { page: "options.html", open_in_tab: true },
  icons: { 192: "icon-192.png", 512: "icon-512.png" },
  commands: {
    "toggle-launcher": {
      suggested_key: { default: "Alt+Shift+H" },
      description: "Open the smartTV launcher",
    },
  },
  content_scripts: [
    {
      matches,
      run_at: "document_idle",
      all_frames: false,
      js: ["channels.js", "launcher.js"],
    },
  ],
}

writeFileSync(
  join(here, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
)

writeFileSync(
  join(here, "channels.js"),
  `// Generated from src/config/services.json — do not edit by hand.\nglobalThis.SMARTTV_CHANNELS = ${JSON.stringify(channels, null, 2)}\n`,
)

const withLogos = channels.filter((channel) => channel.logo).length
console.log(
  `Wrote manifest.json (${matches.length} domains), channels.js (${channels.length} channels, ${withLogos} logos bundled).`,
)

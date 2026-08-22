// The extension's whole settings surface, declared once. Before this, `homeUrl`
// was restated in three files and `ytTvMode` was read as `x !== false` in two —
// an idiom that cannot express a default of `false`, so `debug` had to be read
// as `Boolean(x)` instead. Declaring the defaults here makes each one a single
// fact and lets `webext` apply them at every read site.
//
// `smarttvSettings` is not a user preference: bridge.js mirrors the web app's
// localStorage into it. It lives here so the launcher and the background worker
// observe it through the same `onChange` as everything else.
//
// `local`, not the library's `sync` default: the mirrored web-app settings can
// be large and are per-device by nature.
// Read by options.js, launcher.js, bridge.js and background.js through the shared
// global lexical scope a classic script lands in — which ESLint cannot see across
// files, hence the disable rather than a genuine unused binding.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const settings = webext.defineSettings(
  {
    homeUrl: "https://smart-tv.kud.io/",
    ytTvMode: true,
    debug: false,
    smarttvSettings: null,
  },
  { area: "local" },
)

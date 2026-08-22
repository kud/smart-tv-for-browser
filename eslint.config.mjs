import coreWebVitals from "eslint-config-next/core-web-vitals"
import typescript from "eslint-config-next/typescript"

const config = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/sw.js",
      "worker/**",
      // Vendored build of @kud/webext, re-synced by copy — not ours to lint.
      "extension/vendor/**",
    ],
  },
]

export default config

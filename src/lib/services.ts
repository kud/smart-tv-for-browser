import servicesConfig from "@/config/services.json"

export type Service = {
  name: string
  logo: string
  link: string
  backgroundColor: string
  /** Full-bleed official app icon (the real smart-TV launcher art). Preferred
   * over `logo` and rendered edge-to-edge. */
  icon?: string
  /** Background colour of the app icon — used as the launch-splash background so
   * the icon sits seamlessly (no visible square). Falls back to backgroundColor. */
  splashColor?: string
  /** Used for the text wordmark fallback when `logo` is empty. */
  textColor?: string
}

export type ServiceMap = Record<string, Service>
export type ServiceSelection = Record<string, boolean>

// A user-added channel: any name + URL, stored in localStorage.
export type CustomChannel = {
  id: string
  name: string
  link: string
  logo?: string
  backgroundColor?: string
}

export const CUSTOM_CHANNEL_BG = "#1d1d26"

export const services = servicesConfig as ServiceMap
export const serviceKeys = Object.keys(services)

// Shown out of the box for a clean first run; everything else is opt-in via
// Settings. A returning user's saved choices always take precedence.
const FAMOUS_BY_DEFAULT = new Set([
  "netflix",
  "primeVideo",
  "disneyplus",
  "youtube",
  "max",
  "appletvplus",
  "hulu",
  "paramountplus",
])

export const defaultSelection: ServiceSelection = serviceKeys.reduce(
  (acc, key) => {
    acc[key] = FAMOUS_BY_DEFAULT.has(key)
    return acc
  },
  {} as ServiceSelection,
)

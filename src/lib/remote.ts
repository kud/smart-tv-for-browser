// Shared contract between the TV (receiver) and the phone remote page. Commands
// travel through a Cloudflare Worker + Durable Object room named by the pairing
// code — see worker/index.ts (relay), use-remote-receiver (TV) and app/remote
// (phone).

// The only actions a remote may trigger. Each maps to the keyboard key the TV
// already understands, so the receiver just re-dispatches it. This allowlist is
// the security boundary: anything not here is ignored.
export const REMOTE_KEYS = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  ok: "Enter",
  back: "Escape",
  menu: "m",
} as const

// Actions that map directly to a keyboard key. "home" is handled specially (the
// website returns to the launcher; the extension navigates the tab back to
// smartTV) so it lives outside REMOTE_KEYS.
export type RemoteKeyAction = keyof typeof REMOTE_KEYS
export type RemoteAction = RemoteKeyAction | "home"

export type RemoteMessage = { type: "press"; action: RemoteAction }

// On connect, each side announces its role so presence can be counted per kind:
// "app" = the website, "ext" = the extension's background worker, "phone" = the
// remote. Reported per-role so each side can show exactly who else is present.
export type RemoteRole = "app" | "ext" | "phone"
export const helloMessage = (role: RemoteRole) =>
  JSON.stringify({ type: "hello", role })

export const isRemoteMessage = (value: unknown): value is RemoteMessage => {
  if (!value || typeof value !== "object") return false
  const message = value as Record<string, unknown>
  return (
    message.type === "press" &&
    typeof message.action === "string" &&
    (message.action in REMOTE_KEYS || message.action === "home")
  )
}

export type PresenceMessage = {
  type: "presence"
  app: number
  ext: number
  phone: number
}

export const isPresenceMessage = (value: unknown): value is PresenceMessage => {
  if (!value || typeof value !== "object") return false
  const message = value as Record<string, unknown>
  return (
    message.type === "presence" &&
    typeof message.app === "number" &&
    typeof message.ext === "number" &&
    typeof message.phone === "number"
  )
}

export const parseMessage = (raw: string): unknown => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// Excludes easily-confused characters (0/O, 1/I) for a readable pairing code.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
export const CODE_LENGTH = 6

export const makeCode = () =>
  Array.from(
    { length: CODE_LENGTH },
    () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)],
  ).join("")

// Cloudflare Worker relay URL. Defaults to the deployed worker in production and
// a local `wrangler dev` in development; override with NEXT_PUBLIC_RELAY_URL to
// point at a different relay.
export const RELAY_URL =
  process.env.NEXT_PUBLIC_RELAY_URL ??
  (process.env.NODE_ENV === "development"
    ? "ws://127.0.0.1:8787"
    : "wss://smart-tv-remote.kud-space.workers.dev")

// Each pairing code maps to one Durable Object instance (routed by `room`).
export const roomUrl = (code: string) =>
  `${RELAY_URL}/?room=${encodeURIComponent(code)}`

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
  // Media controls — fallback keys; the extension drives the <video> element
  // directly, which is more reliable than per-site hotkeys.
  playpause: " ",
  mute: "m",
  volup: "ArrowUp",
  voldown: "ArrowDown",
} as const

// Actions that map directly to a keyboard key. "home" and "channels" are
// handled specially (home returns to / navigates back to smartTV; channels opens
// the extension's launcher overlay on the current site) so they sit outside
// REMOTE_KEYS.
export type RemoteKeyAction = keyof typeof REMOTE_KEYS
export type RemoteAction = RemoteKeyAction | "home" | "channels"

export type RemoteMessage = { type: "press"; action: RemoteAction }

// Relative cursor movement from the phone's trackpad. The extension turns these
// into a real on-screen pointer (move + hover + click) on sites we don't own.
export type MoveMessage = { type: "move"; dx: number; dy: number }
export const moveMessage = (dx: number, dy: number) =>
  JSON.stringify({ type: "move", dx, dy })
export const isMoveMessage = (value: unknown): value is MoveMessage => {
  if (!value || typeof value !== "object") return false
  const message = value as Record<string, unknown>
  return (
    message.type === "move" &&
    typeof message.dx === "number" &&
    typeof message.dy === "number"
  )
}

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
    (message.action in REMOTE_KEYS ||
      message.action === "home" ||
      message.action === "channels")
  )
}

// Text entry. A receiver tells the phone when a text field is focused (so the
// phone pops its keyboard); the phone streams the typed value back and can
// submit (Enter).
export type FocusMessage = { type: "focus"; editing: boolean; value: string }
export const focusMessage = (editing: boolean, value = "") =>
  JSON.stringify({ type: "focus", editing, value })
export const isFocusMessage = (value: unknown): value is FocusMessage => {
  if (!value || typeof value !== "object") return false
  const message = value as Record<string, unknown>
  return message.type === "focus" && typeof message.editing === "boolean"
}

export type TextMessage = { type: "text"; value: string }
export const textMessage = (value: string) =>
  JSON.stringify({ type: "text", value })
export const isTextMessage = (value: unknown): value is TextMessage => {
  if (!value || typeof value !== "object") return false
  const message = value as Record<string, unknown>
  return message.type === "text" && typeof message.value === "string"
}

export const submitMessage = () => JSON.stringify({ type: "submit" })
export const isSubmitMessage = (value: unknown) =>
  Boolean(value) &&
  typeof value === "object" &&
  (value as Record<string, unknown>).type === "submit"

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

// Shared contract between the TV (receiver) and the phone remote page. Commands
// travel through a PartyKit room named by the pairing code — see party/remote.ts
// (relay), use-remote-receiver (TV) and app/remote (phone).

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

export type RemoteAction = keyof typeof REMOTE_KEYS

export type RemoteMessage = { type: "press"; action: RemoteAction }

export const isRemoteMessage = (value: unknown): value is RemoteMessage => {
  if (!value || typeof value !== "object") return false
  const message = value as Record<string, unknown>
  return (
    message.type === "press" &&
    typeof message.action === "string" &&
    message.action in REMOTE_KEYS
  )
}

type PresenceMessage = { type: "presence"; count: number }

export const isPresenceMessage = (value: unknown): value is PresenceMessage => {
  if (!value || typeof value !== "object") return false
  const message = value as Record<string, unknown>
  return message.type === "presence" && typeof message.count === "number"
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

// PartyKit relay host: a local dev server in development, the deployed relay in
// production. Override with NEXT_PUBLIC_PARTYKIT_HOST (e.g. to point at a LAN IP
// running `partykit dev`).
export const PARTYKIT_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ??
  (process.env.NODE_ENV === "development"
    ? "127.0.0.1:1999"
    : "smart-tv.kud.partykit.dev")

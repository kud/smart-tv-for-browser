// Shared contract between the TV (receiver) and the phone remote page. Commands
// travel over a WebRTC data channel brokered by PeerJS — see use-remote-receiver
// (TV) and app/remote (phone).

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

// Namespace ids on the shared public PeerJS broker so our short codes don't
// collide with unrelated apps' peers.
const PEER_PREFIX = "smarttv-"

// Excludes easily-confused characters (0/O, 1/I) for a readable pairing code.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
export const CODE_LENGTH = 6

export const makeCode = () =>
  Array.from(
    { length: CODE_LENGTH },
    () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)],
  ).join("")

export const peerIdForCode = (code: string) =>
  `${PEER_PREFIX}${code.toUpperCase()}`

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { WebSocket as ReconnectingWebSocket } from "partysocket"
import {
  FiArrowLeft,
  FiMenu,
  FiHome,
  FiX,
  FiType,
  FiPlay,
  FiVolume1,
  FiVolume2,
  FiVolumeX,
} from "react-icons/fi"

import {
  CODE_LENGTH,
  RELAY_URL,
  roomUrl,
  helloMessage,
  moveMessage,
  textMessage,
  submitMessage,
  isPresenceMessage,
  isFocusMessage,
  parseMessage,
  type RemoteAction,
} from "@/lib/remote"

type Status = "idle" | "connecting" | "connected" | "error"

const STATUS_LABEL: Record<Status, string> = {
  idle: "Enter the code shown on your TV",
  connecting: "Connecting…",
  connected: "Connected",
  error: "Couldn't connect — check the code",
}

const STATUS_DOT: Record<Status, string> = {
  idle: "bg-white/30",
  connecting: "bg-amber-400 animate-pulse",
  connected: "bg-emerald-400",
  error: "bg-red-400",
}

const RemotePage = () => {
  const [status, setStatus] = useState<Status>("idle")
  const [detail, setDetail] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [logs, setLogs] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [text, setText] = useState("")
  const socketRef = useRef<ReconnectingWebSocket | null>(null)
  // Trackpad movement is coalesced to one message per animation frame so the
  // cursor streams smoothly instead of flooding the socket on every touch event.
  const pendingMove = useRef({ dx: 0, dy: 0 })
  const moveFrame = useRef(0)

  const log = useCallback(
    (message: string) =>
      setLogs((prev) =>
        [...prev, `${new Date().toLocaleTimeString()}  ${message}`].slice(-60),
      ),
    [],
  )

  const copyLogs = () => {
    navigator.clipboard
      ?.writeText(logs.join("\n"))
      .then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => {})
  }

  const connect = useCallback(
    (raw: string) => {
      const room = raw.trim().toUpperCase()
      if (room.length !== CODE_LENGTH) return
      if (!RELAY_URL) {
        setDetail("relay not configured")
        setStatus("error")
        return
      }
      socketRef.current?.close()
      setStatus("connecting")
      setDetail(null)
      log(`joining room ${room}`)

      const socket = new ReconnectingWebSocket(roomUrl(room))
      socketRef.current = socket

      socket.addEventListener("open", () => {
        log("relay connected")
        socket.send(helloMessage("phone"))
      })
      socket.addEventListener("message", (event) => {
        const data = parseMessage(event.data)
        if (isPresenceMessage(data)) {
          log(`presence: app ${data.app}, ext ${data.ext}, phone ${data.phone}`)
          setStatus(data.app + data.ext >= 1 ? "connected" : "connecting")
          return
        }
        // A text field was focused on the TV — pop the keyboard, pre-filled.
        if (isFocusMessage(data)) {
          if (data.editing) {
            setText(data.value)
            setKeyboardOpen(true)
          } else {
            setKeyboardOpen(false)
          }
        }
      })
      socket.addEventListener("close", () => {
        log("relay closed")
        setStatus("idle")
      })
      socket.addEventListener("error", () => {
        log("relay error")
        setDetail("relay")
        setStatus("error")
      })
    },
    [log],
  )

  // Auto-connect (and show the code in the input) when arriving from the TV's
  // QR code (/remote#CODE). A one-time URL read, not a render cascade.
  useEffect(() => {
    const fromHash = window.location.hash.replace(/^#/, "").toUpperCase()
    if (fromHash.length !== CODE_LENGTH) return
    /* eslint-disable react-hooks/set-state-in-effect */
    setCode(fromHash)
    connect(fromHash)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [connect])

  // Close the socket when leaving the remote page.
  useEffect(() => () => socketRef.current?.close(), [])

  const sendRaw = (payload: string) => {
    const socket = socketRef.current
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(payload)
      return true
    }
    return false
  }

  const press = (action: RemoteAction) => {
    if (sendRaw(JSON.stringify({ type: "press", action }))) {
      if (navigator.vibrate) navigator.vibrate(8)
    } else {
      log(`press "${action}" ignored — not connected`)
    }
  }

  // Accumulate trackpad deltas and flush once per frame.
  const flushMove = () => {
    moveFrame.current = 0
    const { dx, dy } = pendingMove.current
    pendingMove.current = { dx: 0, dy: 0 }
    if (dx || dy) sendRaw(moveMessage(dx, dy))
  }

  const moveCursor = (dx: number, dy: number) => {
    pendingMove.current.dx += dx
    pendingMove.current.dy += dy
    if (!moveFrame.current) {
      moveFrame.current = requestAnimationFrame(flushMove)
    }
  }

  const unpair = () => {
    socketRef.current?.close()
    socketRef.current = null
    setStatus("idle")
    setSheetOpen(false)
  }

  const sendText = (value: string) => {
    setText(value)
    sendRaw(textMessage(value))
  }

  const connected = status === "connected"

  return (
    <main className="relative flex h-dvh flex-col bg-tv-bg text-tv-text select-none">
      {connected ? (
        <ConnectedView
          onPress={press}
          onMove={moveCursor}
          onOpenSheet={() => setSheetOpen(true)}
          onOpenKeyboard={() => setKeyboardOpen(true)}
        />
      ) : (
        <PairView
          status={status}
          detail={detail}
          code={code}
          setCode={setCode}
          onPair={() => connect(code)}
        />
      )}

      {connected && keyboardOpen && (
        <Keyboard
          text={text}
          onText={sendText}
          onSubmit={() => sendRaw(submitMessage())}
          onClose={() => setKeyboardOpen(false)}
        />
      )}

      {sheetOpen && (
        <Sheet
          status={status}
          logs={logs}
          copied={copied}
          copyLogs={copyLogs}
          connected={connected}
          onUnpair={unpair}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </main>
  )
}

// A fullscreen typing mode that takes over the remote (so it's not crammed above
// the OS keyboard). The input sits at the top — where it stays visible once the
// phone keyboard rises — autofocused; every change streams to the TV, Go submits.
const Keyboard = ({
  text,
  onText,
  onSubmit,
  onClose,
}: {
  text: string
  onText: (value: string) => void
  onSubmit: () => void
  onClose: () => void
}) => (
  <div className="fixed inset-0 z-50 flex flex-col gap-4 bg-tv-bg p-5">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-tv-muted">Type for the TV</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close keyboard"
        className="rounded-full bg-white/10 p-2 text-tv-muted"
      >
        <FiX className="text-lg" />
      </button>
    </div>

    <textarea
      autoFocus
      rows={4}
      value={text}
      onChange={(event) => onText(event.target.value)}
      placeholder="Start typing…"
      className="w-full resize-none rounded-xl border border-white/15 bg-black/40 px-4 py-4 text-lg outline-none focus:border-sky-400"
    />

    <button
      type="button"
      onClick={onSubmit}
      className="w-full rounded-xl bg-sky-500 py-4 text-lg font-semibold text-white"
    >
      Go
    </button>

    <p className="text-xs text-tv-muted">
      What you type appears on the TV. Tap Go to submit (Enter adds a new line).
    </p>
  </div>
)

const Brand = () => (
  <span className="text-2xl font-bold tracking-tight">
    smart
    <span className="bg-gradient-to-r from-sky-400 to-emerald-300 bg-clip-text font-extrabold text-transparent">
      TV
    </span>{" "}
    remote
  </span>
)

const PairView = ({
  status,
  detail,
  code,
  setCode,
  onPair,
}: {
  status: Status
  detail: string | null
  code: string
  setCode: (value: string) => void
  onPair: () => void
}) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
    <Brand />
    <div className="flex items-center gap-2 text-sm text-tv-muted">
      <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABEL[status]}
      {status === "error" && detail ? (
        <span className="text-red-400">({detail})</span>
      ) : null}
    </div>
    <div className="flex w-full max-w-sm items-center gap-2">
      <input
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="off"
        maxLength={CODE_LENGTH}
        value={code}
        onChange={(event) => setCode(event.target.value.toUpperCase())}
        placeholder="ABC123"
        className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-center text-xl font-bold uppercase tracking-[0.3em] outline-none focus:border-sky-400"
      />
      <button
        type="button"
        onClick={onPair}
        disabled={code.trim().length !== CODE_LENGTH}
        className="shrink-0 rounded-xl bg-sky-500 px-5 py-3 font-semibold text-white transition-colors disabled:opacity-40"
      >
        Pair
      </button>
    </div>
  </div>
)

const ConnectedView = ({
  onPress,
  onMove,
  onOpenSheet,
  onOpenKeyboard,
}: {
  onPress: (action: RemoteAction) => void
  onMove: (dx: number, dy: number) => void
  onOpenSheet: () => void
  onOpenKeyboard: () => void
}) => (
  <>
    <header className="flex items-center justify-between px-5 pt-5">
      <button
        type="button"
        onClick={onOpenSheet}
        aria-label="Connection and settings"
        className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="text-xs text-tv-muted">Connected</span>
      </button>
      <button
        type="button"
        onClick={onOpenKeyboard}
        aria-label="Open keyboard"
        className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs text-tv-muted"
      >
        <FiType /> Keyboard
      </button>
    </header>

    <div className="flex flex-1 items-center justify-center px-6">
      <TrackPad onPress={onPress} onMove={onMove} />
    </div>

    <div className="grid grid-cols-4 gap-3 px-6 pt-3">
      <ActionButton label="Vol −" onPress={() => onPress("voldown")}>
        <FiVolume1 />
      </ActionButton>
      <ActionButton label="Play" onPress={() => onPress("playpause")}>
        <FiPlay />
      </ActionButton>
      <ActionButton label="Mute" onPress={() => onPress("mute")}>
        <FiVolumeX />
      </ActionButton>
      <ActionButton label="Vol +" onPress={() => onPress("volup")}>
        <FiVolume2 />
      </ActionButton>
    </div>

    <div className="grid grid-cols-3 gap-3 px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <ActionButton label="Back" onPress={() => onPress("back")}>
        <FiArrowLeft />
      </ActionButton>
      <ActionButton label="Home" onPress={() => onPress("home")}>
        <FiHome />
      </ActionButton>
      <ActionButton label="Menu" onPress={() => onPress("menu")}>
        <FiMenu />
      </ActionButton>
    </div>
  </>
)

const ActionButton = ({
  label,
  onPress,
  children,
}: {
  label: string
  onPress: () => void
  children: React.ReactNode
}) => (
  <button
    type="button"
    aria-label={label}
    onPointerDown={(event) => {
      event.preventDefault()
      onPress()
    }}
    className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/10 py-4 text-tv-text transition-colors active:bg-white/30"
  >
    <span className="text-xl">{children}</span>
    <span className="text-[0.7rem] text-tv-muted">{label}</span>
  </button>
)

// A real trackpad: drag to stream relative cursor movement, tap (no real
// movement) to click. Pointer acceleration (factor scales with speed) keeps
// slow drags precise while fast flicks fly — like a real mouse. The factor is
// computed from total speed and applied to both axes, so direction is exact.
const TRACKPAD_GAIN = 1.5
const TRACKPAD_ACCEL = 0.14
const TRACKPAD_MAX_BOOST = 3.5
const TAP_SLOP = 16

const TrackPad = ({
  onPress,
  onMove,
}: {
  onPress: (action: RemoteAction) => void
  onMove: (dx: number, dy: number) => void
}) => {
  const last = useRef<{ x: number; y: number } | null>(null)
  const travel = useRef(0)

  const onDown = (event: React.PointerEvent) => {
    ;(event.target as Element).setPointerCapture?.(event.pointerId)
    last.current = { x: event.clientX, y: event.clientY }
    travel.current = 0
  }

  const onMovePointer = (event: React.PointerEvent) => {
    const from = last.current
    if (!from) return
    const dx = event.clientX - from.x
    const dy = event.clientY - from.y
    last.current = { x: event.clientX, y: event.clientY }
    travel.current += Math.abs(dx) + Math.abs(dy)
    if (!dx && !dy) return
    const factor = Math.min(
      TRACKPAD_GAIN + Math.hypot(dx, dy) * TRACKPAD_ACCEL,
      TRACKPAD_GAIN + TRACKPAD_MAX_BOOST,
    )
    onMove(dx * factor, dy * factor)
  }

  const onUp = () => {
    const tapped = last.current && travel.current < TAP_SLOP
    last.current = null
    if (tapped) onPress("ok")
  }

  return (
    <div
      onPointerDown={onDown}
      onPointerMove={onMovePointer}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className="flex aspect-square w-full max-w-[20rem] touch-none items-center justify-center rounded-3xl bg-white/8 text-center text-sm leading-relaxed text-tv-muted ring-1 ring-white/10 transition-colors active:bg-white/15"
    >
      drag to move the pointer
      <br />
      tap to click
    </div>
  )
}

const Sheet = ({
  status,
  logs,
  copied,
  copyLogs,
  connected,
  onUnpair,
  onClose,
}: {
  status: Status
  logs: string[]
  copied: boolean
  copyLogs: () => void
  connected: boolean
  onUnpair: () => void
  onClose: () => void
}) => {
  const [showLogs, setShowLogs] = useState(false)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60"
      onClick={onClose}
    >
      <div
        className="max-h-[88dvh] overflow-y-auto rounded-t-3xl bg-tv-elevated p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20" />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Remote</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <FiX className="text-xl text-tv-muted" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[status]}`} />
          {STATUS_LABEL[status]}
        </div>
        <p className="mt-1.5 text-xs text-tv-muted">
          Keep this page open while you watch. Works over any internet — the two
          devices don&apos;t need to share Wi-Fi.
        </p>

        <div className="mt-6 flex items-center gap-4 text-xs">
          <button
            type="button"
            onClick={() => setShowLogs((value) => !value)}
            className="text-tv-muted underline underline-offset-2"
          >
            {showLogs ? "Hide logs" : "Show logs"}
            {logs.length ? ` (${logs.length})` : ""}
          </button>
          {logs.length > 0 && (
            <button
              type="button"
              onClick={copyLogs}
              className="text-sky-400 underline underline-offset-2"
            >
              {copied ? "Copied!" : "Copy logs"}
            </button>
          )}
        </div>
        {showLogs && (
          <pre className="mt-2 max-h-40 w-full overflow-y-auto whitespace-pre-wrap rounded-xl bg-black/50 p-3 text-left text-[11px] leading-relaxed text-tv-muted">
            {logs.length ? logs.join("\n") : "No events yet."}
          </pre>
        )}

        {connected && (
          <button
            type="button"
            onClick={onUnpair}
            className="mt-6 w-full rounded-xl bg-red-500/15 py-3 text-sm font-semibold text-red-300 transition-colors active:bg-red-500/25"
          >
            Unpair
          </button>
        )}
      </div>
    </div>
  )
}

export default RemotePage

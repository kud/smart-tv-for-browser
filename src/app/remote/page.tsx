"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { WebSocket as ReconnectingWebSocket } from "partysocket"
import {
  FiChevronUp,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiArrowLeft,
  FiMenu,
  FiHome,
  FiX,
  FiGrid,
  FiCircle,
} from "react-icons/fi"

import { usePersistedState } from "@/hooks/use-persisted-state"
import {
  CODE_LENGTH,
  RELAY_URL,
  roomUrl,
  helloMessage,
  moveMessage,
  isPresenceMessage,
  parseMessage,
  type RemoteAction,
} from "@/lib/remote"

type Status = "idle" | "connecting" | "connected" | "error"
type Mode = "buttons" | "trackpad"

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
  const [mode, setMode] = usePersistedState<Mode>(
    "remoteControlMode",
    "buttons",
  )
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
          // Connected once a receiver — the website or the extension — is live.
          setStatus(data.app + data.ext >= 1 ? "connected" : "connecting")
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

  const connected = status === "connected"

  return (
    <main className="relative flex h-dvh flex-col bg-tv-bg text-tv-text select-none">
      {connected ? (
        <ConnectedView
          mode={mode}
          onToggleMode={() =>
            setMode((m) => (m === "buttons" ? "trackpad" : "buttons"))
          }
          onPress={press}
          onMove={moveCursor}
          onOpenSheet={() => setSheetOpen(true)}
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

      {sheetOpen && (
        <Sheet
          status={status}
          mode={mode}
          setMode={setMode}
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
  mode,
  onToggleMode,
  onPress,
  onMove,
  onOpenSheet,
}: {
  mode: Mode
  onToggleMode: () => void
  onPress: (action: RemoteAction) => void
  onMove: (dx: number, dy: number) => void
  onOpenSheet: () => void
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
        onClick={onToggleMode}
        aria-label="Switch control mode"
        className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs text-tv-muted"
      >
        {mode === "buttons" ? <FiGrid /> : <FiCircle />}
        {mode === "buttons" ? "Buttons" : "Trackpad"}
      </button>
    </header>

    <div className="flex flex-1 items-center justify-center px-6">
      {mode === "buttons" ? (
        <ButtonsPad onPress={onPress} />
      ) : (
        <TrackPad onPress={onPress} onMove={onMove} />
      )}
    </div>

    <div className="grid grid-cols-3 gap-3 px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
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

const PadButton = ({
  label,
  onPress,
  className,
  children,
}: {
  label: string
  onPress: () => void
  className?: string
  children: React.ReactNode
}) => (
  <button
    type="button"
    aria-label={label}
    onPointerDown={(event) => {
      event.preventDefault()
      onPress()
    }}
    className={`flex items-center justify-center rounded-2xl bg-white/10 text-tv-text transition-colors active:bg-white/30 ${className ?? ""}`}
  >
    {children}
  </button>
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
  <PadButton label={label} onPress={onPress} className="flex-col gap-1 py-4">
    <span className="text-xl">{children}</span>
    <span className="text-[0.7rem] text-tv-muted">{label}</span>
  </PadButton>
)

const ButtonsPad = ({
  onPress,
}: {
  onPress: (action: RemoteAction) => void
}) => (
  <div className="grid aspect-square w-full max-w-[20rem] grid-cols-3 grid-rows-3 gap-3">
    <span />
    <PadButton label="Up" onPress={() => onPress("up")} className="text-4xl">
      <FiChevronUp />
    </PadButton>
    <span />
    <PadButton
      label="Left"
      onPress={() => onPress("left")}
      className="text-4xl"
    >
      <FiChevronLeft />
    </PadButton>
    <PadButton
      label="OK"
      onPress={() => onPress("ok")}
      className="text-xl font-bold"
    >
      OK
    </PadButton>
    <PadButton
      label="Right"
      onPress={() => onPress("right")}
      className="text-4xl"
    >
      <FiChevronRight />
    </PadButton>
    <span />
    <PadButton
      label="Down"
      onPress={() => onPress("down")}
      className="text-4xl"
    >
      <FiChevronDown />
    </PadButton>
    <span />
  </div>
)

// A real trackpad: drag to stream relative cursor movement, tap (no real
// movement) to click. Acceleration makes small flicks travel far, like a mouse.
const TRACKPAD_GAIN = 1.7
const TAP_SLOP = 8

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
    if (dx || dy) onMove(dx * TRACKPAD_GAIN, dy * TRACKPAD_GAIN)
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
  mode,
  setMode,
  logs,
  copied,
  copyLogs,
  connected,
  onUnpair,
  onClose,
}: {
  status: Status
  mode: Mode
  setMode: (mode: Mode) => void
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

        <p className="mt-6 text-[0.7rem] font-medium uppercase tracking-wide text-tv-muted">
          Control mode
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <ModeOption
            active={mode === "buttons"}
            onClick={() => setMode("buttons")}
            icon={<FiGrid />}
            label="Buttons"
          />
          <ModeOption
            active={mode === "trackpad"}
            onClick={() => setMode("trackpad")}
            icon={<FiCircle />}
            label="Trackpad"
          />
        </div>

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

const ModeOption = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-colors ${
      active
        ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/40"
        : "bg-white/5 text-tv-muted"
    }`}
  >
    {icon}
    {label}
  </button>
)

export default RemotePage

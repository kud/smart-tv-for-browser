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
} from "react-icons/fi"

import {
  CODE_LENGTH,
  RELAY_URL,
  roomUrl,
  isPresenceMessage,
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
  const [showLogs, setShowLogs] = useState(false)
  const [copied, setCopied] = useState(false)
  const socketRef = useRef<ReconnectingWebSocket | null>(null)

  const copyLogs = () => {
    navigator.clipboard
      ?.writeText(logs.join("\n"))
      .then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => {})
  }

  const log = useCallback(
    (message: string) =>
      setLogs((prev) =>
        [...prev, `${new Date().toLocaleTimeString()}  ${message}`].slice(-60),
      ),
    [],
  )

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

      socket.addEventListener("open", () => log("relay connected"))
      socket.addEventListener("message", (event) => {
        const data = parseMessage(event.data)
        if (isPresenceMessage(data)) {
          log(`presence: ${data.count}`)
          // Connected only once the TV is also in the room (>= 2 devices).
          setStatus(data.count >= 2 ? "connected" : "connecting")
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

  const press = (action: RemoteAction) => {
    const socket = socketRef.current
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "press", action }))
      if (navigator.vibrate) navigator.vibrate(8)
    } else {
      log(`press "${action}" ignored — not connected`)
    }
  }

  const connected = status === "connected"

  return (
    <main className="flex h-dvh flex-col items-center gap-6 overflow-y-auto bg-tv-bg px-6 py-8 text-tv-text select-none">
      <header className="flex w-full max-w-sm flex-col items-center gap-3">
        <span className="text-2xl font-bold tracking-tight">
          smart
          <span className="bg-gradient-to-r from-sky-400 to-emerald-300 bg-clip-text font-extrabold text-transparent">
            TV
          </span>{" "}
          remote
        </span>
        <div className="flex items-center gap-2 text-sm text-tv-muted">
          <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[status]}`} />
          {STATUS_LABEL[status]}
          {status === "error" && detail ? (
            <span className="text-red-400">({detail})</span>
          ) : null}
        </div>

        {!connected && (
          <div className="mt-2 flex w-full items-center gap-2">
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
              onClick={() => connect(code)}
              disabled={code.trim().length !== CODE_LENGTH}
              className="shrink-0 rounded-xl bg-sky-500 px-5 py-3 font-semibold text-white transition-colors disabled:opacity-40"
            >
              Pair
            </button>
          </div>
        )}
      </header>

      <DPad disabled={!connected} onPress={press} />

      <div className="flex w-full max-w-sm flex-col items-center gap-2">
        <p className="text-center text-xs text-tv-muted">
          Keep this page open while you watch. Both devices must share the same
          Wi-Fi.
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowLogs((value) => !value)}
            className="text-xs text-tv-muted underline underline-offset-2"
          >
            {showLogs ? "Hide logs" : "Show logs"}
            {logs.length ? ` (${logs.length})` : ""}
          </button>
          {logs.length > 0 && (
            <button
              type="button"
              onClick={copyLogs}
              className="text-xs text-sky-400 underline underline-offset-2"
            >
              {copied ? "Copied!" : "Copy logs"}
            </button>
          )}
        </div>
        {showLogs && (
          <pre className="w-full whitespace-pre-wrap rounded-xl bg-black/50 p-3 text-left text-[11px] leading-relaxed text-tv-muted">
            {logs.length ? logs.join("\n") : "No events yet."}
          </pre>
        )}
      </div>
    </main>
  )
}

const PadButton = ({
  label,
  disabled,
  onPress,
  className,
  children,
}: {
  label: string
  disabled: boolean
  onPress: () => void
  className?: string
  children: React.ReactNode
}) => (
  <button
    type="button"
    aria-label={label}
    disabled={disabled}
    onPointerDown={(event) => {
      event.preventDefault()
      onPress()
    }}
    className={`flex items-center justify-center rounded-2xl bg-white/10 text-tv-text transition-colors active:bg-white/30 disabled:opacity-30 ${className ?? ""}`}
  >
    {children}
  </button>
)

const DPad = ({
  disabled,
  onPress,
}: {
  disabled: boolean
  onPress: (action: RemoteAction) => void
}) => (
  <div className="flex w-full max-w-sm flex-col items-center gap-4">
    <div className="grid aspect-square w-full max-w-[20rem] grid-cols-3 grid-rows-3 gap-3">
      <span />
      <PadButton
        label="Up"
        disabled={disabled}
        onPress={() => onPress("up")}
        className="text-4xl"
      >
        <FiChevronUp />
      </PadButton>
      <span />
      <PadButton
        label="Left"
        disabled={disabled}
        onPress={() => onPress("left")}
        className="text-4xl"
      >
        <FiChevronLeft />
      </PadButton>
      <PadButton
        label="OK"
        disabled={disabled}
        onPress={() => onPress("ok")}
        className="text-xl font-bold"
      >
        OK
      </PadButton>
      <PadButton
        label="Right"
        disabled={disabled}
        onPress={() => onPress("right")}
        className="text-4xl"
      >
        <FiChevronRight />
      </PadButton>
      <span />
      <PadButton
        label="Down"
        disabled={disabled}
        onPress={() => onPress("down")}
        className="text-4xl"
      >
        <FiChevronDown />
      </PadButton>
      <span />
    </div>
    <div className="flex w-full max-w-[20rem] gap-3">
      <PadButton
        label="Back"
        disabled={disabled}
        onPress={() => onPress("back")}
        className="flex-1 gap-2 py-4 text-base"
      >
        <FiArrowLeft /> Back
      </PadButton>
      <PadButton
        label="Menu"
        disabled={disabled}
        onPress={() => onPress("menu")}
        className="flex-1 gap-2 py-4 text-base"
      >
        <FiMenu /> Menu
      </PadButton>
    </div>
  </div>
)

export default RemotePage

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { DataConnection } from "peerjs"
import {
  FiChevronUp,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiArrowLeft,
  FiMenu,
} from "react-icons/fi"

import { peerIdForCode, CODE_LENGTH, type RemoteAction } from "@/lib/remote"

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
  const [code, setCode] = useState("")
  const connRef = useRef<DataConnection | null>(null)

  const connect = useCallback(async (raw: string) => {
    const target = raw.trim().toUpperCase()
    if (target.length !== CODE_LENGTH) return

    // Load PeerJS first so the status update is async — never a synchronous
    // setState inside the auto-connect effect.
    const { default: PeerCtor } = await import("peerjs")
    setStatus("connecting")
    const peer = new PeerCtor()

    peer.on("open", () => {
      const conn = peer.connect(peerIdForCode(target), { reliable: true })
      connRef.current = conn
      conn.on("open", () => setStatus("connected"))
      conn.on("close", () => setStatus("idle"))
      conn.on("error", () => setStatus("error"))
    })
    peer.on("error", () => setStatus("error"))
  }, [])

  // Auto-connect when arriving from the TV's QR code (/remote#CODE). The input
  // is only for manual entry, so we connect directly rather than seeding state.
  useEffect(() => {
    const fromHash = window.location.hash.replace(/^#/, "").toUpperCase()
    // Connecting opens an external WebRTC peer; its status updates are async.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (fromHash.length === CODE_LENGTH) connect(fromHash)
  }, [connect])

  const press = (action: RemoteAction) => {
    const conn = connRef.current
    if (conn?.open) {
      conn.send({ type: "press", action })
      if (navigator.vibrate) navigator.vibrate(8)
    }
  }

  const connected = status === "connected"

  return (
    <main className="flex min-h-dvh flex-col items-center justify-between gap-6 bg-tv-bg px-6 py-8 text-tv-text select-none">
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

      <p className="text-center text-xs text-tv-muted">
        Keep this page open while you watch. Both devices must share the same
        Wi-Fi.
      </p>
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

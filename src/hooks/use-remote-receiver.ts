"use client"

import { useEffect, useRef, useState } from "react"
import type Peer from "peerjs"

import {
  peerIdForCode,
  makeCode,
  isRemoteMessage,
  REMOTE_KEYS,
} from "@/lib/remote"

const pressKey = (key: string) => {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
  window.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }))
}

// Runs on the TV. Registers a PeerJS peer under a short pairing code, waits for
// the phone to connect, and re-dispatches each allowlisted command as a key
// event (the same path the on-screen remote uses). Only active while the
// pairing UI is open, so we don't hold a broker connection otherwise.
export const useRemoteReceiver = (active: boolean) => {
  const [code, setCode] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const peerRef = useRef<Peer | null>(null)

  useEffect(() => {
    if (!active) return
    let cancelled = false

    const init = async () => {
      const { default: PeerCtor } = await import("peerjs")
      if (cancelled) return

      const start = (attempt: number) => {
        const candidate = makeCode()
        const peer = new PeerCtor(peerIdForCode(candidate))
        peerRef.current = peer

        peer.on("open", () => {
          if (!cancelled) setCode(candidate)
        })
        peer.on("error", (error) => {
          // The chosen code is taken on the broker — pick another and retry.
          const type = (error as { type?: string })?.type
          if (type === "unavailable-id" && attempt < 5) {
            peer.destroy()
            start(attempt + 1)
          }
        })
        peer.on("connection", (conn) => {
          conn.on("open", () => {
            if (!cancelled) setConnected(true)
          })
          conn.on("close", () => {
            if (!cancelled) setConnected(false)
          })
          conn.on("data", (data) => {
            if (isRemoteMessage(data)) pressKey(REMOTE_KEYS[data.action])
          })
        })
      }

      start(0)
    }

    init()

    return () => {
      cancelled = true
      peerRef.current?.destroy()
      peerRef.current = null
      setCode(null)
      setConnected(false)
    }
  }, [active])

  return { code, connected }
}

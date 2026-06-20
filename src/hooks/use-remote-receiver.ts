"use client"

import { useEffect, useState } from "react"
import { WebSocket as ReconnectingWebSocket } from "partysocket"

import {
  isRemoteMessage,
  isPresenceMessage,
  parseMessage,
  REMOTE_KEYS,
  RELAY_URL,
  roomUrl,
} from "@/lib/remote"

const pressKey = (key: string) => {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
  window.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }))
}

// TV side. Joins the relay room named by `code` and re-dispatches each
// allowlisted command as a key event (the same path the on-screen remote uses).
// `connected` flips true once the phone is also in the room (presence >= 2).
// The socket lives as long as `code` is set, so the phone keeps controlling the
// app after the pairing modal is closed.
export const useRemoteReceiver = (code: string | null) => {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!code || !RELAY_URL) return
    const socket = new ReconnectingWebSocket(roomUrl(code))

    const onMessage = (event: MessageEvent) => {
      const data = parseMessage(event.data)
      if (isPresenceMessage(data)) {
        setConnected(data.count >= 2)
        return
      }
      if (isRemoteMessage(data)) pressKey(REMOTE_KEYS[data.action])
    }

    socket.addEventListener("message", onMessage)
    return () => {
      socket.removeEventListener("message", onMessage)
      socket.close()
      setConnected(false)
    }
  }, [code])

  return { connected }
}

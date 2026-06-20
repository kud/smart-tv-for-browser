"use client"

import { useEffect, useState } from "react"
import { WebSocket as ReconnectingWebSocket } from "partysocket"

import {
  isRemoteMessage,
  isPresenceMessage,
  isMoveMessage,
  isTextMessage,
  isSubmitMessage,
  parseMessage,
  helloMessage,
  focusMessage,
  REMOTE_KEYS,
  RELAY_URL,
  roomUrl,
} from "@/lib/remote"
import { createVirtualCursor } from "@/lib/virtual-cursor"
import {
  isEditable,
  readEditable,
  writeEditable,
  submitEditable,
} from "@/lib/text-field"

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
  const [phoneConnected, setPhoneConnected] = useState(false)
  const [extConnected, setExtConnected] = useState(false)

  useEffect(() => {
    if (!code || !RELAY_URL) return
    const socket = new ReconnectingWebSocket(roomUrl(code))
    // The same trackpad cursor the extension uses, here so the phone's pointer
    // works on the smartTV app itself (one trackpad mode for everything).
    const cursor = createVirtualCursor()

    // Announce on every (re)connect so the relay counts us as the app receiver.
    const onOpen = () => socket.send(helloMessage("app"))
    const onMessage = (event: MessageEvent) => {
      const data = parseMessage(event.data)
      if (isPresenceMessage(data)) {
        setPhoneConnected(data.phone >= 1)
        setExtConnected(data.ext >= 1)
        return
      }
      if (isMoveMessage(data)) {
        cursor.move(data.dx, data.dy)
        return
      }
      if (isTextMessage(data)) {
        const active = document.activeElement
        if (isEditable(active)) writeEditable(active, data.value)
        return
      }
      if (isSubmitMessage(data)) {
        const active = document.activeElement
        if (isEditable(active)) submitEditable(active)
        return
      }
      if (isRemoteMessage(data)) {
        if (data.action === "home") {
          window.dispatchEvent(new CustomEvent("smarttv-home"))
          return
        }
        // When the trackpad is in use, OK clicks where the cursor points;
        // otherwise it activates the spatially-focused element via Enter.
        if (data.action === "ok" && cursor.isPlaced()) {
          cursor.click()
          return
        }
        pressKey(REMOTE_KEYS[data.action])
      }
    }

    // Tell the phone when a text field is focused so it can pop its keyboard.
    const onFocusIn = (event: FocusEvent) => {
      if (isEditable(event.target))
        socket.send(focusMessage(true, readEditable(event.target)))
    }
    const onFocusOut = (event: FocusEvent) => {
      if (isEditable(event.target)) socket.send(focusMessage(false))
    }

    socket.addEventListener("open", onOpen)
    socket.addEventListener("message", onMessage)
    document.addEventListener("focusin", onFocusIn)
    document.addEventListener("focusout", onFocusOut)
    return () => {
      socket.removeEventListener("open", onOpen)
      socket.removeEventListener("message", onMessage)
      document.removeEventListener("focusin", onFocusIn)
      document.removeEventListener("focusout", onFocusOut)
      socket.close()
      cursor.destroy()
      setPhoneConnected(false)
      setExtConnected(false)
    }
  }, [code])

  return { phoneConnected, extConnected }
}

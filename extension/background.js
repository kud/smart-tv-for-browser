const api = globalThis.browser ?? globalThis.chrome

// Cloudflare relay — keep in sync with src/lib/remote.ts (RELAY_URL).
const RELAY_URL = "wss://smart-tv-remote.kud-space.workers.dev"

// The whole point of doing this in the background (not the web app): a service
// worker outlives page navigations, so the phone keeps controlling the active
// tab after the user launches a channel and leaves smartTV. One long-lived
// connection to the relay room, forwarding each press to the active tab.
let socket = null
let currentCode = null

const DEFAULT_HOME = "https://smart-tv.kud.io/"

// Forward a remote action to the active tab. "home" is special: rather than a
// key, it navigates the tab back to smartTV — the real "get me out of Netflix"
// case the web app can't do once you've left it.
const forwardAction = async (action) => {
  if (action === "home") {
    try {
      const { homeUrl } = await api.storage.local.get("homeUrl")
      const [tab] = await api.tabs.query({
        active: true,
        lastFocusedWindow: true,
      })
      if (tab?.id)
        await api.tabs.update(tab.id, { url: homeUrl || DEFAULT_HOME })
    } catch {
      /* no active tab */
    }
    return
  }

  // Hand the action (not a key) to the content script: it both fires the key
  // event and advances native focus, so it can drive sites that ignore keys.
  try {
    const [tab] = await api.tabs.query({
      active: true,
      lastFocusedWindow: true,
    })
    if (tab?.id)
      await api.tabs.sendMessage(tab.id, { type: "smarttv-press", action })
  } catch {
    // Active tab has no content script (a browser page, or a non-channel site).
  }
}

// Relative cursor movement from the phone's trackpad → the active tab's content
// script, which moves an on-screen pointer and synthesises hover/click.
const forwardMove = async (dx, dy) => {
  try {
    const [tab] = await api.tabs.query({
      active: true,
      lastFocusedWindow: true,
    })
    if (tab?.id)
      await api.tabs.sendMessage(tab.id, { type: "smarttv-move", dx, dy })
  } catch {
    // Active tab has no content script.
  }
}

const disconnect = () => {
  if (!socket) return
  try {
    socket.close()
  } catch {
    /* already closed */
  }
  socket = null
}

const connect = (code) => {
  if (!code) {
    currentCode = null
    disconnect()
    return
  }
  // Already connected/connecting to this room — leave it be.
  if (code === currentCode && socket && socket.readyState <= WebSocket.OPEN) {
    return
  }
  currentCode = code
  disconnect()

  const ws = new WebSocket(`${RELAY_URL}/?room=${encodeURIComponent(code)}`)
  socket = ws

  // Announce as the extension receiver so the relay reports us distinctly from
  // the website and the phone (the pairing UI shows the extension's status).
  ws.addEventListener("open", () => {
    try {
      ws.send(JSON.stringify({ type: "hello", role: "ext" }))
    } catch {
      /* socket closed before open settled */
    }
  })

  ws.addEventListener("message", (event) => {
    let data
    try {
      data = JSON.parse(event.data)
    } catch {
      return
    }
    if (data?.type === "press" && typeof data.action === "string") {
      forwardAction(data.action)
    } else if (
      data?.type === "move" &&
      typeof data.dx === "number" &&
      typeof data.dy === "number"
    ) {
      forwardMove(data.dx, data.dy)
    }
  })
  ws.addEventListener("close", () => {
    if (socket === ws) socket = null
  })
}

const ensureConnected = async () => {
  try {
    const { smarttvSettings } = await api.storage.local.get("smarttvSettings")
    connect(smarttvSettings?.remoteCode || null)
  } catch {
    /* storage unavailable */
  }
}

// React to the website handing off (or clearing) the pairing code via bridge.js.
api.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.smarttvSettings) return
  connect(changes.smarttvSettings.newValue?.remoteCode || null)
})

// Connect whenever the service worker spins up.
api.runtime.onStartup.addListener(ensureConnected)
api.runtime.onInstalled.addListener(ensureConnected)
ensureConnected()

// MV3 evicts idle service workers; an open WebSocket extends the lifetime
// (Chrome 116+), and this alarm wakes us to reconnect if it ever dropped.
api.alarms.create("smarttv-keepalive", { periodInMinutes: 0.5 })
api.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "smarttv-keepalive") ensureConnected()
})

// The remote-style launcher key: toggles the overlay on the active channel tab.
// Works even when the page has focus, because commands are handled by the
// extension, not the host page.
api.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-launcher") return
  const [tab] = await api.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return
  try {
    await api.tabs.sendMessage(tab.id, { type: "smarttv-toggle" })
  } catch {
    // No content script on this tab (e.g. a browser-internal page) — ignore.
  }
})

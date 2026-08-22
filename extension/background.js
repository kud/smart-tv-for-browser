// Chrome MV3 loads one service-worker file, so the vendored library and the
// schema arrive via importScripts; Firefox lists all three in
// `background.scripts` and already has them, which is what the guard tests.
if (typeof webext === "undefined")
  importScripts("vendor/webext.js", "settings.js")

// Cloudflare relay — keep in sync with src/lib/remote.ts (RELAY_URL).
const RELAY_URL = "wss://smart-tv-remote.kud-space.workers.dev"

// The whole point of doing this in the background (not the web app): a service
// worker outlives page navigations, so the phone keeps controlling the active
// tab after the user launches a channel and leaves smartTV. One long-lived
// connection to the relay room, forwarding each press to the active tab.
let socket = null
let currentCode = null

// Forward a remote action to the active tab. "home" is special: rather than a
// key, it navigates the tab back to smartTV — the real "get me out of Netflix"
// case the web app can't do once you've left it.
const forwardAction = async (action) => {
  if (action === "home") {
    try {
      const { homeUrl } = await settings.get()
      // Not `sendToActiveTab`: this navigates the tab rather than messaging it,
      // so it goes through `invoke` — the same promise/callback adapter, minus
      // the assumption that a content script is listening.
      const [tab] = await webext.invoke(webext.api.tabs, "query", {
        active: true,
        lastFocusedWindow: true,
      })
      if (tab?.id)
        await webext.invoke(webext.api.tabs, "update", tab.id, { url: homeUrl })
    } catch {
      /* no active tab */
    }
    return
  }

  // Open (toggle) the launcher overlay on the active tab — switch channels in
  // place, without leaving the current site.
  if (action === "channels") {
    toggleLauncher()
    return
  }

  // Hand the action (not a key) to the content script: it both fires the key
  // event and advances native focus, so it can drive sites that ignore keys.
  await forwardToTab({ type: "smarttv-press", action })
}

// Relative cursor movement from the phone's trackpad → the active tab's content
// script, which moves an on-screen pointer and synthesises hover/click.
const forwardMove = (dx, dy) => forwardToTab({ type: "smarttv-move", dx, dy })

// `lastFocused` rather than `current`: every caller here is driven from outside
// the browser UI — a relay socket, an alarm — where "current window" can resolve
// to the background context's own. `sendToActiveTab` resolves undefined when no
// content script is listening, which is the expected case on a browser-internal
// page rather than a failure, so there is nothing left to catch.
const forwardToTab = (payload) =>
  webext.sendToActiveTab(payload, { window: "lastFocused" })

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
    } else if (data?.type === "text" && typeof data.value === "string") {
      forwardToTab({ type: "smarttv-text", value: data.value })
    } else if (data?.type === "submit") {
      forwardToTab({ type: "smarttv-submit" })
    }
  })
  ws.addEventListener("close", () => {
    if (socket === ws) socket = null
  })
}

const ensureConnected = async () => {
  try {
    const { smarttvSettings } = await settings.get()
    connect(smarttvSettings?.remoteCode || null)
  } catch {
    /* storage unavailable */
  }
}

// --- YouTube TV mode ------------------------------------------------------
// Spoof a TV/console user-agent on youtube.com so it serves the leanback TV
// interface (yt-redirect.js then sends the tab to /tv). A console UA — the one
// the leanback wrappers use — rather than a key event, since YouTube gates the
// TV UI on the device's user-agent.
const LEANBACK_UA =
  "Mozilla/5.0 (PS4; Leanback Shell) Cobalt/26.lts.0-qa (unlike Gecko)"
const YT_RULE_ID = 1001

const applyYtMode = async () => {
  if (!webext.api.declarativeNetRequest?.updateDynamicRules) return
  try {
    const { ytTvMode } = await settings.get()
    await webext.api.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [YT_RULE_ID],
      addRules: ytTvMode
        ? [
            {
              id: YT_RULE_ID,
              priority: 1,
              action: {
                type: "modifyHeaders",
                requestHeaders: [
                  {
                    header: "user-agent",
                    operation: "set",
                    value: LEANBACK_UA,
                  },
                ],
              },
              condition: {
                // Only the /tv document itself — so plain youtube.com stays
                // classic. Leanback's own API calls identify as a TV client via
                // request params, not the UA, so this is enough.
                urlFilter: "||youtube.com/tv",
                resourceTypes: ["main_frame", "sub_frame"],
              },
            },
          ]
        : [],
    })
  } catch {
    /* declarativeNetRequest unavailable (e.g. older Firefox) */
  }
}

// React to the website handing off (or clearing) the pairing code via bridge.js,
// and to the YouTube TV mode toggle changing.
settings.onChange((values, changed) => {
  if ("smarttvSettings" in changed)
    connect(values.smarttvSettings?.remoteCode || null)
  if ("ytTvMode" in changed) applyYtMode()
})

// Connect whenever the service worker spins up.
webext.api.runtime.onStartup.addListener(ensureConnected)
webext.api.runtime.onInstalled.addListener(ensureConnected)
webext.api.runtime.onStartup.addListener(applyYtMode)
webext.api.runtime.onInstalled.addListener(applyYtMode)
ensureConnected()
applyYtMode()

// Content scripts report text-field focus here; relay it to the phone so it can
// pop its keyboard.
webext.api.runtime.onMessage.addListener((message) => {
  if (
    message?.type === "smarttv-focus" &&
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type: "focus",
        editing: Boolean(message.editing),
        value: message.value || "",
      }),
    )
  }
})

// MV3 evicts idle service workers; an open WebSocket extends the lifetime
// (Chrome 116+), and this alarm wakes us to reconnect if it ever dropped.
webext.api.alarms.create("smarttv-keepalive", { periodInMinutes: 0.5 })
webext.api.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "smarttv-keepalive") ensureConnected()
})

// Toggle the launcher overlay on the active tab. Driven by the keyboard command
// and the toolbar icon. Works even when the page has focus, because it's the
// extension (not the host page) handling the trigger.
const toggleLauncher = async (tab) => {
  const message = { type: "smarttv-toggle" }
  // Driven by the toolbar icon, which hands us the tab it was clicked on, or by
  // the keyboard command, which does not. No catch either way: a tab with no
  // content script (a browser-internal page) resolves undefined rather than
  // rejecting.
  if (!tab?.id) return void (await webext.sendToActiveTab(message))
  await webext
    .invoke(webext.api.tabs, "sendMessage", tab.id, message)
    .catch(() => {})
}

webext.api.commands.onCommand.addListener((command) => {
  if (command === "toggle-launcher") toggleLauncher()
})

// Clicking the toolbar icon opens the launcher (no popup is set, so onClicked
// fires).
webext.api.action?.onClicked.addListener((tab) => toggleLauncher(tab))

const api = globalThis.browser ?? globalThis.chrome

// Runs on the smartTV web app and mirrors its saved settings (localStorage) into
// extension storage, so the launcher overlay on channel sites shows the same
// channels, in the same order, as the website. A content script shares the host
// page's localStorage, which is why it can read these at all.
// `remoteCode` is the active phone-remote pairing code — mirrored so the
// background worker can join the same relay room and keep the phone in control
// after the user launches a channel and leaves the app.
const KEYS = ["services", "customChannels", "channelOrder", "remoteCode"]

const read = (key) => {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

const snapshot = () =>
  KEYS.reduce((acc, key) => ({ ...acc, [key]: read(key) }), {})

let last = ""
const sync = () => {
  const serialised = JSON.stringify(snapshot())
  if (serialised === last) return
  last = serialised
  api.storage.local
    .set({ smarttvSettings: JSON.parse(serialised) })
    .catch(() => {})
}

sync()
// Same-tab localStorage writes (the app saving its own settings) don't emit a
// `storage` event, so poll. Cross-tab writes and tab refocus are caught too.
setInterval(sync, 1500)
window.addEventListener("storage", sync)
window.addEventListener("pageshow", sync)
document.addEventListener("visibilitychange", sync)

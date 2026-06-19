const api = globalThis.browser ?? globalThis.chrome

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

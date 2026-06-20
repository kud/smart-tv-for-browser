const api = globalThis.browser ?? globalThis.chrome
const DEFAULT_HOME = "https://smart-tv.kud.io/"
const input = document.getElementById("homeUrl")
const ytTvMode = document.getElementById("ytTvMode")
const debug = document.getElementById("debug")
const status = document.getElementById("status")

api.storage.local.get(["homeUrl", "ytTvMode", "debug"]).then((stored) => {
  input.value = stored.homeUrl || DEFAULT_HOME
  // Default on — TV mode is the point of the extension.
  ytTvMode.checked = stored.ytTvMode !== false
  debug.checked = Boolean(stored.debug)
})

document.getElementById("save").addEventListener("click", async () => {
  const homeUrl = input.value.trim() || DEFAULT_HOME
  await api.storage.local.set({
    homeUrl,
    ytTvMode: ytTvMode.checked,
    debug: debug.checked,
  })
  status.textContent = "Saved"
  setTimeout(() => (status.textContent = ""), 1500)
})

const input = document.getElementById("homeUrl")
const ytTvMode = document.getElementById("ytTvMode")
const debug = document.getElementById("debug")
const status = document.getElementById("status")

settings.get().then((values) => {
  input.value = values.homeUrl
  ytTvMode.checked = values.ytTvMode
  debug.checked = values.debug
})

document.getElementById("save").addEventListener("click", async () => {
  await settings.set({
    homeUrl: input.value.trim() || settings.defaults.homeUrl,
    ytTvMode: ytTvMode.checked,
    debug: debug.checked,
  })
  status.textContent = "Saved"
  setTimeout(() => (status.textContent = ""), 1500)
})

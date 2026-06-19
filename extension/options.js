const api = globalThis.browser ?? globalThis.chrome
const DEFAULT_HOME = "http://localhost:3000/"
const input = document.getElementById("homeUrl")
const status = document.getElementById("status")

api.storage.local.get("homeUrl").then(({ homeUrl }) => {
  input.value = homeUrl || DEFAULT_HOME
})

document.getElementById("save").addEventListener("click", async () => {
  const homeUrl = input.value.trim() || DEFAULT_HOME
  await api.storage.local.set({ homeUrl })
  status.textContent = "Saved"
  setTimeout(() => (status.textContent = ""), 1500)
})

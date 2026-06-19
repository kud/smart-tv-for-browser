const api = globalThis.browser ?? globalThis.chrome
const DEFAULT_HOME = "http://localhost:3000/"
const HOST_ID = "smarttv-launcher-host"
const channels = globalThis.SMARTTV_CHANNELS || []

let homeUrl = DEFAULT_HOME
api.storage.local
  .get("homeUrl")
  .then(({ homeUrl: stored }) => {
    if (stored) homeUrl = stored
  })
  .catch(() => {})

const isOpen = () => Boolean(document.getElementById(HOST_ID))

const close = () => {
  document.getElementById(HOST_ID)?.remove()
  document.removeEventListener("keydown", onKey, true)
}

const onKey = (event) => {
  if (event.key === "Escape") {
    event.preventDefault()
    event.stopPropagation()
    close()
  }
}

const tilesHtml = channels
  .map((channel, index) => {
    const inner = channel.logo
      ? `<img src="${channel.logo}" alt="${channel.name}">`
      : `<span>${channel.name}</span>`
    return `<a class="tile" href="${channel.link}" aria-label="${channel.name}"
      style="--i:${index};background:${channel.backgroundColor};color:${channel.textColor || "#fff"}">${inner}</a>`
  })
  .join("")

const open = () => {
  if (isOpen()) return

  const host = document.createElement("div")
  host.id = HOST_ID
  const root = host.attachShadow({ mode: "open" })
  root.innerHTML = `
    <style>
      @keyframes st-fade { from { opacity: 0 } to { opacity: 1 } }
      @keyframes st-panel { from { opacity: 0; transform: translateY(14px) scale(.97) } to { opacity: 1; transform: none } }
      @keyframes st-tile { from { opacity: 0; transform: translateY(10px) scale(.96) } to { opacity: 1; transform: none } }
      .backdrop {
        position: fixed; inset: 0; z-index: 2147483647;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,.6); backdrop-filter: blur(8px);
        font: 15px system-ui, -apple-system, sans-serif;
        animation: st-fade .2s ease both;
      }
      .panel {
        width: min(880px, 90vw); max-height: 84vh; overflow-y: auto;
        padding: 28px; border-radius: 22px;
        background: rgba(20,20,26,.96); color: #f5f5f7;
        box-shadow: 0 30px 80px -20px rgba(0,0,0,.9);
        animation: st-panel .3s cubic-bezier(.22,1,.36,1) both;
      }
      .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
      .brand { font-size: 26px; font-weight: 700; letter-spacing: -.02em; }
      .brand .tv {
        font-weight: 800;
        background: linear-gradient(90deg,#38bdf8,#6ee7b7);
        -webkit-background-clip: text; background-clip: text; color: transparent;
      }
      .home {
        display: flex; align-items: center; gap: 8px; border: 0; cursor: pointer;
        padding: 10px 18px; border-radius: 999px; font: 600 15px system-ui; color: #fff;
        background: rgba(255,255,255,.12);
      }
      .home:hover, .home:focus-visible { background: rgba(255,255,255,.22); outline: none; }
      .label { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: #9b9ba6; margin: 4px 0 12px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; }
      .tile {
        display: flex; align-items: center; justify-content: center; text-align: center;
        aspect-ratio: 1; border-radius: 14px; text-decoration: none; font-weight: 700;
        padding: 8px; font-size: 15px; outline: 3px solid transparent;
        transition: transform .12s ease, outline-color .12s ease;
        animation: st-tile .32s ease both; animation-delay: calc(var(--i) * 16ms);
      }
      .tile img { width: 62%; height: 62%; object-fit: contain; pointer-events: none; }
      .tile:hover, .tile:focus-visible { transform: scale(1.06); outline-color: #fff; }
      @media (prefers-reduced-motion: reduce) {
        .backdrop, .panel, .tile { animation: none; }
      }
    </style>
    <div class="backdrop" part="backdrop">
      <div class="panel" role="dialog" aria-label="smartTV launcher">
        <div class="head">
          <span class="brand">smart<span class="tv">TV</span></span>
          <button class="home" type="button">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 11.5 12 4l9 7.5" />
              <path d="M5 10.5V20h14v-9.5" />
            </svg>
            Home
          </button>
        </div>
        <p class="label">Switch channel</p>
        <div class="grid">${tilesHtml}</div>
      </div>
    </div>`

  const backdrop = root.querySelector(".backdrop")
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) close()
  })
  root.querySelector(".home").addEventListener("click", () => {
    // Skip the boot splash when returning to the launcher.
    try {
      const url = new URL(homeUrl)
      url.hash = "nosplash"
      window.location.href = url.toString()
    } catch {
      window.location.href = homeUrl
    }
  })
  ;(document.body || document.documentElement).appendChild(host)
  document.addEventListener("keydown", onKey, true)
  root.querySelector(".home").focus()
}

const toggle = () => (isOpen() ? close() : open())

api.runtime.onMessage.addListener((message) => {
  if (message?.type === "smarttv-toggle") toggle()
})

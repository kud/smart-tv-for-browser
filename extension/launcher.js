const api = globalThis.browser ?? globalThis.chrome
const DEFAULT_HOME = "https://smart-tv.kud.io/"
const HOST_ID = "smarttv-launcher-host"
const CUSTOM_CHANNEL_BG = "#1d1d26"

let homeUrl = DEFAULT_HOME
// Settings mirrored from the web app by bridge.js (null until first synced).
let settings = null

api.storage.local
  .get(["homeUrl", "smarttvSettings"])
  .then(({ homeUrl: storedHome, smarttvSettings }) => {
    if (storedHome) homeUrl = storedHome
    if (smarttvSettings) settings = smarttvSettings
  })
  .catch(() => {})

// Keep both live so the overlay reflects the latest website settings without a
// browser restart.
api.storage.onChanged?.addListener((changes, area) => {
  if (area !== "local") return
  if (changes.homeUrl) homeUrl = changes.homeUrl.newValue || DEFAULT_HOME
  if (changes.smarttvSettings) settings = changes.smarttvSettings.newValue
})

// Replicate the website's display logic: enabled built-ins (saved selection wins
// over each channel's default) plus all custom channels, sorted by the saved
// channelOrder (unknown ids fall to the end, keeping their natural order).
const visibleChannels = () => {
  const all = globalThis.SMARTTV_CHANNELS || []
  if (!settings) return all

  const selection = settings.services || {}
  const enabled = all.filter((channel) =>
    channel.id in selection ? selection[channel.id] : channel.defaultEnabled,
  )

  const customs = (settings.customChannels || []).map((channel) => ({
    id: channel.id,
    name: channel.name,
    link: channel.link,
    backgroundColor: channel.backgroundColor || CUSTOM_CHANNEL_BG,
    textColor: null,
    icon: null,
    logo: channel.logo || null,
  }))

  const order = settings.channelOrder || []
  const position = new Map(order.map((id, index) => [id, index]))
  const rank = (channel) =>
    position.has(channel.id) ? position.get(channel.id) : Infinity

  return [...enabled, ...customs]
    .map((channel, index) => ({ channel, index }))
    .sort((a, b) => rank(a.channel) - rank(b.channel) || a.index - b.index)
    .map(({ channel }) => channel)
}

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

const renderTiles = () =>
  visibleChannels()
    .map((channel, index) => {
      const inner = channel.icon
        ? `<img class="full" src="${channel.icon}" alt="${channel.name}">`
        : channel.logo
          ? `<img src="${channel.logo}" alt="${channel.name}">`
          : `<span>${channel.name}</span>`
      return `<a class="tile" href="${channel.link}" aria-label="${channel.name}"
      style="--i:${index};background:${channel.backgroundColor};color:${channel.textColor || "#fff"}">${inner}</a>`
    })
    .join("")

const open = () => {
  if (isOpen()) return

  const tilesHtml = renderTiles()

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
        position: relative; overflow: hidden;
        display: flex; align-items: center; justify-content: center; text-align: center;
        aspect-ratio: 1; border-radius: 14px; text-decoration: none; font-weight: 700;
        padding: 8px; font-size: 15px; outline: 3px solid transparent;
        transition: transform .12s ease, outline-color .12s ease;
        animation: st-tile .32s ease both; animation-delay: calc(var(--i) * 16ms);
      }
      .tile img { width: 62%; height: 62%; object-fit: contain; pointer-events: none; }
      .tile img.full {
        position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
      }
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

// Legacy keyCode/code for each key we send. Many players and apps read
// event.keyCode / event.which (not event.key), and the KeyboardEvent
// constructor leaves those at 0 — so we force them below.
const KEY_INFO = {
  ArrowUp: { code: "ArrowUp", keyCode: 38 },
  ArrowDown: { code: "ArrowDown", keyCode: 40 },
  ArrowLeft: { code: "ArrowLeft", keyCode: 37 },
  ArrowRight: { code: "ArrowRight", keyCode: 39 },
  Enter: { code: "Enter", keyCode: 13 },
  Escape: { code: "Escape", keyCode: 27 },
  m: { code: "KeyM", keyCode: 77 },
}

// A press forwarded from the phone (via the background worker). Dispatch from
// the focused element so the event bubbles through document and window —
// reaching both this overlay's Escape handler and the host site's own keyboard
// navigation (so the remote drives e.g. Netflix's UI once you leave smartTV).
const pressKey = (key) => {
  const info = KEY_INFO[key] || { code: key, keyCode: 0 }
  const target =
    document.activeElement && document.activeElement !== document.body
      ? document.activeElement
      : document.body || document.documentElement

  const fire = (eventType) => {
    const event = new KeyboardEvent(eventType, {
      key,
      code: info.code,
      bubbles: true,
      cancelable: true,
      view: window,
    })
    // Force the legacy fields the constructor won't set.
    Object.defineProperty(event, "keyCode", { get: () => info.keyCode })
    Object.defineProperty(event, "which", { get: () => info.keyCode })
    target.dispatchEvent(event)
  }

  fire("keydown")
  fire("keyup")
}

const ACTION_KEY = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  ok: "Enter",
  back: "Escape",
  menu: "m",
}

const FOCUSABLE =
  'a[href], button, input:not([type="hidden"]), select, textarea, video,' +
  ' [tabindex], [role="button"], [role="link"], [role="menuitem"], [role="tab"],' +
  ' [contenteditable="true"]'

const isVisible = (element) => {
  const rect = element.getBoundingClientRect()
  if (rect.width < 2 || rect.height < 2) return false
  const style = getComputedStyle(element)
  return (
    style.visibility !== "hidden" &&
    style.display !== "none" &&
    style.opacity !== "0"
  )
}

const focusables = () =>
  [...document.querySelectorAll(FOCUSABLE)].filter((element) => {
    if (element.disabled) return false
    const tabindex = element.getAttribute("tabindex")
    if (tabindex !== null && Number(tabindex) < 0) return false
    return isVisible(element)
  })

// Be a keyboard: advance the browser's own focus (Tab-like) so the remote moves
// through accessible sites that ignore arrow keys. The site's native focus ring
// is the indicator — we draw no cursor of our own.
const moveFocus = (forward) => {
  const list = focusables()
  if (!list.length) return
  const index = list.indexOf(document.activeElement)
  const nextIndex =
    index === -1 ? (forward ? 0 : list.length - 1) : index + (forward ? 1 : -1)
  const next = list[(nextIndex + list.length) % list.length]
  next.focus({ preventScroll: true })
  const rect = next.getBoundingClientRect()
  const offscreen =
    rect.top < 0 ||
    rect.left < 0 ||
    rect.bottom > window.innerHeight ||
    rect.right > window.innerWidth
  if (offscreen) next.scrollIntoView({ block: "center", inline: "center" })
}

// --- Virtual pointer (the phone's trackpad) -------------------------------
// A real on-screen cursor we move with relative deltas, synthesising hover and
// click via elementFromPoint — so it points at and activates anything, like a
// mouse, on sites where focus navigation is too slow.
let cursorEl = null
let cursorX = 0
let cursorY = 0
let cursorPlaced = false
let cursorHideTimer = 0
let hovered = null

// A classic pointer arrow (tip at 0,0) — readable on any background, unlike a
// flat coloured dot.
const CURSOR_SVG =
  '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M0 0 L0 15.5 L4.2 11.8 L6.9 17.6 L9.4 16.4 L6.7 10.7 L12 10.6 Z" ' +
  'fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>'

const ensureCursor = () => {
  if (cursorEl) return cursorEl
  cursorEl = document.createElement("div")
  cursorEl.id = "smarttv-cursor"
  cursorEl.innerHTML = CURSOR_SVG
  Object.assign(cursorEl.style, {
    position: "fixed",
    left: "0px",
    top: "0px",
    width: "20px",
    height: "20px",
    pointerEvents: "none",
    zIndex: "2147483647",
    filter: "drop-shadow(0 1px 2px rgba(0,0,0,.55))",
    transition: "opacity .15s ease",
    opacity: "0",
    willChange: "transform",
  })
  ;(document.body || document.documentElement).appendChild(cursorEl)
  return cursorEl
}

const showCursor = () => {
  const el = ensureCursor()
  el.style.opacity = "1"
  clearTimeout(cursorHideTimer)
  cursorHideTimer = setTimeout(() => {
    if (cursorEl) cursorEl.style.opacity = "0"
  }, 5000)
}

const fireAt = (type, x, y, extra) => {
  const target = document.elementFromPoint(x, y)
  if (!target) return null
  const Ctor = type.startsWith("pointer") ? PointerEvent : MouseEvent
  const init = {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    ...extra,
  }
  if (Ctor === PointerEvent) {
    init.pointerId = 1
    init.pointerType = "mouse"
    init.isPrimary = true
  }
  target.dispatchEvent(new Ctor(type, init))
  return target
}

const moveCursorBy = (dx, dy) => {
  const el = ensureCursor()
  if (!cursorPlaced) {
    cursorX = window.innerWidth / 2
    cursorY = window.innerHeight / 2
    cursorPlaced = true
  }
  cursorX = Math.max(0, Math.min(window.innerWidth - 1, cursorX + dx))
  cursorY = Math.max(0, Math.min(window.innerHeight - 1, cursorY + dy))
  el.style.transform = `translate(${cursorX}px, ${cursorY}px)`
  showCursor()

  // Drive hover so dropdowns and hover states appear, like a real mouse.
  const over = document.elementFromPoint(cursorX, cursorY)
  if (over !== hovered) {
    if (hovered)
      hovered.dispatchEvent(
        new MouseEvent("mouseout", {
          view: window,
          bubbles: true,
          relatedTarget: over,
        }),
      )
    if (over)
      over.dispatchEvent(
        new MouseEvent("mouseover", {
          view: window,
          bubbles: true,
          relatedTarget: hovered,
        }),
      )
    hovered = over
  }
  fireAt("pointermove", cursorX, cursorY)
  fireAt("mousemove", cursorX, cursorY)
}

const clickCursor = () => {
  const x = cursorX
  const y = cursorY
  fireAt("pointerdown", x, y, { button: 0, buttons: 1 })
  fireAt("mousedown", x, y, { button: 0, buttons: 1 })
  fireAt("pointerup", x, y, { button: 0 })
  fireAt("mouseup", x, y, { button: 0 })
  const target = fireAt("click", x, y, { button: 0 })
  if (target && typeof target.focus === "function") target.focus()
}

// One remote action = both halves of the "mix": fire the key (for sites with
// their own key handling, e.g. Netflix) and act on focus or the cursor.
const handleAction = (action) => {
  const key = ACTION_KEY[action]
  if (!key) return
  pressKey(key)

  if (action === "ok") {
    // If the trackpad cursor has been used, click where it points (even if the
    // dot has faded); otherwise activate the focus-navigated element.
    if (cursorPlaced) {
      clickCursor()
    } else {
      const element = document.activeElement
      if (element && element !== document.body) element.click()
    }
  } else if (action === "down" || action === "right") {
    moveFocus(true)
  } else if (action === "up" || action === "left") {
    moveFocus(false)
  }
}

// YouTube's leanback TV UI is built for a remote (arrow keys), so there the
// trackpad becomes a D-pad: accumulate the stream of move deltas and emit an
// arrow key each time it crosses a step, instead of moving a cursor.
const isLeanback = () =>
  location.hostname.endsWith("youtube.com") &&
  location.pathname.startsWith("/tv")

const SWIPE_STEP = 55
let swipeAccX = 0
let swipeAccY = 0
let swipeResetTimer = 0

const swipeToArrows = (dx, dy) => {
  swipeAccX += dx
  swipeAccY += dy
  while (
    Math.abs(swipeAccX) >= SWIPE_STEP ||
    Math.abs(swipeAccY) >= SWIPE_STEP
  ) {
    if (Math.abs(swipeAccX) >= Math.abs(swipeAccY)) {
      pressKey(swipeAccX > 0 ? "ArrowRight" : "ArrowLeft")
      swipeAccX += swipeAccX > 0 ? -SWIPE_STEP : SWIPE_STEP
    } else {
      pressKey(swipeAccY > 0 ? "ArrowDown" : "ArrowUp")
      swipeAccY += swipeAccY > 0 ? -SWIPE_STEP : SWIPE_STEP
    }
  }
  // Drop leftover sub-step travel once the gesture pauses.
  clearTimeout(swipeResetTimer)
  swipeResetTimer = setTimeout(() => {
    swipeAccX = 0
    swipeAccY = 0
  }, 250)
}

api.runtime.onMessage.addListener((message) => {
  if (message?.type === "smarttv-toggle") toggle()
  else if (message?.type === "smarttv-press" && message.action)
    handleAction(message.action)
  else if (message?.type === "smarttv-move") {
    if (isLeanback()) swipeToArrows(message.dx, message.dy)
    else moveCursorBy(message.dx, message.dy)
  }
})

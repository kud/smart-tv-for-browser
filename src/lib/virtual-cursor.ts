// A real on-screen pointer driven by relative deltas from the phone's trackpad.
// It synthesises hover and click via elementFromPoint, so it can point at and
// activate anything — the same idea the extension uses on third-party sites,
// here for the smartTV app itself so one trackpad works everywhere.

export type VirtualCursor = {
  move: (dx: number, dy: number) => void
  click: () => void
  isPlaced: () => boolean
  destroy: () => void
}

const CURSOR_SIZE = 20

// Hue from screen position — the dot shifts through the rainbow as you move it.
const hueAt = (x: number, y: number) =>
  Math.round(((x / window.innerWidth + y / window.innerHeight) / 2) * 360)

export const createVirtualCursor = (): VirtualCursor => {
  let x = 0
  let y = 0
  let placed = false
  let hovered: Element | null = null
  let hideTimer = 0

  // A flat round dot with a white ring — built as a plain styled div (no
  // innerHTML) so it survives Trusted Types sites like YouTube.
  const el = document.createElement("div")
  el.setAttribute("aria-hidden", "true")
  Object.assign(el.style, {
    position: "fixed",
    left: "0px",
    top: "0px",
    width: `${CURSOR_SIZE}px`,
    height: `${CURSOR_SIZE}px`,
    borderRadius: "50%",
    background: "hsl(200 90% 55%)",
    boxShadow: "0 0 0 2px rgba(255,255,255,.92), 0 3px 10px rgba(0,0,0,.5)",
    pointerEvents: "none",
    zIndex: "2147483647",
    transition: "opacity .15s ease",
    opacity: "0",
    willChange: "transform, background",
  } satisfies Partial<CSSStyleDeclaration>)
  document.body.appendChild(el)

  const show = () => {
    el.style.opacity = "1"
    window.clearTimeout(hideTimer)
    hideTimer = window.setTimeout(() => {
      el.style.opacity = "0"
    }, 5000)
  }

  const fireAt = (type: string, extra: MouseEventInit = {}) => {
    const target = document.elementFromPoint(x, y)
    if (!target) return null
    const base: MouseEventInit = {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      ...extra,
    }
    if (type.startsWith("pointer")) {
      target.dispatchEvent(
        new PointerEvent(type, {
          ...base,
          pointerId: 1,
          pointerType: "mouse",
          isPrimary: true,
        }),
      )
    } else {
      target.dispatchEvent(new MouseEvent(type, base))
    }
    return target
  }

  const move = (dx: number, dy: number) => {
    if (!placed) {
      x = window.innerWidth / 2
      y = window.innerHeight / 2
      placed = true
    }
    x = Math.max(0, Math.min(window.innerWidth - 1, x + dx))
    y = Math.max(0, Math.min(window.innerHeight - 1, y + dy))
    el.style.transform = `translate(${x - CURSOR_SIZE / 2}px, ${y - CURSOR_SIZE / 2}px)`
    el.style.background = `hsl(${hueAt(x, y)} 90% 55%)`
    show()

    const over = document.elementFromPoint(x, y)
    if (over !== hovered) {
      hovered?.dispatchEvent(
        new MouseEvent("mouseout", {
          view: window,
          bubbles: true,
          relatedTarget: over,
        }),
      )
      over?.dispatchEvent(
        new MouseEvent("mouseover", {
          view: window,
          bubbles: true,
          relatedTarget: hovered,
        }),
      )
      hovered = over
    }
    fireAt("pointermove")
    fireAt("mousemove")
  }

  const click = () => {
    fireAt("pointerdown", { button: 0, buttons: 1 })
    fireAt("mousedown", { button: 0, buttons: 1 })
    fireAt("pointerup", { button: 0 })
    fireAt("mouseup", { button: 0 })
    const target = fireAt("click", { button: 0 })
    if (target instanceof HTMLElement) target.focus()
  }

  return {
    move,
    click,
    isPlaced: () => placed,
    destroy: () => {
      window.clearTimeout(hideTimer)
      el.remove()
    },
  }
}

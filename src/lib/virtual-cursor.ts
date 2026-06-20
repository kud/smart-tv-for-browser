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

const SVG_NS = "http://www.w3.org/2000/svg"

const buildCursorArrow = (): SVGElement => {
  const svg = document.createElementNS(SVG_NS, "svg")
  svg.setAttribute("width", "22")
  svg.setAttribute("height", "22")
  svg.setAttribute("viewBox", "0 0 20 20")
  const path = document.createElementNS(SVG_NS, "path")
  path.setAttribute(
    "d",
    "M0 0 L0 15.5 L4.2 11.8 L6.9 17.6 L9.4 16.4 L6.7 10.7 L12 10.6 Z",
  )
  path.setAttribute("fill", "#fff")
  path.setAttribute("stroke", "#111")
  path.setAttribute("stroke-width", "1.4")
  path.setAttribute("stroke-linejoin", "round")
  svg.appendChild(path)
  return svg
}

export const createVirtualCursor = (): VirtualCursor => {
  let x = 0
  let y = 0
  let placed = false
  let hovered: Element | null = null
  let hideTimer = 0

  // A classic pointer arrow (tip at 0,0), built via the DOM (not innerHTML) so
  // it survives Trusted Types sites like YouTube that throw on innerHTML.
  const el = document.createElement("div")
  el.setAttribute("aria-hidden", "true")
  el.appendChild(buildCursorArrow())
  Object.assign(el.style, {
    position: "fixed",
    left: "0px",
    top: "0px",
    width: "22px",
    height: "22px",
    pointerEvents: "none",
    zIndex: "2147483647",
    filter: "drop-shadow(0 1px 2px rgba(0,0,0,.6))",
    transition: "opacity .15s ease",
    opacity: "0",
    willChange: "transform",
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
    el.style.transform = `translate(${x}px, ${y}px)`
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

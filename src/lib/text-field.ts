// Helpers for mirroring the phone's typed text into whatever text field is
// focused on the TV side. Used by the website receiver; the extension has its
// own copy in launcher.js (separate bundle).

const NON_TEXT_INPUT = new Set([
  "button",
  "submit",
  "reset",
  "checkbox",
  "radio",
  "range",
  "color",
  "file",
  "image",
  "hidden",
])

export const isEditable = (el: EventTarget | null): el is HTMLElement => {
  if (el instanceof HTMLTextAreaElement) return !el.disabled && !el.readOnly
  if (el instanceof HTMLInputElement) {
    return !el.disabled && !el.readOnly && !NON_TEXT_INPUT.has(el.type)
  }
  return el instanceof HTMLElement && el.isContentEditable
}

export const readEditable = (el: HTMLElement): string =>
  el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
    ? el.value
    : (el.textContent ?? "")

// Use the native value setter + an input event so React-controlled inputs
// (YouTube/Netflix search, etc.) actually register the change.
export const writeEditable = (el: HTMLElement, value: string) => {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const proto =
      el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set
    if (setter) setter.call(el, value)
    else el.value = value
  } else {
    el.textContent = value
  }
  el.dispatchEvent(new Event("input", { bubbles: true }))
}

export const submitEditable = (el: HTMLElement) => {
  const init: KeyboardEventInit = {
    key: "Enter",
    code: "Enter",
    bubbles: true,
    cancelable: true,
  }
  const down = new KeyboardEvent("keydown", init)
  Object.defineProperty(down, "keyCode", { get: () => 13 })
  Object.defineProperty(down, "which", { get: () => 13 })
  el.dispatchEvent(down)
  el.dispatchEvent(new KeyboardEvent("keyup", init))
}

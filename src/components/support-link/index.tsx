"use client"

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
} from "react"
import clsx from "clsx"

const emptySubscribe = () => () => {}

// Built in the browser from parts, so no served HTML or bundle carries the
// address whole for a scraper to find. The minifier folds constant joins, so
// the separator comes from a map it leaves alone. The server renders the link
// bare. The label is the app's public name, tv.beansontoast.app.
export const supportAddress = () => {
  const at = [63].map((code) => String.fromCharCode(code + 1)).join("")
  return ["support+tv", "beansontoast.app"].join(at)
}

// The scheme is assembled the same way, so the bundle never spells it out.
const mailUrl = (query = "") =>
  [["mail", "to"].map((part) => part).join(""), supportAddress() + query].join(
    ":",
  )

// The note becomes a pre-filled message in the visitor's mail app. Nothing is
// sent from the page.
export const composeSupportMail = (name: string, message: string) => {
  const from = name.trim()
  const text = message.trim()
  const subject = from ? `SmartTV support, from ${from}` : "SmartTV support"
  const body = from ? `${text}\n\n${from}` : text
  return mailUrl(
    `?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  )
}

// A modifier click means "do what links do", so it keeps the plain address.
const opensElsewhere = (event: MouseEvent) =>
  event.button !== 0 ||
  event.metaKey ||
  event.ctrlKey ||
  event.shiftKey ||
  event.altKey

const fieldClass =
  "w-full rounded-[1.2vh] border border-white/15 bg-black/40 px-[1.4vw] py-[1.4vh] text-[max(15px,2.2vh)] text-tv-text outline-none transition-colors focus:border-sky-400"

const buttonClass =
  "whitespace-nowrap rounded-full px-[max(16px,2vw)] py-[max(10px,1.2vh)] text-[max(14px,2vh)] transition-colors focus-visible:[box-shadow:var(--focus-ring)]"

// Lives in the About panel, which already pauses spatial navigation, so the
// arrows edit text in the note without moving the cursor behind it.
export const SupportLink = ({ className }: { className?: string }) => {
  const address = useSyncExternalStore(
    emptySubscribe,
    supportAddress,
    () => null,
  )
  const dialog = useRef<HTMLDialogElement>(null)
  const form = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    // The phone remote's Back and Home arrive on the window, not the dialog.
    const close = () => dialog.current?.close()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "GoBack") close()
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("smarttv-home", close)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("smarttv-home", close)
    }
  }, [open])

  // True when the dialog took over; false leaves the plain address to work.
  const showNote = () => {
    const element = dialog.current
    if (!element || typeof element.showModal !== "function") return false
    element.returnValue = ""
    element.showModal()
    setOpen(true)
    return true
  }

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (opensElsewhere(event)) return
    if (showNote()) event.preventDefault()
  }

  const closed = () => {
    setOpen(false)
    const element = dialog.current
    const fields = form.current
    if (!element || !fields || element.returnValue !== "send") return
    const data = new FormData(fields)
    window.location.href = composeSupportMail(
      String(data.get("name") ?? ""),
      String(data.get("message") ?? ""),
    )
    fields.reset()
  }

  return (
    <>
      <a
        href={address ? mailUrl() : undefined}
        onClick={onClick}
        className={clsx("cursor-pointer", className)}
      >
        Get support
      </a>
      <dialog
        ref={dialog}
        className="support m-auto whitespace-normal w-[46vw] min-w-[min(360px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] border-0 bg-transparent p-0 text-tv-text backdrop:bg-black/70 backdrop:backdrop-blur-sm"
        aria-labelledby="support-title"
        onClose={closed}
        // The TV owns Enter, Tab, Backspace and the arrows on the window; inside
        // the note they belong to the form.
        onKeyDown={(event) => event.stopPropagation()}
        // A click on the backdrop lands on the dialog itself; the card is the form.
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
      >
        <form
          ref={form}
          method="dialog"
          className="rounded-[2vh] bg-tv-elevated p-[max(20px,3vh)] shadow-2xl"
        >
          <h2
            id="support-title"
            className="mb-[1.2vh] text-[max(20px,2.8vh)] font-semibold"
          >
            Get support
          </h2>
          <p className="mb-[2.4vh] text-[max(14px,1.8vh)] leading-relaxed text-tv-muted">
            Write it here and your mail app opens with it, ready to send.
            Nothing leaves this page.
          </p>
          <label className="mb-[2vh] block">
            <span className="mb-[0.8vh] block text-[max(13px,1.8vh)] text-tv-muted">
              Your name <span className="opacity-60">(optional)</span>
            </span>
            <input
              name="name"
              autoComplete="name"
              maxLength={80}
              className={fieldClass}
            />
          </label>
          <label className="mb-[2vh] block">
            <span className="mb-[0.8vh] block text-[max(13px,1.8vh)] text-tv-muted">
              What&rsquo;s up?
            </span>
            <textarea
              name="message"
              rows={5}
              required
              maxLength={2000}
              className={`${fieldClass} resize-y`}
            />
          </label>
          <div className="mt-[1vh] flex flex-wrap justify-end gap-[max(8px,1vw)]">
            {/* A plain button, so Enter in the name field reaches the send button. */}
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className={`${buttonClass} bg-white/10 text-tv-text hover:bg-white/20`}
            >
              Not now
            </button>
            <button
              type="submit"
              value="send"
              className={`${buttonClass} bg-sky-500 font-semibold text-white hover:bg-sky-400`}
            >
              Open in my mail app
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}

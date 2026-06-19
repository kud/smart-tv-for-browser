"use client"

import { useEffect, type RefObject } from "react"

// Fires `onOutside` when a pointerdown lands outside `ref`, but only while
// `active`. Used to dismiss popovers (Wi-Fi, calendar) by clicking away.
export const useOutsideClick = (
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onOutside: () => void,
) => {
  useEffect(() => {
    if (!active) return
    const handler = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onOutside()
    }
    document.addEventListener("pointerdown", handler)
    return () => document.removeEventListener("pointerdown", handler)
  }, [ref, active, onOutside])
}

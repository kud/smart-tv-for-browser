"use client"

import { useEffect } from "react"
import {
  useFocusable,
  type UseFocusableConfig,
} from "@noriginmedia/norigin-spatial-navigation"

// useFocusable plus auto-scroll: whenever the element gains spatial focus it
// scrolls into view. Needed for keyboard/D-pad users inside scrollable regions
// like the settings panel, where focus can otherwise land off-screen.
export const useFocusableRow = <E extends HTMLElement = HTMLElement>(
  config?: UseFocusableConfig,
) => {
  const focusable = useFocusable<object, E>(config)
  const { ref, focused } = focusable

  useEffect(() => {
    if (focused) {
      ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [focused, ref])

  return focusable
}

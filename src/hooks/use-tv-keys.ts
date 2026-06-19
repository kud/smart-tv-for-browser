"use client"

import { useEffect } from "react"
import { navigateByDirection } from "@noriginmedia/norigin-spatial-navigation"

type TvKeyHandlers = {
  onBack?: () => void
  onMenu?: () => void
  onHelp?: () => void
}

const isTextField = (node: EventTarget | null) =>
  node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement

/**
 * Global remote-control keys that spatial navigation does not handle itself.
 * Arrow keys and Enter are owned by norigin; here we map Back (Escape /
 * Backspace), Menu (m / context-menu key), Help (?), and translate Tab /
 * Shift+Tab into spatial moves so the app is fully keyboard-operable.
 */
export const useTvKeys = ({ onBack, onMenu, onHelp }: TvKeyHandlers) => {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
        case "Backspace":
        case "GoBack":
          event.preventDefault()
          onBack?.()
          break
        case "m":
        case "M":
        case "ContextMenu":
          event.preventDefault()
          onMenu?.()
          break
        case "?":
          event.preventDefault()
          onHelp?.()
          break
        case "Tab":
          // Don't hijack Tab while editing text (e.g. the add-channel modal).
          if (isTextField(event.target)) return
          event.preventDefault()
          navigateByDirection(event.shiftKey ? "left" : "right", {})
          break
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onBack, onMenu, onHelp])
}

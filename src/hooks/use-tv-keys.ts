"use client"

import { useEffect } from "react"

type TvKeyHandlers = {
  onBack?: () => void
  onMenu?: () => void
}

/**
 * Global remote-control keys that spatial navigation does not handle itself.
 * Arrow keys and Enter are owned by norigin; here we map Back (Escape /
 * Backspace) and Menu (m / context-menu key) to discoverable actions.
 */
export const useTvKeys = ({ onBack, onMenu }: TvKeyHandlers) => {
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
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onBack, onMenu])
}

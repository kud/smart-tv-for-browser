"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * Toggle the browser's Fullscreen API for an immersive 10-foot experience.
 * Note: requestFullscreen requires a real user gesture (a keypress or click on
 * the TV itself) — it cannot be triggered by the phone remote's synthetic
 * events, which the browser rejects as lacking user activation.
 */
export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(
    () =>
      typeof document !== "undefined" && Boolean(document.fullscreenElement),
  )

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }, [])

  return { isFullscreen, toggle }
}

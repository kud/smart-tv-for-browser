"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const ACTIVITY_EVENTS = [
  "keydown",
  "pointerdown",
  "pointermove",
  "wheel",
] as const

/**
 * Reports whether the user has been inactive for `timeout` ms. Any key,
 * pointer, or wheel activity resets the timer — used to trigger and dismiss
 * the idle screensaver.
 */
export const useIdle = (timeout = 45000) => {
  const [idle, setIdle] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reset = useCallback(() => {
    setIdle(false)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setIdle(true), timeout)
  }, [timeout])

  useEffect(() => {
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, reset, { passive: true }),
    )
    // Start the countdown without a synchronous setState in the effect body.
    timer.current = setTimeout(() => setIdle(true), timeout)
    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, reset),
      )
      if (timer.current) clearTimeout(timer.current)
    }
  }, [reset, timeout])

  return [idle, reset] as const
}

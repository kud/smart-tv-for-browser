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
 * the idle screensaver. `onWake` fires when activity ends an idle period.
 */
export const useIdle = (timeout = 45000, onWake?: () => void) => {
  const [idle, setIdle] = useState(false)
  const idleRef = useRef(false)
  const onWakeRef = useRef(onWake)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    onWakeRef.current = onWake
  }, [onWake])

  const startTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      idleRef.current = true
      setIdle(true)
    }, timeout)
  }, [timeout])

  const reset = useCallback(() => {
    if (idleRef.current) {
      idleRef.current = false
      onWakeRef.current?.()
    }
    setIdle(false)
    startTimer()
  }, [startTimer])

  useEffect(() => {
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, reset, { passive: true }),
    )
    startTimer()
    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, reset),
      )
      if (timer.current) clearTimeout(timer.current)
    }
  }, [reset, startTimer])

  return [idle, reset] as const
}

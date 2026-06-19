"use client"

import { useEffect, useState } from "react"

/**
 * State that hydrates from and syncs to localStorage. The initial value is read
 * synchronously via a lazy initialiser (no setState-in-effect, no cascading
 * render) and written back whenever it changes.
 */
export const usePersistedState = <T>(key: string, initial: T) => {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial
    try {
      const raw = window.localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage full or unavailable — ignore */
    }
  }, [key, value])

  return [value, setValue] as const
}

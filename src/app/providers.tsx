"use client"

import { useEffect } from "react"
import { init } from "@noriginmedia/norigin-spatial-navigation"

export const Providers = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    init({
      // Mirror virtual focus onto the real DOM node so screen readers and
      // :focus styles stay in sync with the spatial cursor.
      shouldFocusDOMNode: true,
    })
  }, [])

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    // The caching service worker conflicts with Next's dev HMR — stale chunks
    // trigger a reload loop — so only run it in production, and tear down any
    // dev-registered worker + caches to break the loop.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          registrations.forEach((registration) => registration.unregister()),
        )
        .catch(() => {})
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)))
      }
      return
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {})
  }, [])

  return <>{children}</>
}

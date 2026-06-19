"use client"

import { useEffect } from "react"
import { motion } from "motion/react"

const TOTAL_MS = 1000

// The tail end of the screensaver: it covers the screen instantly (opaque from
// frame one, sharing the screensaver's background) so the home screen is never
// visible behind it, holds the greeting, then fades out to reveal the
// already-focused home. Starting opaque is what prevents the app "peeking"
// between the screensaver and the greeting.
export const WelcomeBack = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const id = setTimeout(onDone, TOTAL_MS)
    return () => clearTimeout(id)
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 z-[45] flex items-center justify-center bg-tv-bg"
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0] }}
      exit={{ opacity: 0 }}
      transition={{
        duration: TOTAL_MS / 1000,
        times: [0, 0.86, 1],
        ease: ["linear", "easeOut"],
      }}
    >
      <motion.span
        className="text-[7vh] font-semibold tracking-tight text-tv-text"
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        Welcome back
      </motion.span>
    </motion.div>
  )
}

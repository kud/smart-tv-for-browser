"use client"

import { useEffect } from "react"
import { motion } from "motion/react"

const TOTAL_MS = 2200

// Bridges the screensaver and the home screen on wake. The overlay shares the
// screensaver's background, so fading in (cover) dissolves the clock straight
// into the greeting with no seam; it then holds and fades out to reveal the
// already-focused home — one continuous motion rather than two overlapping ones.
export const WelcomeBack = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const id = setTimeout(onDone, TOTAL_MS)
    return () => clearTimeout(id)
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 z-[45] flex items-center justify-center bg-tv-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      exit={{ opacity: 0 }}
      transition={{
        duration: TOTAL_MS / 1000,
        times: [0, 0.26, 0.6, 1],
        ease: ["easeInOut", "linear", "easeInOut"],
      }}
    >
      <motion.span
        className="text-[7vh] font-semibold tracking-tight text-tv-text"
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        Welcome back
      </motion.span>
    </motion.div>
  )
}

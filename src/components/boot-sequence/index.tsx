"use client"

import { useEffect } from "react"
import { motion, useReducedMotion } from "motion/react"

import { Wordmark } from "@/components/wordmark"

export const BootSequence = ({
  onComplete,
  skip = false,
}: {
  onComplete: () => void
  skip?: boolean
}) => {
  const reduceMotion = useReducedMotion()
  const duration = reduceMotion ? 0.4 : 2.4
  // Returning from a channel (skip): a quick, smooth fade-out — no logo, but
  // not a brutal cut.
  const skipDuration = 0.6

  useEffect(() => {
    const id = setTimeout(onComplete, (skip ? skipDuration : duration) * 1000)
    return () => clearTimeout(id)
  }, [onComplete, duration, skip])

  if (skip) {
    return (
      <motion.div
        className="fixed inset-0 z-50 bg-tv-bg"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: skipDuration, ease: "easeOut" }}
      />
    )
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-tv-bg"
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0] }}
      transition={{ duration, times: [0, 0.8, 1] }}
    >
      <motion.div
        className="flex flex-col items-center gap-[3vh]"
        initial={{ scale: reduceMotion ? 1 : 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: reduceMotion ? 0.2 : 1,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <Wordmark className="text-[8vh] drop-shadow-[0_0_6vh_rgba(180,190,255,0.45)]" />
        <motion.span
          className="block h-[0.4vh] rounded-full bg-gradient-to-r from-amber-200 to-orange-400"
          initial={{ width: 0, opacity: 0.4 }}
          animate={{ width: reduceMotion ? "12vw" : ["0vw", "18vw", "0vw"] }}
          transition={{ duration, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  )
}

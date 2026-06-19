"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

export const Screensaver = ({
  visible,
  hour12,
}: {
  visible: boolean
  hour12: boolean
}) => {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(id)
  }, [visible])

  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  })

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-tv-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeOut" } }}
          transition={{ duration: 1.2 }}
          aria-hidden
        >
          <motion.div
            className="absolute h-[120vh] w-[120vw] opacity-60"
            style={{
              background:
                "radial-gradient(40vw 40vw at 30% 40%, rgba(80, 90, 160, 0.55), transparent 70%), radial-gradient(40vw 40vw at 70% 70%, rgba(40, 120, 130, 0.5), transparent 70%)",
            }}
            animate={{ x: ["-6vw", "6vw", "-6vw"], y: ["-4vh", "4vh", "-4vh"] }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            className="relative text-[17vh] font-semibold tabular-nums tracking-tighter text-white"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
          >
            {time}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

"use client"

import { useEffect } from "react"
import { motion } from "motion/react"
import { pause, resume } from "@noriginmedia/norigin-spatial-navigation"

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["←", "↑", "→", "↓"], label: "Move focus between channels" },
  { keys: ["Enter"], label: "Open the focused channel" },
  { keys: ["Tab", "⇧ Tab"], label: "Next / previous" },
  { keys: ["Esc", "Backspace"], label: "Back / close" },
  { keys: ["M"], label: "Open settings" },
  { keys: ["F"], label: "Toggle fullscreen" },
  { keys: ["?"], label: "This help" },
]

// Discoverable cheat-sheet so the app is fully operable from the keyboard.
export const KeyboardHelp = ({ onClose }: { onClose: () => void }) => {
  useEffect(() => {
    pause()
    return () => resume()
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-[4vh] backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <motion.div
        role="dialog"
        aria-label="Keyboard shortcuts"
        className="w-[44vw] min-w-[360px] rounded-[2vh] bg-tv-elevated p-[3vh] shadow-2xl"
        initial={{ scale: 0.95, y: 14 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
      >
        <h2 className="mb-[2.4vh] text-[2.8vh] font-semibold text-tv-text">
          Keyboard shortcuts
        </h2>
        <ul className="flex flex-col gap-[1.6vh]">
          {SHORTCUTS.map(({ keys, label }) => (
            <li
              key={label}
              className="flex items-center justify-between gap-[2vw]"
            >
              <span className="text-[2vh] text-tv-muted">{label}</span>
              <span className="flex shrink-0 items-center gap-[0.6vw]">
                {keys.map((key) => (
                  <kbd
                    key={key}
                    className="rounded-[0.8vh] border border-white/15 bg-black/40 px-[1vw] py-[0.6vh] text-[1.7vh] font-medium text-tv-text"
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-[2.8vh] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-[2vw] py-[1.2vh] text-[2vh] text-tv-text transition-colors hover:bg-white/20"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

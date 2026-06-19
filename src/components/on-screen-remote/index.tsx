"use client"

import { useState } from "react"
import {
  FiChevronUp,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiArrowLeft,
  FiMenu,
} from "react-icons/fi"
import { TbDeviceRemote } from "react-icons/tb"
import { motion, AnimatePresence } from "motion/react"
import clsx from "clsx"

import { playNavSound } from "@/lib/sounds"

const pressKey = (key: string) => {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
  window.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }))
}

const RemoteButton = ({
  onPress,
  label,
  children,
  className,
}: {
  onPress: () => void
  label: string
  children: React.ReactNode
  className?: string
}) => (
  <button
    type="button"
    aria-label={label}
    onClick={onPress}
    className={clsx(
      "flex items-center justify-center rounded-full bg-white/10 text-tv-text transition-colors hover:bg-white/20 active:bg-white/30",
      className,
    )}
  >
    {children}
  </button>
)

export const OnScreenRemote = () => {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-[var(--tv-safe-y)] right-[var(--tv-safe-x)] z-20 flex flex-col items-end gap-[1.5vh]">
      <AnimatePresence>
        {open && (
          <motion.div
            className="flex flex-col items-center gap-[1vh] rounded-[2vh] bg-tv-elevated/90 p-[1.6vh] backdrop-blur-xl"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            role="group"
            aria-label="On-screen remote"
          >
            <RemoteButton
              label="Up"
              onPress={() => pressKey("ArrowUp")}
              className="h-[6vh] w-[6vh] text-[3vh]"
            >
              <FiChevronUp />
            </RemoteButton>
            <div className="flex items-center gap-[1vh]">
              <RemoteButton
                label="Left"
                onPress={() => pressKey("ArrowLeft")}
                className="h-[6vh] w-[6vh] text-[3vh]"
              >
                <FiChevronLeft />
              </RemoteButton>
              <RemoteButton
                label="OK"
                onPress={() => pressKey("Enter")}
                className="h-[6vh] w-[6vh] text-[2vh] font-semibold"
              >
                OK
              </RemoteButton>
              <RemoteButton
                label="Right"
                onPress={() => pressKey("ArrowRight")}
                className="h-[6vh] w-[6vh] text-[3vh]"
              >
                <FiChevronRight />
              </RemoteButton>
            </div>
            <RemoteButton
              label="Down"
              onPress={() => pressKey("ArrowDown")}
              className="h-[6vh] w-[6vh] text-[3vh]"
            >
              <FiChevronDown />
            </RemoteButton>
            <div className="mt-[0.5vh] flex items-center gap-[1.5vh]">
              <RemoteButton
                label="Back"
                onPress={() => {
                  pressKey("Escape")
                  setOpen(false)
                }}
                className="h-[5vh] w-[5vh] text-[2.4vh]"
              >
                <FiArrowLeft />
              </RemoteButton>
              <RemoteButton
                label="Menu"
                onPress={() => pressKey("m")}
                className="h-[5vh] w-[5vh] text-[2.4vh]"
              >
                <FiMenu />
              </RemoteButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        aria-label={open ? "Hide remote" : "Show remote"}
        aria-expanded={open}
        onClick={() => {
          playNavSound()
          setOpen((value) => !value)
        }}
        className="flex h-[6vh] w-[6vh] items-center justify-center rounded-full bg-tv-elevated/90 text-[3vh] text-tv-text backdrop-blur-xl transition-colors hover:bg-white/20"
      >
        <TbDeviceRemote />
      </button>
    </div>
  )
}

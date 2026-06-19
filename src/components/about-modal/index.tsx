"use client"

import { useEffect } from "react"
import { motion } from "motion/react"
import { FiCoffee } from "react-icons/fi"
import { pause, resume } from "@noriginmedia/norigin-spatial-navigation"

import { Wordmark } from "@/components/wordmark"
import { APP_VERSION } from "@/lib/version"

const KOFI_URL = "https://ko-fi.com/B4I421NYZC"

const TECH = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Motion",
  "Norigin Spatial Navigation",
  "PWA",
]

export const AboutModal = ({ onClose }: { onClose: () => void }) => {
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
        aria-label="About smartTV"
        className="w-[46vw] min-w-[360px] rounded-[2vh] bg-tv-elevated p-[3vh] shadow-2xl"
        initial={{ scale: 0.95, y: 14 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
      >
        <div className="mb-[1.6vh] flex items-baseline gap-[1vw]">
          <Wordmark className="text-[3.4vh]" />
          <span className="text-[1.8vh] text-tv-muted">v{APP_VERSION}</span>
        </div>

        <p className="mb-[2vh] text-[2vh] leading-relaxed text-tv-muted">
          A smart-TV experience for the browser — a 10-foot, D-pad-navigable
          launcher for your streaming apps. Built to feel like switching on a
          real TV: power-on sequence, status bar, on-screen remote and idle
          screensaver, installable as a fast offline PWA with a companion
          browser extension for a Home button on any channel.
        </p>

        <p className="mb-[1vh] text-[1.6vh] font-semibold uppercase tracking-wider text-tv-text/80">
          Built with
        </p>
        <div className="mb-[2.4vh] flex flex-wrap gap-[0.6vw]">
          {TECH.map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-white/8 px-[1vw] py-[0.6vh] text-[1.6vh] text-tv-text"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between gap-[1vw]">
          <a
            href={KOFI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-[0.6vw] rounded-full px-[1.6vw] py-[1.2vh] text-[2vh] font-semibold text-white transition-transform active:translate-y-[1px]"
            style={{ backgroundColor: "#72a4f2" }}
          >
            <FiCoffee /> Support me on Ko-fi
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-[2vw] py-[1.2vh] text-[2vh] text-tv-text transition-colors hover:bg-white/20"
          >
            Close
          </button>
        </div>

        <p className="mt-[2vh] text-[1.4vh] text-tv-muted">
          Not affiliated with any of the listed services. Logos belong to their
          respective owners.
        </p>
      </motion.div>
    </motion.div>
  )
}

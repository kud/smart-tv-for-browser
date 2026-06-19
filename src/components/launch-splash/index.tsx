"use client"

import { motion } from "motion/react"

import type { Service } from "@/lib/services"

const isLight = (hex: string) => {
  const value = hex.replace("#", "")
  if (value.length < 6) return false
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 150
}

export const LaunchSplash = ({ service }: { service: Service }) => {
  const onLight = isLight(service.backgroundColor)
  const fg = onLight ? "#0b0b0b" : "#ffffff"

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-[5vh]"
      style={{ backgroundColor: service.backgroundColor }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      role="status"
      aria-live="polite"
      aria-label={`Opening ${service.name}`}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-center"
      >
        {service.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.logo}
            alt=""
            className="h-[18vh] w-[18vh] object-contain"
          />
        ) : (
          <span
            className="text-[8vh] font-bold tracking-tight"
            style={{ color: service.textColor ?? fg }}
          >
            {service.name}
          </span>
        )}
      </motion.div>

      <motion.span
        aria-hidden
        className="block h-[5vh] w-[5vh] rounded-full border-[0.5vh] border-current"
        style={{ color: fg, borderTopColor: "transparent" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
      />

      <span
        className="text-[2.4vh] font-medium opacity-80"
        style={{ color: fg }}
      >
        Opening {service.name}…
      </span>
    </motion.div>
  )
}

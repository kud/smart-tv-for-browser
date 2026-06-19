"use client"

import { useEffect } from "react"
import { useFocusable } from "@noriginmedia/norigin-spatial-navigation"
import { motion } from "motion/react"

import type { Service } from "@/lib/services"

export type TileSize = number | "auto"

type AppTileProps = {
  service: Service
  size: TileSize
  onLaunch: (service: Service) => void
}

// "auto" scales tiles responsively with the viewport; a number is a fixed px.
const AUTO_DIMENSION = "clamp(120px, 13vw, 260px)"
const AUTO_LABEL = "clamp(14px, 1.6vw, 28px)"

export const AppTile = ({ service, size, onLaunch }: AppTileProps) => {
  const { ref, focused } = useFocusable<object, HTMLAnchorElement>({
    onEnterPress: () => onLaunch(service),
    accessibilityLabel: `Open ${service.name}`,
  })

  const dimension = size === "auto" ? AUTO_DIMENSION : `${size}px`
  const labelSize = size === "auto" ? AUTO_LABEL : `${size * 0.15}px`

  // Keep the focused tile in view — essential for the horizontal slider layout.
  useEffect(() => {
    if (focused) {
      ref.current?.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: "smooth",
      })
    }
  }, [focused, ref])

  return (
    <motion.a
      ref={ref}
      href={service.link}
      role="button"
      aria-label={`Open ${service.name}`}
      tabIndex={-1}
      onClick={(event) => {
        event.preventDefault()
        onLaunch(service)
      }}
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-[1.6vh] will-change-transform"
      style={{
        width: dimension,
        height: dimension,
        zIndex: focused ? 10 : 1,
        backgroundColor: service.backgroundColor,
        boxShadow: focused ? "var(--focus-ring)" : "none",
      }}
      animate={{ scale: focused ? 1.12 : 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
    >
      {service.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={service.logo}
          alt=""
          className="pointer-events-none h-[62%] w-[62%] object-contain"
        />
      ) : (
        <span
          className="pointer-events-none px-[10%] text-center font-bold leading-tight tracking-tight"
          style={{
            color: service.textColor ?? "#ffffff",
            fontSize: labelSize,
          }}
        >
          {service.name}
        </span>
      )}
      {focused && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background:
              "linear-gradient(120deg, rgba(255,255,255,0.08), transparent 40%)",
          }}
        />
      )}
    </motion.a>
  )
}

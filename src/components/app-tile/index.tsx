"use client"

import { useEffect } from "react"
import { useFocusable } from "@noriginmedia/norigin-spatial-navigation"
import { motion } from "motion/react"

import type { Service } from "@/lib/services"
import type { LayoutMode } from "@/components/app-grid"

export type TileSize = number | "auto"
export type TileShape = "rounded" | "square" | "circle"

type AppTileProps = {
  service: Service
  size: TileSize
  shape: TileShape
  layout: LayoutMode
  onLaunch: (service: Service) => void
}

// "auto" scales tiles responsively with the viewport; a number is a fixed px.
const AUTO_DIMENSION = "clamp(120px, 13vw, 260px)"
const AUTO_LABEL = "clamp(14px, 1.6vw, 28px)"

// Drives the tile's corner radius; "rounded" matches the original Apple-TV look.
const SHAPE_RADIUS: Record<TileShape, string> = {
  rounded: "1.6vh",
  square: "0.4vh",
  circle: "50%",
}

export const AppTile = ({
  service,
  size,
  shape,
  layout,
  onLaunch,
}: AppTileProps) => {
  const { ref, focused } = useFocusable<object, HTMLAnchorElement>({
    onEnterPress: () => onLaunch(service),
    accessibilityLabel: `Open ${service.name}`,
  })

  const dimension = size === "auto" ? AUTO_DIMENSION : `${size}px`
  const labelSize = size === "auto" ? AUTO_LABEL : `${size * 0.15}px`

  // Keep the focused tile in view. The slider centres horizontally; the grid
  // scrolls on the block axis only, letting the container's padding clear the
  // edge rows so first/last focus doesn't yank the scroll.
  useEffect(() => {
    if (focused) {
      ref.current?.scrollIntoView(
        layout === "slider"
          ? { block: "nearest", inline: "center", behavior: "smooth" }
          : { block: "nearest", behavior: "smooth" },
      )
    }
  }, [focused, layout, ref])

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
      className="relative flex shrink-0 select-none items-center justify-center overflow-hidden scroll-my-[7vh] will-change-transform"
      style={{
        width: dimension,
        height: dimension,
        borderRadius: SHAPE_RADIUS[shape],
        zIndex: focused ? 10 : 1,
        backgroundColor: service.backgroundColor,
        boxShadow: focused ? "var(--focus-ring)" : "none",
      }}
      animate={{ scale: focused ? 1.12 : 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
    >
      {service.icon ? (
        // Official app icon: full-bleed art clipped by the tile's radius — the
        // real smart-TV launcher look.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={service.icon}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      ) : service.logo ? (
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

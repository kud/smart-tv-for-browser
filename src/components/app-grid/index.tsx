"use client"

import { useEffect, useRef } from "react"
import {
  FocusContext,
  useFocusable,
  navigateByDirection,
} from "@noriginmedia/norigin-spatial-navigation"

import type { Service } from "@/lib/services"
import { AppTile, type TileSize, type TileShape } from "@/components/app-tile"

export type DisplayChannel = { id: string; service: Service }
export type LayoutMode = "grid" | "slider"

type AppGridProps = {
  channels: DisplayChannel[]
  size: TileSize
  shape: TileShape
  layout: LayoutMode
  snappyScroll: boolean
  active: boolean
  onLaunch: (service: Service) => void
}

export const AppGrid = ({
  channels,
  size,
  shape,
  layout,
  snappyScroll,
  active,
  onLaunch,
}: AppGridProps) => {
  const { ref, focusKey, focusSelf } = useFocusable<object, HTMLDivElement>({
    focusKey: "GRID",
    saveLastFocusedChild: true,
    trackChildren: true,
  })

  useEffect(() => {
    if (active) focusSelf()
  }, [active, focusSelf])

  // Make the wheel/trackpad behave like the D-pad: each scroll step moves focus
  // one channel (snappy) instead of free pixel-scrolling. Throttled so a
  // continuous swipe steps rather than races. Non-passive so preventDefault
  // actually cancels the native scroll (React's onWheel is passive).
  const lastWheel = useRef(0)
  useEffect(() => {
    const el = ref.current
    if (!el || !snappyScroll) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      if (!active) return
      // Ignore the small trailing deltas of trackpad momentum, and only allow
      // one move per gesture window — otherwise a single swipe steps twice.
      if (Math.max(Math.abs(event.deltaX), Math.abs(event.deltaY)) < 8) return
      const now = performance.now()
      if (now - lastWheel.current < 450) return
      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      const direction =
        layout === "slider"
          ? (horizontal ? event.deltaX : event.deltaY) > 0
            ? "right"
            : "left"
          : horizontal
            ? event.deltaX > 0
              ? "right"
              : "left"
            : event.deltaY > 0
              ? "down"
              : "up"
      lastWheel.current = now
      navigateByDirection(direction, {})
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [ref, active, layout, snappyScroll])

  const containerClass =
    layout === "slider"
      ? "no-scrollbar flex w-screen flex-nowrap items-center gap-[3vw] overflow-x-auto overflow-y-visible px-[var(--tv-safe-x)] py-[8vh] scroll-px-[var(--tv-safe-x)] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]"
      : "no-scrollbar flex max-h-full max-w-[80vw] flex-wrap content-start justify-center gap-[3vw] overflow-y-auto overflow-x-hidden px-[1vw] py-[7vh] [mask-image:linear-gradient(to_bottom,transparent_0,#000_7vh,#000_calc(100%-7vh),transparent_100%)]"

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        role="grid"
        aria-label="Channels"
        className={containerClass}
      >
        {channels.map(({ id, service }) => (
          <AppTile
            key={id}
            service={service}
            size={size}
            shape={shape}
            layout={layout}
            onLaunch={onLaunch}
          />
        ))}
      </div>
    </FocusContext.Provider>
  )
}

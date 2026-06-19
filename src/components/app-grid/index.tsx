"use client"

import { useEffect } from "react"
import {
  FocusContext,
  useFocusable,
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
  active: boolean
  onLaunch: (service: Service) => void
}

export const AppGrid = ({
  channels,
  size,
  shape,
  layout,
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

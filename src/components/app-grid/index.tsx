"use client"

import { useEffect } from "react"
import {
  FocusContext,
  useFocusable,
} from "@noriginmedia/norigin-spatial-navigation"

import type { Service } from "@/lib/services"
import { AppTile, type TileSize } from "@/components/app-tile"

export type DisplayChannel = { id: string; service: Service }
export type LayoutMode = "grid" | "slider"

type AppGridProps = {
  channels: DisplayChannel[]
  size: TileSize
  layout: LayoutMode
  active: boolean
  onLaunch: (service: Service) => void
}

export const AppGrid = ({
  channels,
  size,
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
      : "flex max-w-[80vw] flex-wrap content-start justify-center gap-[3vw]"

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        role="grid"
        aria-label="Channels"
        className={containerClass}
      >
        {channels.map(({ id, service }) => (
          <AppTile key={id} service={service} size={size} onLaunch={onLaunch} />
        ))}
      </div>
    </FocusContext.Provider>
  )
}

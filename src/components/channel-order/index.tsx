"use client"

import { useRef } from "react"
import { FiMenu } from "react-icons/fi"

import type { DisplayChannel } from "@/components/app-grid"

// Mouse drag-and-drop reordering of the channel list. Emits the new id order;
// the parent persists it and switches to the "custom" sort mode.
export const ChannelOrderList = ({
  channels,
  onReorder,
}: {
  channels: DisplayChannel[]
  onReorder: (ids: string[]) => void
}) => {
  const dragId = useRef<string | null>(null)
  const overId = useRef<string | null>(null)

  const commit = () => {
    const from = dragId.current
    const to = overId.current
    dragId.current = null
    overId.current = null
    if (!from || !to || from === to) return
    const ids = channels.map((channel) => channel.id)
    const fromIndex = ids.indexOf(from)
    const toIndex = ids.indexOf(to)
    if (fromIndex < 0 || toIndex < 0) return
    ids.splice(toIndex, 0, ids.splice(fromIndex, 1)[0])
    onReorder(ids)
  }

  return (
    <div className="flex flex-col gap-[0.6vh]">
      {channels.map(({ id, service }) => (
        <div
          key={id}
          draggable
          onDragStart={() => {
            dragId.current = id
          }}
          onDragEnter={() => {
            overId.current = id
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            overId.current = id
            commit()
          }}
          onDragEnd={commit}
          className="flex cursor-grab items-center gap-[1vw] rounded-[1.2vh] bg-white/5 px-[1.2vw] py-[1vh] text-[2vh] text-tv-text transition-colors hover:bg-white/10 active:cursor-grabbing"
        >
          <FiMenu className="shrink-0 text-[2.2vh] text-tv-muted" />
          <span
            className="flex h-[3.4vh] w-[3.4vh] shrink-0 items-center justify-center overflow-hidden rounded-[0.6vh]"
            style={{ backgroundColor: service.backgroundColor }}
          >
            {(service.icon || service.logo) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={service.icon || service.logo}
                alt=""
                className={
                  service.icon
                    ? "h-full w-full object-cover"
                    : "h-[70%] w-[70%] object-contain"
                }
              />
            )}
          </span>
          <span className="truncate">{service.name}</span>
        </div>
      ))}
    </div>
  )
}

"use client"

import { useRef } from "react"
import { FiMenu, FiEdit2 } from "react-icons/fi"
import clsx from "clsx"

import type { Service, CustomChannel } from "@/lib/services"
import { useFocusableRow } from "@/hooks/use-focusable-row"

// Every channel the user can manage — built-ins (toggleable) and customs
// (editable) — in their current display order. The grid renders the enabled
// subset of these.
export type ManagedChannel = {
  id: string
  service: Service
  enabled: boolean
  isCustom: boolean
  custom?: CustomChannel
}

const Thumb = ({ service }: { service: Service }) => (
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
)

const Toggle = ({
  enabled,
  label,
  onToggle,
}: {
  enabled: boolean
  label: string
  onToggle: () => void
}) => {
  const { ref, focused } = useFocusableRow<HTMLButtonElement>({
    onEnterPress: onToggle,
    accessibilityLabel: `${label}, ${enabled ? "shown" : "hidden"}`,
  })

  return (
    <button
      ref={ref}
      type="button"
      tabIndex={-1}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onToggle}
      className="shrink-0 rounded-full p-[0.5vh]"
      style={{ boxShadow: focused ? "var(--focus-ring)" : "none" }}
    >
      <span
        aria-hidden
        className={clsx(
          "relative block h-[2.6vh] w-[5vh] rounded-full transition-colors",
          enabled ? "bg-emerald-400" : "bg-white/20",
        )}
      >
        <span
          className="absolute top-[0.3vh] h-[2vh] w-[2vh] rounded-full bg-white transition-all"
          style={{ left: enabled ? "calc(100% - 2.3vh)" : "0.3vh" }}
        />
      </span>
    </button>
  )
}

const EditButton = ({
  label,
  onEdit,
}: {
  label: string
  onEdit: () => void
}) => {
  const { ref, focused } = useFocusableRow<HTMLButtonElement>({
    onEnterPress: onEdit,
    accessibilityLabel: `Edit ${label}`,
  })

  return (
    <button
      ref={ref}
      type="button"
      tabIndex={-1}
      onClick={onEdit}
      aria-label={`Edit ${label}`}
      className={clsx(
        "shrink-0 rounded-full p-[0.8vh] text-[2.2vh] transition-colors",
        focused ? "bg-white/15 text-tv-text" : "text-tv-muted",
      )}
      style={{ boxShadow: focused ? "var(--focus-ring)" : "none" }}
    >
      <FiEdit2 />
    </button>
  )
}

// Mouse drag-and-drop reordering; the inline toggle/edit controls are spatial-
// focusable so the keyboard can still reach them.
export const ChannelList = ({
  channels,
  onReorder,
  onToggleService,
  onEditChannel,
}: {
  channels: ManagedChannel[]
  onReorder: (ids: string[]) => void
  onToggleService: (key: string) => void
  onEditChannel: (channel: CustomChannel) => void
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
      {channels.map((channel) => (
        <div
          key={channel.id}
          draggable
          onDragStart={() => {
            dragId.current = channel.id
          }}
          onDragEnter={() => {
            overId.current = channel.id
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            overId.current = channel.id
            commit()
          }}
          onDragEnd={commit}
          className={clsx(
            "flex cursor-grab items-center gap-[1vw] rounded-[1.2vh] bg-white/5 px-[1.2vw] py-[1vh] text-[2vh] transition-opacity hover:bg-white/10 active:cursor-grabbing",
            channel.enabled ? "text-tv-text" : "text-tv-muted opacity-55",
          )}
        >
          <FiMenu className="shrink-0 text-[2.2vh] text-tv-muted" />
          <Thumb service={channel.service} />
          <span className="flex-1 truncate">{channel.service.name}</span>
          {channel.isCustom && channel.custom ? (
            <EditButton
              label={channel.service.name}
              onEdit={() => onEditChannel(channel.custom!)}
            />
          ) : (
            <Toggle
              enabled={channel.enabled}
              label={channel.service.name}
              onToggle={() => onToggleService(channel.id)}
            />
          )}
        </div>
      ))}
    </div>
  )
}

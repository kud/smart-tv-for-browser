"use client"

import { useEffect } from "react"
import {
  FocusContext,
  useFocusable,
} from "@noriginmedia/norigin-spatial-navigation"

import { useFocusableRow } from "@/hooks/use-focusable-row"
import { AnimatePresence, motion } from "motion/react"
import {
  FiX,
  FiExternalLink,
  FiEdit2,
  FiPlus,
  FiHelpCircle,
  FiInfo,
} from "react-icons/fi"
import clsx from "clsx"

import {
  services,
  serviceKeys,
  type ServiceSelection,
  type CustomChannel,
  type SortMode,
} from "@/lib/services"
import type { TileSize, TileShape } from "@/components/app-tile"
import type { LayoutMode, DisplayChannel } from "@/components/app-grid"
import { ChannelOrderList } from "@/components/channel-order"

const SHAPE_LABELS: Record<TileShape, string> = {
  rounded: "Rounded",
  square: "Square",
  circle: "Circle",
}

// Recommended phone-as-remote app (Bluetooth keyboard/mouse) until a
// first-party smartTV remote exists.
const BLEK_ANDROID_URL =
  "https://play.google.com/store/apps/details?id=io.appground.blek&hl=en_GB"

const CloseButton = ({ onClose }: { onClose: () => void }) => {
  const { ref, focused } = useFocusableRow<HTMLButtonElement>({
    onEnterPress: onClose,
    accessibilityLabel: "Close settings",
  })

  return (
    <button
      ref={ref}
      type="button"
      tabIndex={-1}
      aria-label="Close settings"
      onClick={onClose}
      className={clsx(
        "flex h-[5vh] w-[5vh] items-center justify-center rounded-full text-[2.6vh] transition-colors",
        focused ? "bg-white/15 text-tv-text" : "text-tv-muted",
      )}
      style={{ boxShadow: focused ? "var(--focus-ring)" : "none" }}
    >
      <FiX />
    </button>
  )
}

export const TILE_MIN = 120
export const TILE_MAX = 320
export const TILE_STEP = 20

type ServiceToggleRowProps = {
  label: string
  enabled: boolean
  onToggle: () => void
}

const ServiceToggleRow = ({
  label,
  enabled,
  onToggle,
}: ServiceToggleRowProps) => {
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
      className={clsx(
        "flex w-full items-center justify-between rounded-[1.2vh] px-[1.4vw] py-[1.4vh] text-[2.1vh] transition-colors",
        focused ? "bg-white/12 text-tv-text" : "text-tv-muted",
      )}
      style={{ boxShadow: focused ? "var(--focus-ring)" : "none" }}
    >
      <span>{label}</span>
      <span
        aria-hidden
        className={clsx(
          "relative h-[2.6vh] w-[5vh] rounded-full transition-colors",
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

// The ordered ring the stepper walks: "Auto" first, then each fixed px size.
// Left/right wrap around the ends so the control loops like the other cycles.
const SIZE_VALUES: TileSize[] = [
  "auto",
  ...Array.from(
    { length: (TILE_MAX - TILE_MIN) / TILE_STEP + 1 },
    (_, i) => TILE_MIN + i * TILE_STEP,
  ),
]

type SizeStepperRowProps = {
  size: TileSize
  onSizeChange: (size: TileSize) => void
}

const SizeStepperRow = ({ size, onSizeChange }: SizeStepperRowProps) => {
  const isAuto = size === "auto"
  const index = SIZE_VALUES.indexOf(size)
  const step = (delta: number) =>
    onSizeChange(
      SIZE_VALUES[(index + delta + SIZE_VALUES.length) % SIZE_VALUES.length],
    )

  const { ref, focused } = useFocusableRow<HTMLDivElement>({
    accessibilityLabel: `Tile size ${
      isAuto ? "auto" : `${size} pixels`
    }. Use left and right to adjust.`,
    onArrowPress: (direction) => {
      if (direction === "left") {
        step(-1)
        return false
      }
      if (direction === "right") {
        step(1)
        return false
      }
      return true
    },
  })

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="slider"
      aria-valuemin={TILE_MIN}
      aria-valuemax={TILE_MAX}
      aria-valuenow={isAuto ? undefined : size}
      aria-valuetext={isAuto ? "Auto" : undefined}
      aria-label="Tile size"
      className={clsx(
        "flex w-full items-center justify-between rounded-[1.2vh] px-[1.4vw] py-[1.4vh] text-[2.1vh] transition-colors",
        focused ? "bg-white/12 text-tv-text" : "text-tv-muted",
      )}
      style={{ boxShadow: focused ? "var(--focus-ring)" : "none" }}
    >
      <span>Tile size</span>
      <span className="flex items-center gap-[1vw] tabular-nums">
        <span aria-hidden className={focused ? "opacity-100" : "opacity-30"}>
          ◀
        </span>
        <span className="w-[12vh] text-center text-tv-text">
          {isAuto ? "Auto" : size}
        </span>
        <span aria-hidden className={focused ? "opacity-100" : "opacity-30"}>
          ▶
        </span>
      </span>
    </div>
  )
}

// A two-value row with the same ◀ ▶ affordance as the size stepper, so it
// reads as adjustable. Left/right/Enter all cycle the value.
const CycleRow = ({
  label,
  value,
  onCycle,
}: {
  label: string
  value: string
  onCycle: () => void
}) => {
  const { ref, focused } = useFocusableRow<HTMLDivElement>({
    accessibilityLabel: `${label} ${value}. Left, right or Enter to change.`,
    onEnterPress: onCycle,
    onArrowPress: (direction) => {
      if (direction === "left" || direction === "right") {
        onCycle()
        return false
      }
      return true
    },
  })

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="button"
      aria-label={`${label}: ${value}`}
      onClick={onCycle}
      className={clsx(
        "flex w-full items-center justify-between rounded-[1.2vh] px-[1.4vw] py-[1.4vh] text-[2.1vh] transition-colors",
        focused ? "bg-white/12 text-tv-text" : "text-tv-muted",
      )}
      style={{ boxShadow: focused ? "var(--focus-ring)" : "none" }}
    >
      <span>{label}</span>
      <span className="flex items-center gap-[1vw]">
        <span aria-hidden className={focused ? "opacity-100" : "opacity-30"}>
          ◀
        </span>
        <span className="w-[12vh] text-center text-tv-text">{value}</span>
        <span aria-hidden className={focused ? "opacity-100" : "opacity-30"}>
          ▶
        </span>
      </span>
    </div>
  )
}

const RemoteRow = ({
  label,
  sublabel,
  href,
  disabled,
}: {
  label: string
  sublabel: string
  href?: string
  disabled?: boolean
}) => {
  const open = () => href && window.open(href, "_blank", "noopener,noreferrer")
  const { ref, focused } = useFocusableRow<HTMLButtonElement>({
    focusable: !disabled,
    onEnterPress: open,
    accessibilityLabel: `${label}. ${sublabel}`,
  })

  return (
    <button
      ref={ref}
      type="button"
      tabIndex={-1}
      disabled={disabled}
      aria-label={`${label}. ${sublabel}`}
      onClick={open}
      className={clsx(
        "flex w-full items-center justify-between rounded-[1.2vh] px-[1.4vw] py-[1.4vh] text-left text-[2.1vh] transition-colors",
        focused ? "bg-white/12 text-tv-text" : "text-tv-muted",
        disabled && "opacity-60",
      )}
      style={{ boxShadow: focused ? "var(--focus-ring)" : "none" }}
    >
      <span className="flex flex-col">
        <span>{label}</span>
        <span className="text-[1.5vh] text-tv-muted">{sublabel}</span>
      </span>
      {href && !disabled && <FiExternalLink className="text-[2.2vh]" />}
    </button>
  )
}

const CustomChannelRow = ({
  channel,
  onEdit,
}: {
  channel: CustomChannel
  onEdit: () => void
}) => {
  const { ref, focused } = useFocusableRow<HTMLButtonElement>({
    onEnterPress: onEdit,
    accessibilityLabel: `${channel.name}. Press to edit.`,
  })

  return (
    <button
      ref={ref}
      type="button"
      tabIndex={-1}
      onClick={onEdit}
      aria-label={`Edit ${channel.name}`}
      className={clsx(
        "flex w-full items-center justify-between rounded-[1.2vh] px-[1.4vw] py-[1.4vh] text-[2.1vh] transition-colors",
        focused ? "bg-white/12 text-tv-text" : "text-tv-muted",
      )}
      style={{ boxShadow: focused ? "var(--focus-ring)" : "none" }}
    >
      <span className="truncate">{channel.name}</span>
      <FiEdit2 className="ml-[1vw] shrink-0 text-[2.2vh]" />
    </button>
  )
}

const ActionRow = ({
  label,
  icon,
  onActivate,
}: {
  label: string
  icon: React.ReactNode
  onActivate: () => void
}) => {
  const { ref, focused } = useFocusableRow<HTMLButtonElement>({
    onEnterPress: onActivate,
    accessibilityLabel: label,
  })

  return (
    <button
      ref={ref}
      type="button"
      tabIndex={-1}
      onClick={onActivate}
      className={clsx(
        "flex w-full items-center gap-[0.8vw] rounded-[1.2vh] px-[1.4vw] py-[1.4vh] text-[2.1vh] transition-colors",
        focused ? "bg-white/12 text-tv-text" : "text-tv-muted",
      )}
      style={{ boxShadow: focused ? "var(--focus-ring)" : "none" }}
    >
      <span className="text-[2.4vh]">{icon}</span>
      {label}
    </button>
  )
}

const AddChannelRow = ({ onAdd }: { onAdd: () => void }) => {
  const { ref, focused } = useFocusableRow<HTMLButtonElement>({
    onEnterPress: onAdd,
    accessibilityLabel: "Add a custom channel",
  })

  return (
    <button
      ref={ref}
      type="button"
      tabIndex={-1}
      onClick={onAdd}
      className={clsx(
        "flex w-full items-center gap-[0.8vw] rounded-[1.2vh] px-[1.4vw] py-[1.4vh] text-[2.1vh] transition-colors",
        focused ? "bg-white/12 text-tv-text" : "text-tv-muted",
      )}
      style={{ boxShadow: focused ? "var(--focus-ring)" : "none" }}
    >
      <FiPlus className="text-[2.4vh]" /> Add custom channel
    </button>
  )
}

type SettingsPanelBodyProps = {
  selection: ServiceSelection
  size: TileSize
  shape: TileShape
  layout: LayoutMode
  soundEnabled: boolean
  twelveHour: boolean
  snappyScroll: boolean
  sortMode: SortMode
  channels: DisplayChannel[]
  customChannels: CustomChannel[]
  onToggleService: (key: string) => void
  onSizeChange: (size: TileSize) => void
  onCycleShape: () => void
  onCycleSort: () => void
  onReorderChannels: (ids: string[]) => void
  onToggleLayout: () => void
  onToggleSnappyScroll: () => void
  onToggleSound: () => void
  onToggleClock: () => void
  onAddChannel: () => void
  onEditChannel: (channel: CustomChannel) => void
  onShowHelp: () => void
  onShowAbout: () => void
  onClose: () => void
}

// Only mounted while the panel is open, so the "SETTINGS" focusable is never
// registered without a DOM node (which would warn and break spatial layout).
const SettingsPanelBody = ({
  selection,
  size,
  shape,
  layout,
  soundEnabled,
  twelveHour,
  snappyScroll,
  sortMode,
  channels,
  customChannels,
  onToggleService,
  onSizeChange,
  onCycleShape,
  onCycleSort,
  onReorderChannels,
  onToggleLayout,
  onToggleSnappyScroll,
  onToggleSound,
  onToggleClock,
  onAddChannel,
  onEditChannel,
  onShowHelp,
  onShowAbout,
  onClose,
}: SettingsPanelBodyProps) => {
  const { ref, focusKey, focusSelf } = useFocusable<object, HTMLDivElement>({
    focusKey: "SETTINGS",
    saveLastFocusedChild: true,
    trackChildren: true,
    isFocusBoundary: true,
  })

  useEffect(() => {
    focusSelf()
  }, [focusSelf])

  return (
    <FocusContext.Provider value={focusKey}>
      <motion.div
        className="fixed inset-0 z-30 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.aside
        ref={ref}
        role="dialog"
        aria-label="Settings"
        className="fixed left-0 top-0 z-30 flex h-full w-[34vw] min-w-[320px] flex-col gap-[1vh] overflow-y-auto scroll-py-[8vh] bg-tv-surface/95 px-[2vw] py-[var(--tv-safe-y)] backdrop-blur-xl"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
      >
        <div className="mb-[1vh] flex items-center justify-between">
          <h2 className="text-[2.8vh] font-semibold text-tv-text">Settings</h2>
          <CloseButton onClose={onClose} />
        </div>
        <CycleRow
          label="Layout"
          value={layout === "slider" ? "Slider" : "Grid"}
          onCycle={onToggleLayout}
        />
        <SizeStepperRow size={size} onSizeChange={onSizeChange} />
        <CycleRow
          label="Icon shape"
          value={SHAPE_LABELS[shape]}
          onCycle={onCycleShape}
        />
        <CycleRow
          label="Clock"
          value={twelveHour ? "12-hour" : "24-hour"}
          onCycle={onToggleClock}
        />
        <ServiceToggleRow
          label="Navigation sounds"
          enabled={soundEnabled}
          onToggle={onToggleSound}
        />
        <ServiceToggleRow
          label="Snappy scroll"
          enabled={snappyScroll}
          onToggle={onToggleSnappyScroll}
        />

        <p className="mt-[2vh] mb-[0.5vh] px-[1.4vw] text-[1.7vh] font-semibold uppercase tracking-wider text-tv-text/80">
          Channel order
        </p>
        <CycleRow
          label="Sort"
          value={sortMode === "alpha" ? "A–Z" : "Custom"}
          onCycle={onCycleSort}
        />
        {sortMode === "custom" && (
          <>
            <p className="px-[1.4vw] text-[1.5vh] text-tv-muted">
              Drag to reorder
            </p>
            <ChannelOrderList
              channels={channels}
              onReorder={onReorderChannels}
            />
          </>
        )}

        <p className="mt-[2vh] mb-[0.5vh] px-[1.4vw] text-[1.7vh] font-semibold uppercase tracking-wider text-tv-text/80">
          Apps
        </p>
        {serviceKeys.map((key) => (
          <ServiceToggleRow
            key={key}
            label={services[key].name}
            enabled={Boolean(selection[key])}
            onToggle={() => onToggleService(key)}
          />
        ))}

        <p className="mt-[2vh] mb-[0.5vh] px-[1.4vw] text-[1.7vh] font-semibold uppercase tracking-wider text-tv-text/80">
          Your channels
        </p>
        {customChannels.map((channel) => (
          <CustomChannelRow
            key={channel.id}
            channel={channel}
            onEdit={() => onEditChannel(channel)}
          />
        ))}
        <AddChannelRow onAdd={onAddChannel} />

        <p className="mt-[2vh] mb-[0.5vh] px-[1.4vw] text-[1.7vh] font-semibold uppercase tracking-wider text-tv-text/80">
          Remote
        </p>
        <RemoteRow
          label="Android — Bluetooth Keyboard & Mouse"
          sublabel="Use your phone as a TV remote"
          href={BLEK_ANDROID_URL}
        />
        <RemoteRow
          label="iOS"
          sublabel="Remote app — not available yet"
          disabled
        />
        <p className="px-[1.4vw] text-[1.5vh] text-tv-muted">
          Not affiliated with Blek — just what we use for now. A dedicated
          smartTV remote may arrive here one day.
        </p>

        <p className="mt-[2vh] mb-[0.5vh] px-[1.4vw] text-[1.7vh] font-semibold uppercase tracking-wider text-tv-text/80">
          About &amp; help
        </p>
        <ActionRow
          label="Keyboard shortcuts"
          icon={<FiHelpCircle />}
          onActivate={onShowHelp}
        />
        <ActionRow
          label="About smartTV"
          icon={<FiInfo />}
          onActivate={onShowAbout}
        />

        <p className="mt-auto pt-[2vh] text-[1.7vh] text-tv-muted">
          Press <kbd>Back</kbd> or <kbd>Esc</kbd> to close
        </p>
      </motion.aside>
    </FocusContext.Provider>
  )
}

type SettingsPanelProps = SettingsPanelBodyProps & { open: boolean }

export const SettingsPanel = ({ open, ...props }: SettingsPanelProps) => (
  <AnimatePresence>
    {open && <SettingsPanelBody key="settings" {...props} />}
  </AnimatePresence>
)

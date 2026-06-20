"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"
import { FiSettings } from "react-icons/fi"
import { AnimatePresence } from "motion/react"

import { usePersistedState } from "@/hooks/use-persisted-state"
import { useIdle } from "@/hooks/use-idle"
import { useTvKeys } from "@/hooks/use-tv-keys"
import { useRemoteReceiver } from "@/hooks/use-remote-receiver"
import { makeCode } from "@/lib/remote"
import {
  services,
  serviceKeys,
  defaultSelection,
  CUSTOM_CHANNEL_BG,
  type Service,
  type ServiceSelection,
  type CustomChannel,
} from "@/lib/services"
import {
  setSoundEnabled as applySoundEnabled,
  playNavSound,
  playSelectSound,
} from "@/lib/sounds"

import { BootSequence } from "@/components/boot-sequence"
import { StatusBar } from "@/components/status-bar"
import {
  AppGrid,
  type DisplayChannel,
  type LayoutMode,
} from "@/components/app-grid"
import type { TileSize, TileShape } from "@/components/app-tile"
import { SettingsPanel } from "@/components/settings-panel"
import type { ManagedChannel } from "@/components/channel-order"
import { OnScreenRemote } from "@/components/on-screen-remote"
import { Screensaver } from "@/components/screensaver"
import { LaunchSplash } from "@/components/launch-splash"
import { AddChannelModal } from "@/components/add-channel-modal"
import { WelcomeBack } from "@/components/welcome-back"
import { KeyboardHelp } from "@/components/keyboard-help"
import { AboutModal } from "@/components/about-modal"
import { RemotePairing } from "@/components/remote-pairing"

// Set by the companion extension's Home button so returning to the launcher
// doesn't replay the full boot animation. Read via useSyncExternalStore so the
// server snapshot (false) is used during hydration — no server/client mismatch.
const subscribeHash = (callback: () => void) => {
  window.addEventListener("hashchange", callback)
  return () => window.removeEventListener("hashchange", callback)
}

export const TvShell = () => {
  const skipSplash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash.includes("nosplash"),
    () => false,
  )
  const [booted, setBooted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selection, setSelection] = usePersistedState<ServiceSelection>(
    "services",
    defaultSelection,
  )
  const [size, setSize] = usePersistedState<TileSize>("imageSize", "auto")
  const [shape, setShape] = usePersistedState<TileShape>("iconShape", "rounded")
  const [soundEnabled, setSoundEnabled] = usePersistedState<boolean>(
    "soundEnabled",
    true,
  )
  const [twelveHour, setTwelveHour] = usePersistedState<boolean>(
    "clock12h",
    false,
  )
  const [layout, setLayout] = usePersistedState<LayoutMode>("layout", "grid")
  const [snappyScroll, setSnappyScroll] = usePersistedState<boolean>(
    "snappyScroll",
    true,
  )
  const [customChannels, setCustomChannels] = usePersistedState<
    CustomChannel[]
  >("customChannels", [])
  const [channelOrder, setChannelOrder] = usePersistedState<string[]>(
    "channelOrder",
    [],
  )
  const [welcomeBack, setWelcomeBack] = useState(false)
  const [idle, resetIdle] = useIdle(45000, () => setWelcomeBack(true))
  const [launching, setLaunching] = useState<Service | null>(null)
  const [showAddChannel, setShowAddChannel] = useState(false)
  const [editingChannel, setEditingChannel] = useState<CustomChannel | null>(
    null,
  )
  const [showHelp, setShowHelp] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showRemote, setShowRemote] = useState(false)
  // A code is generated once the user opens the remote and then persisted, so
  // the receiver stays joined to the room — the phone keeps controlling the app
  // after the pairing modal is closed. Persisting also lets the companion
  // extension's bridge mirror the code so the background worker can take over
  // the connection once the user launches a channel and leaves the app.
  const [remoteCode, setRemoteCode] = usePersistedState<string | null>(
    "remoteCode",
    null,
  )
  const { phoneConnected, extConnected } = useRemoteReceiver(remoteCode)

  // The phone remote's Home button: dismiss every overlay so we land back on the
  // bare launcher grid. (Off the app, the extension navigates the tab instead.)
  useEffect(() => {
    const goHome = () => {
      setShowSettings(false)
      setShowHelp(false)
      setShowAbout(false)
      setShowAddChannel(false)
      setEditingChannel(null)
      setLaunching(null)
    }
    window.addEventListener("smarttv-home", goHome)
    return () => window.removeEventListener("smarttv-home", goHome)
  }, [])

  const closeSettings = useCallback(() => setShowSettings(false), [])
  const toggleSettings = useCallback(
    () => setShowSettings((value) => !value),
    [],
  )

  // Saved choices win; any service missing from a saved config (e.g. a newly
  // added one) falls back to its famous-by-default value.
  const effectiveSelection = useMemo(
    () => ({ ...defaultSelection, ...selection }),
    [selection],
  )

  // Every manageable channel (built-ins + customs), in the user's custom order.
  // An empty channelOrder means the natural order; unknown ids (newly added)
  // fall to the end, and Array.sort's stability keeps their natural order.
  // "A–Z" and "Default" are just actions that rewrite channelOrder.
  const managedChannels = useMemo<ManagedChannel[]>(() => {
    const builtIns = serviceKeys.map((key) => ({
      id: key,
      service: services[key],
      enabled: Boolean(effectiveSelection[key]),
      isCustom: false,
    }))
    const customs = customChannels.map((channel) => ({
      id: channel.id,
      service: {
        name: channel.name,
        link: channel.link,
        logo: channel.logo ?? "",
        backgroundColor: channel.backgroundColor || CUSTOM_CHANNEL_BG,
      } satisfies Service,
      enabled: true,
      isCustom: true,
      custom: channel,
    }))
    const base = [...builtIns, ...customs]
    const position = new Map(channelOrder.map((id, index) => [id, index]))
    return [...base].sort(
      (a, b) =>
        (position.get(a.id) ?? Infinity) - (position.get(b.id) ?? Infinity),
    )
  }, [effectiveSelection, customChannels, channelOrder])

  // The grid shows only the enabled channels, preserving the managed order.
  const displayChannels = useMemo<DisplayChannel[]>(
    () =>
      managedChannels
        .filter((channel) => channel.enabled)
        .map(({ id, service }) => ({ id, service })),
    [managedChannels],
  )

  const toggleService = useCallback(
    (key: string) =>
      setSelection((prev) => {
        const current = { ...defaultSelection, ...prev }
        return { ...current, [key]: !current[key] }
      }),
    [setSelection],
  )

  const toggleSound = useCallback(
    () => setSoundEnabled((value) => !value),
    [setSoundEnabled],
  )

  const toggleClock = useCallback(
    () => setTwelveHour((value) => !value),
    [setTwelveHour],
  )

  const toggleLayout = useCallback(
    () => setLayout((value) => (value === "grid" ? "slider" : "grid")),
    [setLayout],
  )

  const toggleSnappyScroll = useCallback(
    () => setSnappyScroll((value) => !value),
    [setSnappyScroll],
  )

  const reorderChannels = useCallback(
    (ids: string[]) => setChannelOrder(ids),
    [setChannelOrder],
  )

  const resetChannelOrder = useCallback(
    () => setChannelOrder([]),
    [setChannelOrder],
  )

  const sortChannelsAlpha = useCallback(
    () =>
      setChannelOrder(
        [...managedChannels]
          .sort((a, b) => a.service.name.localeCompare(b.service.name))
          .map((channel) => channel.id),
      ),
    [managedChannels, setChannelOrder],
  )

  const cycleShape = useCallback(
    () =>
      setShape((value) =>
        value === "rounded"
          ? "square"
          : value === "square"
            ? "circle"
            : "rounded",
      ),
    [setShape],
  )

  const confirmAddChannel = useCallback(
    (channel: Omit<CustomChannel, "id">) => {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `custom-${String(performance.now())}`
      setCustomChannels((prev) => [...prev, { id, ...channel }])
    },
    [setCustomChannels],
  )

  const editChannel = useCallback(
    (id: string, data: Omit<CustomChannel, "id">) =>
      setCustomChannels((prev) =>
        prev.map((channel) =>
          channel.id === id ? { ...channel, ...data } : channel,
        ),
      ),
    [setCustomChannels],
  )

  const removeCustomChannel = useCallback(
    (id: string) =>
      setCustomChannels((prev) => prev.filter((channel) => channel.id !== id)),
    [setCustomChannels],
  )

  const launch = useCallback((service: Service) => {
    playSelectSound()
    setLaunching(service)
    // Launch the channel directly (like a real TV OS handing off to an app).
    // The companion extension provides the Home button to come back.
    window.setTimeout(() => {
      window.location.href = service.link
    }, 1100)
  }, [])

  useEffect(() => {
    applySoundEnabled(soundEnabled)
  }, [soundEnabled])

  // A soft blip whenever the spatial cursor lands on a focusable (Google-TV
  // style); playNavSound itself respects the enabled flag.
  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const element = event.target as HTMLElement | null
      if (element?.matches?.('[tabindex="-1"]')) playNavSound()
    }
    document.addEventListener("focusin", onFocusIn)
    return () => document.removeEventListener("focusin", onFocusIn)
  }, [])

  // A soft tick on any interactive click too (opening the remote, settings,
  // popovers…); the engine dedupes a click and the focus it triggers.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      // Channel tiles get the select "dum-hit" from launch(), not a nav blip.
      if (target?.closest?.('[role="grid"] a')) return
      if (
        target?.closest?.(
          'button, a, [role="button"], [role="switch"], [role="slider"]',
        )
      ) {
        playNavSound()
      }
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])

  // norigin focuses the real DOM node, so a native <button>/<a> would also
  // self-activate on Enter — firing alongside onEnterPress and double-toggling.
  // Suppress only the native activation; onEnterPress stays the single path.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") event.preventDefault()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useTvKeys({
    onBack: () => {
      if (idle) {
        resetIdle()
        return
      }
      if (showHelp) {
        setShowHelp(false)
        return
      }
      if (showAbout) {
        setShowAbout(false)
        return
      }
      if (showRemote) {
        setShowRemote(false)
        return
      }
      if (showSettings) closeSettings()
    },
    onMenu: () => {
      if (!idle) toggleSettings()
    },
    onHelp: () => {
      if (!idle) setShowHelp(true)
    },
  })

  return (
    <main className="relative h-dvh w-screen overflow-hidden">
      <AnimatePresence>
        {!booted && (
          <BootSequence skip={skipSplash} onComplete={() => setBooted(true)} />
        )}
      </AnimatePresence>

      {booted && (
        <div className="flex h-full flex-col px-[var(--tv-safe-x)] py-[var(--tv-safe-y)]">
          <StatusBar hour12={twelveHour} />
          <div className="flex min-h-0 flex-1 items-center justify-center py-[4vh]">
            <AppGrid
              channels={displayChannels}
              size={size}
              shape={shape}
              layout={layout}
              snappyScroll={snappyScroll}
              active={!showSettings && !idle}
              onLaunch={launch}
            />
          </div>
        </div>
      )}

      <SettingsPanel
        open={showSettings}
        size={size}
        shape={shape}
        layout={layout}
        soundEnabled={soundEnabled}
        twelveHour={twelveHour}
        snappyScroll={snappyScroll}
        channels={managedChannels}
        onToggleService={toggleService}
        onSizeChange={setSize}
        onCycleShape={cycleShape}
        onReorderChannels={reorderChannels}
        onResetOrder={resetChannelOrder}
        onSortAlpha={sortChannelsAlpha}
        onToggleLayout={toggleLayout}
        onToggleSnappyScroll={toggleSnappyScroll}
        onToggleSound={toggleSound}
        onToggleClock={toggleClock}
        onAddChannel={() => setShowAddChannel(true)}
        onEditChannel={setEditingChannel}
        onShowHelp={() => setShowHelp(true)}
        onShowAbout={() => setShowAbout(true)}
        onShowRemote={() => {
          setRemoteCode((current) => current ?? makeCode())
          setShowRemote(true)
        }}
        onClose={closeSettings}
      />

      <Screensaver visible={idle && booted} hour12={twelveHour} />

      <AnimatePresence>
        {welcomeBack && <WelcomeBack onDone={() => setWelcomeBack(false)} />}
      </AnimatePresence>

      <OnScreenRemote />

      <AnimatePresence>
        {launching && <LaunchSplash service={launching} />}
      </AnimatePresence>

      <AnimatePresence>
        {showHelp && <KeyboardHelp onClose={() => setShowHelp(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showRemote && (
          <RemotePairing
            code={remoteCode}
            phoneConnected={phoneConnected}
            extConnected={extConnected}
            onClose={() => setShowRemote(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddChannel && (
          <AddChannelModal
            key="add"
            onSubmit={confirmAddChannel}
            onClose={() => setShowAddChannel(false)}
          />
        )}
        {editingChannel && (
          <AddChannelModal
            key="edit"
            initial={editingChannel}
            onSubmit={(data) => editChannel(editingChannel.id, data)}
            onRemove={() => removeCustomChannel(editingChannel.id)}
            onClose={() => setEditingChannel(null)}
          />
        )}
      </AnimatePresence>

      <button
        type="button"
        aria-label="Open settings"
        onClick={toggleSettings}
        className="fixed bottom-[var(--tv-safe-y)] left-[var(--tv-safe-x)] z-20 flex h-[6vh] w-[6vh] items-center justify-center rounded-full bg-tv-elevated/80 text-[3vh] text-tv-text backdrop-blur-xl transition-colors hover:bg-white/20"
      >
        <FiSettings />
      </button>
    </main>
  )
}

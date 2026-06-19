"use client"

import { useEffect, useRef, useState } from "react"
import { FiWifi, FiWifiOff } from "react-icons/fi"
import { AnimatePresence, motion } from "motion/react"

import { Wordmark } from "@/components/wordmark"
import { useOutsideClick } from "@/hooks/use-outside-click"

type ConnectionInfo = {
  effectiveType?: string
  downlink?: number
  rtt?: number
}

type NetworkInformation = ConnectionInfo & {
  addEventListener?: (type: "change", listener: () => void) => void
  removeEventListener?: (type: "change", listener: () => void) => void
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

// Calendar cells for the month of `ref`, padded so the 1st lands under the
// right weekday (Monday-first). Leading blanks are null.
const buildMonthGrid = (ref: Date) => {
  const year = ref.getFullYear()
  const month = ref.getMonth()
  const startDay = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array.from({ length: startDay }, () => null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day)
  return cells
}

export const StatusBar = ({ hour12 }: { hour12: boolean }) => {
  const [now, setNow] = useState<Date | null>(null)
  const [online, setOnline] = useState(true)
  const [connection, setConnection] = useState<ConnectionInfo>({})
  const [pingMs, setPingMs] = useState<number | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const infoRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  useOutsideClick(infoRef, showInfo, () => setShowInfo(false))
  useOutsideClick(calendarRef, showCalendar, () => setShowCalendar(false))

  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    const id = setInterval(tick, 15000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    update()
    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    return () => {
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
    }
  }, [])

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: NetworkInformation })
      .connection
    if (!conn) return
    const update = () =>
      setConnection({
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
      })
    update()
    conn.addEventListener?.("change", update)
    return () => conn.removeEventListener?.("change", update)
  }, [])

  // Measure a real same-origin round-trip whenever the panel opens — works in
  // every browser, unlike the Chromium-only Network Information API.
  useEffect(() => {
    if (!showInfo || !online) return
    let cancelled = false
    const start = performance.now()
    fetch("/manifest.webmanifest", { cache: "no-store" })
      .then(() => {
        if (!cancelled) setPingMs(Math.round(performance.now() - start))
      })
      .catch(() => {
        if (!cancelled) setPingMs(null)
      })
    return () => {
      cancelled = true
    }
  }, [showInfo, online])

  const time = now
    ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12 })
    : "--:--"
  const date = now
    ? now.toLocaleDateString([], {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : ""

  return (
    <header className="flex items-center justify-between text-tv-muted">
      <Wordmark className="text-[2.6vh]" />
      <div className="flex items-center gap-[1.6vw]">
        <div ref={infoRef} className="relative">
          <button
            type="button"
            aria-label="Network status"
            aria-expanded={showInfo}
            onClick={() => setShowInfo((value) => !value)}
            className="flex items-center rounded-full p-[0.6vh] transition-colors hover:bg-white/10"
          >
            {online ? (
              <FiWifi className="text-[2.4vh] text-tv-text" />
            ) : (
              <FiWifiOff className="text-[2.4vh] text-red-400" />
            )}
          </button>
          <AnimatePresence>
            {showInfo && (
              <motion.div
                className="absolute right-0 top-[140%] z-50 w-[26vh] rounded-[1.4vh] bg-tv-elevated/95 p-[1.8vh] text-[1.8vh] shadow-2xl backdrop-blur-xl"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                role="dialog"
                aria-label="Network details"
              >
                <p className="mb-[0.6vh] font-semibold text-tv-text">
                  {online ? "Connected" : "Offline"}
                </p>
                {connection.effectiveType && (
                  <p className="text-tv-muted">
                    Type:{" "}
                    <span className="text-tv-text">
                      {connection.effectiveType.toUpperCase()}
                    </span>
                  </p>
                )}
                {typeof connection.downlink === "number" && (
                  <p className="text-tv-muted">
                    Speed:{" "}
                    <span className="text-tv-text">
                      ~{connection.downlink} Mbps
                    </span>
                  </p>
                )}
                {typeof connection.rtt === "number" && (
                  <p className="text-tv-muted">
                    Latency:{" "}
                    <span className="text-tv-text">{connection.rtt} ms</span>
                  </p>
                )}
                {online && (
                  <p className="text-tv-muted">
                    Response:{" "}
                    <span className="text-tv-text">
                      {pingMs === null ? "measuring…" : `~${pingMs} ms`}
                    </span>
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={calendarRef} className="relative">
          <button
            type="button"
            aria-label="Calendar"
            aria-expanded={showCalendar}
            onClick={() => setShowCalendar((value) => !value)}
            className="rounded-[1vh] px-[0.8vw] py-[0.4vh] text-[2.2vh] font-medium text-tv-text transition-colors hover:bg-white/10"
          >
            {date && <span className="mr-[0.8vw] text-tv-muted">{date}</span>}
            {time}
          </button>
          <AnimatePresence>
            {showCalendar && now && (
              <motion.div
                className="absolute right-0 top-[140%] z-50 w-[34vh] rounded-[1.4vh] bg-tv-elevated/95 p-[1.8vh] shadow-2xl backdrop-blur-xl"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                role="dialog"
                aria-label="Calendar"
              >
                <p className="mb-[1.2vh] text-center text-[2vh] font-semibold text-tv-text">
                  {now.toLocaleDateString([], {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <div className="grid grid-cols-7 gap-[0.4vh] text-center text-[1.5vh]">
                  {WEEKDAYS.map((weekday) => (
                    <span key={weekday} className="text-tv-muted">
                      {weekday}
                    </span>
                  ))}
                  {buildMonthGrid(now).map((day, index) => (
                    <span
                      key={index}
                      className={
                        day === now.getDate()
                          ? "rounded-[0.8vh] bg-sky-400 py-[0.4vh] font-semibold text-black"
                          : "py-[0.4vh] text-tv-text"
                      }
                    >
                      {day ?? ""}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}

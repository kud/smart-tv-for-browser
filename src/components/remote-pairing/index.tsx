"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import QRCode from "qrcode"
import { FiSmartphone, FiCheckCircle, FiPackage } from "react-icons/fi"
import { pause, resume } from "@noriginmedia/norigin-spatial-navigation"

import { CODE_LENGTH } from "@/lib/remote"

// Presentational only — the receiver peer lives in TvShell so it keeps running
// (and the phone keeps controlling) after this modal is dismissed.
export const RemotePairing = ({
  code,
  phoneConnected,
  extConnected,
  onClose,
}: {
  code: string | null
  phoneConnected: boolean
  extConnected: boolean
  onClose: () => void
}) => {
  const [qr, setQr] = useState<string | null>(null)

  // Spatial nav is irrelevant here; suspend it so it doesn't fight the modal.
  useEffect(() => {
    pause()
    return () => resume()
  }, [])

  useEffect(() => {
    if (!code) return
    const url = `${window.location.origin}/remote#${code}`
    QRCode.toDataURL(url, {
      margin: 1,
      width: 520,
      color: { dark: "#0b0b0f", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(null))
  }, [code])

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-[4vh] backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <motion.div
        role="dialog"
        aria-label="Pair your phone as a remote"
        className="flex w-[52vw] min-w-[360px] max-w-[640px] flex-col items-center gap-[2vh] rounded-[2vh] bg-tv-elevated p-[3.4vh] text-center shadow-2xl"
        initial={{ scale: 0.95, y: 14 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
      >
        <div className="flex items-center gap-[1vw] text-[2.8vh] font-semibold text-tv-text">
          <FiSmartphone /> Phone remote
        </div>

        {phoneConnected ? (
          <div className="flex flex-col items-center gap-[1.4vh] py-[4vh]">
            <FiCheckCircle className="text-[10vh] text-emerald-400" />
            <p className="text-[2.6vh] font-semibold text-tv-text">
              Phone connected
            </p>
            <p className="text-[2vh] text-tv-muted">
              Use the D-pad on your phone to control smartTV.
            </p>
          </div>
        ) : (
          <>
            <p className="text-[2vh] text-tv-muted">
              Scan with your phone, or open{" "}
              <span className="text-tv-text">/remote</span> and enter the code.
            </p>
            <div className="flex h-[28vh] w-[28vh] items-center justify-center overflow-hidden rounded-[1.6vh] bg-white">
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qr}
                  alt="Pairing QR code"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-[2vh] text-black/50">Generating…</span>
              )}
            </div>
            <div className="flex items-center gap-[0.8vw]">
              {(code ?? "·".repeat(CODE_LENGTH))
                .split("")
                .map((char, index) => (
                  <span
                    key={index}
                    className="flex h-[6vh] w-[5vh] items-center justify-center rounded-[1vh] bg-black/40 text-[3vh] font-bold tracking-wide text-tv-text"
                  >
                    {char}
                  </span>
                ))}
            </div>
            <p className="text-[1.7vh] text-tv-muted">
              Waiting for your phone…
            </p>
          </>
        )}

        <div className="flex w-full flex-col gap-[0.8vh] border-t border-white/10 pt-[1.6vh]">
          <StatusRow
            icon={<FiSmartphone />}
            label="Phone"
            on={phoneConnected}
            onText="Connected"
            offText="Waiting to pair"
          />
          <StatusRow
            icon={<FiPackage />}
            label="Extension"
            on={extConnected}
            onText="Active — controls any site"
            offText="Not detected — control stops when you leave smartTV"
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-[1vh] rounded-full bg-white/10 px-[2.4vw] py-[1.2vh] text-[2vh] text-tv-text transition-colors hover:bg-white/20"
        >
          {phoneConnected ? "Done" : "Cancel"}
        </button>
      </motion.div>
    </motion.div>
  )
}

const StatusRow = ({
  icon,
  label,
  on,
  onText,
  offText,
}: {
  icon: React.ReactNode
  label: string
  on: boolean
  onText: string
  offText: string
}) => (
  <div className="flex items-center gap-[0.8vw] text-[1.7vh]">
    <span
      className={`h-[1.4vh] w-[1.4vh] shrink-0 rounded-full ${
        on ? "bg-emerald-400" : "bg-white/25"
      }`}
    />
    <span className="flex items-center gap-[0.4vw] text-tv-muted">{icon}</span>
    <span className="font-medium text-tv-text">{label}</span>
    <span className={on ? "text-emerald-400" : "text-tv-muted"}>
      {on ? onText : offText}
    </span>
  </div>
)

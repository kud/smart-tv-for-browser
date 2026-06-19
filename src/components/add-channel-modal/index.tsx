"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { pause, resume } from "@noriginmedia/norigin-spatial-navigation"

import type { CustomChannel } from "@/lib/services"

type NewChannel = Omit<CustomChannel, "id">

type FieldProps = {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
  onSubmit: () => void
  inputRef?: React.Ref<HTMLInputElement>
}

const Field = ({
  label,
  value,
  placeholder,
  onChange,
  onSubmit,
  inputRef,
}: FieldProps) => (
  <label className="mb-[2vh] block">
    <span className="mb-[0.8vh] block text-[1.8vh] text-tv-muted">{label}</span>
    <input
      ref={inputRef}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault()
          event.stopPropagation()
          onSubmit()
        }
      }}
      className="w-full rounded-[1.2vh] border border-white/15 bg-black/40 px-[1.4vw] py-[1.4vh] text-[2.2vh] text-tv-text outline-none transition-colors focus:border-sky-400"
    />
  </label>
)

export const AddChannelModal = ({
  initial,
  onSubmit,
  onRemove,
  onClose,
}: {
  initial?: CustomChannel
  onSubmit: (channel: NewChannel) => void
  onRemove?: () => void
  onClose: () => void
}) => {
  const [name, setName] = useState(initial?.name ?? "")
  const [url, setUrl] = useState(initial?.link ?? "")
  const [logo, setLogo] = useState(initial?.logo ?? "")
  const nameRef = useRef<HTMLInputElement>(null)

  // Suspend spatial navigation while typing so arrow keys edit text instead of
  // moving the cursor behind the modal.
  useEffect(() => {
    pause()
    nameRef.current?.focus()
    return () => resume()
  }, [])

  const submit = () => {
    const trimmedName = name.trim()
    const trimmedUrl = url.trim()
    if (!trimmedName || !trimmedUrl) return
    const link = /^https?:\/\//i.test(trimmedUrl)
      ? trimmedUrl
      : `https://${trimmedUrl}`
    onSubmit({ name: trimmedName, link, logo: logo.trim() || undefined })
    onClose()
  }

  const canSubmit = name.trim() && url.trim()

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-[4vh] backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation()
          onClose()
        }
      }}
    >
      <motion.div
        role="dialog"
        aria-label={initial ? "Edit channel" : "Add custom channel"}
        className="w-[46vw] min-w-[360px] rounded-[2vh] bg-tv-elevated p-[3vh] shadow-2xl"
        initial={{ scale: 0.95, y: 14 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
      >
        <h2 className="mb-[2.4vh] text-[2.8vh] font-semibold text-tv-text">
          {initial ? "Edit channel" : "Add channel"}
        </h2>
        <Field
          label="Name"
          value={name}
          placeholder="My channel"
          onChange={setName}
          onSubmit={submit}
          inputRef={nameRef}
        />
        <Field
          label="URL"
          value={url}
          placeholder="https://…"
          onChange={setUrl}
          onSubmit={submit}
        />
        <Field
          label="Image URL (optional)"
          value={logo}
          placeholder="https://…/logo.svg"
          onChange={setLogo}
          onSubmit={submit}
        />
        <div className="mt-[1vh] flex items-center justify-between">
          {onRemove ? (
            <button
              type="button"
              onClick={() => {
                onRemove()
                onClose()
              }}
              className="rounded-full px-[2vw] py-[1.2vh] text-[2vh] text-red-400 transition-colors hover:bg-red-500/15"
            >
              Remove
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-[1vw]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/10 px-[2vw] py-[1.2vh] text-[2vh] text-tv-text transition-colors hover:bg-white/20"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="rounded-full bg-sky-500 px-[2vw] py-[1.2vh] text-[2vh] font-semibold text-white transition-colors hover:bg-sky-400 disabled:opacity-40"
            >
              {initial ? "Save" : "Add"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

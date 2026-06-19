import clsx from "clsx"

export const Wordmark = ({ className }: { className?: string }) => (
  <span className={clsx("tracking-tight", className)}>
    <span className="font-bold text-tv-text">smart</span>
    <span className="bg-gradient-to-r from-sky-400 to-emerald-300 bg-clip-text font-extrabold text-transparent">
      TV
    </span>
  </span>
)

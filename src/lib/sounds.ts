// Synthesised UI sounds via the Web Audio API — no audio assets needed.
// Navigation: a warm, low "dum". Select: a "dum-hit" — the warm note plus a
// brighter, higher confirmation that the choice was validated.

let context: AudioContext | null = null
let enabled = true
let lastNavAt = 0

// Master volume multiplier applied to every blip's peak — tuned for an audible
// but non-harsh level (the sub-octave adds ~45%, so keep headroom under ~1.0).
const MASTER = 2.8

export const setSoundEnabled = (value: boolean) => {
  enabled = value
}

const getContext = () => {
  if (typeof window === "undefined") return null
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctor) return null
    context = new Ctor()
  }
  // Resumes once a user gesture has occurred (autoplay policy); a no-op before.
  if (context.state === "suspended") context.resume().catch(() => {})
  return context
}

// One warm blip: fundamental + sub-octave through a low-pass. A higher `cutoff`
// lets more harmonics through for a brighter tone; `when` schedules it ahead.
const blip = (
  frequency: number,
  duration: number,
  peak: number,
  when = 0,
  cutoff = 900,
  attack = 0.018,
) => {
  const audio = getContext()
  if (!audio || audio.state !== "running") return
  const start = audio.currentTime + when

  const filter = audio.createBiquadFilter()
  filter.type = "lowpass"
  filter.frequency.value = cutoff
  filter.Q.value = 0.7

  const gain = audio.createGain()
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(peak * MASTER, start + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  const osc = audio.createOscillator()
  osc.type = "sine"
  osc.frequency.value = frequency
  const sub = audio.createOscillator()
  sub.type = "sine"
  sub.frequency.value = frequency / 2
  const subGain = audio.createGain()
  subGain.gain.value = 0.45

  osc.connect(gain)
  sub.connect(subGain).connect(gain)
  gain.connect(filter).connect(audio.destination)

  osc.start(start)
  sub.start(start)
  osc.stop(start + duration)
  sub.stop(start + duration)
}

export const playNavSound = () => {
  if (!enabled) return
  const audio = getContext()
  if (!audio || audio.state !== "running") return
  // Throttle rapid repeats (e.g. a click and the focus it triggers).
  if (audio.currentTime - lastNavAt < 0.04) return
  lastNavAt = audio.currentTime
  blip(320, 0.16, 0.022)
}

export const playSelectSound = () => {
  if (!enabled) return
  blip(300, 0.14, 0.024) // warm "dum"
  // warm "hit" — slightly higher pitch, more delay, soft attack, long tail.
  blip(490, 0.32, 0.045, 0.13, 1550, 0.03)
}

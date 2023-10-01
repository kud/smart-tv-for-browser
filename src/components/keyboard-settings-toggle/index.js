"use client"

import { useEffect, useMemo } from "react"
import useKeyboardJs from "react-use/lib/useKeyboardJs"
import debounce from "lodash.debounce"

const KeyboardSettingsToggle = ({ onToggle }) => {
  const [isPressed] = useKeyboardJs("x + c + v")

  const debouncedOnToggle = useMemo(() => debounce(onToggle, 500), [onToggle])

  useEffect(() => {
    if (isPressed) {
      debouncedOnToggle()
    }
  }, [isPressed, debouncedOnToggle])

  return null
}

export default KeyboardSettingsToggle

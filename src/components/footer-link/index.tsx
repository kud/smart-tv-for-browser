"use client"

import clsx from "clsx"
import type { MouseEvent, ReactNode } from "react"
import { useFocusable } from "@noriginmedia/norigin-spatial-navigation"

type FooterLinkProps = {
  href?: string
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  // The remote's OK. Enter's native activation is suppressed app-wide, so a
  // link that only has an href would do nothing under the D-pad.
  onEnterPress: () => void
  children: ReactNode
}

// A footer link the spatial cursor can land on, with the same ring as a tile.
export const FooterLink = ({
  href,
  onClick,
  onEnterPress,
  children,
}: FooterLinkProps) => {
  const { ref, focused } = useFocusable<object, HTMLAnchorElement>({
    onEnterPress,
  })

  return (
    <a
      ref={ref}
      href={href}
      tabIndex={-1}
      onClick={onClick}
      className={clsx(
        "rounded-full px-[0.9vh] py-[0.5vh] transition-colors hover:text-tv-text",
        focused ? "bg-white/12 text-tv-text" : "text-tv-muted",
      )}
      style={{ boxShadow: focused ? "var(--focus-ring)" : "none" }}
    >
      {children}
    </a>
  )
}

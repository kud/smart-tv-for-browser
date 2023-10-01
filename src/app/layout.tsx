import type { Metadata } from "next"

import { Providers } from "./providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "SmartTV",
  description:
    "SmartTV - Elevate your viewing experience. Explore a world of endless entertainment, immersive visuals, and smart innovations. Dive into the future of television with SmartTV.",
  keywords:
    "SmartTV, Next-gen TV, 4K, UHD, Streaming, Intelligent Television, Entertainment, Immersive Experience, TV Apps",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

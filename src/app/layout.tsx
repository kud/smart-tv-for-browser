import type { Metadata, Viewport } from "next"

import { Providers } from "./providers"
import "./globals.css"

export const metadata: Metadata = {
  applicationName: "SmartTV",
  title: "SmartTV for Browser",
  description:
    "A smart-TV home screen for the browser. Launch your streaming services with a remote-style D-pad, accessible hotkeys, and a 10-foot interface.",
  keywords:
    "SmartTV, streaming, launcher, 10-foot UI, remote, D-pad, PWA, Netflix, Disney+, Prime Video",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SmartTV",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
}

export const viewport: Viewport = {
  themeColor: "#06060a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

export default RootLayout

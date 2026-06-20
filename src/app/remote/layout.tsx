import type { Metadata, Viewport } from "next"

// The phone remote installs as its own PWA (portrait, scoped to /remote),
// separate from the TV app's fullscreen/landscape manifest.
export const metadata: Metadata = {
  title: "smartTV Remote",
  manifest: "/remote.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "smartTV Remote",
  },
}

export const viewport: Viewport = {
  themeColor: "#06060a",
}

const RemoteLayout = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
)

export default RemoteLayout

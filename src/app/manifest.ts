import type { MetadataRoute } from "next"

const manifest = (): MetadataRoute.Manifest => ({
  name: "SmartTV for Browser",
  short_name: "SmartTV",
  description:
    "A smart-TV home screen for the browser — launch streaming services with a remote-style D-pad and accessible hotkeys.",
  start_url: "/",
  scope: "/",
  display: "fullscreen",
  display_override: ["fullscreen", "standalone"],
  orientation: "landscape",
  background_color: "#06060a",
  theme_color: "#06060a",
  categories: ["entertainment", "utilities"],
  icons: [
    {
      src: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
})

export default manifest

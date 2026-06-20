const api = globalThis.browser ?? globalThis.chrome

// Runs at document_start on YouTube. When TV mode is on, send the tab to the
// leanback TV interface (youtube.com/tv) — a real remote-navigable UI. The
// background's declarativeNetRequest rule spoofs the TV user-agent so YouTube
// actually serves leanback rather than the desktop site.
const path = location.pathname

// Leave the TV app, the device-pairing page, and embeds alone.
if (
  !path.startsWith("/tv") &&
  path !== "/activate" &&
  !path.startsWith("/embed")
) {
  api.storage.local
    .get("ytTvMode")
    .then(({ ytTvMode }) => {
      if (ytTvMode !== false) location.replace("https://www.youtube.com/tv")
    })
    .catch(() => {})
}

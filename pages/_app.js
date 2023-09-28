import Head from "next/head"
import { NextUIProvider } from "@nextui-org/react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

import "styles/globals.css"

const App = ({ Component, pageProps }) => (
  <>
    <Head>
      <title>SmartTV</title>
      <meta
        name="description"
        content="SmartTV - Elevate your viewing experience. Explore a world of endless entertainment, immersive visuals, and smart innovations. Dive into the future of television with SmartTV."
      />
      <meta
        name="keywords"
        content="SmartTV, Next-gen TV, 4K, UHD, Streaming, Intelligent Television, Entertainment, Immersive Experience, TV Apps"
      />
    </Head>

    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark">
        <Component {...pageProps} />
      </NextThemesProvider>
    </NextUIProvider>
  </>
)

export default App

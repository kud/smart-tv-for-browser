import Head from "next/head"

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
    <Component {...pageProps} />
  </>
)

export default App

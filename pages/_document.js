import Document, { Html, Head, Main, NextScript } from "next/document"

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link
            href="https://fonts.googleapis.com/css2?family=Martian+Mono&display=swap"
            rel="stylesheet"
          />
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
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument

import Head from "next/head"
import Image from "next/image"
import styles from "../styles/Home.module.css"

const HomePage = () => (
  <main className={styles.root}>
    <a href="https://www.netflix.com">
      <div className={styles.netflix}>
        <img src="/logo-netflix.svg" />
      </div>
    </a>

    <a href="https://www.primevideo.com/">
      <div className={styles.primeVideo}>
        <img src="/logo-primevideo.svg" />
      </div>
    </a>
  </main>
)

export default HomePage

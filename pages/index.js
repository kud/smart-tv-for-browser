import { useState, useEffect } from "react"
import clsx from "clsx"

import servicesConfig from "config/services.json"

import KeyboardSettingsToggle from "components/keyboard-settings-toggle"

import styles from "styles/Home.module.css"

const defaultServices = Object.keys(servicesConfig).reduce((acc, service) => {
  acc[service] = true

  return acc
}, {})

const HomePage = () => {
  const [services, setServices] = useState(null)
  const [loadedFromLocalStorage, setLoadedFromLocalStorage] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const toggleSettingsVisibility = () => {
    setShowSettings(!showSettings)
  }

  const toggleService = (serviceKey) => {
    setServices((prev) => ({
      ...prev,
      [serviceKey]: !prev[serviceKey],
    }))
  }

  useEffect(() => {
    const savedServices = JSON.parse(localStorage.getItem("services"))

    if (savedServices) {
      const mergedServices = { ...defaultServices, ...savedServices }
      setServices(mergedServices)
    } else {
      setServices(defaultServices)
    }

    setLoadedFromLocalStorage(true)
  }, [])

  useEffect(() => {
    if (loadedFromLocalStorage) {
      localStorage.setItem("services", JSON.stringify(services))
    }
  }, [services, loadedFromLocalStorage])

  return (
    <main className={styles.root}>
      <KeyboardSettingsToggle onToggle={toggleSettingsVisibility} />

      {services && (
        <>
          <div
            className={clsx(styles.settings, {
              [styles.settingsShow]: showSettings,
            })}
          >
            <h3>Services</h3>

            {Object.keys(servicesConfig).map((serviceKey) => (
              <div key={serviceKey}>
                <input
                  type="checkbox"
                  checked={services[serviceKey]}
                  onChange={() => toggleService(serviceKey)}
                />{" "}
                {servicesConfig[serviceKey].name}
              </div>
            ))}
          </div>

          <div className={styles.container}>
            {Object.keys(servicesConfig).map(
              (serviceKey) =>
                services[serviceKey] && (
                  <a key={serviceKey} href={servicesConfig[serviceKey].link}>
                    <div
                      className={styles.item}
                      style={{
                        backgroundColor:
                          servicesConfig[serviceKey].backgroundColor,
                      }}
                    >
                      <img src={servicesConfig[serviceKey].logo} />
                    </div>
                  </a>
                ),
            )}
          </div>
        </>
      )}
    </main>
  )
}

export default HomePage

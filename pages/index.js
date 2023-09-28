import { useState, useEffect } from "react"
import clsx from "clsx"
import { Checkbox } from "@nextui-org/react"

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
              [styles.settings__show]: showSettings,
            })}
          >
            <h2 className={styles.settingsHeading}>Services</h2>

            {Object.keys(servicesConfig)
              .sort()
              .map((serviceKey) => (
                <div key={serviceKey} className={styles.settingsService}>
                  <Checkbox
                    size="sm"
                    checked={services[serviceKey]}
                    isSelected={services[serviceKey]}
                    onValueChange={() => toggleService(serviceKey)}
                    id={serviceKey}
                  >
                    <div className={styles.settingsServiceLabel}>
                      {servicesConfig[serviceKey].name}
                    </div>
                  </Checkbox>
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

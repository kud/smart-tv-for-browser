import { useState, useEffect } from "react"
import clsx from "clsx"

import servicesConfig from "config/services.json"

import KeyboardSettingsToggle from "components/keyboard-settings-toggle"
import ServiceList from "components/service-list"
import ServiceGrid from "components/service-grid"

import styles from "styles/Home.module.css"

const defaultServices = Object.keys(servicesConfig).reduce((acc, service) => {
  acc[service] = true

  return acc
}, {})

const HomePage = () => {
  const [services, setServices] = useState(null)
  const [loadedFromLocalStorage, setLoadedFromLocalStorage] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showOverlay, setShowOverlay] = useState(true)
  const [isOverlayVisible, setIsOverlayVisible] = useState(true)

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
    setShowOverlay(false)

    const removeTimer = setTimeout(() => {
      setIsOverlayVisible(false)
    }, 2000)

    return () => clearTimeout(removeTimer)
  }, [])

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
          <ServiceList
            servicesConfig={servicesConfig}
            selectedServices={services}
            onServiceToggle={toggleService}
            showSettings={showSettings}
          />

          <ServiceGrid
            servicesConfig={servicesConfig}
            selectedServices={services}
          />
        </>
      )}

      {isOverlayVisible && (
        <div
          className={clsx(styles.overlay, {
            [styles.overlay__hidden]: !showOverlay,
          })}
        ></div>
      )}
    </main>
  )
}

export default HomePage

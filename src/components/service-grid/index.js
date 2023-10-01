import styles from "./index.module.css"

const ServiceGrid = ({ servicesConfig, selectedServices, imageSize }) => {
  const handleKeyPress = (event, link) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      window.location.href = link
    }
  }

  return (
    <div className={styles.container}>
      {Object.keys(servicesConfig).map(
        (serviceKey) =>
          selectedServices[serviceKey] && (
            <a
              className={styles.itemLink}
              key={serviceKey}
              tabIndex="0"
              onKeyDown={(event) =>
                handleKeyPress(event, servicesConfig[serviceKey].link)
              }
              href={servicesConfig[serviceKey].link}
            >
              <div
                className={styles.item}
                style={{
                  backgroundColor: servicesConfig[serviceKey].backgroundColor,
                  width: `${imageSize}px`,
                  height: `${imageSize}px`,
                }}
              >
                <img alt="" src={servicesConfig[serviceKey].logo} />
              </div>
            </a>
          ),
      )}
    </div>
  )
}

export default ServiceGrid

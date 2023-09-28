import styles from "styles/Home.module.css"

const ServiceGrid = ({ servicesConfig, selectedServices }) => (
  <div className={styles.container}>
    {Object.keys(servicesConfig).map(
      (serviceKey) =>
        selectedServices[serviceKey] && (
          <a key={serviceKey} href={servicesConfig[serviceKey].link}>
            <div
              className={styles.item}
              style={{
                backgroundColor: servicesConfig[serviceKey].backgroundColor,
              }}
            >
              <img alt="" src={servicesConfig[serviceKey].logo} />
            </div>
          </a>
        ),
    )}
  </div>
)

export default ServiceGrid

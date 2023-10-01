import clsx from "clsx"

import ServiceCheckbox from "@/components/service-checkbox"

import styles from "./index.module.css"

const ServiceList = ({
  servicesConfig,
  selectedServices,
  onServiceToggle,
  showSettings,
}) => (
  <div
    className={clsx(styles.settings, {
      [styles.settings__show]: showSettings,
    })}
  >
    <h2 className={styles.settingsHeading}>Services</h2>
    {Object.keys(servicesConfig)
      .sort()
      .map((serviceKey) => (
        <ServiceCheckbox
          key={serviceKey}
          serviceKey={serviceKey}
          serviceConfig={servicesConfig[serviceKey]}
          isChecked={selectedServices[serviceKey]}
          onToggle={() => onServiceToggle(serviceKey)}
        />
      ))}
  </div>
)

export default ServiceList

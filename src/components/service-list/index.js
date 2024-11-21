import clsx from "clsx"
import ServiceCheckbox from "@/components/service-checkbox"
import styles from "./index.module.css"

const ServiceList = ({
  servicesConfig,
  selectedServices,
  onServiceToggle,
  showSettings,
  imageSize,
  onImageSizeChange,
}) => (
  <div
    className={clsx(styles.settings, {
      [styles.settings__show]: showSettings,
    })}
  >
    <h2 className={styles.settingsHeading}>Services</h2>

    <div className={styles.settingsList}>
      {Object.keys(servicesConfig)
        .sort()
        .map((serviceKey) => (
          <div
            key={serviceKey}
            className={styles.settingsListItem}
            onClick={() => onServiceToggle(serviceKey)}
          >
            <ServiceCheckbox
              serviceKey={serviceKey}
              serviceConfig={servicesConfig[serviceKey]}
              isChecked={selectedServices[serviceKey]}
            />
          </div>
        ))}
    </div>

    <br />

    <div>
      <label>Size:</label>
      <input
        type="range"
        min="100"
        max="400"
        value={imageSize}
        onChange={(e) => onImageSizeChange(Number(e.target.value))}
      />
      {imageSize}px
    </div>
  </div>
)

export default ServiceList

import { Checkbox } from "@nextui-org/react"

import styles from "./index.module.css"

const ServiceCheckbox = ({
  serviceKey,
  serviceConfig,
  isChecked,
  onToggle,
}) => (
  <div className={styles.settingsService}>
    <Checkbox
      size="sm"
      checked={isChecked}
      isSelected={isChecked}
      onValueChange={onToggle}
      id={serviceKey}
    >
      <div className={styles.settingsServiceLabel}>{serviceConfig.name}</div>
    </Checkbox>
  </div>
)

export default ServiceCheckbox

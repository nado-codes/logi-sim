import * as fs from "fs";
import path from "path";

export interface NotificationConfig {
  showStorageNotifications: boolean;
  showProcessorNotifications: boolean;
  showProducerNotifications: boolean;
  showConsumerNotifications: boolean;
  showContractNotifications: boolean;
  showTruckNotifications: boolean;
}

const CONFIG_PATH = path.resolve("./notif-config.json");
const defaultConfig: NotificationConfig = {
  showStorageNotifications: false,
  showProcessorNotifications: false,
  showProducerNotifications: false,
  showConsumerNotifications: false,
  showContractNotifications: false,
  showTruckNotifications: false,
};

export const loadNotificationConfig = () => {
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(
      CONFIG_PATH,
      JSON.stringify(defaultConfig, null, 2),
      "utf-8",
    );
  }

  const config = fs.readFileSync(CONFIG_PATH, "utf-8");
  return { ...defaultConfig, ...(JSON.parse(config) as NotificationConfig) };
};

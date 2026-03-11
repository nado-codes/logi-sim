import { loadConfig } from "./utils/configUtils";

export interface NotificationConfig {
  showStorageNotifications: boolean;
  showProcessorNotifications: boolean;
  showProducerNotifications: boolean;
  showConsumerNotifications: boolean;
  showContractNotifications: boolean;
  showTruckNotifications: boolean;
  showProductionNotifications: boolean;
  showLocationNotifications: boolean;
}

const CONFIG_PATH = "./notif-config.json";
const defaultConfig: NotificationConfig = {
  showStorageNotifications: false,
  showProcessorNotifications: false,
  showProducerNotifications: false,
  showConsumerNotifications: false,
  showContractNotifications: false,
  showTruckNotifications: false,
  showProductionNotifications: false,
  showLocationNotifications: false,
};

export const loadNotificationConfig = () =>
  loadConfig(CONFIG_PATH, defaultConfig);

import { loadConfig } from "./utils/configUtils";

type TruckNotifications = {
  all: boolean;
  loading: boolean;
  unloading: boolean;
  movement: boolean;
  costs: boolean;
};

export interface INotificationConfig {
  logStorageNotifications: boolean;
  logProcessorNotifications: boolean;
  logProducerNotifications: boolean;
  logConsumerNotifications: boolean;
  logContractNotifications: boolean;
  logTruckNotifications: TruckNotifications;
  logProductionNotifications: boolean;
  logLocationNotifications: boolean;
  logCompanyNotifications: boolean;
  printLogs: boolean;
}

const defaultConfig: INotificationConfig = {
  logStorageNotifications: false,
  logProcessorNotifications: false,
  logProducerNotifications: false,
  logConsumerNotifications: false,
  logContractNotifications: false,
  logTruckNotifications: {
    all: false,
    loading: false,
    unloading: false,
    movement: false,
    costs: false,
  },
  logProductionNotifications: false,
  logLocationNotifications: false,
  logCompanyNotifications: false,
  printLogs: false,
};

export const loadNotificationConfig = () =>
  loadConfig("notification", defaultConfig);

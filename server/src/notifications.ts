import { loadConfig } from "./utils/configUtils";

type TruckNotifications = {
  all: boolean;
  loading: boolean;
  unloading: boolean;
  movement: boolean;
  costs: boolean;
};

type CompanyNotifications = {
  all: boolean;
  government: boolean;
  ai: boolean;
};

type TownNotifications = {
  all: boolean;
  confidence: boolean;
  population: boolean;
}

export interface INotificationConfig {
  logStorageNotifications: boolean;
  logProcessorNotifications: boolean;
  logProducerNotifications: boolean;
  logConsumerNotifications: boolean;
  logContractNotifications: boolean;
  logMarketplaceNotifications: boolean;
  logTruckNotifications: TruckNotifications;
  logProductionNotifications: boolean;
  logLocationNotifications: boolean;
  logCompanyNotifications: CompanyNotifications;
  logTownNotifications: TownNotifications;
  printLogs: boolean;
}

const defaultConfig: INotificationConfig = {
  logStorageNotifications: false,
  logProcessorNotifications: false,
  logProducerNotifications: false,
  logConsumerNotifications: false,
  logContractNotifications: false,
  logMarketplaceNotifications: false,
  logTruckNotifications: {
    all: false,
    loading: false,
    unloading: false,
    movement: false,
    costs: false,
  },
  logProductionNotifications: false,
  logLocationNotifications: false,
  logCompanyNotifications: {
    all: false,
    government: false,
    ai: false,
  },
  logTownNotifications: {
    all : false,
    population: false,
    confidence: false
  },
  printLogs: false,
};

export const loadNotificationConfig = () =>
  loadConfig("notification", defaultConfig);

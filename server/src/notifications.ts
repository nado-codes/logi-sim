import { loadConfig } from "./utils/configUtils";

type TruckNotifications = {
  all: boolean;
  loading: boolean;
  unloading: boolean;
  movement: boolean;
  costs: boolean;
};

type ContractNotifications = {
  all: boolean;
  creation: boolean;
  assignment: boolean;
  update: boolean;
  completion: boolean;
  breach: boolean;
};

type CompanyNotifications = {
  all: boolean;
  money: boolean;
  government: boolean;
  ai: boolean;
};

type TownNotifications = {
  all: boolean;
  confidence: boolean;
  population: boolean;
};

export interface INotificationConfig {
  logStorageNotifications: boolean;
  logProcessorNotifications: boolean;
  logProducerNotifications: boolean;
  logConsumerNotifications: boolean;
  logContractNotifications: ContractNotifications;
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
  logContractNotifications: {
    all: false,
    creation: false,
    assignment: false,
    update: false,
    completion: false,
    breach: false,
  },
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
    money: false,
    government: false,
    ai: false,
  },
  logTownNotifications: {
    all: false,
    population: false,
    confidence: false,
  },
  printLogs: false,
};

export const loadNotificationConfig = () =>
  loadConfig("notification", defaultConfig);

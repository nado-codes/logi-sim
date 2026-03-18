import { IContract } from "../entities/contract";
import { loadNotificationConfig } from "../notifications";
import { ITruck } from "../entities/truck";
import {
  logSuccess,
  logWarning,
  logInfo,
  logError,
  highlight,
} from "../utils/logUtils";
import {
  createCompanyEntity,
  getCompanyById,
  transferFunds,
} from "./companies";
import { getLocationById } from "./locations/locations";
import { getTruckById } from "./trucks";
import { Nullable } from "../entities/entity";
import { IWorldState } from "../entities/world";
import { getResourceCount } from "./storages";
import { loadConfig } from "../utils/configUtils";
import { world } from "..";
import { RESOURCE_TYPE } from "../entities/resource";

const notificationConfig = loadNotificationConfig();

type UrgencyMultiplier = {
  threshold: number;
  multiplier: number;
};

interface IContractConfig {
  perUnitRate: number;
  distanceRate: number;
  urgencyMultipliers: {
    critical: UrgencyMultiplier;
    urgent: UrgencyMultiplier;
    priority: UrgencyMultiplier;
  };
}

const defaultConfig: IContractConfig = {
  perUnitRate: 5,
  distanceRate: 2,
  urgencyMultipliers: {
    critical: {
      threshold: 3,
      multiplier: 2,
    },
    urgent: {
      threshold: 5,
      multiplier: 1.5,
    },
    priority: {
      threshold: 10,
      multiplier: 1.2,
    },
  },
};

const contractConfig = loadConfig("contract", defaultConfig);

// .. CREATE

const getUrgencyMultiplier = (ticksUntilExpiry: number) => {
  const { urgencyMultipliers } = contractConfig;

  if (ticksUntilExpiry <= urgencyMultipliers.critical.threshold) {
    return urgencyMultipliers.critical.multiplier;
  }
  if (ticksUntilExpiry <= urgencyMultipliers.urgent.threshold) {
    return urgencyMultipliers.urgent.multiplier;
  }
  if (ticksUntilExpiry <= urgencyMultipliers.priority.threshold) {
    return urgencyMultipliers.priority.multiplier;
  }
  return 1.0;
};

const calculateContractPayment = (
  quantity: number,
  distance: number,
  ticksUntilExpiry: number,
) => {
  const basePayment = quantity * contractConfig.perUnitRate;
  const distancePremium = distance * contractConfig.distanceRate;
  const urgencyMultiplier = getUrgencyMultiplier(ticksUntilExpiry);

  if (notificationConfig.logContractNotifications) {
    logInfo(` - Base Payment: ${basePayment}`);
    logInfo(` - Distance Premium: ${distancePremium}`);
    logInfo(` - Urgency Multiplier: ${urgencyMultiplier}`);
  }

  return Math.round((basePayment + distancePremium) * urgencyMultiplier);
};

export const createContract = (
  state: IWorldState,
  companyId: string,
  destinationId: string,
  supplierId: string,
  resourceType: RESOURCE_TYPE,
  amount: number,
  dueTicks: number,
) => {
  if (notificationConfig.logContractNotifications) {
    logInfo(`[CONTRACT] Trying to create ${resourceType} contract...`);
  }

  const supplier = getLocationById(state, supplierId);
  const destination = getLocationById(state, destinationId);
  const distance = Math.abs(destination.position - supplier.position);
  const payment = calculateContractPayment(amount, distance, dueTicks);

  const newContract: IContract = {
    ...createCompanyEntity(companyId),
    destinationId,
    supplierId,
    resourceType,
    totalAmount: amount,
    amountDelivered: 0,
    payment,
    expectedTick: state.currentTick + dueTicks,
  };

  if (notificationConfig.logContractNotifications) {
    logSuccess(
      `[CONTRACT] Created contract for ${amount} ${resourceType} from ${supplier.name} to ${destination.name}, due in ${dueTicks} ticks and paying ${payment}`,
    );
  }

  state.contracts.push(newContract);
};

// .. READ

export const getContractByIdOrNull = (
  state: IWorldState,
  id: string | undefined,
) => {
  const contract = state.contracts.find((c) => c.id === id);

  return contract;
};

export const getContractByLocationIdOrNull = (
  state: IWorldState,
  locationId: Nullable<string>,
) => {
  const contract = state.contracts.find((c) => c.destinationId === locationId);

  return contract;
};

export const getContractByResource = (
  state: IWorldState,
  destinationId: string,
  resourceType: RESOURCE_TYPE,
) => {
  return state.contracts.find(
    (c) => c.destinationId === destinationId && c.resourceType === resourceType,
  );
};

export const getContractString = (state: IWorldState, contract: IContract) => {
  const contractCompany = getCompanyById(state, contract.companyId);
  const contractSupplier = getLocationById(state, contract.supplierId);
  const contractDestination = getLocationById(state, contract.destinationId);

  const amountResource = highlight.yellow(
    contract.totalAmount + " " + contract.resourceType,
  );
  const pickupDropoff = `Pickup: ${highlight.yellow(contractSupplier.name)} | Drop-off: ${highlight.yellow(contractDestination.name)}`;
  const owner = `Owner: ${highlight.yellow(contractCompany.name)}`;
  const dueIn = `Due in: ${highlight.yellow(contract.expectedTick - state.currentTick + " ticks")}`;
  const payment = `Payment: ${highlight.yellow(contract.payment + "")}`;

  return `| ${highlight.custom("███", contractCompany.color)} | ${amountResource} | ${pickupDropoff} | ${owner} | ${dueIn} | ${payment}`;
};

// .. UPDATE
export const updateContracts = (state: IWorldState) => {
  state.contracts.forEach((contract) => {
    const destination = state
      .getLocations()
      .find((l) => l.id === contract.destinationId);
    const supplier = state
      .getLocations()
      .find((l) => l.id === contract.supplierId);

    if (!destination) {
      throw Error(`[CRITICAL CONTRACT ERROR] A contract must have an owner`);
    }
    if (!supplier) {
      throw Error(`[CRITICAL CONTRACT ERROR] A contract must have a supplier`);
    }

    const contractDueTicks = contract.expectedTick - state.currentTick;

    if (contractDueTicks > 0) {
      if (contractDueTicks - 1 <= 0) {
        if (notificationConfig.logContractNotifications) {
          logWarning(`Contract ${contract.id} has expired`);
        }
        // .. impose some sort of penalty on the shipper if they fail to deliver?
      } else {
        if (notificationConfig.logContractNotifications) {
          logInfo(
            `Contract ${contract.id} is due in ${contractDueTicks} ticks`,
          );
        }
      }
    }
  });
};

export const assignContract = (contract: IContract, shipper: ITruck) => {
  if (notificationConfig.logContractNotifications) {
    logInfo(`[CONTRACT] Trying to assign ${contract.resourceType} contract...`);
  }

  if (contract.shipperId) {
    logError(
      ` - ERROR: Contract already being shipped - assignment not possible`,
    );
    return false;
  }

  if (shipper.storage.resourceType !== contract.resourceType) {
    logError(
      ` - ERROR: Incompatible shipper resource type - assignment not possible`,
    );
    return false;
  }

  shipper.contractId = contract.id;
  contract.shipperId = shipper.id;
  contract.acceptedAtTick = world.getCurrentTick();

  if (notificationConfig.logContractNotifications) {
    logSuccess(
      `- SUCCESS: Contract ${highlight.yellow(contract.id)} assigned to shipper ${highlight.yellow(shipper.id)}`,
    );
  }

  return true;
};

export const archiveContract = (state: IWorldState, contract: IContract) => {
  state.contractHistory.push(contract);
  state.contracts = state.contracts.filter((c) => c.id !== contract.id);
};

export const completeContract = (state: IWorldState, contract: IContract) => {
  if (notificationConfig.logContractNotifications) {
    logInfo(
      `[CONTRACT] Trying to complete ${contract.resourceType} contract...`,
    );
  }

  const destination = getLocationById(state, contract.destinationId);

  if (!destination) {
    logError(` - ERROR: No destination found - completion not possible`);
    return false;
  }

  if (!contract.shipperId) {
    logError(` - ERROR: No shipper found - completion not possible`);
    return false;
  }

  const resourceCount = getResourceCount(
    contract.resourceType,
    destination.storage,
  );
  if (resourceCount < contract.totalAmount) {
    if (notificationConfig.logContractNotifications) {
      logWarning(
        ` - WARNING: Requirements not satisfied - ${destination.name} needs ${contract.totalAmount} ${contract.resourceType} - only ${resourceCount} available`,
      );
    }
    return false;
  }

  if (notificationConfig.logContractNotifications) {
    logSuccess(` - SUCCESS: All requirements met. Contract will be voided.`);
  }

  const shipper = getTruckById(state, contract.shipperId);
  const shipperCompany = getCompanyById(state, shipper.companyId);

  const contractOwner = getLocationById(state, contract.destinationId);
  const contractOwnerCompany = getCompanyById(state, contractOwner.companyId);

  transferFunds(contractOwnerCompany, shipperCompany, contract.payment);

  contract.deliveredTick = state.currentTick;
  archiveContract(state, contract);

  return true;
};

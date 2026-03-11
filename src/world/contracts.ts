import { IContract } from "../entities/contract";
import { getResourceCount, RESOURCE_TYPE } from "../entities/storage";
import { loadNotificationConfig } from "../notifications";
import { ITruck } from "../entities/truck";
import {
  logSuccess,
  logWarning,
  logInfo,
  logError,
  highlight,
} from "../logUtils";
import { createCompanyEntity, getCompanyById } from "./companies";
import { getLocationById } from "./locations/locations";
import { getTruckById } from "./trucks";
import { IWorld } from "./world";
import { Nullable } from "../entities/entity";
import { IWorldState } from "../entities/world";

const notificationConfig = loadNotificationConfig();

// .. CREATE

export const createContract = (
  state: IWorldState,
  companyId: string,
  destinationId: string,
  supplierId: string,
  resourceType: RESOURCE_TYPE,
  amount: number,
  payment: number,
  dueTicks: number,
) => {
  const newContract: IContract = {
    ...createCompanyEntity(companyId),
    destinationId,
    supplierId,
    resourceType,
    amount,
    payment,
    expectedTick: state.currentTick + dueTicks,
  };

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

export const getContractString = (world: IWorld, contract: IContract) => {
  const contractCompany = world.getCompanyById(contract.companyId);
  const contractSupplier = world.getLocationById(contract.supplierId);
  const contractDestination = world.getLocationById(contract.destinationId);

  const amountResource = highlight.yellow(
    contract.amount + " " + contract.resourceType,
  );
  const pickupDropoff = `Pickup: ${highlight.yellow(contractSupplier.name)} | Drop-off: ${highlight.yellow(contractDestination.name)}`;
  const owner = `Owner: ${highlight.yellow(contractCompany.name)}`;
  const dueIn = `Due in: ${highlight.yellow(contract.expectedTick - world.getCurrentTick() + " ticks")}`;

  return `| ${highlight.custom("███", contractCompany.color)} | ${amountResource} | ${pickupDropoff} | ${owner} | ${dueIn}`;
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
        if (notificationConfig.showContractNotifications) {
          logWarning(`Contract ${contract.id} has expired`);
        }
        // .. impose some sort of penalty on the shipper if they fail to deliver?
      } else {
        if (notificationConfig.showContractNotifications) {
          logInfo(
            `Contract ${contract.id} is due in ${contractDueTicks} ticks`,
          );
        }
      }
    }
  });
};

export const assignContract = (contract: IContract, shipper: ITruck) => {
  if (notificationConfig.showContractNotifications) {
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

  if (notificationConfig.showContractNotifications) {
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
  if (notificationConfig.showContractNotifications) {
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
  if (resourceCount < contract.amount) {
    if (notificationConfig.showContractNotifications) {
      logWarning(
        ` - WARNING: Requirements not satisfied - ${destination.name} needs ${contract.amount} ${contract.resourceType} - only ${resourceCount} available`,
      );
    }
    return false;
  }

  if (notificationConfig.showContractNotifications) {
    logSuccess(` - SUCCESS: All requirements met. Contract will be voided.`);
  }

  const shipper = getTruckById(state, contract.shipperId);
  const shipperCompany = getCompanyById(state, shipper.companyId);
  shipperCompany.money += contract.payment;

  contract.deliveredTick = state.currentTick;
  archiveContract(state, contract);

  return true;
};

export const removeOwnedContracts = (
  state: IWorldState,
  destinationId: string,
) => {
  const contractsToRemove = state.contracts.filter(
    (c) => c.destinationId === destinationId,
  );

  if (contractsToRemove.length > 0) {
    if (notificationConfig.showContractNotifications) {
      const destination = state
        .getLocations()
        .find((l) => l.id === contractsToRemove[0].destinationId);

      if (!destination) {
        throw Error(
          `[CRITICAL SYSTEM ERROR] Location with id ${contractsToRemove[0].destinationId} doesn't exist - removal not possible`,
        );
      }

      logSuccess(
        `[CONTRACTS] Voiding ${contractsToRemove.length} contracts from ${destination.name}`,
      );
    }
    state.contracts = state.contracts.filter(
      (c) => !contractsToRemove.find((ctr) => ctr.id == c.id),
    );
  }
};

import { randomUUID } from "crypto";
import { Contract } from "../entities/contract";
import { BaseLocation } from "../entities/location";
import { getResourceCount, RESOURCE_TYPE } from "../entities/storage";
import { IWorldState } from "./state";
import { loadNotificationConfig } from "../notifications";
import { Truck } from "../entities/truck";
import { logSuccess, logWarning, logInfo, logError, highlight } from "../utils";
import { createCompanyEntity } from "../entities/entity";

const notificationConfig = loadNotificationConfig();

// .. CREATE

export const createContract = (
  state: IWorldState,
  name: string,
  companyId: string,
  destination: BaseLocation,
  supplier: BaseLocation,
  resourceType: RESOURCE_TYPE,
  amount: number,
  payment: number,
  dueTicks: number,
) => {
  const newContract = createCompanyEntity(
    {
      name,
      destination,
      supplier,
      shipper: undefined,
      resourceType,
      amount,
      payment,
      dueTicks,
    },
    companyId,
  );

  if (!destination) {
    throw Error(`[CRITICAL CONTRACT ERROR] Owner cannot be null or undefined`);
  }
  if (!supplier) {
    throw Error(
      `[CRITICAL CONTRACT ERROR] Supplier cannot be null or undefined`,
    );
  }

  if (notificationConfig.showContractNotifications) {
    logSuccess(
      `${destination.name} created a contract with ${supplier.name} for ${amount} ${resourceType} - due in ${dueTicks} ticks`,
    );
  }

  state.contracts.push(newContract);
};

// .. READ

export const getContractByResource = (
  state: IWorldState,
  ownerId: string,
  resourceType: RESOURCE_TYPE,
) => {
  return state.contracts.find(
    (c) => c.destination.id === ownerId && c.resourceType === resourceType,
  );
};

export const getContractString = (contract: Contract) => {
  return `| ${highlight.yellow(contract.amount + " " + contract.resourceType)} | Pickup: ${highlight.yellow(contract.supplier.name)} | Drop-off: ${highlight.yellow(contract.destination.name)} | Due in: ${highlight.yellow(contract.dueTicks + " ticks")}`;
};

// .. UPDATE
export const updateContracts = (state: IWorldState) => {
  state.contracts.forEach((contract) => {
    if (!contract.destination) {
      throw Error(`[CRITICAL CONTRACT ERROR] A contract must have an owner`);
    }
    if (!contract.supplier) {
      throw Error(`[CRITICAL CONTRACT ERROR] A contract must have a supplier`);
    }

    if (contract.dueTicks > 0) {
      if (contract.dueTicks - 1 <= 0) {
        if (notificationConfig.showContractNotifications) {
          logWarning(`Contract ${contract.id} has expired`);
        }
        // .. impose some sort of penalty on the shipper if they fail to deliver?
      } else {
        contract.dueTicks--;

        if (notificationConfig.showContractNotifications) {
          logInfo(
            `Contract ${contract.id} is due in ${contract.dueTicks} ticks`,
          );
        }
      }
    }
  });
};

export const isValidShipperType = (contract: Contract, shipper: Truck) => {
  if (shipper.storage.resourceType !== contract.resourceType) {
    if (notificationConfig.showContractNotifications) {
      logWarning(` - WARNING: Incompatible shipper resource type`);
    }
    return false;
  }

  return true;
};

export const assignContract = (contract: Contract, shipper: Truck) => {
  if (notificationConfig.showContractNotifications) {
    logInfo(`[CONTRACT] Trying to assign ${contract.resourceType} contract...`);
  }

  if (contract.shipper) {
    logError(
      ` - ERROR: Contract already being shipped - assignment not possible`,
    );
    return false;
  }

  if (!isValidShipperType(contract, shipper)) {
    logError(
      ` - ERROR: Incompatible shipper resource type - assignment not possible`,
    );
    return false;
  }

  shipper.contract = contract;
  contract.shipper = shipper;

  if (notificationConfig.showContractNotifications) {
    logSuccess(
      `- SUCCESS: Contract ${highlight.yellow(contract.id)} assigned to shipper ${highlight.yellow(shipper.id)}`,
    );
  }

  return true;
};

// .. DELETE
export const deleteContract = (state: IWorldState, contract: Contract) => {
  state.contracts = state.contracts.filter((c) => c.id !== contract.id);
};

export const completeContract = (state: IWorldState, contract: Contract) => {
  if (notificationConfig.showContractNotifications) {
    logInfo(
      `[CONTRACT] Trying to complete ${contract.resourceType} contract...`,
    );
  }
  if (!contract.destination) {
    logError(` - ERROR: No owner found - completion not possible`);
    return false;
  }

  const resourceCount = getResourceCount(
    contract.resourceType,
    contract.destination.storage,
  );
  if (resourceCount < contract.amount) {
    if (notificationConfig.showContractNotifications) {
      logWarning(
        ` - WARNING: Requirements not satisfied - ${contract.destination.name} needs ${contract.amount} ${contract.resourceType} - only ${resourceCount} available`,
      );
    }
    return false;
  }

  if (notificationConfig.showContractNotifications) {
    logSuccess(` - SUCCESS: All requirements met. Contract will be voided.`);
  }

  deleteContract(state, contract);

  return true;
};

export const removeOwnedContracts = (state: IWorldState, ownerId: string) => {
  const contractsToRemove = state.contracts.filter(
    (c) => c.destination.id === ownerId,
  );

  if (contractsToRemove.length > 0) {
    if (notificationConfig.showContractNotifications) {
      logSuccess(
        `[CONTRACTS] Voiding ${contractsToRemove.length} contracts from ${contractsToRemove[0].destination.name}`,
      );
    }
    state.contracts = state.contracts.filter(
      (c) => !contractsToRemove.find((ctr) => ctr.id == c.id),
    );
  }
};

import { randomUUID } from "crypto";
import { IContract } from "../entities/contract";
import { IBaseLocation } from "../entities/location";
import {
  addResources,
  getResourceCount,
  getResourceStorage,
  RESOURCE_TYPE,
} from "../entities/storage";
import { IWorldState } from "./state";
import { loadNotificationConfig, notify } from "../notifications";
import { ITruck } from "../entities/truck";

const notificationConfig = loadNotificationConfig();

// .. CREATE

export const createContract = (
  state: IWorldState,
  owner: IBaseLocation,
  supplier: IBaseLocation,
  resourceType: RESOURCE_TYPE,
  amount: number,
  payment: number,
  dueTicks: number,
) => {
  const newContract: IContract = {
    id: randomUUID(),
    owner,
    supplier,
    shipper: undefined,
    resourceType,
    amount,
    payment,
    dueTicks,
  };

  if (notificationConfig.showContractNotifications) {
    notify.success(
      `${owner.name} created a contract with ${supplier.name} for ${amount} ${resourceType} - due in ${dueTicks} ticks`,
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
    (c) => c.owner.id === ownerId && c.resourceType === resourceType,
  );
};

// .. UPDATE
export const updateContracts = (state: IWorldState) => {
  state.contracts.forEach((contract) => {
    if (!contract.owner) {
      throw Error(`[CRITICAL CONTRACT ERROR] A contract must have an owner`);
    }
    if (!contract.supplier) {
      throw Error(`[CRITICAL CONTRACT ERROR] A contract must have a supplier`);
    }

    if (contract.dueTicks > 0) {
      if (contract.dueTicks - 1 <= 0) {
        if (notificationConfig.showContractNotifications) {
          notify.warning(`Contract ${contract.id} has expired`);
        }
        // .. impose some sort of penalty on the shipper if they fail to deliver?
      } else {
        contract.dueTicks--;

        if (notificationConfig.showContractNotifications) {
          notify.info(
            `Contract ${contract.id} is due in ${contract.dueTicks} ticks`,
          );
        }
      }
    }
  });
};

// .. DELETE
export const deleteContract = (state: IWorldState, contract: IContract) => {
  state.contracts = state.contracts.filter((c) => c.id !== contract.id);
};

export const completeContract = (state: IWorldState, contract: IContract) => {
  if (notificationConfig.showContractNotifications) {
    notify.info(
      `[CONTRACT] Trying to complete ${contract.resourceType} contract...`,
    );
  }
  if (!contract.owner) {
    notify.error(` - ERROR: No owner found - completion not possible`);
    return false;
  }

  const resourceCount = getResourceCount(
    contract.resourceType,
    contract.owner.storage,
  );
  if (resourceCount < contract.amount) {
    if (notificationConfig.showContractNotifications) {
      notify.warning(
        ` - WARNING: Requirements not satisfied - ${contract.owner.name} needs ${contract.amount} ${contract.resourceType} - only ${resourceCount} available`,
      );
    }
    return false;
  }

  if (notificationConfig.showContractNotifications) {
    notify.success(
      ` - SUCCESS: All requirements met. Contract will be voided.`,
    );
  }

  deleteContract(state, contract);

  return true;
};

export const removeOwnedContracts = (state: IWorldState, ownerId: string) => {
  const contractsToRemove = state.contracts.filter(
    (c) => c.owner.id === ownerId,
  );

  if (contractsToRemove.length > 0) {
    if (notificationConfig.showContractNotifications) {
      notify.success(
        `[CONTRACTS] Voiding ${contractsToRemove.length} contracts from ${contractsToRemove[0].owner.name}`,
      );
    }
    state.contracts = state.contracts.filter(
      (c) => !contractsToRemove.find((ctr) => ctr.id == c.id),
    );
  }
};

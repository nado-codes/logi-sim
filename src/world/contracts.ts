import { randomUUID } from "crypto";
import { IContract } from "../entities/contract";
import { IBaseLocation } from "../entities/location";
import { addResources, RESOURCE_TYPE } from "../entities/storage";
import { IWorldState } from "./state";
import { loadNotificationConfig, notify } from "../notifications";

const notificationConfig = loadNotificationConfig();

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

        //addResources(contract.amount, contract.owner.storage[0]);
        //removeOwnedContracts(state, contract.owner.id);
      }
    }
  });
};

export const getResourceContract = (
  state: IWorldState,
  ownerId: string,
  resourceType: RESOURCE_TYPE,
) => {
  return state.contracts.find(
    (c) => c.owner.id === ownerId && c.resourceType === resourceType,
  );
};

export const completeContract = (contract: IContract) => {
  if (!contract.shipper) {
    notify.error(
      `[CONTRACT ERROR] A contract with no shipper cannot be completed`,
    );
  }
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

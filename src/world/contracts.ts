import { randomUUID } from "crypto";
import { IContract } from "../entities/contract";
import { IBaseLocation } from "../entities/location";
import { RESOURCE_TYPE } from "../entities/storage";
import { IWorldState } from "./state";

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

  console.log(
    `${owner.name} created a contract with ${supplier.name} for ${amount} ${resourceType} - due in ${dueTicks} ticks`,
  );

  state.contracts.push(newContract);
};

export const updateContracts = (state: IWorldState) => {
  state.contracts.forEach((contract) => {
    if (contract.dueTicks > 0) {
      if (contract.dueTicks - 1 <= 0) {
        console.log(`Contract ${contract.id} has expired`);
        // .. impose some sort of penalty on the shipper if they fail to deliver?
      } else {
        contract.dueTicks--;
        console.log(
          `Contract ${contract.id} is due in ${contract.dueTicks} ticks`,
        );
      }
    }
  });
};

export const removeOwnedContracts = (state: IWorldState, ownerId: string) => {
  const contractsToRemove = state.contracts.filter(
    (c) => c.owner.id === ownerId,
  );

  if (contractsToRemove.length > 0) {
    console.log("contracts to void: ", contractsToRemove);
    state.contracts = state.contracts.filter(
      (c) => !contractsToRemove.find((ctr) => ctr.id == c.id),
    );
  }
};

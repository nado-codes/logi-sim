export enum RESOURCE_TYPE {
  Grain = "Grain",
  Flour = "Flour",
}

export type ResourceMap = Partial<Record<RESOURCE_TYPE, number>>;

export interface IRecipe {
  inputs?: ResourceMap;
  outputs?: ResourceMap;
}

// .. these are used to track who delivered resources and when they did it
// .. check recent deliveries from a particular person to work out if they've satisfied the contract yet or not
// .. this is a bit weird though - contracts should just keep track of how much is left to deliver, otherwise
// we need to do all these calculations to say which events are relevant, then getting the sum ... when we can
// just decrease a number e.g. amountLeftToDeliver
// this also solves the issue of using storage count to determine if a contract has been completed .. because
// truck A might end up taking credit for truck B's work if truck A says "hey the storage is full" and town goes
// "omg thanks here's $1000", even though truck B was the one to deliver it
// - just track the amount left to deliver on THAT contract by THAT truck and just decrement it until the contract is done
// and if a town creates too many contracts and gets over-supplied - that's the town's problem
export interface IStorageTransferEvent {
  entityId: string;
  tick: number;
  amount: number;
}

export interface IStorage {
  ownerId: string;
  resourceType: RESOURCE_TYPE;
  resourceCapacity: number;
  resourceCount: number;
  transferEvents: IStorageTransferEvent[];
}

export enum StorageTransferResult {
  SOURCE_EMPTY,
  DESTINATION_FULL,
  SUCCESS,
}

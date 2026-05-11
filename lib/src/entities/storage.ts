export enum RESOURCE_TYPE {
  Grain = "Grain",
  Flour = "Flour",
  Bread = "Bread",
}

export type ResourceMap = Partial<Record<RESOURCE_TYPE, number>>;

export interface IRecipe {
  inputs?: ResourceMap;
  outputs?: ResourceMap;
}

export interface IStorage {
  ownerId: string;
  resourceType: RESOURCE_TYPE;
  resourceCapacity: number;
  resourceCount: number;
}

export enum StorageTransferResult {
  SOURCE_EMPTY,
  DESTINATION_FULL,
  SUCCESS,
}

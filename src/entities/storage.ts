export enum RESOURCE_TYPE {
  ORE = "Ore",
  METAL = "Metal",
}

export interface IStorage {
  id: string;
  resourceType: RESOURCE_TYPE;
  resourceCapacity: number;
  resourceCount: number;
}

export const transferResources = (
  amount: number,
  from: IStorage,
  to: IStorage,
) => {
  if (from.resourceType != to.resourceType) {
    throw Error(
      `[STORAGE ERROR] Containers ${from.id} and ${to.id} have incompatible resource types and cannot be transferred between`,
    );
  }

  const amountToMoveFrom = Math.min(from.resourceCount, amount);

  if (from.resourceCount < amount) {
    console.log(
      `[STORAGE] ${from.id} doesn't have enough ${from.resourceType} to transfer ${amount}`,
    );
  }
  if (to.resourceCount + amountToMoveFrom > to.resourceCapacity) {
    console.log(
      `[STORAGE] ${to.id} is too full of ${from.resourceType} to transfer ${amount}`,
    );
  }

  const amountToMoveTo = Math.min(
    amountToMoveFrom,
    to.resourceCapacity - to.resourceCount,
  );

  from.resourceCount -= amountToMoveTo;
  to.resourceCount += amountToMoveTo;

  console.log(
    `[STORAGE] Transferred ${amountToMoveTo} ${from.resourceType} from ${from.id} to ${to.id}`,
  );

  if (from.resourceCount < 0) {
    console.log(
      `[STORAGE WARNING] ${from.id} had negative storage and was corrected`,
    );
    from.resourceCount = 0;
  }
  if (to.resourceCount > to.resourceCapacity) {
    console.log(`[STORAGE WARNING] ${to.id} was overflowing and was corrected`);
    console.log(
      ` - ${to.resourceCount - to.resourceCapacity} units of ${to.resourceType} were lost`,
    );
    to.resourceCount = to.resourceCapacity;
  }
};

export const addResources = (amount: number, to: IStorage) => {
  if (to.resourceCount + amount > to.resourceCapacity) {
    console.log(
      `[STORAGE WARNING] ${to.id} is too full of ${to.resourceType} to add ${amount}`,
    );
  }

  const amountToAdd = Math.min(amount, to.resourceCapacity - to.resourceCount);
  to.resourceCount += amountToAdd;
  console.log(`[STORAGE] Added ${amountToAdd} ${to.resourceType} to ${to.id}`);

  return amountToAdd;
};

export const removeResources = (amount: number, from: IStorage) => {
  if (from.resourceCount - amount < 0) {
    console.log(
      `[STORAGE WARNING] ${from.id} doesn't have enough ${from.resourceType} to remove ${amount}`,
    );
  }

  const amountToRemove = Math.max(from.resourceCount - amount, 0);
  from.resourceCount -= amountToRemove;

  console.log(
    `[STORAGE] Removed ${amountToRemove} ${from.resourceType} from ${from.id}`,
  );

  return amountToRemove;
};

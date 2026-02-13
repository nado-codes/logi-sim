export enum RESOURCE_TYPE {
  ORE = "Ore",
  METAL = "Metal",
}

// RECIPES

export interface IRecipe {
  inputs?: Partial<Record<RESOURCE_TYPE, number>>;
  outputs?: Partial<Record<RESOURCE_TYPE, number>>;
}

export const processRecipe = (recipe: IRecipe, storage: IStorage[]) => {
  let canProcess = true;

  if (recipe.inputs) {
    Object.entries(recipe.inputs).forEach(([resourceType, requiredAmount]) => {
      const inputStorage = storage.filter(
        (s) => s.resourceType == resourceType,
      );
      const availableAmount = inputStorage
        .map((s) => s.resourceCount)
        .reduce((p, c) => p + c);

      if (availableAmount < requiredAmount) {
        canProcess = false;
      } else {
        let amountLeftToRemove = requiredAmount;

        inputStorage.forEach((storage) => {
          const amountToRemove = Math.max(
            storage.resourceCount - amountLeftToRemove,
            storage.resourceCount,
          );
          const amountRemoved = removeResources(amountToRemove, storage);

          amountLeftToRemove = Math.max(amountLeftToRemove - amountRemoved, 0);
        });
      }
    });
  }

  if (canProcess && recipe.outputs) {
    Object.entries(recipe.outputs).forEach(([outputResource, outputAmount]) => {
      const outputStorage = storage.filter(
        (s) => s.resourceType == outputResource,
      );
      const availableCapacity = outputStorage
        .map((s) => s.resourceCapacity - s.resourceCount)
        .reduce((p, c) => p + c, 0);

      if (availableCapacity >= outputAmount) {
        let amountLeftToAdd = outputAmount;

        outputStorage.forEach((storage) => {
          const amountToAdd = Math.min(
            storage.resourceCapacity - storage.resourceCount,
            amountLeftToAdd,
          );
          const amountAdded = addResources(amountToAdd, storage);

          amountLeftToAdd = Math.max(amountLeftToAdd - amountAdded, 0);
        });

        console.log(`[RECIPE] Processing:`);
        const recipeInputs = Object.entries(
          recipe.inputs ?? ({} as Record<RESOURCE_TYPE, number>),
        ).map((r) => {
          return `${r[1]} ${r[0]}`;
        });
        recipeInputs.length > 0 &&
          console.log(" - Inputs:", recipeInputs.join(","));

        const recipeOutputs = Object.entries(
          recipe.outputs ?? ({} as Record<RESOURCE_TYPE, number>),
        ).map((r) => {
          return `${r[1]} ${r[0]}`;
        });
        recipeOutputs.length > 0 &&
          console.log(" - Outputs:", recipeOutputs.join(","));
      } else {
        canProcess = false;
      }
    });
  }

  return canProcess;
};

// STORAGE

export interface IStorage {
  id: string;
  resourceType: RESOURCE_TYPE;
  resourceCapacity: number;
  resourceCount: number;
}

export const getInputStorage = (recipe: IRecipe, storage: IStorage[]) =>
  storage.filter((s) => s.resourceType in (recipe.inputs ?? {}));

export const getOutputStorage = (recipe: IRecipe, storage: IStorage[]) =>
  storage.filter((s) => s.resourceType in (recipe.outputs ?? {}));

export const getResourceCapacity = (
  resourceType: RESOURCE_TYPE,
  storage: IStorage[],
) => {
  const resourceStorage = storage.filter((s) => s.resourceType == resourceType);
  return resourceStorage.map((s) => s.resourceCapacity).reduce((a, c) => a + c);
};

export const getResourceCount = (
  resourceType: RESOURCE_TYPE,
  storage: IStorage[],
) => {
  const resourceStorage = storage.filter((s) => s.resourceType == resourceType);
  return resourceStorage.map((s) => s.resourceCount).reduce((a, c) => a + c);
};

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

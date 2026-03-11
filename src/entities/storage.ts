import { randomUUID } from "crypto";
import { loadNotificationConfig } from "../notifications";
import { logInfo, logWarning, logSuccess } from "../utils/logUtils";

export enum RESOURCE_TYPE {
  GRAIN = "Grain",
  FLOUR = "Flour",
}

// RECIPES

export type ResourceMap = Partial<Record<RESOURCE_TYPE, number>>;

export interface IRecipe {
  inputs?: ResourceMap;
  outputs?: ResourceMap;
}

const notificationConfig = loadNotificationConfig();

export const createAndGetStorage = (
  resourceType: RESOURCE_TYPE,
  resourceCapacity: number,
  resourceCount?: number,
): IStorage => {
  const newStorage: IStorage = {
    resourceType,
    resourceCapacity,
    resourceCount: resourceCount ?? 0,
  };

  return newStorage;
};

export const createRecipeStorage = (
  recipe: IRecipe,
  inputCapacity: number,
  outputCapacity: number,
  startWithFullInputs: boolean = false,
  startWithFullOutputs: boolean = false,
) => {
  const recipeInputs = Object.entries(recipe.inputs ?? {});
  const recipeOutputs = Object.entries(recipe.outputs ?? {});

  recipeInputs.forEach(([iR, _]) => {
    if (recipeOutputs.find(([oR, _]) => oR === iR)) {
      throw Error(
        `[CRITICAL PRODUCTION ERROR] A recipe cannot have an input and output of the same resource type ${iR}`,
      );
    }
  });

  const inputStorage: IStorage[] = recipeInputs.map(([r, _]) =>
    createAndGetStorage(r as RESOURCE_TYPE, inputCapacity),
  );

  if (startWithFullInputs) {
    inputStorage.forEach((storage) => {
      addResources(storage.resourceCapacity, storage);
    });
  }

  const outputStorage: IStorage[] = recipeOutputs.map(([r, _]) =>
    createAndGetStorage(r as RESOURCE_TYPE, outputCapacity),
  );

  if (startWithFullOutputs) {
    outputStorage.forEach((storage) => {
      addResources(storage.resourceCapacity, storage);
    });
  }

  return [...inputStorage, ...outputStorage];
};

export const processRecipe = (recipe: IRecipe, storage: IStorage[]) => {
  let canProcess = true;

  if (notificationConfig.showProductionNotifications) {
    logInfo("[PRODUCTION] Processing recipe...");
  }

  if (recipe.inputs) {
    Object.entries(recipe.inputs).forEach(([resourceType, requiredAmount]) => {
      const inputStorage = storage.filter(
        (s) => s.resourceType === resourceType,
      );
      const availableAmount = inputStorage
        .map((s) => s.resourceCount)
        .reduce((p, c) => p + c);

      if (availableAmount < requiredAmount) {
        if (notificationConfig.showProductionNotifications) {
          logWarning(
            ` - Missing the required ${requiredAmount} ${resourceType} to process this recipe. Production paused`,
          );
        }

        canProcess = false;
      } else {
        if (notificationConfig.showProductionNotifications) {
          logInfo(
            ` - Found ${inputStorage.length} input storages with ${availableAmount} total units of ${resourceType} inside them`,
          );
        }

        let amountLeftToRemove = requiredAmount;

        inputStorage.forEach((storage) => {
          const amountToRemove = Math.min(
            amountLeftToRemove,
            storage.resourceCount,
          );

          const amountRemoved = removeResources(amountToRemove, storage);

          amountLeftToRemove = Math.max(amountLeftToRemove - amountRemoved, 0);

          if (notificationConfig.showProductionNotifications) {
            logInfo(` - Consumed ${amountRemoved} units of ${resourceType}`);
          }
        });
      }
    });
  } else {
    if (notificationConfig.showProductionNotifications) {
      logInfo(" - No inputs for this recipe");
    }
  }

  if (canProcess && recipe.outputs) {
    Object.entries(recipe.outputs).forEach(([outputResource, outputAmount]) => {
      const outputStorage = storage.filter(
        (s) => s.resourceType === outputResource,
      );
      const availableCapacity = outputStorage
        .map((s) => s.resourceCapacity - s.resourceCount)
        .reduce((p, c) => p + c, 0);

      let amountLeftToAdd = outputAmount;

      outputStorage.forEach((storage) => {
        const amountToAdd = Math.min(
          storage.resourceCapacity - storage.resourceCount,
          amountLeftToAdd,
        );
        const amountAdded = addResources(amountToAdd, storage);

        amountLeftToAdd = Math.max(amountLeftToAdd - amountAdded, 0);
      });

      if (notificationConfig.showProductionNotifications) {
        logSuccess(` - Produced ${outputAmount} ${outputResource}`);
      }

      if (availableCapacity <= outputAmount) {
        if (notificationConfig.showProductionNotifications) {
          logWarning(` - Output storage is full. Production paused`);
        }

        canProcess = false;
      }
    });
  }

  return canProcess;
};

// STORAGE

export interface IStorage {
  resourceType: RESOURCE_TYPE;
  resourceCapacity: number;
  resourceCount: number;
}

export const getResourceStorage = (
  resourceType: RESOURCE_TYPE,
  storage: IStorage[],
) => {
  return storage.filter((s) => s.resourceType === resourceType);
};

export const getInputStorage = (recipe: IRecipe, storage: IStorage[]) =>
  storage.filter((s) => s.resourceType in (recipe.inputs ?? {}));

export const getOutputStorage = (recipe: IRecipe, storage: IStorage[]) =>
  storage.filter((s) => s.resourceType in (recipe.outputs ?? {}));

export const getResourceCapacity = (
  resourceType: RESOURCE_TYPE,
  storage: IStorage[],
) => {
  const resourceStorage = storage.filter(
    (s) => s.resourceType === resourceType,
  );
  return resourceStorage.map((s) => s.resourceCapacity).reduce((a, c) => a + c);
};

export const getResourceCount = (
  resourceType: RESOURCE_TYPE,
  storage: IStorage[],
) => {
  const resourceStorage = storage.filter(
    (s) => s.resourceType === resourceType,
  );
  return resourceStorage.map((s) => s.resourceCount).reduce((a, c) => a + c);
};

// .. eventually, this method will allow the transfer of many different types of cargo in one call
// .. (e.g. trains with different cargo types) but this is (very) complicated to do
// so for now - we'll just transfer everything
export const transferResources = (
  amount: number,
  resourceType: RESOURCE_TYPE,
  fromStorage: IStorage[],
  toStorage: IStorage[],
) => {
  if (notificationConfig.showStorageNotifications) {
    logInfo(`[STORAGE] We'll try to transfer ${amount} ${resourceType}...`);
  }

  const matchingSourceStorage = fromStorage.filter(
    (s) => s.resourceType === resourceType,
  );
  const matchingDestinationStorage = toStorage.filter(
    (s) => s.resourceType === resourceType,
  );

  if (
    matchingSourceStorage.length === 0 ||
    matchingDestinationStorage.length === 0
  ) {
    throw Error(
      `[CRITICAL STORAGE ERROR] No matching source & destination storage found for ${resourceType}`,
    );
  }

  const matchingSourceResourceCount = matchingSourceStorage
    .map((s) => s.resourceCount)
    .reduce((a, c) => a + c);
  if (
    matchingSourceResourceCount < amount &&
    notificationConfig.showStorageNotifications
  ) {
    logWarning(
      `[STORAGE WARNING] Not enough ${resourceType} to transfer - only ${matchingSourceResourceCount} available ... we'll transfer what we can`,
    );
  }

  const matchingDestinationAvailableCapacity = matchingDestinationStorage
    .map((s) => s.resourceCapacity - s.resourceCount)
    .reduce((a, c) => a + c);

  if (
    matchingDestinationAvailableCapacity < amount &&
    notificationConfig.showStorageNotifications
  ) {
    logWarning(
      `[STORAGE WARNING] Not enough space available to transfer - only ${matchingDestinationAvailableCapacity} ... we'll transfer what we can`,
    );
  }

  // SCENARIO 1:
  // - Iron Mine has 30 ore
  // - Truck has 25 capacity and wants 25
  // - Truck gets 25 ore, 5 left in the mine

  // SCENARIO 2:
  // - Iron Mine has 15 ore
  // - Truck has 25 capacity and wants 25
  // - Truck can only take 15 ore, so the truck needs to wait for more to get mined

  let amountLeftToTransfer = amount;

  // .. this is the ore in the mine e.g. 30
  matchingSourceStorage.forEach((source) => {
    // .. do we still have stuff to move? if not, we'll just skip over everything else
    if (amountLeftToTransfer > 0) {
      if (notificationConfig.showStorageNotifications) {
        logInfo(` - We have ${amountLeftToTransfer} left to transfer`);
      }
      // .. we know how much we have in total, but how much does this box have in it?
      // .. we'll try to get everything we need from this box, but if we can't - that's fine
      const availableToTransfer = Math.min(
        source.resourceCount,
        amountLeftToTransfer,
      );

      if (notificationConfig.showStorageNotifications) {
        logInfo(` - Theres ${availableToTransfer} in this box`);
      }

      matchingDestinationStorage.forEach((destination) => {
        // .. ok, now how much space is available in this box to put it into
        // .. can we transfer everything? or only a bit at a time?
        const availableCapacity =
          destination.resourceCapacity - destination.resourceCount;
        const amountToTransfer = Math.min(
          availableCapacity,
          availableToTransfer,
        );

        if (notificationConfig.showStorageNotifications) {
          logInfo(
            ` - The box we want to put it in can take ${availableCapacity}, so we'll move ${amountToTransfer}`,
          );
        }

        // .. ok cool, let's move the stuff and track how much we moved
        removeResources(amountToTransfer, source);
        addResources(amountToTransfer, destination);
        amountLeftToTransfer -= amountToTransfer;
      });
    }
  });

  // .. we (really) dont expect this to happen, but if it does, we need to know
  if (amountLeftToTransfer < 0) {
    throw Error(
      `[CRITICAL STORAGE ERROR] Tried to transfer too much  (amount left: ${amountLeftToTransfer} - this is wrong)`,
    );
  } else if (amountLeftToTransfer > 0) {
    if (notificationConfig.showStorageNotifications) {
      logWarning(
        `[STORAGE WARNING] We couldn't transfer everything, still have ${amountLeftToTransfer} left to go`,
      );
    }
    return false;
  } else {
    return true;
  }
};

export const addResources = (amount: number, to: IStorage) => {
  if (to.resourceCount + amount > to.resourceCapacity) {
    if (notificationConfig.showStorageNotifications) {
      logWarning(
        `[STORAGE WARNING] Too full of ${to.resourceType} to add ${amount}`,
      );
    }
  }

  const amountToAdd = Math.min(amount, to.resourceCapacity - to.resourceCount);
  to.resourceCount += amountToAdd;

  if (notificationConfig.showStorageNotifications) {
    logSuccess(`[STORAGE] Added ${amountToAdd} ${to.resourceType}`);
  }

  return amountToAdd;
};

export const removeResources = (amount: number, from: IStorage) => {
  if (from.resourceCount < amount) {
    if (notificationConfig.showStorageNotifications) {
      logWarning(
        `[STORAGE WARNING] Not enough ${from.resourceType} to remove ${amount}`,
      );
    }
  }

  const amountToRemove = Math.min(from.resourceCount, amount);
  from.resourceCount -= amountToRemove;

  if (notificationConfig.showStorageNotifications) {
    logSuccess(`[STORAGE] Removed ${amountToRemove} ${from.resourceType}`);
  }

  return amountToRemove;
};

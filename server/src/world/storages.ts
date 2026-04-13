import {
  RESOURCE_TYPE,
  IStorage,
  IRecipe,
  IWorldState,
  StorageTransferResult,
} from "@logisim/lib/entities";
import { clamp, logInfo, logWarning, logSuccess } from "@logisim/lib/utils";
import { loadNotificationConfig } from "../notifications";
import { loadConfig } from "../utils/configUtils";

const notificationConfig = loadNotificationConfig();

interface IStorageConfig {
  recipeBufferStorageMultiplier: number;
  storageLowThreshold: number;
}

const defaultConfig: IStorageConfig = {
  recipeBufferStorageMultiplier: 5,
  storageLowThreshold: 0.9,
};

export const loadStorageConfig = () => {
  const config = loadConfig("storage", defaultConfig);
  config.storageLowThreshold = clamp(config.storageLowThreshold, 0, 1);

  return config;
};

const storageConfig = loadStorageConfig();

export const createAndGetStorage = (
  ownerId: string,
  resourceType: RESOURCE_TYPE,
  resourceCapacity: number,
  resourceCount: number = 0,
): IStorage => {
  const newStorage: IStorage = {
    ownerId,
    resourceType,
    resourceCapacity,
    resourceCount,
    transferEvents: [],
  };

  return newStorage;
};

export const createRecipeStorage = (
  ownerId: string,
  recipe: IRecipe,
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

  const inputStorage: IStorage[] = recipeInputs.map(([resourceType, amount]) =>
    createAndGetStorage(
      ownerId,
      resourceType as RESOURCE_TYPE,
      amount * storageConfig.recipeBufferStorageMultiplier,
    ),
  );

  if (startWithFullInputs) {
    inputStorage.forEach((storage) => {
      _addResources(storage.resourceCapacity, storage);
    });
  }

  const outputStorage: IStorage[] = recipeOutputs.map(
    ([resourceType, amount]) =>
      createAndGetStorage(
        ownerId,
        resourceType as RESOURCE_TYPE,
        amount * storageConfig.recipeBufferStorageMultiplier,
      ),
  );

  if (startWithFullOutputs) {
    outputStorage.forEach((storage) => {
      _addResources(storage.resourceCapacity, storage);
    });
  }

  return [...inputStorage, ...outputStorage];
};

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

export const processRecipe = (recipe: IRecipe, storage: IStorage[]) => {
  let canProcess = true;

  if (notificationConfig.logProductionNotifications) {
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
        if (notificationConfig.logProductionNotifications) {
          logWarning(
            ` - Missing the required ${requiredAmount} ${resourceType} to process this recipe. Production paused`,
          );
        }

        canProcess = false;
      } else {
        if (notificationConfig.logProductionNotifications) {
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

          const amountRemoved = _removeResources(amountToRemove, storage);

          amountLeftToRemove = Math.max(amountLeftToRemove - amountRemoved, 0);

          if (notificationConfig.logProductionNotifications) {
            logInfo(` - Consumed ${amountRemoved} units of ${resourceType}`);
          }
        });
      }
    });
  } else {
    if (notificationConfig.logProductionNotifications) {
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
        const amountAdded = _addResources(amountToAdd, storage);

        amountLeftToAdd = Math.max(amountLeftToAdd - amountAdded, 0);
      });

      if (notificationConfig.logProductionNotifications) {
        logSuccess(` - Produced ${outputAmount} ${outputResource}`);
      }

      if (availableCapacity <= outputAmount) {
        if (notificationConfig.logProductionNotifications) {
          logWarning(` - Output storage is full. Production paused`);
        }

        canProcess = false;
      }
    });
  }

  return canProcess;
};

// .. eventually, this method will allow the transfer of many different types of cargo in one call
// .. (e.g. trains with different cargo types) but this is (very) complicated to do
// so for now - we'll just transfer everything
export const transferResources = (
  state: IWorldState,
  amount: number,
  resourceType: RESOURCE_TYPE,
  fromStorage: IStorage[],
  toStorage: IStorage[],
): StorageTransferResult => {
  if (notificationConfig.logStorageNotifications) {
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
    notificationConfig.logStorageNotifications
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
    notificationConfig.logStorageNotifications
  ) {
    logWarning(
      `[STORAGE WARNING] Not enough space available to transfer - only ${matchingDestinationAvailableCapacity} ... we'll transfer what we can`,
    );
  }

  let result = StorageTransferResult.SUCCESS;
  let amountLeftToTransfer = amount;

  matchingSourceStorage.forEach((source) => {
    if (source.resourceCount <= 0) {
      result = StorageTransferResult.SOURCE_EMPTY;
      return;
    }

    if (amountLeftToTransfer > 0) {
      if (notificationConfig.logStorageNotifications) {
        logInfo(` - We have ${amountLeftToTransfer} left to transfer`);
      }

      const availableToTransfer = Math.min(
        source.resourceCount,
        amountLeftToTransfer,
      );

      if (notificationConfig.logStorageNotifications) {
        logInfo(` - Theres ${availableToTransfer} in this box`);
      }

      matchingDestinationStorage.forEach((destination) => {
        const availableCapacity =
          destination.resourceCapacity - destination.resourceCount;

        if (availableCapacity <= 0) {
          result = StorageTransferResult.DESTINATION_FULL;
          return;
        }

        const amountToTransfer = Math.min(
          availableCapacity,
          availableToTransfer,
        );

        if (notificationConfig.logStorageNotifications) {
          logInfo(
            ` - The box we want to put it in can take ${availableCapacity}, so we'll move ${amountToTransfer}`,
          );
        }

        _removeResources(amountToTransfer, source);
        source.transferEvents.push({
          entityId: source.ownerId,
          tick: state.currentTick,
          amount: amountToTransfer,
        });
        _addResources(amountToTransfer, destination);
        destination.transferEvents.push({
          entityId: source.ownerId,
          tick: state.currentTick,
          amount: amountToTransfer,
        });

        amountLeftToTransfer -= amountToTransfer;
        amountLeftToTransfer = Math.max(amountLeftToTransfer, 0);
      });
    }
  });

  if (amountLeftToTransfer > 0) {
    if (notificationConfig.logStorageNotifications) {
      logWarning(
        `[STORAGE WARNING] We couldn't transfer everything, still have ${amountLeftToTransfer} left to go`,
      );
    }
  }

  return result;
};

const _addResources = (amount: number, to: IStorage) => {
  if (to.resourceCount + amount > to.resourceCapacity) {
    if (notificationConfig.logStorageNotifications) {
      logWarning(
        `[STORAGE WARNING] Too full of ${to.resourceType} to add ${amount}`,
      );
    }
  }

  const amountToAdd = Math.min(amount, to.resourceCapacity - to.resourceCount);
  to.resourceCount += amountToAdd;

  if (notificationConfig.logStorageNotifications) {
    logSuccess(`[STORAGE] Added ${amountToAdd} ${to.resourceType}`);
  }

  return amountToAdd;
};

const _removeResources = (amount: number, from: IStorage) => {
  if (from.resourceCount < amount) {
    if (notificationConfig.logStorageNotifications) {
      logWarning(
        `[STORAGE WARNING] Not enough ${from.resourceType} to remove ${amount}`,
      );
    }
  }

  const amountToRemove = Math.min(from.resourceCount, amount);
  from.resourceCount -= amountToRemove;

  if (notificationConfig.logStorageNotifications) {
    logSuccess(`[STORAGE] Removed ${amountToRemove} ${from.resourceType}`);
  }

  return amountToRemove;
};

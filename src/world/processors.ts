import { randomUUID } from "crypto";
import { IProcessor } from "../entities/location";
import {
  addResources,
  createAndGetStorage,
  createRecipeStorage,
  getInputStorage,
  getOutputStorage,
  getResourceStorage,
  IRecipe,
  IStorage,
  processRecipe,
  RESOURCE_TYPE,
} from "../entities/storage";
import { findClosestSupplier } from "../utils";
import {
  completeContract,
  createContract,
  getResourceContract,
  removeOwnedContracts,
} from "./contracts";
import { IWorldState } from "./state";
import { loadNotificationConfig, notify } from "../notifications";

const notificationConfig = loadNotificationConfig();

export const createProcessor = (
  state: IWorldState,
  name: string,
  position: number,
  recipe: IRecipe,
  minInputThreshold: number,
  inputCapacity: number,
  outputCapacity: number,
  startWithFullInputs: boolean = false,
  startWithFullOutputs: boolean = false,
) => {
  if (!recipe.inputs) {
    throw Error(
      `[CRITICAL SYSTEM ERROR] Processors require at least one input`,
    );
  }
  if (!recipe.outputs) {
    throw Error(
      `[CRITICAL SYSTEM ERROR] Processors require at least one output`,
    );
  }

  const storage = createRecipeStorage(
    recipe,
    inputCapacity,
    outputCapacity,
    startWithFullInputs,
    startWithFullOutputs,
  );

  const newProcessor: IProcessor = {
    id: randomUUID(),
    name,
    position,
    storage,
    recipe,
    minInputThreshold,
  };

  state.processors.push(newProcessor);
};

export const updateProcessors = (state: IWorldState) => {
  state.processors.forEach((processor) => {
    // .. check to see if any contracts have been fulfilled
    Object.entries(processor.recipe.inputs ?? {}).forEach(
      ([resourceType, _]) => {
        const resourceContract = getResourceContract(
          state,
          processor.id,
          resourceType as RESOURCE_TYPE,
        );

        const inputStorage = getResourceStorage(
          resourceType as RESOURCE_TYPE,
          processor.storage,
        );
        const inputStorageCount = inputStorage
          .map((s) => s.resourceCount)
          .reduce((c, v) => c + v);

        if (
          resourceContract &&
          inputStorageCount >= processor.minInputThreshold
        ) {
          completeContract(state, resourceContract);
        }
      },
    );

    // .. check to see if the output is full (we wont try to produce anything if we're already full)
    const outputStorage = getOutputStorage(processor.recipe, processor.storage);
    const outputStorageCapacity = outputStorage
      .map((s) => s.resourceCapacity)
      .reduce((c, v) => c + v);
    const outputStorageCount = outputStorage
      .map((s) => s.resourceCount)
      .reduce((c, v) => c + v);

    if (outputStorageCount >= outputStorageCapacity) {
      if (notificationConfig.showProcessorNotifications) {
        notify.warning(`${processor.name} is full and can't produce any more`);
      }
    } else {
      const inputStorage = getInputStorage(processor.recipe, processor.storage);
      const inputStorageCount = inputStorage
        .map((s) => s.resourceCount)
        .reduce((a, c) => a + c);

      if (processRecipe(processor.recipe, processor.storage)) {
        const recipeInputs = Object.entries(processor.recipe.inputs ?? {});
        const recipeInputsString = recipeInputs
          .map(([resource, amount]) => `${amount} units of ${resource}`)
          .join(", ");

        const recipeOutputs = Object.entries(processor.recipe.outputs ?? {});
        const recipeOutputsString = recipeOutputs
          .map(([resource, amount]) => `${amount} units of ${resource}`)
          .join(", ");

        if (notificationConfig.showProcessorNotifications) {
          notify.success(
            `${processor.name} processed ${recipeInputsString} to produce ${recipeOutputsString} and has ${inputStorageCount} left`,
          );
        }
      } else {
        Object.entries(processor.recipe.inputs ?? {}).map(
          ([resourceType, _]) => {
            const inputStorage = getResourceStorage(
              resourceType as RESOURCE_TYPE,
              processor.storage,
            );
            const inputStorageCount = inputStorage
              .map((s) => s.resourceCount)
              .reduce((c, v) => c + v);

            const resourceContract = getResourceContract(
              state,
              processor.id,
              resourceType as RESOURCE_TYPE,
            );

            if (inputStorageCount < processor.minInputThreshold) {
              if (!resourceContract) {
                if (notificationConfig.showProcessorNotifications) {
                  notify.warning(
                    `[PROCESSOR WARNING] ${processor.name} doesn't have enough ${inputStorage[0].resourceType} ${inputStorageCount > 0 ? `(only ${inputStorageCount} available) ` : ""}- so we'll create a contract`,
                  );
                }

                const closestSupplier = findClosestSupplier(
                  processor,
                  inputStorage[0].resourceType,
                  [...state.consumers, ...state.processors, ...state.producers],
                );

                if (!closestSupplier) {
                  if (notificationConfig.showProcessorNotifications) {
                    notify.error(
                      `[PROCESSOR ERROR] No nearby suppliers to resupply ${processor.name}`,
                    );
                  }
                } else {
                  // .. if there's literally NO STOCK left, we need to create an URGENT contract (due sooner, more needs to be transported)
                  createContract(
                    state,
                    processor,
                    closestSupplier,
                    inputStorage[0].resourceType,
                    Math.ceil(processor.minInputThreshold * 1.5),
                    100,
                    10,
                  );
                }
              } else if (!resourceContract.shipper) {
                notify.error(
                  `[PROCESSOR ERROR] ${processor.name} was unable to create a contract because one already exists and is NOT being shipped`,
                );
              }
            }
          },
        );
      }
    }
  });
};

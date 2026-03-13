import { IProcessor, LOCATION_TYPE } from "../../entities/locations/location";
import { IRecipe, RESOURCE_TYPE } from "../../entities/storage";
import { createBaseLocation, replenishInputStorage } from "./locations";
import { getContractByResource } from "../contracts";
import { loadNotificationConfig } from "../../notifications";
import { logWarning, logSuccess } from "../../utils/logUtils";
import { IWorldState } from "../../entities/world";
import {
  getResourceStorage,
  getOutputStorage,
  getInputStorage,
  processRecipe,
} from "../storages";

const notificationConfig = loadNotificationConfig();

export const createProcessor = (
  state: IWorldState,
  name: string,
  companyId: string,
  position: number,
  recipe: IRecipe,
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

  const newProcessor: IProcessor = {
    ...createBaseLocation(
      name,
      companyId,
      position,
      recipe,
      LOCATION_TYPE.PROCESSOR,
      startWithFullInputs,
      startWithFullOutputs,
    ),
  };

  state.processors.push(newProcessor);
};

export const updateProcessors = (state: IWorldState) => {
  state.processors.forEach((processor) => {
    // .. check to see if any contracts have been fulfilled
    Object.keys(processor.recipe.inputs ?? []).forEach((resourceType) => {
      const resourceContract = getContractByResource(
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
      const inputStorageCapacity = inputStorage
        .map((s) => s.resourceCapacity)
        .reduce((c, v) => c + v);

      /* if (
        resourceContract &&
        inputStorageCount >= inputStorageCapacity * 0.25
      ) {
        completeContract(state, resourceContract);
      } */
    });

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
        logWarning(`${processor.name} is full and can't produce any more`);
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
          logSuccess(
            `${processor.name} processed ${recipeInputsString} to produce ${recipeOutputsString} and has ${inputStorageCount} left`,
          );
        }
      } else {
        replenishInputStorage(state, processor);
      }
    }
  });
};

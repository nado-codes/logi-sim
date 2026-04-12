import {
  IProcessor,
  LOCATION_TYPE,
  IRecipe,
  RESOURCE_TYPE,
  logWarning,
  logSuccess,
} from "@logisim/lib";
import { createBaseLocation, checkInputStorage } from "./locations";
import { getContractByResource } from "../contracts";
import { loadNotificationConfig } from "../../notifications";
import { IWorldState } from "@logisim/lib";
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
      LOCATION_TYPE.Processor,
      startWithFullInputs,
      startWithFullOutputs,
    ),
  };

  state.processors.push(newProcessor);
};

export const updateProcessors = (state: IWorldState) => {
  state.processors.forEach((processor) => {
    checkInputStorage(state, processor);

    // .. check to see if the output is full (we wont try to produce anything if we're already full)
    const outputStorage = getOutputStorage(processor.recipe, processor.storage);
    const outputStorageCapacity = outputStorage
      .map((s) => s.resourceCapacity)
      .reduce((c, v) => c + v);
    const outputStorageCount = outputStorage
      .map((s) => s.resourceCount)
      .reduce((c, v) => c + v);

    if (outputStorageCount >= outputStorageCapacity) {
      if (notificationConfig.logProcessorNotifications) {
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

        if (notificationConfig.logProcessorNotifications) {
          logSuccess(
            `${processor.name} processed ${recipeInputsString} to produce ${recipeOutputsString} and has ${inputStorageCount} left`,
          );
        }
      }
    }
  });
};

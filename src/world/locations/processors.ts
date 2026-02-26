import { randomUUID } from "crypto";
import { IProcessor, LOCATION_TYPE } from "../../entities/location";
import {
  createRecipeStorage,
  getInputStorage,
  getOutputStorage,
  getResourceStorage,
  IRecipe,
  processRecipe,
  RESOURCE_TYPE,
} from "../../entities/storage";
import { replenishInputStorage } from "./locations";
import { completeContract, getContractByResource } from "../contracts";
import { IWorldState } from "../state";
import { loadNotificationConfig } from "../../notifications";
import { logWarning, logSuccess } from "../../utils";

const notificationConfig = loadNotificationConfig();

export const createProcessor = (
  state: IWorldState,
  companyId: string,
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
    companyId,
    type: LOCATION_TYPE.PROCESSOR,
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
        replenishInputStorage(state, processor, processor.minInputThreshold);
      }
    }
  });
};

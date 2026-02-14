import { randomUUID } from "crypto";
import { IProcessor } from "../entities/location";
import {
  addResources,
  createAndGetStorage,
  getInputStorage,
  getOutputStorage,
  IRecipe,
  IStorage,
  processRecipe,
  RESOURCE_TYPE,
} from "../entities/storage";
import { findClosestSupplier } from "../utils";
import { createContract, removeOwnedContracts } from "./contracts";
import { IWorldState } from "./state";

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
    throw Error(`[ERROR] Processors require at least one input`);
  }

  const inputStorage: IStorage[] = Object.entries(recipe.inputs).map(([r, _]) =>
    createAndGetStorage(r as RESOURCE_TYPE, inputCapacity),
  );

  if (startWithFullInputs) {
    inputStorage.forEach((storage) => {
      addResources(storage.resourceCapacity, storage);
    });
  }

  if (!recipe.outputs) {
    throw Error(`[ERROR] Processors require at least one output`);
  }

  const outputStorage: IStorage[] = Object.entries(recipe.outputs).map(
    ([r, _]) => createAndGetStorage(r as RESOURCE_TYPE, outputCapacity),
  );

  if (startWithFullOutputs) {
    outputStorage.forEach((storage) => {
      addResources(storage.resourceCapacity, storage);
    });
  }

  const newProcessor: IProcessor = {
    id: randomUUID(),
    name,
    position,
    storage: [...inputStorage, ...outputStorage],
    recipe,
    minInputThreshold,
  };

  state.processors.push(newProcessor);
};

export const updateProcessors = (state: IWorldState) => {
  state.processors.forEach((processor) => {
    if (processRecipe(processor.recipe, processor.storage)) {
      if (!processor.recipe.inputs) {
        throw Error(`[PROCESSOR ERROR] Processors require at least one input`);
      }

      const recipeInputs = Object.entries(processor.recipe.inputs);
      const recipeInputsString = recipeInputs
        .map(([resource, amount]) => `${amount} units of ${resource}`)
        .join(", ");

      if (!processor.recipe.outputs) {
        throw Error(`[PROCESSOR ERROR] Processors require at least one output`);
      }

      const recipeOutputs = Object.entries(processor.recipe.outputs);
      const recipeOutputsString = recipeOutputs
        .map(([resource, amount]) => `${amount} units of ${resource}`)
        .join(", ");

      const inputStorage = getInputStorage(processor.recipe, processor.storage);
      const inputStorageCount = inputStorage
        .map((s) => s.resourceCount)
        .reduce((a, c) => a + c);

      console.log(
        `${processor.name} processed ${recipeInputsString} to produce ${recipeOutputsString} and has ${inputStorageCount} left`,
      );
    } else {
      const inputStorage = getInputStorage(processor.recipe, processor.storage);
      const inputStorageCount = inputStorage
        .map((s) => s.resourceCount)
        .reduce((c, v) => c + v);

      // .. PROCESSING FAILED
      // .. check if the inputs are empty or not enough and create contracts
      if (
        inputStorageCount < processor.minInputThreshold &&
        !state.contracts.find((c) => c.owner === processor)
      ) {
        console.log(
          `[PROCESSOR WARNING] ${processor.name} doesn't have enough ${inputStorage[0].resourceType} ${inputStorageCount > 0 ? `(only ${inputStorageCount} available) ` : ""}- so we'll create a contract`,
        );

        const closestSupplier = findClosestSupplier(
          processor,
          inputStorage[0].resourceType,
          [...state.consumers, ...state.processors, ...state.producers],
        );

        if (!closestSupplier) {
          console.log(
            `[PROCESSOR ERROR] No nearby suppliers to resupply ${processor.name}`,
          );
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
      }

      if (inputStorageCount >= processor.minInputThreshold) {
        removeOwnedContracts(state, processor.id);
      }

      // .. check if the output is full
      const outputStorage = getOutputStorage(
        processor.recipe,
        processor.storage,
      );
      const outputStorageCapacity = outputStorage
        .map((s) => s.resourceCapacity)
        .reduce((c, v) => c + v);
      const outputStorageCount = outputStorage
        .map((s) => s.resourceCount)
        .reduce((c, v) => c + v);

      if (outputStorageCount > outputStorageCapacity) {
        console.log(`${processor.name} is full and can't produce any more`);
      }
    }
  });
};

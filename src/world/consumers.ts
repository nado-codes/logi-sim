import { randomUUID } from "crypto";
import { IConsumer } from "../entities/location";
import {
  RESOURCE_TYPE,
  createAndGetStorage,
  processRecipe,
  getInputStorage,
} from "../entities/storage";
import { findClosestSupplier } from "../utils";
import { createContract } from "./contracts";
import { IWorldState } from "./state";

export const createConsumer = (
  state: IWorldState,
  name: string,
  position: number,
  consumes: RESOURCE_TYPE,
  consumptionRate: number,
  minStockThreshold: number,
  maxStock: number,
  currentStock?: number,
) => {
  const newConsumer: IConsumer = {
    id: randomUUID(),
    name,
    position,
    storage: [createAndGetStorage(consumes, maxStock, currentStock)],
    recipe: { inputs: { [consumes]: consumptionRate } },
    minInputThreshold: minStockThreshold,
  };

  state.consumers.push(newConsumer);
};

export const updateConsumers = (state: IWorldState) => {
  state.consumers.forEach((consumer) => {
    processRecipe(consumer.recipe, consumer.storage);

    const inputStorage = getInputStorage(consumer.recipe, consumer.storage);
    const inputStorageCount = inputStorage
      .map((s) => s.resourceCount)
      .reduce((c, v) => c + v);

    if (inputStorageCount < consumer.minInputThreshold) {
      const closestSupplier = findClosestSupplier(
        consumer,
        inputStorage[0].resourceType,
        [...state.consumers, ...state.processors, ...state.producers],
      );

      if (!closestSupplier) {
        console.log(
          `[CONSUMER ERROR] No nearby suppliers to resupply ${consumer.name}`,
        );
      } else if (!state.contracts.find((c) => c.owner === consumer)) {
        if (inputStorageCount <= 0) {
          // .. consumption straight up failed because we literally have NOTHING
          // .. we need to create an URGENT contract
          // MVP: just create a normal contract
          createContract(
            state,
            consumer,
            closestSupplier,
            inputStorage[0].resourceType,
            Math.ceil(consumer.minInputThreshold * 1.5),
            100,
            10,
          );
        } else {
          // .. create a normal contract

          createContract(
            state,
            consumer,
            closestSupplier,
            inputStorage[0].resourceType,
            Math.ceil(consumer.minInputThreshold * 1.5),
            100,
            10,
          );
        }
      }
    } else {
      // .. consumed successfully
    }
  });
};

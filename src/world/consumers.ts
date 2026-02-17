import { randomUUID } from "crypto";
import { IConsumer } from "../entities/location";
import {
  RESOURCE_TYPE,
  createAndGetStorage,
  processRecipe,
  getInputStorage,
  getResourceStorage,
} from "../entities/storage";
import { findClosestSupplier } from "../utils";
import { createContract } from "./contracts";
import { IWorldState } from "./state";
import { loadNotificationConfig, notify } from "../notifications";

const notifConfig = loadNotificationConfig();

export const createConsumer = (
  state: IWorldState,
  name: string,
  position: number,
  consumes: RESOURCE_TYPE,
  consumptionRate: number,
  minStockThreshold: number,
  maxStock: number,
  startFull: boolean,
) => {
  const newConsumer: IConsumer = {
    id: randomUUID(),
    name,
    position,
    storage: [
      createAndGetStorage(consumes, maxStock, startFull ? maxStock : 0),
    ],
    recipe: { inputs: { [consumes]: consumptionRate } },
    minInputThreshold: minStockThreshold,
  };

  state.consumers.push(newConsumer);
};

export const updateConsumers = (state: IWorldState) => {
  state.consumers.forEach((consumer) => {
    if (processRecipe(consumer.recipe, consumer.storage)) {
    } else {
      Object.entries(consumer.recipe.inputs ?? {}).forEach(
        ([resourceType, requiredAmount]) => {
          const inputStorage = getResourceStorage(
            resourceType as RESOURCE_TYPE,
            consumer.storage,
          );
          const inputStorageCount = inputStorage
            .map((s) => s.resourceCount)
            .reduce((c, v) => c + v);

          if (inputStorageCount < requiredAmount) {
            if (notifConfig.showConsumerNotifications) {
              notify.warning(
                `${consumer.name} is running low on ${resourceType} (Only ${inputStorageCount} available) - so we'll create a contract`,
              );
            }

            const closestSupplier = findClosestSupplier(
              consumer,
              inputStorage[0].resourceType,
              [...state.consumers, ...state.processors, ...state.producers],
            );

            if (!closestSupplier) {
              notify.error(
                ` - Unable to create contract: No nearby suppliers to resupply ${consumer.name}`,
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
            notify.error(
              `[CONSUMER ERROR] ${consumer.name} was unable to consume anything due to an unknown error`,
            );
          }
        },
      );
    }
  });
};

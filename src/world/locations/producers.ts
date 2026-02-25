import { randomUUID } from "crypto";
import { IProducer, LOCATION_TYPE } from "../../entities/location";
import {
  RESOURCE_TYPE,
  createAndGetStorage,
  getOutputStorage,
  getResourceCapacity,
  getResourceCount,
  processRecipe,
} from "../../entities/storage";
import { IWorldState } from "../state";
import { loadNotificationConfig } from "../../notifications";
import { logWarning, logSuccess, logError, logInfo } from "../../utils";

const notificationConfig = loadNotificationConfig();

export const createProducer = (
  state: IWorldState,
  name: string,
  position: number,
  produces: RESOURCE_TYPE,
  productionRate: number,
  maxStock: number,
  currentStock?: number,
) => {
  const newProducer: IProducer = {
    id: randomUUID(),
    type: LOCATION_TYPE.PRODUCER,
    name,
    position,
    recipe: { outputs: { [produces]: productionRate } },
    storage: [createAndGetStorage(produces, maxStock, currentStock)],
    productionRate,
    currentStock: currentStock ?? 0,
    maxStock,
  };

  state.producers.push(newProducer);
};

export const updateProducers = (state: IWorldState) => {
  state.producers.forEach((producer) => {
    if (
      Object.entries(
        producer.recipe.outputs ??
          ({} as Partial<Record<RESOURCE_TYPE, number>>),
      ).length > 1
    ) {
      throw Error(
        `[CRITICAL PRODUCER ERROR] Producers currently only support one output`,
      );
    } else if (!producer.recipe.outputs) {
      throw Error(
        `[CRITICAL PRODUCER ERROR] Producers require at least one output`,
      );
    }

    const resourceType = Object.keys(
      producer.recipe.outputs,
    )[0] as RESOURCE_TYPE;
    const productionRate = Object.values(producer.recipe.outputs)[0];

    const outputStorage = getOutputStorage(producer.recipe, producer.storage);
    const outputStorageCapacity = getResourceCapacity(
      resourceType,
      outputStorage,
    );
    const outputStorageCount = getResourceCount(resourceType, outputStorage);

    if (outputStorageCount >= outputStorageCapacity) {
      if (notificationConfig.showProducerNotifications) {
        logWarning(
          `${producer.name} is full and can't produce any more ${resourceType}`,
        );
      }
    } else {
      if (processRecipe(producer.recipe, producer.storage)) {
        const outputStorageCount = getResourceCount(
          resourceType,
          outputStorage,
        );

        if (notificationConfig.showProducerNotifications) {
          logSuccess(
            `${producer.name} produced ${productionRate} ${resourceType} and has ${outputStorageCount} available`,
          );
        }
      } else {
        if (outputStorageCount > outputStorageCapacity - productionRate) {
          if (notificationConfig.showProducerNotifications) {
            logWarning(
              `${producer.name} is full and can't produce any more ${resourceType}`,
            );
          }
        } else {
          logError(
            `[PRODUCER ERROR] ${producer.name} was unable to produce anything due to an unknown error`,
          );
          logInfo(
            ` - Output Storage has ${outputStorageCount} ${resourceType}`,
          );
          logInfo(` - Output Storage can store ${outputStorageCapacity}`);
        }
      }
    }
  });
};

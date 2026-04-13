import { LOCATION_TYPE, IRecipe, RESOURCE_TYPE } from "@logisim/lib";
import { loadNotificationConfig } from "../../notifications";
import { createBaseLocation } from "./locations";
import { IWorldState } from "@logisim/lib";
import {
  getOutputStorage,
  getResourceCapacity,
  getResourceCount,
  processRecipe,
} from "../storages";
import {
  logWarning,
  logSuccess,
  logError,
  logInfo,
} from "@logisim/lib/src/utils/logUtils";

const notificationConfig = loadNotificationConfig();

export const createProducer = (
  state: IWorldState,
  name: string,
  companyId: string,
  position: number,
  produces: RESOURCE_TYPE,
  productionRate: number,
  startFull: boolean = false,
) => {
  const recipe: IRecipe = { outputs: { [produces]: productionRate } };

  const newProducer = createBaseLocation(
    name,
    companyId,
    position,
    recipe,
    LOCATION_TYPE.Producer,
    false,
    startFull,
  );

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
      if (notificationConfig.logProducerNotifications) {
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

        if (notificationConfig.logProducerNotifications) {
          logSuccess(
            `${producer.name} produced ${productionRate} ${resourceType} and has ${outputStorageCount} available`,
          );
        }
      } else {
        if (outputStorageCount > outputStorageCapacity - productionRate) {
          if (notificationConfig.logProducerNotifications) {
            logWarning(
              `${producer.name} is full and can't produce any more ${resourceType}`,
            );
          }
        } else {
          if (notificationConfig.logProducerNotifications) {
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
    }
  });
};

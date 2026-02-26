import { randomUUID } from "crypto";
import { IConsumer, LOCATION_TYPE } from "../../entities/location";
import {
  RESOURCE_TYPE,
  createAndGetStorage,
  processRecipe,
} from "../../entities/storage";
import { replenishInputStorage } from "./locations";
import { IWorldState } from "../state";
import { loadNotificationConfig } from "../../notifications";

const notifConfig = loadNotificationConfig();

export const createConsumer = (
  state: IWorldState,
  companyId: string,
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
    type: LOCATION_TYPE.CONSUMER,
    companyId,
    name,
    position,
    storage: [
      createAndGetStorage(
        consumes,
        maxStock,
        startFull === true ? maxStock : 0,
      ),
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
      replenishInputStorage(state, consumer, consumer.minInputThreshold);
    }
  });
};

import { randomUUID } from "crypto";
import { IConsumer } from "../entities/location";
import {
  RESOURCE_TYPE,
  createAndGetStorage,
  processRecipe,
} from "../entities/storage";
import { replenishInputStorage } from "./locations";
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
      replenishInputStorage(state, consumer, consumer.minInputThreshold);
    }
  });
};

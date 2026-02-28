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
import { generateId } from "../../entities/entity";

export const createConsumer = (
  state: IWorldState,
  name: string,
  companyId: string,
  position: number,
  consumes: RESOURCE_TYPE,
  consumptionRate: number,
  minInputThreshold: number,
  maxStock: number,
  startFull: boolean,
) => {
  const newConsumer = {
    companyId,
    id: generateId(),
    name,
    type: LOCATION_TYPE.CONSUMER,
    position,
    storage: [
      createAndGetStorage(
        consumes,
        maxStock,
        startFull === true ? maxStock : 0,
      ),
    ],
    recipe: { inputs: { [consumes]: consumptionRate } },
    minInputThreshold,
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

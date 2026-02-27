import { randomUUID } from "crypto";
import { Consumer, LOCATION_TYPE } from "../../entities/location";
import {
  RESOURCE_TYPE,
  createAndGetStorageUnsafe,
  processRecipe,
} from "../../entities/storage";
import { replenishInputStorage } from "./locations";
import { IWorldState } from "../state";
import { loadNotificationConfig } from "../../notifications";
import { createCompanyEntity } from "../../entities/entity";

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
  const newConsumer = createCompanyEntity(
    {
      name,
      type: LOCATION_TYPE.CONSUMER,
      position,
      storage: [
        createAndGetStorageUnsafe(
          consumes,
          maxStock,
          startFull === true ? maxStock : 0,
        ),
      ],
      recipe: { inputs: { [consumes]: consumptionRate } },
      minInputThreshold,
    },
    companyId,
  );

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

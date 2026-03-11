import { IBaseConsumer } from "../../../entities/locations/consumer";
import { LOCATION_TYPE } from "../../../entities/locations/location";
import {
  RESOURCE_TYPE,
  ResourceMap,
  createAndGetStorage,
  processRecipe,
} from "../../../entities/storage";
import { IWorldState } from "../../../entities/world";
import { createBaseLocation, replenishInputStorage } from "../locations";

export const createBaseConsumer = (
  state: IWorldState,
  name: string,
  companyId: string,
  position: number,
  consumes: ResourceMap,
  minInputThreshold: number,
  maxStock: number,
  startFull: boolean,
) => {
  const storage = Object.entries(consumes).map(([resource]) =>
    createAndGetStorage(
      resource as RESOURCE_TYPE,
      maxStock,
      startFull === true ? maxStock : 0,
    ),
  );

  const newConsumer = {
    ...createBaseLocation(
      name,
      companyId,
      position,
      storage,
      { inputs: consumes },
      LOCATION_TYPE.CONSUMER,
    ),
    minInputThreshold,
  };

  return newConsumer;
};

export const updateBaseConsumer = (
  state: IWorldState,
  consumer: IBaseConsumer,
) => {
  if (!processRecipe(consumer.recipe, consumer.storage)) {
    replenishInputStorage(state, consumer);
  }
};

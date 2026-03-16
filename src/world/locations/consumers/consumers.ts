import { IBaseConsumer } from "../../../entities/locations/consumer";
import { LOCATION_TYPE } from "../../../entities/locations/location";
import { ResourceMap } from "../../../entities/storage";
import { IWorldState } from "../../../entities/world";
import { processRecipe } from "../../storages";
import { createBaseLocation, checkInputStorage } from "../locations";

export const createBaseConsumer = (
  name: string,
  companyId: string,
  position: number,
  consumes: ResourceMap,
  startFull: boolean,
) => {
  const newConsumer = createBaseLocation(
    name,
    companyId,
    position,
    { inputs: consumes },
    LOCATION_TYPE.CONSUMER,
    startFull,
  );

  return newConsumer;
};

export const updateBaseConsumer = (
  state: IWorldState,
  consumer: IBaseConsumer,
) => {
  processRecipe(consumer.recipe, consumer.storage);
  checkInputStorage(state, consumer);
};

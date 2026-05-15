import {
  ResourceMap,
  LOCATION_TYPE,
  IWorldState,
  IBaseConsumer,
  Pos3D,
} from "@logisim/lib/entities";
import { processRecipe } from "../../storages";
import { createLocation, checkInputStorage } from "../locations";

export const createBaseConsumer = (
  name: string,
  companyId: string,
  position: Pos3D,
  consumes: ResourceMap,
  startFull: boolean,
) => {
  const newConsumer = createLocation(
    name,
    companyId,
    position,
    { inputs: consumes },
    LOCATION_TYPE.Consumer,
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

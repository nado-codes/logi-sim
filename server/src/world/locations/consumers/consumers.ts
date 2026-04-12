import { IBaseConsumer } from "@logisim/lib";
import { LOCATION_TYPE } from "@logisim/lib";
import { ResourceMap } from "@logisim/lib";
import { IWorldState } from "@logisim/lib";
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

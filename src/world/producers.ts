import { randomUUID } from "crypto";
import { IProducer } from "../entities/location";
import {
  RESOURCE_TYPE,
  createAndGetStorage,
  getOutputStorage,
  getResourceCapacity,
  getResourceCount,
  processRecipe,
} from "../entities/storage";
import { IWorldState } from "./state";

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
        `[PRODUCER ERROR] Producers currently only support one output`,
      );
    } else if (!producer.recipe.outputs) {
      throw Error(`[PRODUCER ERROR] Producers require at least one output`);
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

    if (processRecipe(producer.recipe, producer.storage)) {
      const outputStorageCount = getResourceCount(resourceType, outputStorage);
      console.log(
        `${producer.name} produced ${productionRate} ${resourceType} and has ${outputStorageCount} available`,
      );
    } else {
      const outputStorageCount = getResourceCount(resourceType, outputStorage);
      console.log(
        `${producer.name} has ${outputStorageCount} ${resourceType} with a capacity of ${outputStorageCapacity}`,
      );
      if (outputStorageCount >= outputStorageCapacity) {
        console.log(
          `${producer.name} is full and can't produce any more ${resourceType}`,
        );
      } else {
        console.error(
          `[PRODUCER ERROR] ${producer.name} was unable to produce anything due to an unknown error`,
        );
      }
    }
  });
};

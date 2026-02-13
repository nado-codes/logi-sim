import {
  IConsumer,
  LOCATION_TYPE,
  IProcessor,
  IProducer,
  IBaseLocation,
} from "./entities/location";
import readline from "readline";
import { IContract } from "./entities/contract";
import { randomUUID } from "crypto";
import { Truck as ITruck } from "./entities/truck";
import {
  addResources,
  getInputStorage,
  getOutputStorage,
  getResourceCapacity,
  getResourceCount,
  IRecipe,
  IStorage,
  processRecipe,
  removeResources,
  RESOURCE_TYPE,
} from "./entities/storage";

// Creating locations

console.log("Logi sim starting...");
console.log("LogiSim v1.0 10-02-26");

let producers: IProducer[] = [];
let processors: IProcessor[] = [];
let consumers: IConsumer[] = [];
let contracts: IContract[] = [];
let trucks: ITruck[] = [];

// .. CREATE

const createAndGetStorage = (
  resourceType: RESOURCE_TYPE,
  resourceCapacity: number,
  resourceCount?: number,
): IStorage => {
  const newStorage: IStorage = {
    id: randomUUID(),
    resourceType,
    resourceCapacity,
    resourceCount: resourceCount ?? 0,
  };

  return newStorage;
};
const createProducer = (
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

  producers.push(newProducer);
};
const createProcessor = (
  name: string,
  position: number,
  recipe: IRecipe,
  minInputThreshold: number,
) => {
  if (!recipe.inputs) {
    throw Error(`[ERROR] Processors require at least one input`);
  }

  const inputStorage: IStorage[] = Object.entries(recipe.inputs).map(([r, _]) =>
    createAndGetStorage(r as RESOURCE_TYPE, 25),
  );

  if (!recipe.outputs) {
    throw Error(`[ERROR] Processors require at least one output`);
  }

  const outputStorage: IStorage[] = Object.entries(recipe.outputs).map(
    ([r, _]) => createAndGetStorage(r as RESOURCE_TYPE, 25),
  );

  const newProcessor: IProcessor = {
    id: randomUUID(),
    name,
    position,
    storage: [...inputStorage, ...outputStorage],
    recipe,
    minInputThreshold,
  };

  processors.push(newProcessor);
};
const createConsumer = (
  name: string,
  position: number,
  consumes: RESOURCE_TYPE,
  consumptionRate: number,
  minStockThreshold: number,
  maxStock: number,
  currentStock?: number,
) => {
  const newConsumer: IConsumer = {
    id: randomUUID(),
    name,
    position,
    storage: [createAndGetStorage(consumes, maxStock, currentStock)],
    recipe: { inputs: { [consumes]: consumptionRate } },
    minInputThreshold: minStockThreshold,
  };

  consumers.push(newConsumer);
};

const createContract = (
  owner: string,
  supplier: string,
  resource: RESOURCE_TYPE,
  amount: number,
  payment: number,
  dueTicks: number,
) => {
  const newContract: IContract = {
    id: randomUUID(),
    owner,
    supplier,
    shipper: undefined,
    resource,
    amount,
    payment,
    dueTicks,
  };

  console.log("Created contract: ", newContract);

  contracts.push(newContract);
};

const createTruck = (
  resourceType: RESOURCE_TYPE,
  resourceCapacity: number,
  position: number,
  speed: number,
  resourceCount?: number,
) => {
  const newTruck: ITruck = {
    id: randomUUID(),
    storage: createAndGetStorage(resourceType, resourceCapacity, resourceCount),
    position,
    speed,
  };

  trucks.push(newTruck);
};

// .. UPDATE
const updateProducers = () => {
  producers.forEach((producer) => {
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

const findClosestSupplier = (
  destination: IBaseLocation,
  resourceType: RESOURCE_TYPE,
): IBaseLocation | undefined => {
  const suppliers = [...producers, ...processors, ...consumers].filter((s) => {
    const hasResources = s.storage.some(
      (st) => st.resourceType == resourceType && st.resourceCount > 0,
    );
    return hasResources && s.id !== destination.id;
  });

  if (suppliers.length == 0) {
    return undefined;
  }

  let closest = suppliers[0];
  let closestDistance = Math.abs(destination.position - closest.position);

  for (const supplier of suppliers) {
    const distance = Math.abs(destination.position - supplier.position);

    if (distance < closestDistance) {
      closest = supplier;
      closestDistance = distance;
    }
  }

  return closest;
};

const updateProcessors = () => {
  processors.forEach((processor) => {
    if (processRecipe(processor.recipe, processor.storage)) {
      if (!processor.recipe.inputs) {
        throw Error(`[PROCESSOR ERROR] Processors require at least one input`);
      }

      const recipeInputs = Object.entries(processor.recipe.inputs);
      const recipeInputsString = recipeInputs
        .map(([resource, amount]) => `${amount} units of ${resource}`)
        .join(", ");

      if (!processor.recipe.outputs) {
        throw Error(`[PROCESSOR ERROR] Processors require at least one output`);
      }

      const recipeOutputs = Object.entries(processor.recipe.outputs);
      const recipeOutputsString = recipeOutputs
        .map(([resource, amount]) => `${amount} units of ${resource}`)
        .join(", ");

      console.log(
        `${processor.name} processed ${recipeInputsString} to produce ${recipeOutputsString}`,
      );
    } else {
      const inputStorage = getInputStorage(processor.recipe, processor.storage);
      const inputStorageCount = inputStorage
        .map((s) => s.resourceCount)
        .reduce((c, v) => c + v);

      // .. PROCESSING FAILED
      // .. check if the inputs are empty or not enough and create contracts
      if (inputStorageCount < processor.minInputThreshold) {
        const closestSupplier = findClosestSupplier(
          processor,
          inputStorage[0].resourceType,
        );

        if (!closestSupplier) {
          console.log(
            `[PROCESSOR ERROR] No nearby suppliers to resupply ${processor.name}`,
          );
        } else if (!contracts.find((c) => c.owner === processor.id)) {
          // .. if there's literally NO STOCK left, we need to create an URGENT contract (due sooner, more needs to be transported)
          createContract(
            processor.id,
            closestSupplier.id,
            inputStorage[0].resourceType,
            Math.ceil(processor.minInputThreshold * 1.5),
            100,
            10,
          );
        }
      }

      // .. check if the output is full
      const outputStorage = getOutputStorage(
        processor.recipe,
        processor.storage,
      );
      const outputStorageCapacity = outputStorage
        .map((s) => s.resourceCapacity)
        .reduce((c, v) => c + v);
      const outputStorageCount = outputStorage
        .map((s) => s.resourceCount)
        .reduce((c, v) => c + v);

      if (outputStorageCount > outputStorageCapacity) {
        console.log(`${processor.name} is full and can't produce any more`);
      }
    }
  });
};

// .. TODO: consumers basically use the same "recipe" system as processors - except they only have
// input storage that the recipe "consumes" resources from ... effectively making consumers resource sinks
const updateConsumers = () => {
  consumers.forEach((consumer) => {
    processRecipe(consumer.recipe, consumer.storage);

    const inputStorage = getInputStorage(consumer.recipe, consumer.storage);
    const inputStorageCount = inputStorage
      .map((s) => s.resourceCount)
      .reduce((c, v) => c + v);

    if (inputStorageCount < consumer.minInputThreshold) {
      const closestSupplier = findClosestSupplier(
        consumer,
        inputStorage[0].resourceType,
      );

      if (!closestSupplier) {
        console.log(
          `[CONSUMER ERROR] No nearby suppliers to resupply ${consumer.name}`,
        );
      } else if (!contracts.find((c) => c.owner === consumer.id)) {
        if (inputStorageCount <= 0) {
          // .. consumption straight up failed because we literally have NOTHING
          // .. we need to create an URGENT contract
          // MVP: just create a normal contract
          createContract(
            consumer.id,
            closestSupplier.id,
            inputStorage[0].resourceType,
            Math.ceil(consumer.minInputThreshold * 1.5),
            100,
            10,
          );
        } else {
          // .. create a normal contract

          createContract(
            consumer.id,
            closestSupplier.id,
            inputStorage[0].resourceType,
            Math.ceil(consumer.minInputThreshold * 1.5),
            100,
            10,
          );
        }
      }
    } else {
      // .. consumed successfully
    }
  });
};

const updateContracts = () => {
  contracts.forEach((contract) => {
    if (contract.dueTicks > 0) {
      if (contract.dueTicks - 1 <= 0) {
        console.log(`Contract ${contract.id} has expired`);
        contracts = contracts.filter((c) => c.id !== contract.id);
        // .. impose some sort of penalty on the shipper if they fail to deliver?
      } else {
        contract.dueTicks--;
        console.log(
          `Contract ${contract.id} is due in ${contract.dueTicks} ticks`,
        );
      }
    }
  });
};

/* const transferTruckCargo = (truck: ITruck, destination : IBaseLocation, amount?: number) => {
  if(destination.type == LOCATION_TYPE.CONSUMER) {
    const consumer = (destination as IConsumer);

    if(truck.resourceCount > 0) {
      consumer.currentStock += truck.resourceCount;
      truck.resourceCount = 0;
    }
    else {
      throw Error(`Error: Truck ${truck.id} tried to deliver ${truck.resourceType} to ${destination.name}, but it was empty`);
    }
  }
  else if(destination.type == LOCATION_TYPE.PROCESSOR) {
    const processor = (destination as IProcessor);

    if(truck.resourceCount > 0) { // .. if the truck is full, unload it
      const amountToUnload : number = amount ?? truck.resourceCapacity;

      processor.inputStock += Math.min(processor);
      truck.resourceCount = 0;
    }
    else { // .. if the truck is empty, load it
      if(processor.outputStock > 0) {
        const amountToLoad : number = amount ?? truck.resourceCapacity;

        truck.resourceCount += Math.min(processor.outputStock,amountToLoad); // .. if we don't specify an amount, just fill it as much as we can
        processor.outputStock = Math.max(0,processor.outputStock-amountToLoad);
      }
    }
  }
  else if(destination.type == LOCATION_TYPE.PRODUCER) {
    const producer = (destination as IProducer);
  }
} */
const updateTrucks = () => {
  trucks.forEach((truck) => {
    if (truck.destination && truck.position != truck.destination.position) {
      const distance = truck.position - truck.destination.position;
      const direction = Math.sign(distance);

      truck.position -= direction * truck.speed;

      if (Math.abs(truck.position - truck.destination.position) < truck.speed) {
        truck.position = truck.destination.position; // Snap to destination
      }

      if (truck.position == truck.destination.position) {
        console.log(
          `Truck ${truck.id} has arrived at ${truck.destination.name}`,
        );
      }
    }
  });
};

// .. BUILD THE WORLD
createConsumer("Town A", 50, RESOURCE_TYPE.METAL, 3, 5, 25);

createProcessor(
  "Steel Refinery",
  30, // .. position
  {
    inputs: {
      [RESOURCE_TYPE.ORE]: 6,
    },
    outputs: {
      [RESOURCE_TYPE.METAL]: 3,
    },
  },
  12, // .. min input threshold
);
createProducer("Iron Mine", 10, RESOURCE_TYPE.ORE, 5, 25, 0);

const update = () => {
  rl.removeAllListeners();

  updateProducers();
  updateProcessors();
  //updateConsumers();
  updateContracts();

  rl.on("line", (input: string) => {
    const [command, ...args] = input.trim().split(" ");

    if (command) {
      console.log("you said: ", command);
    }
    update();
  });
};

// Main game loop with CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

update();

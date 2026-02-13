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
import { ITruck as ITruck } from "./entities/truck";
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
  transferResources,
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
  owner: IBaseLocation,
  supplier: IBaseLocation,
  resourceType: RESOURCE_TYPE,
  amount: number,
  payment: number,
  dueTicks: number,
) => {
  const newContract: IContract = {
    id: randomUUID(),
    owner,
    supplier,
    shipper: undefined,
    resourceType,
    amount,
    payment,
    dueTicks,
  };

  console.log(
    `${owner.name} created a contract with ${supplier.name} for ${amount} ${resourceType} - due in ${dueTicks} ticks`,
  );

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
      if (
        inputStorageCount < processor.minInputThreshold &&
        !contracts.find((c) => c.owner === processor)
      ) {
        console.log(
          `[PROCESSOR WARNING] ${processor.name} doesn't have enough ${inputStorage[0].resourceType} ${inputStorageCount > 0 ? `(only ${inputStorageCount} available) ` : ""}- so we'll create a contract`,
        );

        const closestSupplier = findClosestSupplier(
          processor,
          inputStorage[0].resourceType,
        );

        if (!closestSupplier) {
          console.log(
            `[PROCESSOR ERROR] No nearby suppliers to resupply ${processor.name}`,
          );
        } else {
          // .. if there's literally NO STOCK left, we need to create an URGENT contract (due sooner, more needs to be transported)
          createContract(
            processor,
            closestSupplier,
            inputStorage[0].resourceType,
            Math.ceil(processor.minInputThreshold * 1.5),
            100,
            10,
          );
        }
      }

      if (inputStorageCount >= processor.minInputThreshold) {
        const contractsToRemove = contracts.filter(
          (c) => c.owner === processor,
        );

        if (contractsToRemove.length > 0) {
          console.log("contracts to void: ", contractsToRemove);
          contracts = contracts.filter(
            (c) => !contractsToRemove.find((ctr) => ctr.id == c.id),
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
      } else if (!contracts.find((c) => c.owner === consumer)) {
        if (inputStorageCount <= 0) {
          // .. consumption straight up failed because we literally have NOTHING
          // .. we need to create an URGENT contract
          // MVP: just create a normal contract
          createContract(
            consumer,
            closestSupplier,
            inputStorage[0].resourceType,
            Math.ceil(consumer.minInputThreshold * 1.5),
            100,
            10,
          );
        } else {
          // .. create a normal contract

          createContract(
            consumer,
            closestSupplier,
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

// .. TRUCKS
const updateTrucks = () => {
  trucks.forEach((truck) => {
    if (truck.destination) {
      const distance = truck.position - truck.destination.position;
      const direction = Math.sign(distance);

      if (truck.position != truck.destination.position) {
        truck.position -= direction * truck.speed;

        if (
          Math.abs(truck.position - truck.destination.position) < truck.speed
        ) {
          truck.position = truck.destination.position; // Snap to destination
        }

        if (truck.position == truck.destination.position) {
          console.log(
            `[TRUCK] ${truck.id} has arrived at ${truck.destination.name}`,
          );
        }

        console.log(
          `[TRUCK] ${truck.id} moved ${truck.speed} distance units and is ${distance} units away from the destination`,
        );
      } else {
        if (truck.contract) {
          if (truck.destination == truck.contract.supplier) {
            const amountLeftToLoad =
              truck.contract.amount - truck.storage.resourceCount;

            console.log(
              `[TRUCK] ${truck.id} requested ${amountLeftToLoad} ${truck.contract.resourceType} from ${truck.destination.name}`,
            );

            if (
              transferResources(
                amountLeftToLoad,
                truck.contract.resourceType,
                truck.destination.storage,
                [truck.storage],
              ) ||
              amountLeftToLoad <= 0
            ) {
              console.log(
                `[TRUCK] ${truck.id} finished loading at ${truck.destination.name}. Heading to ${truck.contract.owner.name}`,
              );
              truck.destination = truck.contract.owner;
            } else {
              console.log(
                `[TRUCK] ${truck.id} will wait for the rest of the ${truck.contract.resourceType}`,
              );
            }
          } else if (truck.destination == truck.contract.owner) {
            if (
              transferResources(
                truck.contract.amount,
                truck.contract.resourceType,
                [truck.storage],
                truck.destination.storage,
              )
            ) {
              console.log(
                `[TRUCK] ${truck.id} finished unloading at ${truck.destination.name}. Contract completed`,
              );
              truck.destination = undefined;
              truck.contract = undefined;
            } else {
              console.log(
                `[TRUCK] ${truck.id} will wait for the rest of the ${truck.contract.resourceType}`,
              );
            }
          }
        }
      }
    } else if (contracts.length > 0) {
      console.log(`[TRUCK] ${truck.id} is looking for a contract...`);
      // .. if there's a contract available and the truck is doing nothing, accept the contract
      const contract = contracts.filter(
        (c) => !c.shipper && c.resourceType == truck.storage.resourceType,
      )[0];

      // .. TODO: if a particular truck can't complete the contract on its own, it will subcontract it to someone who can

      if (!contract) {
        console.log(` - No contracts available`);
      } else {
        contract.shipper = truck;
        truck.contract = contract;
        truck.destination = contract.supplier;

        console.log(` - Accepted contract ${contract.id}`);
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

createTruck(RESOURCE_TYPE.ORE, 30, 0, 2);

const update = () => {
  rl.removeAllListeners();

  updateProducers();
  updateProcessors();
  //updateConsumers();
  updateContracts();
  updateTrucks();

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

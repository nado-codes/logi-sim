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
    type: LOCATION_TYPE.PRODUCER,
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
    type: LOCATION_TYPE.PROCESSOR,
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
    type: LOCATION_TYPE.CONSUMER,
    storage: [createAndGetStorage(consumes, maxStock, currentStock)],
    recipe: { inputs: { [consumes]: consumptionRate } },
    minStockThreshold,
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
    if (producer.currentStock < producer.maxStock) {
      if (
        producer.currentStock + producer.productionRate >=
        producer.maxStock
      ) {
        console.log(`${producer.name} is full`);
      }
      producer.currentStock = Math.min(
        producer.currentStock,
        producer.productionRate,
        producer.maxStock,
      );
      console.log(
        `${producer.name} produced ${producer.productionRate} units of ${producer.storage}`,
      );
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
      // .. PROCESSING FAILED
      // .. check if the inputs are empty or not enough and create contracts
      // .. check if the output is full
    }

    /* 
    
    let canProcess = false;
    
    Object.entries(processor.recipe.inputs).forEach(
      ([resourceType, requiredAmount]) => {
        const inputStorage = processor.storage.filter(
          (s) => s.resourceType == resourceType,
        );
        const availableAmount = inputStorage
          .map((s) => s.resourceCount)
          .reduce((p, c) => p + c);

        if (availableAmount < requiredAmount) {
          if (!contracts.find((c) => c.owner === processor.id)) {
            console.log(
              `[PROCESSOR ERROR] ${processor.id} doesn't have enough ${resourceType} - need ${requiredAmount}, only have ${availableAmount}`,
            );

            // .. if an active contract exists, create an urgent purchase order and clear other active orders
            // otherwise just stop production
            // .. the due date of the purchase order should take into account expected shipping time +
            // time needed to produce the goods
            // MVP = just create a contract that's due in 5 ticks, but only if one doesn't already exist

            const closestSupplier = findClosestSupplier(
              processor,
              resourceType as RESOURCE_TYPE,
            );

            if (closestSupplier) {
              createContract(
                processor.id,
                closestSupplier.id,
                resourceType as RESOURCE_TYPE,
                Math.ceil(processor.minInputThreshold * 1.5),
                100,
                5,
              );
            } else {
              console.log(
                `[PROCESSOR ERROR] No suppliers available to resupply ${processor.id}. Production terminated.`,
              );
            }
          }

          canProcess = false;
        } else {
          let amountLeftToRemove = requiredAmount;

          inputStorage.forEach((storage) => {
            const amountToRemove = Math.max(
              storage.resourceCount - amountLeftToRemove,
              storage.resourceCount,
            );
            const amountRemoved = removeResources(amountToRemove, storage);

            amountLeftToRemove = Math.max(
              amountLeftToRemove - amountRemoved,
              0,
            );
          });

          canProcess = true;
        }

        if (
          availableAmount < processor.minInputThreshold &&
          !contracts.find((c) => c.owner == processor.id)
        ) {
          const closestSupplier = findClosestSupplier(
            processor,
            resourceType as RESOURCE_TYPE,
          );

          if (closestSupplier) {
            createContract(
              processor.id,
              closestSupplier.id,
              resourceType as RESOURCE_TYPE,
              Math.ceil(processor.minInputThreshold * 1.5),
              100,
              5,
            );
          } else {
            console.log(
              `[PROCESSOR ERROR] No suppliers available to resupply ${processor.id}. Production terminated.`,
            );
          }
        }
      },
    ); 

    if (canProcess) {
      Object.entries(processor.recipe.outputs).forEach(
        ([outputResource, productionRate]) => {
          const outputStorage = processor.storage.filter(
            (s) => s.resourceType == outputResource,
          );
          const availableCapacity = outputStorage
            .map((s) => s.resourceCapacity - s.resourceCount)
            .reduce((p, c) => p + c, 0);

          if (availableCapacity < productionRate) {
            console.log(
              `${processor.name} is full and cannot produce more ${outputResource}`,
            );
          } else {
            let amountLeftToAdd = productionRate;

            outputStorage.forEach((storage) => {
              const amountToAdd = Math.min(
                storage.resourceCapacity - storage.resourceCount,
                amountLeftToAdd,
              );
              const amountAdded = addResources(amountToAdd, storage);

              amountLeftToAdd = Math.max(amountLeftToAdd - amountAdded, 0);
            });

            const recipeInputs = Object.entries(processor.recipe.inputs);
            const recipeInputsString = recipeInputs
              .map(([resource, amount]) => `${amount} units of ${resource}`)
              .join(", ");

            const recipeOutputs = Object.entries(processor.recipe.outputs);
            const recipeOutputsString = recipeOutputs
              .map(([resource, amount]) => `${amount} units of ${resource}`)
              .join(", ");

            console.log(
              `${processor.name} processed ${recipeInputsString} to produce ${recipeOutputsString}`,
            );
          }
        },
      );
    }*/
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

    if (inputStorageCount < consumer.minStockThreshold) {
      if (inputStorageCount <= 0) {
        // .. consumption straight up failed because we literally have NOTHING
        // .. we need to create an URGENT contract
        // MVP: just create a normal contract
      } else {
        // .. create a normal contract
        const closestSupplier = findClosestSupplier(
          consumer,
          inputStorage[0].resourceType,
        );

        if (!closestSupplier) {
          console.log(
            `[CONSUMER ERROR] No nearby suppliers to resupply ${consumer.name}`,
          );
        } else {
          createContract(
            consumer.id,
            closestSupplier.id,
            inputStorage[0].resourceType,
            Math.ceil(consumer.minStockThreshold * 1.5),
            100,
            10,
          );
        }
      }
    } else {
      // .. consumed successfully
    }

    /*if (consumer.currentStock > 0) {
      console.log(
        `${consumer.name} consumed ${consumer.consumptionRate} units of ${consumer.consumes} and has ${consumer.currentStock} left`,
      );
    }

    consumer.currentStock = Math.max(
      consumer.currentStock - consumer.consumptionRate,
      0,
    );

    if (consumer.currentStock <= consumer.minStockThreshold) {
      console.log(`${consumer.name} demands ${consumer.consumes}`);

      if (!contracts.find((c) => c.owner == consumer.id)) {
        const origin = findClosest(consumer, processors);

        if (origin) {
          createContract(
            consumer.id,
            origin.id,
            consumer.id,
            consumer.consumes,
            Math.ceil(consumer.minStockThreshold * 1.5),
            100,
            10,
          );
        } else {
          throw Error(
            `${consumer.name} was unable to create a contract: no processor available`,
          );
        }
      }
    }*/
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
createProducer("Iron Mine", 10, 1, RESOURCE_TYPE.ORE, 5, 25, 0);

const update = () => {
  rl.removeAllListeners();

  updateConsumers();
  updateProcessors();
  updateProducers();
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

//printMenu();

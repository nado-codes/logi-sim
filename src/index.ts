import {
  IConsumer,
  LOCATION_TYPE,
  IProcessor,
  IProducer,
  TIER,
  IBaseLocation,
} from "./entities/worldLocation";
import readline from "readline";
import { RESOURCE_TYPE } from "./resources";
import { IContract } from "./entities/contract";
import { randomUUID } from "crypto";

// Creating locations

console.log("Logi sim starting...");
console.log("LogiSim v1.0 10-02-26");

let producers: IProducer[] = [];
let processors: IProcessor[] = [];
let consumers: IConsumer[] = [];
let contracts: IContract[] = [];

// .. CREATE

const createProducer = (
  name: string,
  position: number,
  tier: TIER,
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
    tier,
    produces,
    productionRate,
    currentStock: currentStock ?? 0,
    maxStock,
  };

  producers.push(newProducer);
};
const createProcessor = (
  name: string,
  position: number,
  tier: TIER,
  inputType: RESOURCE_TYPE,
  outputType: RESOURCE_TYPE,
  inputConsumptionRate: number,
  outputProductionRate: number,
  minInputThreshold: number,
  maxInputStock: number,
  maxOutputStock: number,
  inputStock?: number,
  outputStock?: number,
) => {
  const newProcessor: IProcessor = {
    id: randomUUID(),
    name,
    position,
    type: LOCATION_TYPE.PROCESSOR,
    tier,
    inputType,
    outputType,
    inputStock: inputStock ?? 0,
    outputStock: outputStock ?? 0,
    inputConsumptionRate,
    outputProductionRate,
    minInputThreshold,
    maxInputStock,
    maxOutputStock,
  };

  processors.push(newProcessor);
};
const createConsumer = (
  name: string,
  position: number,
  tier: TIER,
  consumes: RESOURCE_TYPE,
  consumptionRate: number,
  minStockThreshold: number,
  currentStock?: number,
) => {
  const newConsumer: IConsumer = {
    id: randomUUID(),
    name,
    position,
    type: LOCATION_TYPE.CONSUMER,
    tier,
    consumes,
    consumptionRate,
    currentStock: currentStock ?? 0,
    minStockThreshold,
  };

  consumers.push(newConsumer);
};

const createContract = (
  owner: string,
  origin: string,
  destination: string,
  resource: RESOURCE_TYPE,
  amount: number,
  payment: number,
  dueTicks: number,
) => {
  const newContract: IContract = {
    id: randomUUID(),
    owner,
    origin,
    shipper: undefined,
    destination,
    resource,
    amount,
    payment,
    dueTicks,
  };

  console.log("Created contract: ", newContract);

  contracts.push(newContract);
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
        `${producer.name} produced ${producer.productionRate} units of ${producer.produces}`,
      );
    }
  });
};

const findClosest = (
  destination: IBaseLocation,
  origins: IBaseLocation[],
): IBaseLocation | undefined => {
  if (origins.length === 0) return undefined;

  let closest = origins[0];
  let closestDistance = Math.abs(destination.position - closest.position);

  for (const origin of origins) {
    const distance = Math.abs(destination.position - origin.position);

    if (distance < closestDistance) {
      closest = origin;
      closestDistance = distance;
    }
  }

  return closest;
};
const updateProcessors = () => {
  processors.forEach((processor) => {
    if (processor.outputStock < processor.maxOutputStock) {
      if (
        processor.outputStock + processor.outputProductionRate >=
        processor.maxOutputStock
      ) {
        console.log(`${processor.name} is full`);
      }

      processor.outputStock = Math.min(
        processor.outputStock + processor.outputProductionRate,
        processor.maxOutputStock,
      );
      processor.inputStock = Math.max(
        processor.inputStock - processor.inputConsumptionRate,
        0,
      );

      console.log(
        `${processor.name} processed ${processor.inputConsumptionRate} units of ${processor.inputType} to produce ${processor.outputProductionRate} units of ${processor.outputType} and has ${processor.inputStock} left`,
      );
    }

    if (processor.inputStock <= processor.minInputThreshold) {
      console.log(`${processor.name} demands ${processor.inputType}`);

      if (!contracts.find((c) => c.owner == processor.id)) {
        const origin = findClosest(processor, producers);

        if (origin) {
          createContract(
            processor.id,
            origin.id,
            processor.id,
            processor.inputType,
            Math.ceil(processor.minInputThreshold * 1.5),
            100,
            2,
          );
        } else {
          throw Error(
            `${processor.name} was unable to create a contract: no producer available`,
          );
        }
      }
    }
  });
};

const updateConsumers = () => {
  consumers.forEach((consumer) => {
    if (consumer.currentStock > 0) {
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

// .. BUILD THE WORLD
createConsumer("Town A", 50, 1, RESOURCE_TYPE.METAL, 3, 5, 25);
createProcessor(
  "Steel Refinery",
  30, // .. position
  1, // .. tier
  RESOURCE_TYPE.ORE,
  RESOURCE_TYPE.METAL,
  6, // .. input consumption
  3, // .. output production
  12, // .. min input threshold
  50, // .. max input stock
  25, // .. max output stock
  35, // .. input stock
  0, // .. output stock
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

import {
  IConsumer,
  LOCATION_TYPE,
  IProcessor,
  IProducer,
  RESOURCE_TYPE,
  WorldLocation,
} from "./entities/worldLocation";
import readline from "readline";

console.log("Logi sim starting...");
console.log("LogiSim v1.0 10-02-26");

const printMenu = () => {
  console.log("What would you like to do?");
};

// Creating locations
const mine: IProducer = {
  name: "Iron Mine Alpha",
  position: 10,
  type: LOCATION_TYPE.PRODUCER,
  tier: 1,
  produces: RESOURCE_TYPE.ORE,
  productionRate: 5,
  currentStock: 0,
  maxStock: 100,
};

const refinery: IProcessor = {
  name: "Steel Refinery",
  position: 50,
  type: LOCATION_TYPE.PROCESSOR,
  tier: 1,
  inputType: RESOURCE_TYPE.ORE,
  outputType: RESOURCE_TYPE.METAL,
  inputStock: 0,
  outputStock: 0,
  processingRate: 3,
  minInputThreshold: 10,
};

const townA: IConsumer = {
  name: "Town A",
  position: 50,
  type: LOCATION_TYPE.CONSUMER,
  tier: 1,
  consumes: RESOURCE_TYPE.METAL,
  consumptionRate: 3,
  currentStock: 0,
  minStockThreshold: 0,
};

const updateSim = () => {
  console.log("hello");
};

// Main game loop with CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

updateSim();

rl.on("line", (input: string) => {
  const [command, ...args] = input.trim().split(" ");

  console.log("you said: ", command);
});

//printMenu();

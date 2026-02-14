import readline from "readline";
import { RESOURCE_TYPE } from "./entities/storage";
import { createWorld } from "./world/world";
import { notify } from "./notifications";

notify.info("Logi sim starting...");
notify.info("LogiSim v1.0 10-02-26");

// .. CREATE

// .. BUILD THE WORLD
const world = createWorld();

world.createProducer("Iron Mine", 10, RESOURCE_TYPE.ORE, 5, 25);
world.createProcessor(
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
  12, // .. min input threshold,
  50,
  25,
);
world.createConsumer("Town A", 50, RESOURCE_TYPE.METAL, 3, 5, 25);
world.createTruck(RESOURCE_TYPE.ORE, 30, 10, 2);

// Main game loop with CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const update = () => {
  rl.removeAllListeners();

  world.updateProducers();
  world.updateProcessors();
  //world.updateConsumers();
  world.updateContracts();
  world.updateTrucks();

  rl.on("line", (input: string) => {
    const [command, ...args] = input.trim().split(" ");

    if (command) {
      console.log("you said: ", command);
    }
    update();
  });
};

update();

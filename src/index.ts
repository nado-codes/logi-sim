import { RESOURCE_TYPE } from "./entities/storage";
import { createWorld } from "./world/world";
import { createMenu } from "./menus/menu";
import { logInfo } from "./logUtils";

logInfo("Logi sim starting...");
logInfo("LogiSim v0.3.1");

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
world.createConsumer("Town A", 50, RESOURCE_TYPE.METAL, 3, 5, 25, true);
world.createTruck(RESOURCE_TYPE.ORE, 30, 10, 2);
world.createTruck(RESOURCE_TYPE.METAL, 30, 30, 2);

const update = () => {
  world.updateProducers();
  world.updateProcessors();
  world.updateConsumers();
  world.updateContracts();
  world.updateTrucks();

  menu.show();
};

const menu = createMenu(update, world);

update();

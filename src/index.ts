import { RESOURCE_TYPE } from "./entities/storage";
import { createWorld } from "./world/world";
import { createMenu } from "./menus/menu";
import { logInfo } from "./utils";

logInfo("Logi sim starting...");
logInfo("LogiSim v0.3.1");

// .. CREATE

// .. BUILD THE WORLD
const world = createWorld();

const companyId = "";
world.createProducer("Farm", companyId, 10, RESOURCE_TYPE.GRAIN, 5, 25);
world.createProcessor(
  "Flour Mill",
  companyId,
  30, // .. position
  {
    inputs: {
      [RESOURCE_TYPE.GRAIN]: 6,
    },
    outputs: {
      [RESOURCE_TYPE.FLOUR]: 3,
    },
  },
  12, // .. min input threshold,
  50,
  25,
);
world.createConsumer("Town A", companyId, 50, RESOURCE_TYPE.FLOUR, 3, 5, 25);
world.createTruck("Truck 1", companyId, RESOURCE_TYPE.GRAIN, 30, 10, 2);
world.createTruck("Truck 2", companyId, RESOURCE_TYPE.FLOUR, 30, 30, 2);

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

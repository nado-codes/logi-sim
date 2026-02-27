import { RESOURCE_TYPE } from "./entities/storage";
import { createWorld } from "./world/world";
import { createMenu } from "./menus/menu";
import { logInfo, Color } from "./utils";

logInfo("Logi sim starting...");
logInfo("LogiSim v0.3.1");

// .. CREATE

// .. BUILD THE WORLD
const world = createWorld();

const company = world.createCompany("NadoCo Logistics", 100000, Color.Cyan);

world.createProducer("Farm", company.getId(), 10, RESOURCE_TYPE.GRAIN, 5, 25);
world.createProducer("Mine", company.getId(), 0, RESOURCE_TYPE.ORE, 5, 25);
world.createProcessor(
  "Flour Mill",
  company.getId(),
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

world.createProcessor(
  "Steel Refinery",
  company.getId(),
  27, // .. position
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

world.createConsumer(
  "Town A",
  company.getId(),
  50,
  RESOURCE_TYPE.FLOUR,
  3,
  5,
  25,
);
world.createConsumer(
  "Town B",
  company.getId(),
  50,
  RESOURCE_TYPE.METAL,
  3,
  5,
  25,
);

world.createTruck("Truck 1", company.getId(), RESOURCE_TYPE.GRAIN, 30, 10, 2);
world.createTruck("Truck 2", company.getId(), RESOURCE_TYPE.FLOUR, 30, 30, 2);
world.createTruck("Truck 3", company.getId(), RESOURCE_TYPE.ORE, 30, 0, 2);
world.createTruck("Truck 4", company.getId(), RESOURCE_TYPE.METAL, 30, 5, 2);

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

import { RESOURCE_TYPE } from "./entities/storage";
import { createWorld } from "./world/world";
import { createMenu } from "./menus/menu";
import { Color, logInfo } from "./utils/logUtils";

// .. CREATE

// .. BUILD THE WORLD
export const world = createWorld();

logInfo("Logi sim starting...");
logInfo("LogiSim v0.3.5");

const stateCompany = world.createCompany(
  "State",
  1000000000,
  Color.Magenta,
  true,
);
const playerCompany = world.createCompany(
  "NadoCo Logistics",
  100000,
  Color.Cyan,
);
world.createProducer("Farm", stateCompany.id, 0, RESOURCE_TYPE.GRAIN, 500);
world.createProcessor("Flour Mill", stateCompany.id, 15, {
  inputs: {
    [RESOURCE_TYPE.GRAIN]: 6,
  },
  outputs: {
    [RESOURCE_TYPE.FLOUR]: 6,
  },
});
world.createTown("Town A", stateCompany.id, 45, true);
world.createTruck(
  "Truck 1",
  playerCompany.id,
  RESOURCE_TYPE.GRAIN,
  10000,
  0,
  2,
  100,
);
world.createTruck(
  "Truck 2",
  playerCompany.id,
  RESOURCE_TYPE.FLOUR,
  10000,
  15,
  2,
  100,
);

const simTarget = 0;

const update = () => {
  world.advanceTick();

  world.updateProducers();
  world.updateProcessors();
  world.updateTowns();
  world.updateContracts();
  world.updateTrucks();
};

while (world.getCurrentTick() < simTarget) {
  update();
}

const menu = createMenu(update, world, playerCompany);
menu.show();

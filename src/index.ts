import { createWorld } from "./world/world";
import { createMenu } from "./menus/menu";
import { Color, logError, logInfo } from "./utils/logUtils";
import { RESOURCE_TYPE } from "./entities/resource";

// .. CREATE

// .. BUILD THE WORLD
export const world = createWorld();

logInfo("Logi sim starting...");
logInfo("LogiSim v0.5.0");

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
    [RESOURCE_TYPE.FLOUR]: 3,
  },
});
world.createTown("Town A", stateCompany.id, 45, true);
world.createTruck(
  "Truck 1",
  playerCompany.id,
  RESOURCE_TYPE.GRAIN,
  10000,
  0,
  1,
  100,
);
world.createTruck(
  "Truck 2",
  playerCompany.id,
  RESOURCE_TYPE.FLOUR,
  10000,
  15,
  1,
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

  if (playerCompany.money < 0) {
    logError(
      `[SYSTEM] Exiting auto-sim early because the player company ran out of money`,
    );
    break;
  }
}

const menu = createMenu(update, world, playerCompany);
menu.show();

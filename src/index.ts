import { RESOURCE_TYPE } from "./entities/storage";
import { createWorld } from "./world/world";
import { createMenu } from "./menus/menu";
import { Color, logInfo } from "./utils/logUtils";
import { TownTier } from "./entities/locations/consumer";

// .. CREATE

// .. BUILD THE WORLD
export const world = createWorld();

logInfo("Logi sim starting...");
logInfo("LogiSim v0.3.5");

const stateCompany = world.createCompany("State", 1000000000, Color.Magenta);
const playerCompany = world.createCompany(
  "NadoCo Logistics",
  100000,
  Color.Cyan,
);
world.createProducer("Farm", stateCompany.id, 0, RESOURCE_TYPE.GRAIN, 5, 25);
world.createProcessor(
  "Flour Mill",
  stateCompany.id,
  15, // .. position
  {
    inputs: {
      [RESOURCE_TYPE.GRAIN]: 6,
    },
    outputs: {
      [RESOURCE_TYPE.FLOUR]: 6,
    },
  },
  12, // .. min input threshold,
  50,
  25,
  false,
  true,
);
world.createTown("Town A", stateCompany.id, 45, TownTier.TierOne);
world.createTruck("Truck 1", playerCompany.id, RESOURCE_TYPE.GRAIN, 30, 0, 2);
world.createTruck("Truck 2", playerCompany.id, RESOURCE_TYPE.FLOUR, 30, 15, 4);

const update = () => {
  world.advanceTick();

  world.updateProducers();
  world.updateProcessors();
  world.updateTowns();
  world.updateContracts();
  world.updateTrucks();

  menu.show();
};

const menu = createMenu(update, world, playerCompany);

update();

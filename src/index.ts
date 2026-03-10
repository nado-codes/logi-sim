import { RESOURCE_TYPE } from "./entities/storage";
import { createWorld } from "./world/world";
import { createMenu } from "./menus/menu";
import { Color, logInfo } from "./logUtils";
import { TownTier } from "./entities/locations/consumer";

logInfo("Logi sim starting...");
logInfo("LogiSim v0.3.1");

// .. CREATE

// .. BUILD THE WORLD
const world = createWorld();

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
      [RESOURCE_TYPE.FLOUR]: 3,
    },
  },
  12, // .. min input threshold,
  50,
  25,
);
world.createTown("Town A", stateCompany.id, 45, TownTier.TierOne);
world.createTruck("Truck 1", playerCompany.id, RESOURCE_TYPE.GRAIN, 30, 0, 2);
world.createTruck("Truck 2", playerCompany.id, RESOURCE_TYPE.FLOUR, 30, 15, 2);

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

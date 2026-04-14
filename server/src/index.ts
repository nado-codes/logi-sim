import { createWorld } from "./world/world";
import { logisimApi } from "./api";
import { ITown, LOCATION_TYPE, RESOURCE_TYPE } from "@logisim/lib/entities";
import {
  logInfo,
  Color,
  highlight,
  logError,
  logSuccess,
} from "@logisim/lib/utils";
import {
  getResourceCapacity,
  getResourceCount,
  getResourceStorage,
} from "./world/storages";

// .. CREATE

export const world = createWorld();

logInfo("Logi sim starting...");
logInfo("LogiSim v0.6.1");

const stateCompany = world.createCompany("State", 1000000000, Color.Magenta, {
  isAiEnabled: true,
  hasUnlimitedMoney: true,
  isGovernment: true,
});
const playerCompany = world.createCompany(
  "NadoCo Logistics",
  100000,
  Color.Cyan,
);
const competitorCompany = world.createCompany("RivalCo", 1000, Color.Red, {
  isAiEnabled: true,
});

world.createCoastline(0);
world.createWater(40);
//world.createMountain(30, 5, 10);
//world.createResourceDeposit(35, RESOURCE_TYPE.Grain);

world.createProducer("Farm", stateCompany.id, 20, RESOURCE_TYPE.Grain, 25);
world.createProcessor("Flour Mill", stateCompany.id, 25, {
  inputs: {
    [RESOURCE_TYPE.Grain]: 6,
  },
  outputs: {
    [RESOURCE_TYPE.Flour]: 300,
  }, //
});

world.createTruck(
  "Truck 1",
  playerCompany.id,
  RESOURCE_TYPE.Grain,
  1000000,
  0,
  2,
);
world.createTruck(
  "Truck 2",
  playerCompany.id,
  RESOURCE_TYPE.Flour,
  1000000,
  15,
  2,
);

// .. TODO: disable per-truck contract acceptance and instead create "dispatcher" behaviour at company
// level to auto-assign trucks to applicable contracts
world.createTruck(
  "Truck 3",
  competitorCompany.id,
  RESOURCE_TYPE.Grain,
  1000000,
  15,
  2,
);
world.createTruck(
  "Truck 4",
  competitorCompany.id,
  RESOURCE_TYPE.Flour,
  1000000,
  15,
  2,
);

const simTarget = 500;
const checkpointFactor = simTarget / 10;

const update = () => {
  /*console.log(
    `Updated world at ${Date.now()}ms (World Tick: ${world.getCurrentTick()})`,
  );*/ //
  world.advanceTick();

  world.updateCompanies();
  world.updateProducers();
  world.updateProcessors();
  world.updateTowns();
  world.updateContracts();
  world.updateTrucks();
};

let lastSnapshot = Date.now();

const trySnapshot = () => {
  if (
    simTarget <= 0 ||
    world.getCurrentTick() / checkpointFactor !==
      Math.round(world.getCurrentTick() / checkpointFactor)
  ) {
    return;
  }

  const lastSnapshotDuration = new Date(Date.now() - lastSnapshot);

  console.log(
    `- Tick ${highlight.yellow(world.getCurrentTick() + "/" + simTarget) + `(${Math.round((world.getCurrentTick() / simTarget) * 100)}%)`} [${lastSnapshotDuration.getMilliseconds() + "ms"}]`,
  );

  lastSnapshot = Date.now();
};

if (simTarget > 0) {
  console.log(highlight.cyan(`Simulating...`));
}

let popStrikes = 0;
const popStrikeLimit = 50;
const popThreshold = 30;

while (world.getCurrentTick() < simTarget) {
  trySnapshot();
  update();

  const towns = world
    .getLocations()
    .filter((l) => l.locationType === LOCATION_TYPE.Town)
    .map((t) => t as ITown);

  function mean<T extends number>(arr: T[]) {
    return arr.reduce((a, c) => a + c, 0) / arr.length;
  }

  if (towns.some((t) => t.population < popThreshold)) {
    console.log(" - avg pop: ", mean(towns.map((t) => t.population)));
    console.log(" - avg confidence: ", mean(towns.map((t) => t.confidence)));
    const avgFlourStored = mean(
      towns.map((t) => getResourceCount(RESOURCE_TYPE.Flour, t.storage)),
    );
    const avgFlourCapacity = mean(
      towns.map((t) => getResourceCapacity(RESOURCE_TYPE.Flour, t.storage)),
    );
    console.log(
      ` - avg flour: ${avgFlourStored}/${avgFlourCapacity} (${(avgFlourStored / avgFlourCapacity) * 100}%)`,
    );
    if (popStrikes < popStrikeLimit) {
      popStrikes++;
    } else {
      logError(
        `[SYSTEM] Exiting sim at tick ${world.getCurrentTick()} because a town had less than 50 pop for more than ${popStrikeLimit} ticks`,
      );
      break;
    }
  } else {
    if (popStrikes > 0) {
      popStrikes--;
    }
    //logSuccess(`[SYSTEM] Towns are all good`);
  }
}

const api = logisimApi(world);
api.start();
//setInterval(update, 100);

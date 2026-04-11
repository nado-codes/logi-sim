import { RESOURCE_TYPE } from "./entities/storage";
import { createWorld } from "./world/world";
import { Color, highlight, logError, logInfo } from "./utils/logUtils";
import { logisimApi } from "./api";

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

const simTarget = 0;
const checkpointFactor = simTarget / 10;

const update = () => {
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

while (world.getCurrentTick() < simTarget) {
  trySnapshot();
  update();

  if (playerCompany.money < 0) {
    logError(
      `[SYSTEM] Exiting auto-sim early because the player company ran out of money`,
    );
    break;
  }
}

const api = logisimApi(world);
api.start();

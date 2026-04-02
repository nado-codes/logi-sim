import { RESOURCE_TYPE } from "./entities/storage";
import { createWorld } from "./world/world";
import { createMenu } from "./menus/menu";
import { Color, highlight, logError, logInfo } from "./utils/logUtils";

// .. CREATE

export const world = createWorld();

logInfo("Logi sim starting...");
logInfo("LogiSim v0.5.0");

const stateCompany = world.createCompany("State", 1000000000, Color.Magenta, {
  isAiEnabled: true,
  hasUnlimitedMoney: true,
});
const playerCompany = world.createCompany(
  "NadoCo Logistics",
  100000,
  Color.Cyan,
);

world.createCoastline(0);
world.createWater(20);
world.createMountain(24, 5, 10);
world.createResourceDeposit(25, RESOURCE_TYPE.Grain);
world.createWater(60);

/*world.createProducer("Farm", stateCompany.id, 2, RESOURCE_TYPE.Grain, 500);
world.createProcessor("Flour Mill", stateCompany.id, 15, {
  inputs: {
    [RESOURCE_TYPE.Grain]: 6,
  },
  outputs: {
    [RESOURCE_TYPE.Flour]: 3,
  },
});
world.createTown("Town A", stateCompany.id, 45, true);
world.createTruck(
  "Truck 1",
  playerCompany.id,
  RESOURCE_TYPE.Grain,
  10000,
  0,
  2,
);
world.createTruck(
  "Truck 2",
  playerCompany.id,
  RESOURCE_TYPE.Flour,
  10000,
  15,
  2,
); */

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
if (simTarget > 0) {
  console.log(highlight.green(`- Success! Press any key to start playing`));
}

const menu = createMenu(update, world, playerCompany);

if (simTarget > 0) {
  menu.pause(menu.show);
} else {
  menu.show();
}

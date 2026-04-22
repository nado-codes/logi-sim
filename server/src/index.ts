import { createWorld } from "./world/world";
import { logisimApi } from "./api";
import { RESOURCE_TYPE } from "@logisim/lib/entities";
import { logInfo, Color, highlight } from "@logisim/lib/utils";

// .. CREATE

export const world = createWorld();

logInfo("Logi sim starting...");
logInfo("LogiSim v0.6.1");

const stateCompany = world.createCompany("State", 100000, Color.Magenta, {
  isAiEnabled: true,
  hasUnlimitedMoney: true,
});
const playerCompany = world.createCompany(
  "NadoCo Logistics",
  100000,
  Color.Cyan,
);
const competitorCompany = world.createCompany("RivalCo", 100000, Color.Red, {
  isAiEnabled: true,
});
/*const competitorCompany2 = world.createCompany(
  "Disruptor Inc",
  100000,
  Color.Yellow,
  {
    isAiEnabled: true,
  },
);*/

world.createTown("FlourVille", stateCompany.id, { x: 63, y: 0, z: 0 }, true);

world.createProducer(
  "Farm",
  stateCompany.id,
  { x: 10, y: 0, z: 0 },
  RESOURCE_TYPE.Grain,
  25,
);
world.createProcessor(
  "Flour Mill",
  stateCompany.id,
  { x: 25, y: 0, z: 0 },
  {
    inputs: {
      [RESOURCE_TYPE.Grain]: 6,
    },
    outputs: {
      [RESOURCE_TYPE.Flour]: 300,
    }, //
  },
);
/* world.createProcessor(
  "Bakery",
  stateCompany.id,
  { x: 45, y: 0, z: 0 },
  {
    inputs: {
      [RESOURCE_TYPE.Flour]: 6,
    },
    outputs: {
      [RESOURCE_TYPE.Bread]: 30,
    },
  },
); */

/*world.createTruck(
  "Truck 1",
  playerCompany.id,
  RESOURCE_TYPE.Grain,
  1000000,
  { x: 10, y: 0, z: 0 },
  2,
);
world.createTruck(
  "Truck 2",
  playerCompany.id,
  RESOURCE_TYPE.Flour,
  1000000,
  { x: 15, y: 0, z: 0 },
  2,
);*/

// .. RivalCo trucks
world.createTruck(
  "Truck 3",
  competitorCompany.id,
  RESOURCE_TYPE.Grain,
  1000000,
  { x: 15, y: 0, z: 0 },
  2,
);
world.createTruck(
  "Truck 4",
  competitorCompany.id,
  RESOURCE_TYPE.Flour,
  1000000,
  { x: 15, y: 0, z: 0 },
  2,
);
/*world.createTruck(
  "Truck 5",
  competitorCompany.id,
  RESOURCE_TYPE.Bread,
  1000000,
  { x: 15, y: 0, z: 0 },
  2,
);
world.createTruck(
  "Truck 6",
  competitorCompany.id,
  RESOURCE_TYPE.Grain,
  1000000,
  { x: 15, y: 0, z: 0 },
  2,
);

// .. Disruptor Inc trucks
world.createTruck(
  "Truck 7",
  competitorCompany2.id,
  RESOURCE_TYPE.Grain,
  1000000,
  { x: 15, y: 0, z: 0 },
  2,
);
world.createTruck(
  "Truck 8",
  competitorCompany2.id,
  RESOURCE_TYPE.Flour,
  1000000,
  { x: 15, y: 0, z: 0 },
  2,
);
world.createTruck(
  "Truck 9",
  competitorCompany2.id,
  RESOURCE_TYPE.Bread,
  1000000,
  { x: 15, y: 0, z: 0 },
  2,
);
world.createTruck(
  "Truck 10",
  competitorCompany2.id,
  RESOURCE_TYPE.Grain,
  1000000,
  { x: 15, y: 0, z: 0 },
  2,
);*/

const simTarget = 1300;
const checkpointFactor = simTarget / 10;

const update = () => {
  if (world.getCurrentTick() >= simTarget) {
    console.log(
      "Updated world state for tick ",
      highlight.yellow(world.getCurrentTick()),
    );
  }
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

  const nonStateCompanies = world
    .getCompanies()
    .filter((c) => c.name !== "State");

  nonStateCompanies.forEach((c1) => {
    console.log(`  - ${c1.name} = ${c1.money}`);
  });

  if (world.getCurrentTick() > 750) {
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
}

const api = logisimApi(world);
api.start();
//setInterval(update, 500);

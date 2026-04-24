import { createWorld, IWorld } from "../../src/world/world";
import { RESOURCE_TYPE } from "@logisim/lib/entities";
import {
  logInfo,
  Color,
  highlight,
  setLogContextProvider,
} from "@logisim/lib/utils";

export const runBaseSimulation = (options: {
  simTarget: number;
  onTick?: (world: IWorld) => void;
}) => {
  // .. CREATE

  const world = createWorld();

  logInfo("Logi sim starting...");
  logInfo("LogiSim v0.6.1 - SC-BASE");

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

  world.createTown("FlourVille", stateCompany.id, { x: 63, y: 0, z: 0 }, true);

  world.createProducer(
    "Farm",
    stateCompany.id,
    { x: 10, y: 0, z: 0 },
    RESOURCE_TYPE.Grain,
    2500,
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

  // .. RivalCo trucks
  world.createTruck(
    "Truck 3",
    playerCompany.id,
    RESOURCE_TYPE.Grain,
    1000000,
    { x: 15, y: 0, z: 0 },
    2,
  );
  /*world.createTruck(
    "Truck 4",
    competitorCompany.id,
    RESOURCE_TYPE.Flour,
    1000000,
    { x: 15, y: 0, z: 0 },
    2,
  );*/

  setLogContextProvider(() => `Tick ${world.getCurrentTick()}`);

  const checkpointFactor = options.simTarget / 10;

  const update = () => {
    if (world.getCurrentTick() >= options.simTarget) {
      console.log(
        "Updated world state for tick ",
        highlight.yellow(world.getCurrentTick()),
      );
    }

    world.update();

    options.onTick?.(world);
  };

  let lastSnapshot = Date.now();

  const trySnapshot = () => {
    if (
      options.simTarget <= 0 ||
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
      `- Tick ${highlight.yellow(world.getCurrentTick() + "/" + options.simTarget) + `(${Math.round((world.getCurrentTick() / options.simTarget) * 100)}%)`} [${lastSnapshotDuration.getMilliseconds() + "ms"}]`,
    );

    lastSnapshot = Date.now();
  };

  if (options.simTarget > 0) {
    console.log(highlight.cyan(`Simulating...`));
  }

  while (world.getCurrentTick() < options.simTarget) {
    trySnapshot();
    update();
  }

  return world;
};

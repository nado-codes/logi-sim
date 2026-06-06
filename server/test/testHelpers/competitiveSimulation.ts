import { createWorld, IWorld } from "../../src/world/world";
import { RESOURCE_TYPE } from "@logisim/lib/entities";
import {
  logInfo,
  Color,
  highlight,
  setLogContextProvider,
  logSuccess,
} from "@logisim/lib/utils";

export const runCompetitiveSimulation = (options: {
  simTarget: number;
  onTick?: (world: IWorld) => void;
}) => {
  // .. CREATE

  const world = createWorld();

  logInfo("Logi sim starting...");
  logInfo("LogiSim v0.6.1 - SC-COMPETE");

  const stateCompany = world.createCompany("State", 100000, Color.Magenta, {
    isAiEnabled: false,
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
  const competitorCompany2 = world.createCompany(
    "Disruptor Inc",
    100000,
    Color.Yellow,
    {
      isAiEnabled: true,
    },
  );

  world.createTown("FlourVille", stateCompany.id, { x: 75, y: 0, z: 0 }, true);
  world.createTown(
    "TruckTropolis",
    stateCompany.id,
    { x: 60, y: 0, z: 50 },
    true,
  );
  world.createTown("Contractia", stateCompany.id, { x: 40, y: 0, z: 0 }, true);

  const farm = world.createProducer(
    "Farm",
    stateCompany.id,
    { x: 10, y: 0, z: 0 },
    RESOURCE_TYPE.Grain,
    2500,
  );
  const flourMill = world.createProcessor(
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

  // .. Player trucks
  world.createTruckFromItemId(`truck-flour`, playerCompany.id, {
    x: 0,
    y: 0,
    z: 0,
  });
  world.createTruckFromItemId(`truck-grain`, playerCompany.id, {
    x: 0,
    y: 0,
    z: 0,
  });

  // .. RivalCo trucks
  world.createTruckFromItemId(`truck-grain`, competitorCompany.id, {
    x: 0,
    y: 0,
    z: 0,
  });
  world.createTruckFromItemId(`truck-flour`, competitorCompany.id, {
    x: 0,
    y: 0,
    z: 0,
  });

  // .. Disruptor Inc trucks
  world.createTruckFromItemId(`truck-grain`, competitorCompany2.id, {
    x: 0,
    y: 0,
    z: 0,
  });
  world.createTruckFromItemId(`truck-flour`, competitorCompany2.id, {
    x: 0,
    y: 0,
    z: 0,
  });

  setLogContextProvider(() => ({
    timestamp: `Tick ${world.getCurrentTick()}`,
    printLogs: false,
  }));

  const checkpointFactor = options.simTarget / 10;
  let forceExit = false;

  const update = () => {
    if (world.getCurrentTick() >= options.simTarget) {
      console.log(
        "Updated world state for tick ",
        highlight.yellow(world.getCurrentTick()),
      );
    }

    world.update();

    if (!options.onTick?.(world)) {
      forceExit = true;
    }
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

  while (world.getCurrentTick() < options.simTarget && !forceExit) {
    trySnapshot();
    update();
  }

  logSuccess("COMPLETED SIMULATION - SC-COMPETE");

  return world;
};

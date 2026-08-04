import { createWorld, STATE_COMPANY_NAME } from "./world/world";
import { logisimApi } from "./api";
import { logInfo, Color, setLogContextProvider } from "@logisim/lib/utils";

export const world = createWorld();

logInfo("Logi sim starting...");
logInfo("LogiSim v0.6.1");

const stateCompany = world.getCompanyByName(STATE_COMPANY_NAME);
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
  { x: 75, y: 0, z: 50 },
  true,
);
world.createTown("Contractia", stateCompany.id, { x: 25, y: 0, z: 0 }, true);

world.createLocationFromItemId("location-grainfarm", stateCompany.id, {
  x: 10,
  y: 0,
  z: 25,
});
world.createLocationFromItemId("location-flourmill", stateCompany.id, {
  x: 25,
  y: 0,
  z: 25,
});

// .. Player trucks
world.createTruckFromItemId("truck-grain", playerCompany.id, {
  x: 10,
  y: 0,
  z: 0,
});
world.createTruckFromItemId("truck-flour", playerCompany.id, {
  x: 15,
  y: 0,
  z: 0,
});

// .. RivalCo trucks
world.createTruckFromItemId("truck-grain", competitorCompany.id, {
  x: 10,
  y: 0,
  z: 0,
});
world.createTruckFromItemId("truck-flour", competitorCompany.id, {
  x: 20,
  y: 0,
  z: 0,
});

// .. Disruptor Inc trucks
world.createTruckFromItemId("truck-grain", competitorCompany2.id, {
  x: 25,
  y: 0,
  z: 0,
});
world.createTruckFromItemId("truck-flour", competitorCompany2.id, {
  x: 30,
  y: 0,
  z: 0,
});

setLogContextProvider(() => ({
  timestamp: `Tick ${world.getCurrentTick()}`,
  printLogs: true,
}));

const api = logisimApi(world);
api.start();
setInterval(world.update, 500);

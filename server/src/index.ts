import { createWorld, STATE_COMPANY_NAME } from "./world/world";
import { logisimApi } from "./api";
import { logInfo, Color, setLogContextProvider } from "@logisim/lib/utils";
import { loadConfig } from "./utils/configUtils";
import { ITimespans } from "@logisim/lib";

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

interface ISystemConfig {
  tickRateMS: number;
  dayLengthTicks: number;
  getHourMS: () => number;
  getHourTicks: () => number;
  getDayMS: () => number;
  getWeekTicks: () => number;
  getWeekMS: () => number;
  getMonthTicks: () => number;
  getMonthMS: () => number;
  getYearTicks: () => number;
  getYearMS: () => number;
}

const defaultConfig: ISystemConfig = {
  tickRateMS: 500,
  dayLengthTicks: 10,
  getHourMS: () => defaultConfig.getDayMS() / 24,
  getHourTicks: () => defaultConfig.dayLengthTicks / 24,
  getDayMS: () => defaultConfig.dayLengthTicks * defaultConfig.tickRateMS,
  getWeekTicks: () => defaultConfig.dayLengthTicks * 7,
  getWeekMS: () => defaultConfig.getDayMS() * 7,
  getMonthTicks: () => defaultConfig.dayLengthTicks * 28,
  getMonthMS: () => defaultConfig.getDayMS() * 28,
  getYearTicks: () => defaultConfig.dayLengthTicks * 365,
  getYearMS: () => defaultConfig.getDayMS() * 365,
};

interface ISystemConfigWithTimespan {
  config: ISystemConfig;
  timespans: ITimespans;
}

export const loadSystemConfig = (): ISystemConfigWithTimespan => {
  const config = loadConfig("system", defaultConfig);
  const timespans: ITimespans = {
    hourLengthTicks: config.getHourTicks(),
    hourLengthMS: config.getHourMS(),
    dayLengthTicks: config.dayLengthTicks,
    dayLengthMS: config.getDayMS(),
    weekLengthTicks: config.getWeekTicks(),
    weekLengthMS: config.getWeekMS(),
    monthLengthTicks: config.getMonthTicks(),
    monthLengthMS: config.getMonthMS(),
    yearLengthTicks: config.getYearTicks(),
    yearLengthMS: config.getYearMS(),
  };

  return { ...config, timespans };
};
const systemConfig = loadSystemConfig();
const api = logisimApi(world);
api.start();
setInterval(world.update, systemConfig.config.tickRateMS);

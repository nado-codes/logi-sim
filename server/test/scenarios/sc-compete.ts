import { ITown, LOCATION_TYPE, RESOURCE_TYPE } from "@logisim/lib/entities";
import { setGlobalSeed } from "../../../lib/dist/utils/mathUtils";
import { logisimApi } from "../../src/api";
import { runCompetitiveSimulation } from "../testHelpers/competitiveSimulation";
import { highlight, logError, logInfo, saveLogs } from "@logisim/lib/utils";

setGlobalSeed("competitive-scenario-seed");
const world = runCompetitiveSimulation({
  simTarget: 8760, // .. 1 year, if every tick represents 1 hour (24 ticks per day * 365 days)
  onTick: (world) => {
    const numActiveContracts = world
      .getContracts()
      .filter((c) => c.deliveredTick === undefined).length;
    const totalCompanyMoney = world
      .getCompanies()
      .filter((c) => c.name !== "State")
      .reduce((sum, c) => sum + c.money, 0);

    const logData = {
      numActiveContracts,
      totalCompanyMoney,
    };

    logInfo(JSON.stringify(logData));

    return true;
  },
});

saveLogs();

// .. divide each number down so that it shows each year, day and hours (i.e. hours shouldn't be 8760, it should be whatever's left over)
const years = Math.floor(world.getCurrentTick() / (24 * 365));
const days = Math.floor((world.getCurrentTick() % (24 * 365)) / 24);
const hours = world.getCurrentTick() % 24;
//.. then show it in the format of "Year 1, Day 2, Hour 3"
console.log(
  "Final tick: " +
    highlight.yellow(`Year ${years}, Day ${days}, Hour ${hours}`),
);

const towns: ITown[] = world
  .getLocations()
  .filter((l) => l.locationType == LOCATION_TYPE.Town)
  .map((l) => l as ITown);

towns.forEach((t) => {
  console.log("==" + t.name.toUpperCase() + "==");
  console.log(" - population: ", t.population);
  console.log(" - confidence: ", t.confidence);
});

setInterval(world.update, 200);

const api = logisimApi(world);
api.start();

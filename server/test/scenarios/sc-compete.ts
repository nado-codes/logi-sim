import { ITown, LOCATION_TYPE, RESOURCE_TYPE } from "@logisim/lib/entities";
import { setGlobalSeed } from "../../../lib/dist/utils/mathUtils";
import { logisimApi } from "../../src/api";
import { runCompetitiveSimulation } from "../testHelpers/competitiveSimulation";
import { logError, logInfo, logSuccess, saveLogs } from "@logisim/lib/utils";

setGlobalSeed("competitive-scenario-seed");
const world = runCompetitiveSimulation({
  simTarget: 50000,
  onTick: (world) => {
    const towns: ITown[] = world
      .getLocations()
      .filter((l) => l.locationType == LOCATION_TYPE.Town)
      .map((l) => l as ITown);

    const avgTownPop =
      towns.map((t) => t.population).reduce((a, c) => a + c) / towns.length;
    const avgTownConfidence =
      towns.map((t) => t.confidence).reduce((a, c) => a + c) / towns.length;
    const industryStorages = world
      .getLocations()
      .filter((l) => l.locationType !== LOCATION_TYPE.Town)
      .map((l) => l.storage)
      .reduce((a, c) => a.concat(c), []);
    const townStorages = towns
      .map((l) => l.storage)
      .reduce((a, c) => a.concat(c), []);
    const truckStorages = world.getTrucks().map((t) => t.storage);

    const totalIndustryFlour = industryStorages
      .filter((s) => s.resourceType === RESOURCE_TYPE.Flour)
      .map((s) => s.resourceCount)
      .reduce((a, c) => a + c);
    const totalTownFlour = townStorages
      .filter((s) => s.resourceType === RESOURCE_TYPE.Flour)
      .map((s) => s.resourceCount)
      .reduce((a, c) => a + c);
    const totalTruckFlour = truckStorages
      .filter((s) => s.resourceType === RESOURCE_TYPE.Flour)
      .map((s) => s.resourceCount)
      .reduce((a, c) => a + c);
    const logData = {
      avgPop: avgTownPop,
      avgConfidence: avgTownConfidence,
      totalTownFlour,
      totalIndustryFlour,
      totalTruckFlour,
    };

    logInfo(JSON.stringify(logData));

    if (towns.some((t) => t.population > 50)) {
      //logSuccess("At least one town is doing okay");
      return true;
    }

    //logError("All towns died");
    saveLogs();
    return false;
  },
});

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

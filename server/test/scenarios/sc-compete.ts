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
    const townStorages = towns
      .map((l) => l.storage)
      .reduce((a, c) => a.concat(c), []);
    const totalTownFlour = townStorages
      .filter((s) => s.resourceType === RESOURCE_TYPE.Flour)
      .map((s) => s.resourceCount)
      .reduce((a, c) => a + c);

    const allAICompanies = world
      .getCompanies()
      .filter((c) => c.options.isAiEnabled);

    let events: Record<string, string>[] = [];

    if (world.getCurrentTick() % 100 === 0) {
      allAICompanies.forEach((c) => {
        const allCompanyTrucks = world
          .getTrucks()
          .filter((t) => t.companyId === c.id);
        if (allCompanyTrucks.length < 5) {
          world.createTruck(
            `Truck ${allCompanyTrucks.length}`,
            c.id,
            RESOURCE_TYPE.Flour,
            1000,
            { x: 50, y: 0, z: 25 },
            2,
          );
          events.push({
            type: "FlourTruckCreated",
            company: c.name,
          });
        }
      });
    }

    const logData = {
      avgPop: avgTownPop,
      avgConfidence: avgTownConfidence,
      totalTownFlour,
      events,
    };

    logInfo(JSON.stringify(logData));

    if (towns.some((t) => t.population > 50)) {
      return true;
    }

    logError("All towns died");

    return false;
  },
});

saveLogs();

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

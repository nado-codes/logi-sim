import { ITown, LOCATION_TYPE } from "@logisim/lib/entities";
import { setGlobalSeed } from "../../../lib/dist/utils/mathUtils";
import { logisimApi } from "../../src/api";
import { runBaseSimulation } from "../testHelpers/baseSimulation";

setGlobalSeed("base-scenario-seed");
const world = runBaseSimulation({
  simTarget: 100000,
  onTick: (world) => {
    const towns: ITown[] = world
      .getLocations()
      .filter((l) => l.locationType == LOCATION_TYPE.Town)
      .map((l) => l as ITown);

    if (towns.some((t) => t.population < 10)) {
      throw Error(`Town ran out of pop`);
    }
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

const api = logisimApi(world);
api.start();

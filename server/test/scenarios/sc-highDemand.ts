import { LOCATION_TYPE, RESOURCE_TYPE } from "@logisim/lib/entities";
import { setGlobalSeed } from "../../../lib/dist/utils/mathUtils";
import { logisimApi } from "../../src/api";
import { runBaseSimulation } from "../testHelpers/baseSimulation";

setGlobalSeed("highdemand-scenario-seed");
const world = runBaseSimulation({ simTarget: 0 });
const flourMill = world.getLocations().find((l) => l.name === "Flour Mill");
const town = world
  .getLocations()
  .find((l) => l.locationType === LOCATION_TYPE.Town);
const stateCompany = world.getCompanies().find((c) => c.name === "State");

if (!flourMill) {
  throw new Error("Can't find the flour mill");
}
if (!stateCompany) {
  throw new Error("Can't find The State company");
}

if (!town) {
  throw new Error("Can't find the town");
}

// Create a lot of contracts for the first town to create high demand on the flour mill
const createContract = () => {
  world.createContract(
    stateCompany.id,
    town.id,
    flourMill.id,
    RESOURCE_TYPE.Flour,
    1000,
    50,
  );
};

setInterval(createContract, 3000);
setInterval(world.update, 500);

const api = logisimApi(world);
api.start();

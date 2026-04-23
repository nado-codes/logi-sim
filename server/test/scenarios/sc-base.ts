import { setGlobalSeed } from "../../../lib/dist/utils/mathUtils";
import { logisimApi } from "../../src/api";
import { runBaseSimulation } from "../testHelpers/baseSimulation";

setGlobalSeed("base-scenario-seed");
const world = runBaseSimulation({ simTarget: 500 });

const api = logisimApi(world);
api.start();

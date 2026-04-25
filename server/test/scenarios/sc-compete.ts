import { setGlobalSeed } from "../../../lib/dist/utils/mathUtils";
import { logisimApi } from "../../src/api";
import { runCompetitiveSimulation } from "../testHelpers/competitiveSimulation";

setGlobalSeed("competitive-scenario-seed");
const world = runCompetitiveSimulation({ simTarget: 100000 });

const api = logisimApi(world);
api.start();

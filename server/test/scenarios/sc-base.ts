import { setGlobalSeed } from "@logisim/lib/utils";
import { logisimApi } from "../../src/api";
import { runBaseSimulation } from "../testHelpers/baseSimulation";

setGlobalSeed("deadlock-soak-test-seed");
const world = runBaseSimulation({ simTarget: 5 });

const api = logisimApi(world);
api.start();

import { logisimApi } from "../../src/api";
import { runBaseSimulation } from "../testHelpers/baseSimulation";

const world = runBaseSimulation({ simTarget: 100 });

const api = logisimApi(world);
api.start();

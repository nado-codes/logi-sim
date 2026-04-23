import { describe, it, expect } from "vitest";
import { runBaseSimulation } from "../testHelpers/baseSimulation";
import { IWorld } from "../../src/world/world";
import { highlight, setGlobalSeed } from "@logisim/lib/utils";
import { ITruck } from "../../../lib/dist/entities/truck";

describe("deadlock soak", () => {
  it("No loaded truck may be idle for more than 2 ticks", () => {
    let previousTickLoadedTrucks: ITruck[] = [];
    const loadedTrucksTicksIdle: Record<string, number> = {};

    const observe = (world: IWorld) => {
      const loadedTrucks = world
        .getTrucks()
        .filter((t) => t.storage.resourceCount > 0);

      loadedTrucks.forEach((t) => {
        if (
          previousTickLoadedTrucks.find(
            (ptt) => ptt.id === t.id && t.position === ptt.position,
          )
        ) {
          loadedTrucksTicksIdle[t.id] = (loadedTrucksTicksIdle[t.id] ?? 0) + 1;
        }
      });

      previousTickLoadedTrucks = loadedTrucks;

      const stuckTruck = Object.entries(loadedTrucksTicksIdle).find(
        ([_, ticksIdle]) => ticksIdle > 2,
      );
      expect(
        stuckTruck?.[0],
        `Truck with id ${stuckTruck?.[0]} has been idle with resources for ${stuckTruck?.[1]} ticks`,
      ).toBeUndefined();
    };

    setGlobalSeed("deadlock-soak-test-seed");
    runBaseSimulation({ simTarget: 1500, onTick: observe });
  });
});

import { describe, it, expect } from "vitest";
import { runBaseSimulation } from "../testHelpers/baseSimulation";
import { IWorld } from "../../src/world/world";
import { highlight, setGlobalSeed, vectorsAreEqual } from "@logisim/lib/utils";
import { Vector3 } from "@logisim/lib/entities";

describe("deadlock soak", () => {
  it("No loaded truck may be idle for more than 5 ticks", () => {
    const previousTickLoadedTruckPositions: Record<string, Vector3> = {};
    const loadedTrucksTicksIdle: Record<string, number> = {};

    const observe = (world: IWorld) => {
      const loadedTrucks = world
        .getTrucks()
        .filter((t) => t.storage.resourceCount > 0);

      loadedTrucks.forEach((t) => {
        const tPreviousPosition = previousTickLoadedTruckPositions[t.id];
        if (tPreviousPosition) {
          if (vectorsAreEqual(t.position, tPreviousPosition)) {
            console.log(
              `${highlight.yellow(t.name)} has been idle for ${
                loadedTrucksTicksIdle[t.id] ?? 0
              } ticks at position ${highlight.yellow(JSON.stringify(t.position))}`,
            );
            loadedTrucksTicksIdle[t.id] =
              (loadedTrucksTicksIdle[t.id] ?? 0) + 1;
          } else {
            loadedTrucksTicksIdle[t.id] = 0;
          }
        }
        previousTickLoadedTruckPositions[t.id] = structuredClone(t.position);
      });

      const stuckTruckInfo = Object.entries(loadedTrucksTicksIdle).find(
        ([_, ticksIdle]) => ticksIdle > 5,
      );
      const stuckTruckId = stuckTruckInfo?.[0];
      const stuckTruck = stuckTruckId ? world.getTruckById(stuckTruckId) : null;
      const stuckTruckMessage = stuckTruck
        ? `${highlight.yellow(stuckTruck.name)} at position ${highlight.yellow(
            JSON.stringify(stuckTruck.position),
          )} with ${highlight.yellow(stuckTruck.storage.resourceCount + " " + stuckTruck.storage.resourceType)}`
        : "Unknown truck got stuck";
      expect(
        stuckTruckInfo,
        `${stuckTruckMessage} has been idle for ${stuckTruckInfo?.[1]} ticks`,
      ).toBeUndefined();
    };

    setGlobalSeed("deadlock-soak-test-seed");
    runBaseSimulation({ simTarget: 1500, onTick: observe });
  });
});

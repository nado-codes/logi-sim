import { describe, it, expect } from "vitest";
import { runBaseSimulation } from "../testHelpers/baseSimulation";
import { IWorld } from "../../src/world/world";

describe("deadlock soak", () => {
  it("economy should not deadlock over 5000 ticks", () => {
    const observe = (world: IWorld) => {
      console.log("observing world state at tick ", world.getCurrentTick());
    };

    const world = runBaseSimulation({ simTarget: 5000, onTick: observe });

    const nonStateCompanies = world
      .getCompanies()
      .filter((c) => c.name !== "State");

    const anyMoneyChanged = nonStateCompanies.some((c) => c.money !== 100000);

    expect(
      anyMoneyChanged,
      "Economy deadlocked: no non-State company's money changed after 5000 ticks",
    ).toBe(true);
  });
});

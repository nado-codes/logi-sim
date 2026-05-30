import { describe, expect, it } from "vitest";
import { createWorld } from "../../src/world/world";
import { Color } from "@logisim/lib/utils";
import { Pos3DZero } from "@logisim/lib/entities";

describe("confident towns must grow", () => {
    const world = createWorld();

    const company = world.createCompany("TestCompany",1,Color.Red);
    const town = world.createTown("ConfiTown",company.id,Pos3DZero,true);
    town.confidence = 100;

    it("should have a population greater than or equal to 110 after 10 ticks", () => {
        for(var samples = 0; samples < 10; ++samples) {
            world.update();
        }
        expect(town.population).toBeGreaterThanOrEqual(110);
    });
});
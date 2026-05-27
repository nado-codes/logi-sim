import { describe, expect, it } from "vitest";
import { RESOURCE_TYPE } from "../../../lib/dist/entities/storage";
import { createWorld } from "../../src/world/world";
import { Color } from "@logisim/lib/utils";
import { updateTowns } from "../../src/world/locations/consumers/towns";

describe("confident towns must grow", () => {
    const world = createWorld();

    const company = world.createCompany("TestCompany",1,Color.Red);
    const town = world.createTown("ConfiTown",company.id,{x: 0, y: 0, z: 0},true);
    town.confidence = 100;

    it("should have a population greater than or equal to 110 after 10 ticks", () => {
        for(var samples = 0; samples < 10; ++samples) {
            world.update();
        }
        expect(town.population).toBeGreaterThanOrEqual(110);
    });
});
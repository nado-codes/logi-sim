import { describe, expect, it } from "vitest";
import { RESOURCE_TYPE } from "../../../lib/dist/entities/storage";
import { createWorld } from "../../src/world/world";

describe("create location from item id", () => {
    const world = createWorld();

    it("should create a location with the correct recipe based on the item id", () => {
        const location = world.createLocationFromItemId("location-bakery", "company-1", { x: 0, y: 0, z: 0 });
        expect(location.recipe.inputs).toEqual({ [RESOURCE_TYPE.Flour]: 800 });
        expect(location.recipe.outputs).toEqual({ [RESOURCE_TYPE.Bread]: 600 });
    });
});
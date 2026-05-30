import { describe, expect, it } from "vitest";
import { RESOURCE_TYPE } from "../../../lib/dist/entities/storage";
import { createWorld } from "../../src/world/world";
import { Pos3DZero } from "@logisim/lib/entities";

describe("create location from item id", () => {
    const world = createWorld();

    it("should create a location with the correct recipe based on the item id", () => {
        const location = world.createLocationFromItemId("location-bakery", "company-1", Pos3DZero);
        expect(location.recipe.inputs).toEqual({ [RESOURCE_TYPE.Flour]: 800 });
        expect(location.recipe.outputs).toEqual({ [RESOURCE_TYPE.Bread]: 600 });
    });
});
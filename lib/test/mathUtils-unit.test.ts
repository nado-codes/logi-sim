import { describe, expect, it } from "vitest";
import { Pos3D } from "@logisim/lib/entities";
import { getDistanceBetweenPositions } from "@logisim/lib/utils";

describe("pos distance must be legit", () => {
  const posA: Pos3D = { x: 0, y: 0, z: 0 };
  const posB: Pos3D = { x: 5, y: 5, z: 5 };

  // x 5-0 = 5(2) = 25
  // y 5-0 = 5(2) = 25
  // z 5-0 = 5(2) = 25
  // = sqrt(75) =

  it("should be correct", () => {
    const distance = getDistanceBetweenPositions(posA, posB);
    expect(distance).toBeCloseTo(8.66, 2);
  });
});

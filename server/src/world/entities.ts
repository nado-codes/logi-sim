import { IWorldState, Vector3 } from "@logisim/lib/entities";
import { vectorsAreEqual } from "@logisim/lib/utils";

export const getWorldEntityByPositionOrNull = (
  state: IWorldState,
  position: Vector3,
) => {
  const worldEntities = [
    ...state.getLocations(),
    ...state.geographies,
    ...state.trucks,
  ];

  return worldEntities.find((e) => vectorsAreEqual(e.position, position));
};

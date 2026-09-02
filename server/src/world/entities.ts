import { IWorldState, Pos3D } from "@logisim/lib/entities";
import { positionsAreEqual } from "@logisim/lib/utils";

export const getWorldEntityByPositionOrNull = (
  state: IWorldState,
  position: Pos3D,
) => {
  const worldEntities = [
    ...state.getLocations(),
    ...state.geographies,
    ...state.trucks,
  ];

  return worldEntities.find((e) => positionsAreEqual(e.position, position));
};

export const getWorldEntityByXPositionOrNull = (
  state: IWorldState,
  posX: number,
) => {
  const worldEntities = [
    ...state.getLocations(),
    ...state.geographies,
    ...state.trucks,
  ];

  return worldEntities.find((e) => e.position.x === posX);
};

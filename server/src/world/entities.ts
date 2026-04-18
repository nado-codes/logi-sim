import { IWorldState, Vector3 } from "@logisim/lib/entities";

export const getWorldEntityByPositionOrNull = (
  state: IWorldState,
  position: Vector3,
) => {
  const worldEntities = [
    ...state.getLocations(),
    ...state.geographies,
    ...state.trucks,
  ];

  return worldEntities.find((e) => e.position === position);
};

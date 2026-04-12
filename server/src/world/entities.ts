import { IWorldState } from "@logisim/lib";

export const getWorldEntityByPositionOrNull = (
  state: IWorldState,
  position: number,
) => {
  const worldEntities = [
    ...state.getLocations(),
    ...state.geographies,
    ...state.trucks,
  ];

  return worldEntities.find((e) => e.position === position);
};

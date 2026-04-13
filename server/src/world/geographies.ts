import {
  GEOGRAPHY_TYPE,
  IGeographicEntity,
  WorldEntityType,
  IWorldState,
  ICoastline,
  IWater,
  IMountain,
  RESOURCE_TYPE,
  IResourceDeposit,
} from "@logisim/lib/entities";
import { createWorldEntity } from "../entities";
import { loadConfig } from "../utils/configUtils";

interface IGeographyConfig {
  arableLandRadius: number;
}

const defaultConfig: IGeographyConfig = {
  arableLandRadius: 3,
};

export const loadGeographyConfig = () => loadConfig("geography", defaultConfig);

export const createBaseGeographicEntity = (
  position: number,
  name: string,
  geographyType: GEOGRAPHY_TYPE,
): IGeographicEntity => {
  return {
    ...createWorldEntity(WorldEntityType.Geography, position, name),
    geographyType,
  };
};

export const createCoastline = (
  state: IWorldState,
  position: number,
): ICoastline => {
  const newCoastline: ICoastline = {
    ...createBaseGeographicEntity(
      position,
      "Coastline",
      GEOGRAPHY_TYPE.Coastline,
    ),
  };

  state.geographies.push(newCoastline);

  return newCoastline;
};

export const createWater = (state: IWorldState, position: number): IWater => {
  const newWater: ICoastline = {
    ...createBaseGeographicEntity(position, "Water", GEOGRAPHY_TYPE.Water),
  };

  state.geographies.push(newWater);

  return newWater;
};

export const createMountain = (
  state: IWorldState,
  position: number,
  width: number,
  height: number,
): IMountain => {
  const newMountain: IMountain = {
    ...createBaseGeographicEntity(
      position,
      "Mountain",
      GEOGRAPHY_TYPE.Mountain,
    ),
    width,
    height,
  };

  state.geographies.push(newMountain);

  return newMountain;
};

export const createResourceDeposit = (
  state: IWorldState,
  position: number,
  resourceType: RESOURCE_TYPE,
): IResourceDeposit => {
  const newResourceDeposit: IResourceDeposit = {
    ...createBaseGeographicEntity(
      position,
      "Resource Deposit",
      GEOGRAPHY_TYPE.ResourceDeposit,
    ),
    resourceType,
  };

  state.geographies.push(newResourceDeposit);

  return newResourceDeposit;
};

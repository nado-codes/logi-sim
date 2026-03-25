import { Color } from "../utils/logUtils";
import { IWorldEntity } from "./entity";
import { RESOURCE_TYPE } from "./storage";

export enum GEOGRAPHY_TYPE {
  Coastline = "Coastline",
  Water = "Water",
  Mountain = "Mountain",
  ResourceDeposit = "ResourceDeposit",
}

export interface IGeographicEntity extends IWorldEntity {
  geographyType: GEOGRAPHY_TYPE;
}

export interface ICoastline extends IGeographicEntity {}

export interface IWater extends IGeographicEntity {}

export interface IMountain extends IGeographicEntity {
  width: number;
  height: number;
}

export interface IResourceDeposit extends IGeographicEntity {
  resourceType: RESOURCE_TYPE;
}

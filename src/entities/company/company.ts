import { Color } from "../../utils";
import { Contract } from "../contract";
import { BaseEntity, IBaseEntity, IWorldEntity } from "../entity";
import { BaseLocation } from "../location";
import { ITruck, Truck } from "../truck";

export type Company = {
  money: number;
  color: Color;
} & BaseEntity;

export interface ICompany extends IBaseEntity {
  getMoney: () => number;
  getColor: () => Color;
  getTrucks: () => ITruck[];
  getContracts: () => Contract[];
  getLocations: () => BaseLocation[];
}

export interface ICompanyAsset extends IWorldEntity {
  getCompanyId: () => string;
}

import { Color } from "../../utils/utils";
import { Contract } from "../contract";
import { BaseEntity, IBaseEntity, INamedEntity } from "../entity";
import { BaseLocation } from "../location";
import { ITruck } from "../truck";

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

export interface ICompanyAsset extends INamedEntity {
  getCompanyId: () => string;
}

import { Contract } from "../contract";
import { BaseEntity } from "../entity";
import { BaseLocation } from "../location";
import { Truck } from "../truck";

export type Company = {
  money: number;
  color: string;
} & BaseEntity;

export interface ICompany {
  getName: () => string;
  getMoney: () => number;
  getColor: () => string;
  getTrucks: () => Truck[];
  getContracts: () => Contract[];
  getLocations: () => BaseLocation[];
}

import { IBaseLocation } from "./location";
import { RESOURCE_TYPE } from "./storage";
import { ITruck } from "./truck";

export interface IContract {
  id: string;
  owner: IBaseLocation;
  supplier: IBaseLocation;
  shipper: ITruck | undefined;
  resourceType: RESOURCE_TYPE;
  amount: number;
  payment: number;
  dueTicks: number;
}

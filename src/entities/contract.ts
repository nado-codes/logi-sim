import { ICompanyEntity } from "./company";
import { IBaseLocation } from "./location";
import { RESOURCE_TYPE } from "./storage";
import { ITruck } from "./truck";

export interface IContractUnsafe extends ICompanyEntity {
  destination: IBaseLocation;
  supplier: IBaseLocation;
  shipper: ITruck | undefined;
  resourceType: RESOURCE_TYPE;
  amount: number;
  payment: number;
  dueTicks: number;
}

export interface IContract extends ICompanyEntity {
  destinationId: string;
  supplierId: string;
  shipperId?: string | undefined;
  resourceType: RESOURCE_TYPE;
  amount: number;
  payment: number;
  dueTicks: number;
}

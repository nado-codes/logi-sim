import { CompanyEntity } from "./company/companyEntity";
import { BaseLocation } from "./location";
import { RESOURCE_TYPE } from "./storage";
import { Truck } from "./truck";

export type Contract = {
  destination: BaseLocation;
  supplier: BaseLocation;
  shipper: Truck | undefined;
  resourceType: RESOURCE_TYPE;
  amount: number;
  payment: number;
  dueTicks: number;
} & CompanyEntity;

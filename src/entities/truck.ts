import { CompanyEntity } from "./company/companyEntity";
import { Contract } from "./contract";
import { BaseLocation } from "./location";
import { Storage } from "./storage";

export type Truck = {
  id: string;
  position: number;
  speed: number;
  destination?: BaseLocation;
  contract?: Contract;
  storage: Storage;
} & CompanyEntity;

import { ICompanyAsset } from "./company/company";
import { CompanyEntity } from "./company/companyEntity";
import { Contract } from "./contract";
import { BaseLocation } from "./location";
import { IStorage, Storage } from "./storage";

export type Truck = {
  id: string;
  position: number;
  speed: number;
  destination?: BaseLocation;
  contract?: Contract;
  storage: Storage;
} & CompanyEntity;

export interface ITruck extends ICompanyAsset {
  getSpeed: () => number;
  getDestinationId: () => string;
  getContractId: () => string;
  getStorage: () => IStorage;
}

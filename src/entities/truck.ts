import { Result } from "../utils/result";
import { ICompanyAsset } from "./company/company";
import { CompanyEntity } from "./company/companyEntity";
import { Contract } from "./contract";
import { IWorldEntity } from "./entity";
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

export interface ITruck extends IWorldEntity, ICompanyAsset {
  getSpeed: () => number;
  getDestinationId: () => string | undefined;
  getContractId: () => string | undefined;
  getStorage: () => IStorage;

  move: (direction: number) => Result;
}

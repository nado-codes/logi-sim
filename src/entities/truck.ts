import { ICompanyEntity } from "./company";
import { IWorldEntity } from "./entity";
import { IStorage } from "./storage";

export enum VEHICLE_TYPE {
  Truck = "Truck",
}

export interface IVehicle extends IWorldEntity, ICompanyEntity {
  vehicleType: VEHICLE_TYPE;
  storage: IStorage;
  speed: number;
  destinationId?: string | undefined;
  contractId?: string | undefined;
}

export interface ITruck extends IVehicle {}

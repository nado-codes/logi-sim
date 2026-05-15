import { ICompanyEntity } from "./company";
import { IWorldEntity } from "./entity";
import { IBaseItem } from "./item";
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

export interface IVehicleItem extends IBaseItem {
  resourceItemId: string;
  resourceCapacity: number;
  speed: number;
}

export interface ITruck extends IVehicle {}

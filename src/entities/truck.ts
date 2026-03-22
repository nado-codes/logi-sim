import { ICompanyEntity } from "./company";
import { IWorldEntity } from "./entity";
import { IStorage } from "./storage";

export interface ITruck extends IWorldEntity, ICompanyEntity {
  speed: number;
  destinationId?: string | undefined;
  contractId?: string | undefined;
  storage: IStorage;
}

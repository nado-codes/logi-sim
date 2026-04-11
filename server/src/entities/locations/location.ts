import { ICompanyEntity } from "../company";
import { IWorldEntity } from "../entity";
import { IRecipe, IStorage } from "../storage";

export enum LOCATION_TYPE {
  Producer = "Producer",
  Processor = "Processor",
  Consumer = "Consumer",
  Town = "Town",
}

export interface IBaseLocation extends ICompanyEntity, IWorldEntity {
  storage: IStorage[];
  recipe: IRecipe;
  locationType: LOCATION_TYPE;
}

export interface IProducer extends IBaseLocation {}

export interface IProcessor extends IBaseLocation {}

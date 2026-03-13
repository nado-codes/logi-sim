import { ICompanyEntity } from "../company";
import { IWorldEntity } from "../entity";
import { IRecipe, IStorage } from "../storage";

export enum LOCATION_TYPE {
  PRODUCER = "Producer",
  PROCESSOR = "Processor",
  CONSUMER = "Consumer",
  TOWN = "Town",
}

export interface IBaseLocation extends ICompanyEntity, IWorldEntity {
  storage: IStorage[];
  recipe: IRecipe;
  type: LOCATION_TYPE;
}

export interface IProducer extends IBaseLocation {}

export interface IProcessor extends IBaseLocation {}

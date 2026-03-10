import { ICompanyEntity } from "../company";
import { IWorldEntity } from "../entity";
import { IRecipe, IStorage } from "../storage";
import { IBaseConsumer } from "./consumer";

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

export interface IProducer extends IBaseLocation {
  productionRate: number; // units per tick
  currentStock: number;
  maxStock: number; // optional storage limit
}

export interface IProcessor extends IBaseLocation {
  minInputThreshold: number; // stock level that triggers input contract
}

export type WorldLocation = IProducer | IProcessor | IBaseConsumer;

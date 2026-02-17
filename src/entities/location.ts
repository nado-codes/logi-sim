import { IRecipe, IStorage, RESOURCE_TYPE } from "./storage";

export enum LOCATION_TYPE {
  PRODUCER = "Producer",
  PROCESSOR = "Processor",
  CONSUMER = "Consumer",
}

export interface IBaseLocation {
  id: string;
  name: string;
  position: number;
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

export interface IConsumer extends IBaseLocation {
  minInputThreshold: number; // stock level that triggers delivery contract
}

export type WorldLocation = IProducer | IProcessor | IConsumer;

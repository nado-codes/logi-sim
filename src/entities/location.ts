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
  type: LOCATION_TYPE;
  storage: IStorage[];
}

export interface IProducer extends IBaseLocation {
  type: LOCATION_TYPE.PRODUCER;
  productionRate: number; // units per tick
  currentStock: number;
  maxStock: number; // optional storage limit
}

export interface IProcessor extends IBaseLocation {
  type: LOCATION_TYPE.PROCESSOR;
  recipe: IRecipe;
  minInputThreshold: number; // stock level that triggers input contract
}

export interface IConsumer extends IBaseLocation {
  type: LOCATION_TYPE.CONSUMER;
  consumptionRate: number;
  minStockThreshold: number; // stock level that triggers delivery contract
}

export type WorldLocation = IProducer | IProcessor | IConsumer;

import { CompanyEntity } from "./company/companyEntity";
import { BaseEntity } from "./entity";
import { IRecipe, Storage, RESOURCE_TYPE } from "./storage";

export enum LOCATION_TYPE {
  PRODUCER = "Producer",
  PROCESSOR = "Processor",
  CONSUMER = "Consumer",
}

export type BaseLocation = {
  position: number;
  storage: Storage[];
  recipe: IRecipe;
  type: LOCATION_TYPE;
} & CompanyEntity;

export interface IProducer extends BaseLocation {
  productionRate: number; // units per tick
  currentStock: number;
  maxStock: number; // optional storage limit
}

export interface IProcessor extends BaseLocation {
  minInputThreshold: number; // stock level that triggers input contract
}

export interface IConsumer extends BaseLocation {
  minInputThreshold: number; // stock level that triggers delivery contract
}

export type WorldLocation = IProducer | IProcessor | IConsumer;

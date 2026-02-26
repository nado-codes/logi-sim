import { CompanyEntity } from "./company/companyEntity";
import { IRecipe, Storage } from "./storage";

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

export type Producer = {
  productionRate: number; // units per tick
  currentStock: number;
  maxStock: number; // optional storage limit
} & BaseLocation;

export type Processor = {
  minInputThreshold: number; // stock level that triggers input contract
} & BaseLocation;

export type Consumer = {
  minInputThreshold: number; // stock level that triggers delivery contract
} & BaseLocation;

export type WorldLocation = Producer | Processor | Consumer;

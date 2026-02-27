import { CompanyEntity } from "./company/companyEntity";
import { IWorldEntity } from "./entity";
import { Recipe, IStorage, Storage } from "./storage";

export enum LOCATION_TYPE {
  PRODUCER = "Producer",
  PROCESSOR = "Processor",
  CONSUMER = "Consumer",
}

export type BaseLocation = {
  position: number;
  storage: Storage[];
  recipe: Recipe;
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


export interface IBaseLocation extends IWorldEntity {
  getType : () => LOCATION_TYPE
  getStorage: () => IStorage[];
  getRecipes: () => Recipe[];
}

export interface 

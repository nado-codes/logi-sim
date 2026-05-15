import { ICompanyEntity } from "../company";
import { IWorldEntity } from "../entity";
import { IBaseItem } from "../item";
import { IRecipe, IStorage } from "../storage";

export enum LOCATION_TYPE {
  Producer = "Producer",
  Processor = "Processor",
  Consumer = "Consumer",
  Town = "Town",
}

export interface ILocation extends ICompanyEntity, IWorldEntity {
  storage: IStorage[];
  recipe: IRecipe;
  locationType: LOCATION_TYPE;
}

export interface ILocationItem extends IBaseItem {
  recipe: IRecipe
  locationType: LOCATION_TYPE;
}

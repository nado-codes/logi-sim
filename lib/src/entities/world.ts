import { ICompany } from "./company";
import { IContract } from "./contract";
import { IGeographicEntity } from "./geography";
import { ITown } from "./locations/consumer";
import { ILocation } from "./locations/location";
import { ITruck } from "./truck";

export interface IWorldState {
  currentTick: number;
  producers: ILocation[];
  processors: ILocation[];
  towns: ITown[];
  contracts: IContract[];
  contractHistory: IContract[];
  trucks: ITruck[];
  companies: ICompany[];
  geographies: IGeographicEntity[];
  getLocations: () => ILocation[];
}

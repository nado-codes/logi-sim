import { ICompany } from "./company";
import { IContract } from "./contract";
import { ITown } from "./locations/consumer";
import { IProducer, IProcessor, IBaseLocation } from "./locations/location";
import { ITruck } from "./truck";

export interface IWorldState {
  currentTick: number;
  producers: IProducer[];
  processors: IProcessor[];
  towns: ITown[];
  contracts: IContract[];
  contractHistory: IContract[];
  trucks: ITruck[];
  companies: ICompany[];
  getLocations: () => IBaseLocation[];
}

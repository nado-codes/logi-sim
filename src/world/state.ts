// world/state.ts

import { Company, ICompany } from "../entities/company/company";
import { Contract } from "../entities/contract";
import { Producer, Processor, Consumer } from "../entities/location";
import { ITruck, Truck } from "../entities/truck";

export interface IWorldState {
  producers: Producer[];
  processors: Processor[];
  consumers: Consumer[];
  contracts: Contract[];
  trucksUnsafe: Truck[];
  trucks: ITruck[];
  companies: ICompany[];
}

export const createInitialState = (): IWorldState => ({
  producers: [],
  processors: [],
  consumers: [],
  contracts: [],
  trucksUnsafe: [],
  trucks: [],
  companies: [],
});

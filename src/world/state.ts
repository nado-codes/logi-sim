// world/state.ts

import { Company } from "../entities/company/company";
import { Contract } from "../entities/contract";
import { Producer, Processor, Consumer } from "../entities/location";
import { Truck } from "../entities/truck";

export interface IWorldState {
  producers: Producer[];
  processors: Processor[];
  consumers: Consumer[];
  contracts: Contract[];
  trucks: Truck[];
  companies: Company[];
}

export const createInitialState = (): IWorldState => ({
  producers: [],
  processors: [],
  consumers: [],
  contracts: [],
  trucks: [],
  companies: [],
});

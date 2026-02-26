// world/state.ts

import { Company } from "../entities/company/company";
import { Contract } from "../entities/contract";
import { IProducer, IProcessor, IConsumer } from "../entities/location";
import { Truck } from "../entities/truck";

export interface IWorldState {
  producers: IProducer[];
  processors: IProcessor[];
  consumers: IConsumer[];
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

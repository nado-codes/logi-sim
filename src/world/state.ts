// world/state.ts

import { IContract } from "../entities/contract";
import { IProducer, IProcessor, IConsumer } from "../entities/location";
import { ITruck } from "../entities/truck";

export interface IWorldState {
  producers: IProducer[];
  processors: IProcessor[];
  consumers: IConsumer[];
  contracts: IContract[];
  trucks: ITruck[];
}

export const createInitialState = (): IWorldState => ({
  producers: [],
  processors: [],
  consumers: [],
  contracts: [],
  trucks: [],
});

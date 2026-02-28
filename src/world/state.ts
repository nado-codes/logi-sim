// world/state.ts

import { ICompany } from "../entities/company";
import { IContract } from "../entities/contract";
import {
  IProducer,
  IProcessor,
  IConsumer,
  IBaseLocation,
} from "../entities/location";
import { ITruck } from "../entities/truck";

export interface IWorldState {
  producers: IProducer[];
  processors: IProcessor[];
  consumers: IConsumer[];
  contracts: IContract[];
  trucks: ITruck[];
  companies: ICompany[];
  getLocations: () => IBaseLocation[];
}

export const createInitialState = (): IWorldState => {
  const state = {
    producers: [],
    processors: [],
    consumers: [],
    contracts: [],
    trucks: [],
    companies: [],
  };

  return {
    ...state,
    getLocations: () => [
      ...state.producers,
      ...state.processors,
      ...state.consumers,
    ],
  };
};

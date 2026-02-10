import { RESOURCE_TYPE } from "../resources";

export enum LOCATION_TYPE {
  PRODUCER = "Producer",
  PROCESSOR = "Processor",
  CONSUMER = "Consumer",
}

export type TIER = 1 | 2 | 3;

export interface IBaseLocation {
  id: string;
  name: string;
  position: number;
  type: LOCATION_TYPE;
  tier: TIER;
}

export interface IProducer extends IBaseLocation {
  type: LOCATION_TYPE.PRODUCER;
  produces: RESOURCE_TYPE;
  productionRate: number; // units per tick
  currentStock: number;
  maxStock: number; // optional storage limit
}

export interface IProcessor extends IBaseLocation {
  type: LOCATION_TYPE.PROCESSOR;
  inputType: RESOURCE_TYPE;
  outputType: RESOURCE_TYPE;
  inputStock: number;
  outputStock: number;
  inputConsumptionRate: number;
  outputProductionRate: number; // how fast it converts input -> output
  minInputThreshold: number; // stock level that triggers input contract
  maxInputStock: number;
  maxOutputStock: number;
}

export interface IConsumer extends IBaseLocation {
  type: LOCATION_TYPE.CONSUMER;
  consumes: RESOURCE_TYPE;
  consumptionRate: number;
  currentStock: number;
  minStockThreshold: number; // stock level that triggers delivery contract
}

export type WorldLocation = IProducer | IProcessor | IConsumer;

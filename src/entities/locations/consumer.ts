import { IBaseLocation } from "./location";

export interface IBaseConsumer extends IBaseLocation {}

export enum CONSUMER_TYPE {
  Sink = "Sink",
  Town = "Town",
}

export interface ITown extends IBaseConsumer {
  confidence: number;
  population: number;
}

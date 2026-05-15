import { ILocation } from "./location";

export interface IBaseConsumer extends ILocation {}

export enum CONSUMER_TYPE {
  Sink = "Sink",
  Town = "Town",
}

export interface ITown extends IBaseConsumer {
  confidence: number;
  population: number;
}

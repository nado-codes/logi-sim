import { IBaseLocation } from "./location";

export interface IBaseConsumer extends IBaseLocation {}

export interface ITown extends IBaseConsumer {
  confidence: number;
  population: number;
}

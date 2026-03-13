import { IBaseLocation } from "./location";

export interface IBaseConsumer extends IBaseLocation {}

export interface ITown extends IBaseConsumer {
  confidence: number;
  population: number;
}

export enum TownTier {
  TierOne = "TIER_ONE",
  TierTwo = "TIER_TWO",
  TierThree = "TIER_THREE",
}

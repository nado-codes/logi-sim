import { IContract } from "./contract";
import { IBaseLocation } from "./location";
import { IStorage } from "./storage";

export interface ITruck {
  id: string;
  position: number;
  speed: number; //..how many km per tick that the truck will travel
  destination?: IBaseLocation;
  contract?: IContract;
  storage: IStorage;
}

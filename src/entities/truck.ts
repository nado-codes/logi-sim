import { IBaseLocation } from "./location";
import { IStorage } from "./storage";

export interface Truck {
  id: string;
  position: number;
  speed: number; //..how many km per tick that the truck will travel
  destination?: IBaseLocation;
  storage?: IStorage;
}

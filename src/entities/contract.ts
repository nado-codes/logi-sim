import { RESOURCE_TYPE } from "./storage";

export interface IContract {
  id: string;
  owner: string;
  supplier: string;
  shipper: string | undefined;
  resource: RESOURCE_TYPE;
  amount: number;
  payment: number;
  dueTicks: number;
}

import { RESOURCE_TYPE } from "../resources";

export interface IContract {
  id: string;
  owner: string;
  shipper: string | undefined;
  origin: string;
  destination: string;
  resource: RESOURCE_TYPE;
  amount: number;
  payment: number;
  dueTicks: number;
}

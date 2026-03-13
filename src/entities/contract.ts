import { ICompanyEntity } from "./company";
import { RESOURCE_TYPE } from "./storage";

export interface IContract extends ICompanyEntity {
  destinationId: string;
  supplierId: string;
  shipperId?: string | undefined;
  resourceType: RESOURCE_TYPE;
  totalAmount: number;
  amountDelivered: number;
  payment: number;
  expectedTick: number;
  deliveredTick?: number;
}

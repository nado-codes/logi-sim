import { Color } from "../utils/color";
import { IBaseEntity, INamedEntity } from "./entity";

export interface ICompanyDebt {
  creditorCompanyId: string;
  amount: number;
  paymentPerTick?: number;
  reason: string;
  createdAtTick: number;
}

export enum RegulatoryActionStatus {
  None,
  PreProbation,
  Probation,
  PreSuspensionNotice,
  SuspensionNotice,
  PreCeasedOperations,
  CeasedOperations,
}

export interface ICompany extends INamedEntity {
  money: number;
  color: Color;
  insolvencyCounter: number;
  isInsolvent: boolean;
  isLiquidated: boolean;
  debts: ICompanyDebt[];
  options: ICreateCompanyOptions;
}

export type ICreateCompanyOptions = {
  isAiEnabled: boolean;
  isGovernment: boolean;
  hasUnlimitedMoney: boolean;
};

export const defaultCompanyOptions: ICreateCompanyOptions = {
  isAiEnabled: false,
  hasUnlimitedMoney: false,
  isGovernment: false,
};

export interface ICompanyEntity extends IBaseEntity {
  companyId: string;
}

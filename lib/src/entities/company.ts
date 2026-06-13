import { Color } from "../utils/color";
import { IBaseEntity, INamedEntity } from "./entity";

export interface ICompanyDebt {
  creditorCompanyId: string;
  amount: number;
  reason: string;
  createdAtTick: number;
}
export interface ICompany extends INamedEntity {
  money: number;
  color: Color;
  isInsolvent: boolean;
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

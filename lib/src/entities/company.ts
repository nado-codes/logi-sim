import { Color } from "../utils/color";
import { IBaseEntity, INamedEntity } from "./entity";

export interface ICompany extends INamedEntity {
  money: number;
  color: Color;
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

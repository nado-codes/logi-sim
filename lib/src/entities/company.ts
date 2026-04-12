import { IBaseEntity, INamedEntity } from "./entity";

enum Color {
  Red = "31m",
  Yellow = "33m",
  Cyan = "36m",
  Green = "32m",
  Blue = "34m",
  Magenta = "35m",
  White = "37m",
  Gray = "90m",
  BrightRed = "91m",
  BrightYellow = "93m",
  BrightCyan = "96m",
  BrightGreen = "92m",
}

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

import { IBaseEntity } from "./entity";

export interface ICompany extends IBaseEntity {
  money: number;
  color: string;
}

export interface ICompanyEntity extends IBaseEntity {
  companyId: string;
}

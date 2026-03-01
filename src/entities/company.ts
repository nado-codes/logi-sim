import { Color } from "../logUtils";
import { IBaseEntity, INamedEntity } from "./entity";

export interface ICompany extends INamedEntity {
  money: number;
  color: Color;
}

export interface ICompanyEntity extends IBaseEntity {
  companyId: string;
}

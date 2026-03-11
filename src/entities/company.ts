import { Color } from "../utils/logUtils";
import { IBaseEntity, INamedEntity } from "./entity";

export interface ICompany extends INamedEntity {
  money: number;
  color: Color;
}

export interface ICompanyEntity extends IBaseEntity {
  companyId: string;
}

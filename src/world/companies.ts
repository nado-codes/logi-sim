import { ICompany, ICompanyEntity } from "../entities/company";
import { createBaseEntity, createNamedEntity } from "../entities";
import { IWorldState } from "./state";

export const createCompany = (
  state: IWorldState,
  name: string,
  money: number,
  color: string,
): ICompany => {
  const newCompany: ICompany = {
    ...createNamedEntity(name),
    money,
    color,
  };

  state.companies.push(newCompany);

  return newCompany;
};

export const createCompanyEntity = (companyId: string): ICompanyEntity => {
  return {
    ...createBaseEntity(),
    companyId,
  };
};

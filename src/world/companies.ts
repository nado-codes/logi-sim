import { ICompany, ICompanyEntity } from "../entities/company";
import { createBaseEntity, createNamedEntity } from "../entities";
import { IWorldState } from "./state";
import { Color } from "../logUtils";

// .. CREATE
export const createCompany = (
  state: IWorldState,
  name: string,
  money: number,
  color: Color,
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

// GET

export const getCompanyById = (state: IWorldState, id: string) => {
  const company = state.companies.find((cm) => cm.id === id);

  if (!company) {
    throw Error(`Company with id ${id} doesn't exist`);
  }

  return company;
};

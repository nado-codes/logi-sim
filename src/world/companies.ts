import { ICompany, ICompanyEntity } from "../entities/company";
import { createBaseEntity, createNamedEntity } from "../entities";
import { Color, highlight } from "../logUtils";
import { IWorldState } from "../entities/world";

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

export const getCompanyString = (company: ICompany) => {
  return `Name: ${highlight.yellow(company.name)} | Money: ${highlight.yellow(company.money + "")} | Color: ${highlight.custom("███", company.color)}`;
};

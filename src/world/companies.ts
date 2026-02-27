import { ICompany, ICompanyAsset } from "../entities/company/company";
import { Color } from "../utils";
import { IWorldState } from "./state";
import { createNamedEntity, createWorldEntity } from "../entities";

export const createCompany = (
  world: IWorldState,
  name: string,
  money: number,
  color: Color,
): ICompany => {
  const worldLocations = [
    ...world.producers,
    ...world.processors,
    ...world.consumers,
  ];
  const newCompany: ICompany = {
    ...createNamedEntity(name),
    getMoney: () => money,
    getColor: () => color,
    getContracts: () =>
      world.contracts.filter((c) => c.companyId === newCompany.getId()),
    getLocations: () =>
      worldLocations.filter((l) => l.companyId === newCompany.getId()),
    getTrucks: () =>
      world.trucks.filter((t) => t.getCompanyId() === newCompany.getId()),
  };

  world.companies.push(newCompany);

  return newCompany;
};

export const createCompanyAsset = (
  companyId: string,
  position: number,
  name: string,
): ICompanyAsset => {
  return {
    ...createWorldEntity(position, name),
    getCompanyId: () => companyId,
  };
};

export const getCompanyById = (world: IWorldState, companyId: string) => {
  const company = world.companies.find((c) => c.getId() === companyId);

  if (!company) {
    throw Error(`Company with id ${companyId} doesn't exist`);
  }

  return company;
};

import { randomUUID } from "crypto";
import { Company, ICompany } from "../entities/company/company";
import { IWorld } from "./world";

export const createCompany = (
  world: IWorld,
  name: string,
  money: number,
  color: string,
): ICompany => {
  const company: Company = {
    id: randomUUID(),
    name,
    money,
    color,
  };

  return {
    getName: () => company.name,
    getMoney: () => company.money,
    getColor: () => company.color,
    getContracts: () =>
      world.getContracts().filter((c) => c.companyId === company.id),
    getTrucks: () =>
      world.getTrucks().filter((t) => t.companyId === company.id),
    getLocations: () =>
      world.getLocations().filter((l) => l.companyId === company.id),
  };
};

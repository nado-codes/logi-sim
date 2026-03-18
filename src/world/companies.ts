import { ICompany, ICompanyEntity } from "../entities/company";
import { createBaseEntity, createNamedEntity } from "../entities";
import { Color, highlight, logInfo } from "../utils/logUtils";
import { IWorldState } from "../entities/world";

// .. CREATE
export const createCompany = (
  state: IWorldState,
  name: string,
  money: number,
  color: Color,
  isStateControlled: boolean = false,
): ICompany => {
  const newCompany: ICompany = {
    ...createNamedEntity(name),
    money,
    color,
    isStateControlled,
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

// UPDATE

export const transferFunds = (
  fromCompany: ICompany,
  toCompany: ICompany,
  amount: number,
) => {
  if (fromCompany.money > 0) {
    if (!fromCompany.isStateControlled) {
      fromCompany.money -= Math.abs(amount);
    }

    toCompany.money += Math.abs(amount);

    const transferString = `${highlight.yellow(fromCompany.name)} transferred ${highlight.yellow("$" + amount)} to ${highlight.yellow(toCompany.name)}`;
    const moneyString =
      fromCompany.money > 0
        ? `${highlight.yellow("$" + fromCompany.money)}`
        : `${highlight.red("$" + fromCompany.money)}`;

    logInfo(`${transferString} and has ${moneyString} left`);
  }
};

/**
 * Transfer funds to state (economic sink).
 *
 * In Phase 2, this represents operating costs (fuel, maintenance)
 * going into "the void" since fuel stations/service providers
 * don't exist yet.
 *
 * In Phase 5+, replace with transferFunds(company, serviceProvider, amount)
 * to route money to actual economic actors.
 *
 * State-controlled companies are exempt (infinite funds).
 */
export const transferFundsToState = (fromCompany: ICompany, amount: number) => {
  if (!fromCompany.isStateControlled && fromCompany.money > 0) {
    fromCompany.money -= Math.abs(amount);

    const transferString = `${highlight.yellow(fromCompany.name)} transferred ${highlight.yellow("$" + amount)} to ${highlight.yellow("State")}`;
    const moneyString =
      fromCompany.money > 0
        ? `${highlight.yellow("$" + fromCompany.money)}`
        : `${highlight.red("$" + fromCompany.money)}`;

    logInfo(`${transferString} and has ${moneyString} left`);
  }
};

import {
  defaultCompanyOptions,
  ICompany,
  ICompanyEntity,
  ICreateCompanyOptions,
} from "../entities/company";
import { createBaseEntity, createNamedEntity } from "../entities";
import {
  Color,
  highlight,
  logInfo,
  logSuccess,
  logWarning,
} from "../utils/logUtils";
import { IWorldState } from "../entities/world";
import { GEOGRAPHY_TYPE, IResourceDeposit } from "../entities/geography";
import { loadGeographyConfig } from "./geographies";
import { world } from "..";
import { randomUUID } from "node:crypto";
import { loadNotificationConfig } from "../notifications";
import { Nullable } from "../entities/entity";

const geographyConfig = loadGeographyConfig();
const notificationConfig = loadNotificationConfig();

// .. CREATE
export const createCompany = (
  state: IWorldState,
  name: string,
  money: number,
  color: Color,
  options: Partial<ICreateCompanyOptions>,
): ICompany => {
  const newCompany: ICompany = {
    ...createNamedEntity(name),
    money,
    color,
    options: { ...defaultCompanyOptions, ...options },
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

export const getCompanyByIdOrNull = (state: IWorldState, id: string) => {
  const company = state.companies.find((cm) => cm.id === id);

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
    if (!fromCompany.options.hasUnlimitedMoney) {
      fromCompany.money -= Math.abs(amount);
    }

    toCompany.money += Math.abs(amount);

    const transferString = `${highlight.yellow(fromCompany.name)} transferred ${highlight.yellow("$" + amount)} to ${highlight.yellow(toCompany.name)}`;
    const moneyString =
      fromCompany.money > 0
        ? `${highlight.yellow("$" + fromCompany.money)}`
        : `${highlight.red("$" + fromCompany.money)}`;

    if (notificationConfig.logCompanyNotifications) {
      logInfo(`${transferString} and has ${moneyString} left`);
    }
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
  if (!fromCompany.options.hasUnlimitedMoney && fromCompany.money > 0) {
    fromCompany.money -= Math.abs(amount);

    const transferString = `${highlight.yellow(fromCompany.name)} transferred ${highlight.yellow("$" + amount)} to ${highlight.yellow("State")}`;
    const moneyString =
      fromCompany.money > 0
        ? `${highlight.yellow("$" + fromCompany.money)}`
        : `${highlight.red("$" + fromCompany.money)}`;

    if (notificationConfig.logCompanyNotifications) {
      logInfo(`${transferString} and has ${moneyString} left`);
    }
  }
};

export const updateCompanies = (state: IWorldState) => {
  logInfo(`Updating companies...`);
  state.companies.forEach((company) => {
    if (!company.options.isAiEnabled) {
      if (notificationConfig.logCompanyNotifications) {
        logWarning(`[COMPANY] AI behaviour for ${company.name} not enabled`);
      }
      return;
    }

    logInfo(`[COMPANY] Running AI behaviour for ${company.name}...`);

    const positionHasLocation = (position: number) => {
      const allLocations = state.getLocations();
      return !!allLocations.find((l) => l.position === position);
    };
    const createTowns = () => {
      logInfo(`[COMPANY] Trying to create a town...`);

      // 1. Towns -> Near arable land & water //
      const allWater = state.geographies.filter(
        (g) => g.geographyType === GEOGRAPHY_TYPE.Water,
      );

      if (allWater.length === 0 && notificationConfig.logCompanyNotifications) {
        logWarning(`[COMPANY] No water found - skipping town creation`);
      }

      const allEdges = allWater.map((w) => [
        w.position - geographyConfig.arableLandRadius - 1,
        w.position + geographyConfig.arableLandRadius + 1,
      ]);

      let spawnPos: Nullable<number> = undefined;

      allEdges.forEach(([leftEdge, rightEdge]) => {
        let posLeft = leftEdge;
        let posRight = rightEdge;

        while (spawnPos === undefined) {
          posLeft--;
          posRight++;

          if (!positionHasLocation(posLeft)) {
            spawnPos = posLeft;
          } else if (!positionHasLocation(posRight)) {
            spawnPos = posRight;
          }
        }
      });

      if (spawnPos) {
        world.createTown(`Town ${randomUUID()}`, company.id, spawnPos, true);

        if (notificationConfig.logCompanyNotifications) {
          logSuccess(`[COMPANY] Created town`);
        }
      } else if (notificationConfig.logCompanyNotifications) {
        logWarning(`[COMPANY] Unable to create town - no suitable position`);
      }
    };

    createTowns();

    // 1. Resource -> Processor/Factory or End Consumer
    const resourceDeposits = state.geographies
      .filter((g) => g.geographyType === GEOGRAPHY_TYPE.ResourceDeposit)
      .map((d) => d as IResourceDeposit);
    const unclaimedDeposits = resourceDeposits.filter(
      (d) => !state.producers.some((p) => p.position === d.position),
    );

    const allCustomers = [...state.processors, ...state.towns];

    // .. customers should have actual demand for this resource (un-served with contracts) ... otherwise its pointless
    const depositsWithCustomers = unclaimedDeposits.find((d) => {
      const viableCustomers = allCustomers.find((pc) =>
        Object.entries(pc.recipe.inputs ?? {}).find(
          ([k, _]) => k === d.resourceType,
        ),
      );
    });
    // 2. Processor/Factory -> End Consumer & Near Resources (Prefer weber, otherwise next suitable)
  });
};

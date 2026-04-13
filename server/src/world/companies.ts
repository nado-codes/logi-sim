import {
  defaultCompanyOptions,
  ICompanyEntity,
  ICreateCompanyOptions,
  ICompany,
  IWorldState,
  GEOGRAPHY_TYPE,
  Color,
  sum,
} from "@logisim/lib";
import { createBaseEntity, createNamedEntity } from "../entities";
import { loadGeographyConfig } from "./geographies";
import { world } from "..";
import { randomUUID } from "node:crypto";
import { loadNotificationConfig } from "../notifications";
import { loadTownConfig } from "./locations/consumers/towns";
import { getLocationById } from "./locations/locations";
import { assignContract } from "./contracts";
import { loadTruckConfig } from "./trucks";
import { loadConfig } from "../utils/configUtils";
import {
  logSuccess,
  highlight,
  logInfo,
  logWarning,
} from "@logisim/lib/src/utils/logUtils";

const geographyConfig = loadGeographyConfig();
const notificationConfig = loadNotificationConfig();
const townConfig = loadTownConfig();
const truckConfig = loadTruckConfig();

export enum COMPANY_OP_RESULT {
  SUCCESS,
  INSUFFICIENT_FUNDS,
}

interface ICompanyConfig {
  aiConfig: {
    dispatchChance: number;
  };
}

const defaultConfig: ICompanyConfig = {
  aiConfig: {
    dispatchChance: 0.1,
  },
};

const companyConfig = loadConfig("company", defaultConfig);

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

  if (notificationConfig.logCompanyNotifications) {
    logSuccess(
      `Created a Company ${highlight.yellow(JSON.stringify(newCompany))}`,
    );
  }

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

export const getCompanyByName = (state: IWorldState, name: string) => {
  const company = state.companies.find((cm) => cm.name === name);

  if (!company) {
    throw Error(`Company with name ${name} doesn't exist`);
  }

  return company;
};

export const getCompanyString = (company: ICompany) => {
  return `Name: ${highlight.yellow(company.name)} | Money: ${highlight.yellow(company.money + "")} | Color: ${highlight.custom("███", company.color)}`;
};

// UPDATE

export const transferCompanyFunds = (
  fromCompany: ICompany,
  toCompany: ICompany,
  amount: number,
): COMPANY_OP_RESULT => {
  if (fromCompany.money >= amount) {
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

    return COMPANY_OP_RESULT.SUCCESS;
  } else {
    return COMPANY_OP_RESULT.INSUFFICIENT_FUNDS;
  }
};

export const transferCompanyFundsToState = (
  fromCompany: ICompany,
  amount: number,
): COMPANY_OP_RESULT => {
  if (fromCompany.money >= amount) {
    if (!fromCompany.options.hasUnlimitedMoney) {
      fromCompany.money -= Math.abs(amount);
    }

    const transferString = `${highlight.yellow(fromCompany.name)} transferred ${highlight.yellow("$" + amount)} to ${highlight.yellow("The State")}`;
    const moneyString =
      fromCompany.money > 0
        ? `${highlight.yellow("$" + fromCompany.money)}`
        : `${highlight.red("$" + fromCompany.money)}`;

    if (notificationConfig.logCompanyNotifications) {
      logInfo(`${transferString} and has ${moneyString} left`);
    }

    return COMPANY_OP_RESULT.SUCCESS;
  } else {
    return COMPANY_OP_RESULT.INSUFFICIENT_FUNDS;
  }
};

export const transferCompanyFundsFromState = (
  toCompany: ICompany,
  amount: number,
) => {
  toCompany.money += Math.abs(amount);

  const transferString = `${highlight.yellow(toCompany.name)} was paid ${highlight.yellow("$" + amount)} by ${highlight.yellow("The State")}`;
  const moneyString =
    toCompany.money > 0
      ? `${highlight.yellow("$" + toCompany.money)}`
      : `${highlight.red("$" + toCompany.money)}`;

  if (notificationConfig.logCompanyNotifications) {
    logInfo(`${transferString} and now has ${moneyString}`);
  }
};

const tryCreateTown = (state: IWorldState, company: ICompany) => {
  if (notificationConfig.logCompanyNotifications) {
    logInfo(`[COMPANY] Trying to create a town...`);
  }

  // 1. Towns -> Near arable land & water & existing towns already at capacity
  if (
    state.towns.some(
      (t) =>
        t.population * townConfig.avgDwellingSize <
        townConfig.townCatchmentRadius * 2,
    )
  ) {
    if (notificationConfig.logCompanyNotifications) {
      logWarning(
        `[COMPANY] Existing towns not at capacity yet - skipping town creation`,
      );
    }
    return;
  }

  const allWater = state.geographies.filter(
    (g) => g.geographyType === GEOGRAPHY_TYPE.Water,
  );

  if (allWater.length === 0 && notificationConfig.logCompanyNotifications) {
    logWarning(`[COMPANY] No water found - skipping town creation`);
    return;
  }

  const allPositions = allWater
    .map((w) =>
      Array.from(
        { length: 1 + geographyConfig.arableLandRadius * 2 },
        (_, i) => w.position - geographyConfig.arableLandRadius + i,
      ),
    )
    .reduce((a, c) => a.concat(c));
  const allLocations = state.getLocations();

  const spawnPos = allPositions.find(
    (p) =>
      !allLocations.some((l) => l.position === p) &&
      !state.towns.some(
        (t) => Math.abs(t.position - p) < townConfig.townCatchmentRadius,
      ),
  );

  if (spawnPos) {
    world.createTown(`Town ${randomUUID()}`, company.id, spawnPos, true);

    if (notificationConfig.logCompanyNotifications) {
      logSuccess(`[COMPANY] Created town`);
    }
  } else if (notificationConfig.logCompanyNotifications) {
    logWarning(`[COMPANY] Unable to create town - no suitable position`);
  }
};

const tryDispatchTrucks = (state: IWorldState, company: ICompany) => {
  const dispatch = Math.random();
  if (dispatch > companyConfig.aiConfig.dispatchChance) {
    return;
  }

  const companyTrucks = state.trucks.filter((t) => t.companyId === company.id);
  const companyContracts = state.contracts.filter((c) =>
    companyTrucks.some((t) => c.truckId === t.id),
  );
  const commitmentsLedger = companyContracts.map((c) => {
    const supplier = getLocationById(state, c.supplierId);
    const destination = getLocationById(state, c.destinationId);
    const totalTravelDistance = Math.abs(
      destination.position - supplier.position,
    );
    const totalTravelCost = totalTravelDistance * truckConfig.baseOperatingCost;

    return { payment: c.payment, totalCost: totalTravelCost };
  });
  let currentCompanyReceivables = sum(commitmentsLedger.map((l) => l.payment));
  let currentCompanyPayables = sum(commitmentsLedger.map((l) => l.totalCost));

  const availableContracts = state.contracts.filter((c) => !c.truckId);
  availableContracts.forEach((c) => {
    const supplier = getLocationById(state, c.supplierId);
    const validIdleTrucks = companyTrucks.filter(
      (t) => t.storage.resourceType === c.resourceType && !t.contractId,
    );
    if (validIdleTrucks.length === 0) {
      return;
    }

    const nearestTruck = validIdleTrucks.reduce((closest, current) =>
      Math.abs(current.position - supplier.position) <
      Math.abs(closest.position - supplier.position)
        ? current
        : closest,
    );

    const destination = getLocationById(state, c.destinationId);
    const totalTravelDistance =
      Math.abs(destination.position - supplier.position) +
      Math.abs(supplier.position - nearestTruck.position);
    const contractDeliveryCost =
      totalTravelDistance * truckConfig.baseOperatingCost;

    const updatedCompanyPayables =
      currentCompanyPayables + contractDeliveryCost;
    const updatedRecievables = currentCompanyReceivables + c.payment;

    if (updatedCompanyPayables > updatedRecievables + company.money) {
      return;
    }

    assignContract(state, c, nearestTruck);
    currentCompanyReceivables = updatedRecievables;
    currentCompanyPayables = updatedCompanyPayables;
  });
};

export const updateCompanies = (state: IWorldState) => {
  if (notificationConfig.logCompanyNotifications) {
    logInfo(`Updating companies...`);
  }
  state.companies.forEach((company) => {
    if (company.options.isGovernment) {
      tryCreateTown(state, company);
    }

    if (!company.options.isAiEnabled) {
      if (notificationConfig.logCompanyNotifications) {
        logWarning(`[COMPANY] AI behaviour for ${company.name} not enabled`);
      }
      return;
    }

    if (notificationConfig.logCompanyNotifications) {
      logInfo(`[COMPANY] Running AI behaviour for ${company.name}...`);
    }

    tryDispatchTrucks(state, company);
  });
};

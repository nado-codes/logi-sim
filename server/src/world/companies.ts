import { createBaseEntity, createNamedEntity } from "../entities";
import { loadGeographyConfig } from "./geographies";
import { randomUUID } from "node:crypto";
import { loadNotificationConfig } from "../notifications";
import { createTown, loadTownConfig } from "./locations/consumers/towns";
import { getLocationById } from "./locations/locations";
import { assignContract } from "./contracts";
import { loadTruckConfig } from "./trucks";
import { loadConfig } from "../utils/configUtils";
import {
  IWorldState,
  ICreateCompanyOptions,
  ICompany,
  defaultCompanyOptions,
  ICompanyEntity,
  GEOGRAPHY_TYPE,
} from "@logisim/lib/entities";
import {
  Color,
  logSuccess,
  highlight,
  logInfo,
  logWarning,
  sum,
} from "@logisim/lib/utils";

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

  if (notificationConfig.logCompanyNotifications.all) {
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

    if (notificationConfig.logCompanyNotifications.all) {
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

    if (notificationConfig.logCompanyNotifications.all) {
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

  if (notificationConfig.logCompanyNotifications.all) {
    logInfo(`${transferString} and now has ${moneyString}`);
  }
};

const tryCreateTown = (state: IWorldState, company: ICompany) => {
  if (
    notificationConfig.logCompanyNotifications.all ||
    notificationConfig.logCompanyNotifications.government
  ) {
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
    if (
      notificationConfig.logCompanyNotifications.all ||
      notificationConfig.logCompanyNotifications.government
    ) {
      logWarning(
        `[COMPANY] Existing towns not at capacity yet - skipping town creation`,
      );
    }
    return;
  }

  const allWater = state.geographies.filter(
    (g) => g.geographyType === GEOGRAPHY_TYPE.Water,
  );

  if (
    allWater.length === 0 &&
    (notificationConfig.logCompanyNotifications.all ||
      notificationConfig.logCompanyNotifications.government)
  ) {
    logWarning(`[COMPANY] No water found - skipping town creation`);
    return;
  }

  const allPositions = allWater
    .map((w) =>
      Array.from(
        { length: 1 + geographyConfig.arableLandRadius * 2 },
        (_, i) => w.position.x - geographyConfig.arableLandRadius + i,
      ),
    )
    .reduce((a, c) => a.concat(c));
  const allLocations = state.getLocations();

  const spawnPos = allPositions.find(
    (p) =>
      !allLocations.some((l) => l.position.x === p) &&
      !state.towns.some(
        (t) => Math.abs(t.position.x - p) < townConfig.townCatchmentRadius,
      ),
  );

  if (spawnPos) {
    createTown(state, `Town ${randomUUID()}`, company.id, {
      x: spawnPos,
      y: 0,
      z: 0,
    });

    if (
      notificationConfig.logCompanyNotifications.all ||
      notificationConfig.logCompanyNotifications.government
    ) {
      logSuccess(`[COMPANY] Created town`);
    }
  } else if (
    notificationConfig.logCompanyNotifications.all ||
    notificationConfig.logCompanyNotifications.government
  ) {
    logWarning(`[COMPANY] Unable to create town - no suitable position`);
  }
};

const tryDispatchTrucks = (state: IWorldState, company: ICompany) => {
  const dispatch = Math.random();

  if (
    notificationConfig.logCompanyNotifications.all ||
    notificationConfig.logCompanyNotifications.ai
  ) {
    logInfo(
      `[COMPANY] ${company.name} is trying to dispatch trucks with a dispatch chance of ${companyConfig.aiConfig.dispatchChance}...`,
    );
  }

  if (dispatch > companyConfig.aiConfig.dispatchChance) {
    if (
      notificationConfig.logCompanyNotifications.all ||
      notificationConfig.logCompanyNotifications.ai
    ) {
      logInfo(`- Decided not to dispatch trucks this tick (roll: ${dispatch})`);
    }
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
      destination.position.x - supplier.position.x,
    );
    const totalTravelCost = totalTravelDistance * truckConfig.baseOperatingCost;

    return { payment: c.payment, totalCost: totalTravelCost };
  });
  let currentCompanyReceivables = sum(commitmentsLedger.map((l) => l.payment));
  let currentCompanyPayables = sum(commitmentsLedger.map((l) => l.totalCost));

  const availableContracts = state.contracts.filter((c) => !c.truckId);

  if (
    notificationConfig.logCompanyNotifications.all ||
    notificationConfig.logCompanyNotifications.ai
  ) {
    if (availableContracts.length === 0) {
      logWarning(`- No available contracts to consider for dispatching trucks`);
    } else {
      logInfo(
        `- Found ${availableContracts.length} available contracts to consider for dispatching trucks...`,
      );
    }
  }

  availableContracts.forEach((c) => {
    const supplier = getLocationById(state, c.supplierId);
    const validIdleTrucks = companyTrucks.filter(
      (t) => t.storage.resourceType === c.resourceType && !t.contractId,
    );
    if (validIdleTrucks.length === 0) {
      if (
        notificationConfig.logCompanyNotifications.all ||
        notificationConfig.logCompanyNotifications.ai
      ) {
        logWarning(
          `- No valid idle trucks available for contract ${c.id} (requires resource type ${c.resourceType})`,
        );
      }
      return;
    }

    const nearestTruck = validIdleTrucks.reduce((closest, current) =>
      Math.abs(current.position.x - supplier.position.x) <
      Math.abs(closest.position.x - supplier.position.x)
        ? current
        : closest,
    );

    const destination = getLocationById(state, c.destinationId);
    const totalTravelDistance =
      Math.abs(destination.position.x - supplier.position.x) +
      Math.abs(supplier.position.x - nearestTruck.position.x);
    const contractDeliveryCost =
      totalTravelDistance * truckConfig.baseOperatingCost;

    const updatedCompanyPayables =
      currentCompanyPayables + contractDeliveryCost;
    const updatedRecievables = currentCompanyReceivables + c.payment;

    if (updatedCompanyPayables > updatedRecievables + company.money) {
      if (
        notificationConfig.logCompanyNotifications.all ||
        notificationConfig.logCompanyNotifications.ai
      ) {
        logWarning(
          `- Dispatching truck ${nearestTruck.name} for contract ${c.id} would not be profitable (current receivables: ${currentCompanyReceivables}, current payables: ${currentCompanyPayables}, contract payment: ${c.payment}, contract cost: ${contractDeliveryCost}, company money: ${company.money}) - skipping`,
        );
      }
      return;
    }

    assignContract(state, c, nearestTruck);

    if (
      notificationConfig.logCompanyNotifications.all ||
      notificationConfig.logCompanyNotifications.ai
    ) {
      logInfo(
        `- Dispatching truck ${nearestTruck.name} for contract ${c.id} (contract payment: ${c.payment}, contract cost: ${contractDeliveryCost})`,
      );
    }

    currentCompanyReceivables = updatedRecievables;
    currentCompanyPayables = updatedCompanyPayables;
  });
};

export const updateCompanies = (state: IWorldState) => {
  if (notificationConfig.logCompanyNotifications.all) {
    logInfo(`Updating companies...`);
  }
  state.companies.forEach((company) => {
    if (company.options.isGovernment) {
      tryCreateTown(state, company);
    }

    if (!company.options.isAiEnabled) {
      if (
        notificationConfig.logCompanyNotifications.all ||
        notificationConfig.logCompanyNotifications.ai
      ) {
        logWarning(`[COMPANY] AI behaviour for ${company.name} not enabled`);
      }
      return;
    }

    if (
      notificationConfig.logCompanyNotifications.all ||
      notificationConfig.logCompanyNotifications.ai
    ) {
      logInfo(`[COMPANY] Running AI behaviour for ${company.name}...`);
    }

    tryDispatchTrucks(state, company);
  });
};

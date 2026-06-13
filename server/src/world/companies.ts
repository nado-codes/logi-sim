import { createBaseEntity, createNamedEntity } from "../entities";
import { loadGeographyConfig } from "./geographies";
import { randomUUID } from "node:crypto";
import { loadNotificationConfig } from "../notifications";
import { createTown, loadTownConfig } from "./locations/consumers/towns";
import {
  getLocationById,
  getLocationItemById,
  getLocationItemByIdOrNull,
} from "./locations/locations";
import { assignContractToTruck } from "./contracts";
import {
  getTruckItemById,
  getTruckItemByIdOrNull,
  loadTruckConfig,
} from "./trucks";
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
  random,
  getDistanceBetweenPositions,
} from "@logisim/lib/utils";

const geographyConfig = loadGeographyConfig();
const notificationConfig = loadNotificationConfig();
const townConfig = loadTownConfig();
const truckConfig = loadTruckConfig();

export enum COMPANY_TRANSFER_RESULT {
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
    isInsolvent: false,
    debts: [],
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
): COMPANY_TRANSFER_RESULT => {
  if (fromCompany.money >= amount || fromCompany.options.hasUnlimitedMoney) {
    if (!fromCompany.options.hasUnlimitedMoney) {
      fromCompany.money -= Math.abs(amount);
    }

    toCompany.money += Math.abs(amount);

    const transferString = `${highlight.yellow(fromCompany.name)} paid ${highlight.yellow("$" + amount)} to ${highlight.yellow(toCompany.name)}`;
    const moneyString =
      fromCompany.money > 0
        ? `${highlight.yellow("$" + fromCompany.money)}`
        : `${highlight.red("$" + fromCompany.money)}`;

    if (notificationConfig.logCompanyNotifications.all) {
      logInfo(`${transferString} and has ${moneyString} left`);
    }

    return COMPANY_TRANSFER_RESULT.SUCCESS;
  } else {
    return COMPANY_TRANSFER_RESULT.INSUFFICIENT_FUNDS;
  }
};

const collectFromCompany = (
  state: IWorldState,
  debtorCompany: ICompany,
  creditorCompany: ICompany,
  amount: number,
  reason: string,
) => {
  if (debtorCompany.money >= amount) {
    transferCompanyFunds(debtorCompany, creditorCompany, amount);
  } else {
    let amountLeftToPay = amount - Math.max(0, debtorCompany.money);
    transferCompanyFunds(debtorCompany, creditorCompany, debtorCompany.money);
    debtorCompany.money -= amountLeftToPay;
    debtorCompany.isInsolvent = true;

    if (
      notificationConfig.logCompanyNotifications.all ||
      notificationConfig.logCompanyNotifications.money
    ) {
      logWarning(
        `[COMPANY] ${debtorCompany.name} is now insolvent and must cease trading until debts are paid via asset reposession`,
      );
    }

    const existingDebtWithCreditor = debtorCompany.debts.find(
      (d) => d.creditorCompanyId === creditorCompany.id,
    );

    if (!existingDebtWithCreditor) {
      debtorCompany.debts.push({
        createdAtTick: state.currentTick,
        creditorCompanyId: creditorCompany.id,
        amount: amountLeftToPay,
        reason,
      });
    } else {
      existingDebtWithCreditor.amount += amountLeftToPay;
    }

    // .. try to auto-resolve debts with company assets (locations & trucks) (for AI companies)
    // .. for player companies, we MUST give them the option to choose what assets to sell off
    // set an insolvency flag on player companies so they can't operate, then prompt them to sell off
    // assets within a given timeframe, or the company will be liquidated
    // players can also choose to auto-resolve debts (runs the auto-resolver) OR declare bankruptcy which
    // will immediately liquidate the company
    const debtorLocationItems = state
      .getLocations()
      .filter((l) => l.companyId === debtorCompany.id && l.itemId)
      .map((l) => getLocationItemById(l.itemId));
    const debtorTruckItems = state.trucks
      .filter((t) => t.companyId === debtorCompany.id && t.itemId)
      .map((t) => getTruckItemById(t.itemId));
    const debtorAssetItemsByValue = [
      ...debtorLocationItems,
      ...debtorTruckItems,
    ].sort((a, b) => a.price - b.price);

    const debtorTotalAssetValue = debtorAssetItemsByValue
      .map((li) => li!.price)
      .reduce((a, c) => a + c, 0);
    const sumTotalCompanyDebts = debtorCompany.debts
      .map((d) => d.amount)
      .reduce((a, c) => a + c, 0);

    if (debtorTotalAssetValue >= sumTotalCompanyDebts) {
      if (
        debtorCompany.options.isAiEnabled &&
        creditorCompany.options.isAiEnabled
      ) {
        debtorAssetItemsByValue.forEach((i) => {
          if (amountLeftToPay <= 0) {
            return;
          }
          amountLeftToPay -= i.price;
        });
        // .. auto-resolve by selling off enough assets to pay back the debt
        // .. we'll do it randomly for AI companies, but player companies need to resolve debts manually
        // .. should we just resolve debts with finances? or could player-to-player or even AI-to-player
        // debts be resolved through arbitration/compromise e.g. creditor company is happy to take a financial
        // loss in exchange for (x y z) asset, or they just want to liquidate the debtor company/take all their
        // payment in cash rather than assets
      }
    } else {
      // .. it's not possible to resolve debts with assets, so the company must be liquidated
      if (
        notificationConfig.logCompanyNotifications.all ||
        notificationConfig.logCompanyNotifications.money
      ) {
        logWarning(
          `[COMPANY] ${debtorCompany.name} is insolvent but is unable to pay their debts, and will be liquidated`,
        );
      }
    }
  }
};

export const transferCompanyFundsFromState = (
  state: IWorldState,
  toCompany: ICompany,
  amount: number,
) => {
  const stateCompany = getCompanyByName(state, "State");
  return transferCompanyFunds(stateCompany, toCompany, amount);
};

export const transferCompanyFundsToState = (
  state: IWorldState,
  fromCompany: ICompany,
  amount: number,
): COMPANY_TRANSFER_RESULT => {
  const stateCompany = getCompanyByName(state, "State");
  return transferCompanyFunds(fromCompany, stateCompany, amount);
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
    .reduce((a, c) => a.concat(c), []);
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
  const dispatch = random();

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

  const availableContracts = state.contracts.filter(
    (c) => !c.truckId && !c.shipperId,
  );

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
    const supplierConsumerDistance = getDistanceBetweenPositions(
      supplier.position,
      destination.position,
    );
    const supplierTruckDistance = getDistanceBetweenPositions(
      supplier.position,
      nearestTruck.position,
    );
    const contractDeliveryCost =
      (supplierConsumerDistance + supplierTruckDistance) *
      truckConfig.baseOperatingCost;

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

    assignContractToTruck(state, c, nearestTruck);

    if (
      notificationConfig.logCompanyNotifications.all ||
      notificationConfig.logCompanyNotifications.ai
    ) {
      logSuccess(
        `- Dispatched ${nearestTruck.name} for contract ${c.id} (contract payment: ${c.payment}, contract cost: ${contractDeliveryCost})`,
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

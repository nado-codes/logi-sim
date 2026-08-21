import { createBaseEntity, createNamedEntity } from "../entities";
import { loadGeographyConfig } from "./geographies";
import { randomUUID } from "node:crypto";
import { loadNotificationConfig } from "../notifications";
import { createTown, loadTownConfig } from "./locations/consumers/towns";
import { getLocationById, getLocationItemById } from "./locations/locations";
import { assignContractToTruck } from "./contracts";
import { getTruckItemById, loadTruckConfig } from "./trucks";
import { loadConfig } from "../utils/configUtils";
import {
  IWorldState,
  ICreateCompanyOptions,
  ICompany,
  defaultCompanyOptions,
  ICompanyEntity,
  GEOGRAPHY_TYPE,
  IMarketplaceEntity,
  IWorldEntity,
  ICompanyDebt,
  IContract,
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
  logError,
} from "@logisim/lib/utils";
import { sellItem } from "./marketplace";

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
  insolvencyThreshold: number;
}

const defaultConfig: ICompanyConfig = {
  aiConfig: {
    dispatchChance: 0.1,
  },
  insolvencyThreshold: 10,
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
  if (money < 0) {
    throw Error(`Cannot create company ${name} with negative money: ${money}`);
  }

  const newCompany: ICompany = {
    ...createNamedEntity(name),
    isInsolvent: false,
    isLiquidated: false,
    insolvencyCounter: 0,
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

export const getCompanyEntitiesByCompanyId = (
  state: IWorldState,
  id: string,
): (IWorldEntity & IMarketplaceEntity & ICompanyEntity)[] => {
  return [...state.getLocations(), ...state.trucks].filter(
    (e) => e.companyId === id,
  );
};

export const getCompanyEntityByCompanyIdEntityId = (
  state: IWorldState,
  companyId: string,
  entityId: string,
): IWorldEntity & IMarketplaceEntity & ICompanyEntity => {
  const companyEntities = getCompanyEntitiesByCompanyId(state, companyId);
  const companyEntity = companyEntities.find((e) => e.id === entityId);

  if (!companyEntity) {
    throw Error(
      `Entity with id ${entityId} either doesn't belong to company ${companyId} or it doesn't exist`,
    );
  }

  return companyEntity;
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

export const collectFromCompany = (
  state: IWorldState,
  debtorCompany: ICompany,
  creditorCompany: ICompany,
  amount: number,
  reason: string,
) => {
  if (debtorCompany.money >= amount) {
    transferCompanyFunds(debtorCompany, creditorCompany, amount);
    logWarning(
      `${creditorCompany.name} collected $${amount} from ${debtorCompany.name} because ${reason}`,
    );
  } else {
    let amountLeftToPay = amount - Math.max(0, debtorCompany.money);
    logWarning(
      `${creditorCompany.name} collected $${amount} from ${debtorCompany.name} because ${reason} and must reposess some of ${debtorCompany.name}'s assets in order to pay the debts`,
    );
    transferCompanyFunds(debtorCompany, creditorCompany, debtorCompany.money);
    debtorCompany.isInsolvent = true;

    if (
      notificationConfig.logCompanyNotifications.all ||
      notificationConfig.logCompanyNotifications.money
    ) {
      logWarning(
        `[COMPANY] ${debtorCompany.name} is now insolvent and must cease trading until debts are paid`,
      );
    }

    const existingDebtWithCreditor = debtorCompany.debts.find(
      (d) => d.creditorCompanyId === creditorCompany.id,
    );

    if (!existingDebtWithCreditor) {
      const newDebt: ICompanyDebt = {
        createdAtTick: state.currentTick,
        creditorCompanyId: creditorCompany.id,
        amount: amountLeftToPay,
        reason,
      };
      const debtTerm = 10; // .. 10 ticks to pay off the debt

      if (debtorCompany.options.isAiEnabled) {
        newDebt.paymentPerTick = Math.max(
          1,
          Math.floor(amountLeftToPay / debtTerm),
        );
      }
      debtorCompany.debts.push(newDebt);
    } else {
      existingDebtWithCreditor.amount += amountLeftToPay;
    }

    if (debtorCompany.options.isAiEnabled) {
      autoResolveDebtForCompany(state, debtorCompany, creditorCompany.id);
    }
  }
};

export const autoResolveDebtForCompany = (
  state: IWorldState,
  company: ICompany,
  creditorCompanyId: string,
) => {
  if (
    notificationConfig.logCompanyNotifications.all &&
    !notificationConfig.logCompanyNotifications.money
  ) {
    logInfo(
      `Trying to auto-resolve debt for ${company.name} with creditor company ID ${creditorCompanyId}...`,
    );
  }
  const debtEntry = company.debts.find(
    (d) => d.creditorCompanyId === creditorCompanyId,
  );
  if (!debtEntry) {
    logError(
      `[COMPANY] No debt entry found for company ${company.name} with creditor company ID ${creditorCompanyId}`,
    );
    return;
  }

  const creditorCompany = getCompanyById(state, debtEntry.creditorCompanyId);
  let amountLeftToPay = debtEntry.amount;
  const debtorLocationItems = state
    .getLocations()
    .filter((l) => l.companyId === company.id && l.itemId)
    .map((l) => ({
      asset: l,
      item: getLocationItemById(l.itemId),
    }));
  const debtorTruckItems = state.trucks
    .filter((t) => t.companyId === company.id && t.itemId)
    .map((t) => ({ asset: t, item: getTruckItemById(t.itemId) }));
  const debtorAssetItemsByValue = [
    ...debtorLocationItems,
    ...debtorTruckItems,
  ].sort((a, b) => a.item.price - b.item.price);

  const debtorTotalAssetValue = debtorAssetItemsByValue
    .map((li) => li!.item.price)
    .reduce((a, c) => a + c, 0);
  const sumTotalCompanyDebts = company.debts
    .map((d) => d.amount)
    .reduce((a, c) => a + c, 0);

  if (
    notificationConfig.logCompanyNotifications.all &&
    !notificationConfig.logCompanyNotifications.money
  ) {
    logInfo(
      `- Total debt: ${sumTotalCompanyDebts}, Total assets value: ${debtorTotalAssetValue}`,
    );
  }

  if (debtorTotalAssetValue >= sumTotalCompanyDebts) {
    debtorAssetItemsByValue.forEach((assetItem) => {
      sellItem(state, assetItem.asset.id, company);

      const amountToPay = Math.min(amountLeftToPay, assetItem.item.price);
      transferCompanyFunds(company, creditorCompany, amountToPay);
      amountLeftToPay -= amountToPay;

      if (amountLeftToPay > 0) {
        if (
          notificationConfig.logCompanyNotifications.all ||
          notificationConfig.logCompanyNotifications.money
        ) {
          logInfo(
            ` - ${company.name} now has $${amountLeftToPay} left to pay to ${creditorCompany.name}`,
          );
        }
      } else {
        if (
          notificationConfig.logCompanyNotifications.all ||
          notificationConfig.logCompanyNotifications.money
        ) {
          logSuccess(
            `${company.name} has resolved their debt with ${creditorCompany.name}`,
          );
        }
        company.debts = company.debts.filter(
          (d) => d.creditorCompanyId !== creditorCompany.id,
        );
        return;
      }
    });
    if (company.debts.length <= 0) {
      company.isInsolvent = false;
      logSuccess(
        `${company.name} is no longer insolvent and may resume trading`,
      );
    }
  } else {
    // .. it's not possible to resolve debts with assets, so the company must be liquidated
    if (company.options.isAiEnabled) {
      liquidateCompany(state, company);
    }
  }
};

export const processCompanyDebts = (
  debtorCompany: ICompany,
  debtorContracts: IContract[],
) => {
  if (
    notificationConfig.logCompanyNotifications.all ||
    notificationConfig.logCompanyNotifications.money
  ) {
    logInfo(`[COMPANY] Processing debts for ${debtorCompany.name}...`);
  }
  const sumTotalDebtPayments = debtorCompany.debts
    .map((d) => d.paymentPerTick ?? 0)
    .reduce((a, c) => a + c, 0);

  const sumTotalDeferredRevenue = debtorContracts
    .map((c) => c.payment)
    .reduce((a, c) => a + c, 0);

  if (sumTotalDeferredRevenue + debtorCompany.money < sumTotalDebtPayments) {
    if (
      notificationConfig.logCompanyNotifications.all ||
      notificationConfig.logCompanyNotifications.money
    ) {
      logWarning(
        `- Debts cannot be paid this tick. Insolvency counter will be increased ${debtorCompany.insolvencyCounter} -> ${debtorCompany.insolvencyCounter + 1}`,
      );
    }
    debtorCompany.insolvencyCounter++;
    debtorCompany.isInsolvent = true;

    if (debtorCompany.insolvencyCounter >= companyConfig.insolvencyThreshold) {
      if (
        notificationConfig.logCompanyNotifications.all ||
        notificationConfig.logCompanyNotifications.money
      ) {
        logWarning(
          `- Insolvency counter has reached the threshold of ${companyConfig.insolvencyThreshold}. ${debtorCompany.name} will be liquidated.`,
        );
      }

      //liquidateCompany()
    }
  } else {
    if (debtorCompany.insolvencyCounter > 0) {
      if (
        notificationConfig.logCompanyNotifications.all ||
        notificationConfig.logCompanyNotifications.money
      ) {
        logInfo(
          `- Debts can be paid this tick. Insolvency counter will be reduced ${debtorCompany.insolvencyCounter} -> ${debtorCompany.insolvencyCounter - 1}`,
        );
      }
      debtorCompany.insolvencyCounter--;
    }
  }

  debtorCompany.debts.forEach((debt) => {});
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

export const liquidateCompany = (state: IWorldState, company: ICompany) => {
  if (
    notificationConfig.logCompanyNotifications.all ||
    notificationConfig.logCompanyNotifications.money
  ) {
    logInfo(`[COMPANY] Liquidating company: ${company.name}`);
  }

  const sumTotalCompanyDebts = company.debts
    .map((d) => d.amount)
    .reduce((a, c) => a + c, 0);

  if (
    notificationConfig.logCompanyNotifications.all ||
    notificationConfig.logCompanyNotifications.money
  ) {
    logInfo(`- Total debt: ${sumTotalCompanyDebts}`);
  }

  company.isLiquidated = true;

  const debtorLocationItems = state
    .getLocations()
    .filter((l) => l.companyId === company.id && l.itemId)
    .map((l) => ({
      asset: l,
      item: getLocationItemById(l.itemId),
    }));
  const debtorTruckItems = state.trucks
    .filter((t) => t.companyId === company.id && t.itemId)
    .map((t) => ({ asset: t, item: getTruckItemById(t.itemId) }));
  const debtorAssetItemsByValue = [
    ...debtorLocationItems,
    ...debtorTruckItems,
  ].sort((a, b) => a.item.price - b.item.price);

  if (
    notificationConfig.logCompanyNotifications.all ||
    notificationConfig.logCompanyNotifications.money
  ) {
    logInfo(
      `- Industries: ${debtorLocationItems.length}, Trucks: ${debtorTruckItems.length}`,
    );
    logInfo(
      `- Total asset value: ${debtorAssetItemsByValue.map((li) => li!.item.price).reduce((a, c) => a + c, 0)}`,
    );
  }

  debtorAssetItemsByValue.forEach((assetItem) => {
    sellItem(state, assetItem.asset.id, company);
  });

  const debtorCompanyStartingMoney = company.money;
  company.debts.forEach((debt) => {
    const creditorCompany = getCompanyById(state, debt.creditorCompanyId);
    const amountToPay = Math.min(
      (debt.amount / sumTotalCompanyDebts) * debtorCompanyStartingMoney,
      debt.amount,
      company.money,
    );
    transferCompanyFunds(company, creditorCompany, amountToPay);
    debt.amount -= amountToPay;

    if (company.money <= 0) {
      logWarning(`[COMPANY] ${company.name} has no money left to pay debts`);
      return;
    }
  });

  company.debts = [];
  logSuccess(
    `[COMPANY] ${company.name} has been liquidated and tried to pay off as many debts as possible`,
  );
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
      logWarning(
        `- Decided not to dispatch trucks this tick (roll: ${dispatch})`,
      );
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
    logInfo(`[SYSTEM] Updating companies...`);
  }
  state.companies.forEach((company) => {
    if (notificationConfig.logCompanyNotifications.all) {
      logInfo(`- Updating ${company.name}...`);
    }

    const companyContracts = state.contracts.filter((c) =>
      state.trucks.some(
        (t) => t.companyId === company.id && c.truckId === t.id,
      ),
    );
    processCompanyDebts(company, companyContracts);

    if (company.options.isAiEnabled) {
      if (
        notificationConfig.logCompanyNotifications.all ||
        notificationConfig.logCompanyNotifications.ai
      ) {
        logInfo(` - Running AI behaviour...`);
      }

      if (company.options.isGovernment) {
        if (
          notificationConfig.logCompanyNotifications.all ||
          notificationConfig.logCompanyNotifications.ai
        ) {
          logInfo(` - Running government behaviour...`);
        }
        tryCreateTown(state, company);
        if (
          notificationConfig.logCompanyNotifications.all ||
          notificationConfig.logCompanyNotifications.ai
        ) {
          logSuccess(` - Finished running government behaviour`);
        }
      }

      tryDispatchTrucks(state, company);

      if (
        notificationConfig.logCompanyNotifications.all ||
        notificationConfig.logCompanyNotifications.ai
      ) {
        logSuccess(` - Finished running AI behaviour`);
      }
    } else {
      if (
        notificationConfig.logCompanyNotifications.all ||
        notificationConfig.logCompanyNotifications.ai
      ) {
        logWarning(` - AI behaviour not enabled, skipping`);
      }
    }

    if (notificationConfig.logCompanyNotifications.all) {
      logSuccess(`- Finished updating ${company.name}...`);
    }
  });
  if (notificationConfig.logCompanyNotifications.all) {
    logSuccess(`[SYSTEM] Finished updating companies`);
  }
};

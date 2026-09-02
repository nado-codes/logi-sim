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
  ITruck,
  ILocation,
  RegulatoryActionStatus,
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
  regulatoryWarningMultiplier: number;
  probationThreshold: number;
  suspensionNoticeThreshold: number;
  ceasedOperationsThreshold: number;
}

export const defaultCompanyConfig: ICompanyConfig = {
  aiConfig: {
    dispatchChance: 0.1,
  },
  insolvencyThreshold: 10,
  regulatoryWarningMultiplier: 0.5,
  probationThreshold: 1,
  suspensionNoticeThreshold: 5,
  ceasedOperationsThreshold: 10,
};

const companyConfig = loadConfig("company", defaultCompanyConfig);

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

export const getRegulatoryActionStatus = (
  company: ICompany,
): RegulatoryActionStatus => {
  const probationWarningThreshold =
    companyConfig.probationThreshold *
    companyConfig.regulatoryWarningMultiplier;
  const suspensionNoticeWarningthreshold =
    companyConfig.probationThreshold +
    (companyConfig.suspensionNoticeThreshold -
      companyConfig.probationThreshold) *
      companyConfig.regulatoryWarningMultiplier;
  const ceasedOperationsWarningThreshold =
    companyConfig.suspensionNoticeThreshold +
    (companyConfig.ceasedOperationsThreshold -
      companyConfig.suspensionNoticeThreshold) *
      companyConfig.regulatoryWarningMultiplier;

  if (
    company.insolvencyCounter >= companyConfig.ceasedOperationsThreshold ||
    company.isLiquidated
  ) {
    return RegulatoryActionStatus.CeasedOperations;
  } else if (
    company.insolvencyCounter >= probationWarningThreshold &&
    company.insolvencyCounter < companyConfig.probationThreshold
  ) {
    return RegulatoryActionStatus.PreProbation;
  } else if (
    company.insolvencyCounter >= companyConfig.probationThreshold &&
    company.insolvencyCounter < suspensionNoticeWarningthreshold
  ) {
    return RegulatoryActionStatus.Probation;
  } else if (
    company.insolvencyCounter >= suspensionNoticeWarningthreshold &&
    company.insolvencyCounter < companyConfig.suspensionNoticeThreshold
  ) {
    return RegulatoryActionStatus.PreSuspensionNotice;
  } else if (
    company.insolvencyCounter >= companyConfig.suspensionNoticeThreshold &&
    company.insolvencyCounter < ceasedOperationsWarningThreshold
  ) {
    return RegulatoryActionStatus.SuspensionNotice;
  } else if (
    company.insolvencyCounter >= ceasedOperationsWarningThreshold &&
    company.insolvencyCounter < companyConfig.ceasedOperationsThreshold
  ) {
    return RegulatoryActionStatus.PreCeasedOperations;
  } else {
    return RegulatoryActionStatus.None;
  }
};

export const getCompanies = (state: IWorldState) => {
  const companies = state.companies.map((c) => ({
    ...c,
    regulatoryActionStatus: getRegulatoryActionStatus(c),
  }));

  return companies;
};

export const getCompanyById = (state: IWorldState, id: string) => {
  const company = state.companies.find((c) => c.id === id);

  if (!company) {
    throw Error(`Company with id ${id} doesn't exist`);
  }

  return company;
};

export const getCompanyByIdOrNull = (state: IWorldState, id: string) => {
  const company = state.companies.find((cm) => cm.id === id);

  if (!company) {
    return undefined;
  }

  return {
    ...company,
    regulatoryActionStatus: getRegulatoryActionStatus(company),
  };
};

export const getCompanyByName = (state: IWorldState, name: string) => {
  const company = state.companies.find((cm) => cm.name === name);

  if (!company) {
    throw Error(`Company with name ${name} doesn't exist`);
  }

  return {
    ...company,
    regulatoryActionStatus: getRegulatoryActionStatus(company),
  };
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
  }
};

export const processCompanyDebts = (
  debtorCompany: ICompany,
  creditors: ICompany[],
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
    } else {
      debtorCompany.isInsolvent = false;
    }
  }

  const debtorCompanyStartMoney = debtorCompany.money;
  debtorCompany.debts.forEach((debt) => {
    const creditorCompany = creditors.find(
      (c) => c.id === debt.creditorCompanyId,
    );

    if (!creditorCompany) {
      throw Error(
        `Creditor with id ${debt.creditorCompanyId} couldn't be found`,
      );
    }
    if (!debt.paymentPerTick) {
      return;
    }

    if (!debtorCompany.isInsolvent) {
      const amountToPay = Math.min(debt.amount, debt.paymentPerTick);
      transferCompanyFunds(debtorCompany, creditorCompany, amountToPay);
      debt.amount -= amountToPay;
    } else {
      const proRataPayment =
        (debt.paymentPerTick / sumTotalDebtPayments) * debtorCompanyStartMoney;
      const amountToPay = Math.min(debt.amount, proRataPayment);
      const paymentResult = transferCompanyFunds(
        debtorCompany,
        creditorCompany,
        amountToPay,
      );

      if (paymentResult === COMPANY_TRANSFER_RESULT.INSUFFICIENT_FUNDS) {
        logError(
          `Unable to process company pro-rata debt payment - insufficient funds`,
        );
        return;
      }

      debt.amount -= amountToPay;
    }

    if (debt.amount <= 0) {
      debtorCompany.debts = debtorCompany.debts.filter(
        (d) => d.creditorCompanyId !== creditorCompany.id,
      );
    }
  });

  if (debtorCompany.debts.length <= 0) {
    debtorCompany.isInsolvent = false;
    debtorCompany.insolvencyCounter = 0;
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

export const liquidateCompany = (
  company: ICompany,
  debtorLocations: ILocation[],
  debtorTrucks: ITruck[],
  debtorCreditors: ICompany[],
  stateCompany: ICompany,
) => {
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

  const debtorLocationItems = debtorLocations
    .filter((l) => l.companyId === company.id && l.itemId)
    .map((l) => ({
      asset: l,
      item: getLocationItemById(l.itemId),
    }));
  const debtorTruckItems = debtorTrucks
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
    transferCompanyFunds(stateCompany, company, assetItem.item.price);
    assetItem.asset.companyId = stateCompany.id;
  });

  const debtorCompanyStartingMoney = company.money;
  company.debts.forEach((debt) => {
    const creditorCompany = debtorCreditors.find(
      (c) => c.id === debt.creditorCompanyId,
    );
    if (!creditorCompany) {
      throw Error(
        `Creditor with id ${debt.creditorCompanyId} couldn't be found`,
      );
    }

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
    const creditorIds = company.debts.map((d) => d.creditorCompanyId);
    const creditors = state.companies.filter((c) => creditorIds.includes(c.id));
    processCompanyDebts(company, creditors, companyContracts);

    if (company.insolvencyCounter >= companyConfig.insolvencyThreshold) {
      if (
        notificationConfig.logCompanyNotifications.all ||
        notificationConfig.logCompanyNotifications.money
      ) {
        logWarning(
          `- Insolvency counter has reached the threshold of ${companyConfig.insolvencyThreshold}. ${company.name} will be liquidated.`,
        );
      }
      const companyLocations = state
        .getLocations()
        .filter((l) => l.companyId === company.id);
      const companyTrucks = state.trucks.filter(
        (t) => t.companyId === company.id,
      );
      const stateCompany = getCompanyByName(state, "State");
      liquidateCompany(
        company,
        companyLocations,
        companyTrucks,
        creditors,
        stateCompany,
      );
    }

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

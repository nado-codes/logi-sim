import { loadNotificationConfig } from "../notifications";
import {
  collectFromCompany,
  createCompanyEntity,
  getCompanyById,
  transferCompanyFunds,
} from "./companies";
import { getLocationById } from "./locations/locations";
import { getTruckById, setTruckContract, stopTruck } from "./trucks";
import { canStoreResourceType, getResourceStorage } from "./storages";
import { loadConfig } from "../utils/configUtils";
import {
  logInfo,
  logSuccess,
  highlight,
  logWarning,
  logError,
  getDistanceBetweenPositions,
} from "@logisim/lib/utils";
import {
  IWorldState,
  RESOURCE_TYPE,
  IContract,
  Nullable,
  ITruck,
  ICompany,
} from "@logisim/lib/entities";

const notificationConfig = loadNotificationConfig();

type UrgencyMultiplier = {
  threshold: number;
  multiplier: number;
};

interface IContractConfig {
  perUnitRate: number;
  distanceRate: number;
  bufferMultiplier: number;
  urgencyMultipliers: {
    critical: UrgencyMultiplier;
    urgent: UrgencyMultiplier;
    priority: UrgencyMultiplier;
  };
  debtCollectionEnabled: boolean;
  breachPenaltyMultiplier: number;
}

const defaultConfig: IContractConfig = {
  perUnitRate: 5,
  distanceRate: 2,
  bufferMultiplier: 3,
  urgencyMultipliers: {
    critical: {
      threshold: 3,
      multiplier: 2,
    },
    urgent: {
      threshold: 5,
      multiplier: 1.5,
    },
    priority: {
      threshold: 10,
      multiplier: 1.2,
    },
  },
  debtCollectionEnabled: true,
  breachPenaltyMultiplier: 1,
};

export const contractConfig = loadConfig("contract", defaultConfig);

// .. CREATE

const getUrgencyMultiplier = (ticksUntilExpiry: number) => {
  const { urgencyMultipliers } = contractConfig;

  if (ticksUntilExpiry <= urgencyMultipliers.critical.threshold) {
    return urgencyMultipliers.critical.multiplier;
  }
  if (ticksUntilExpiry <= urgencyMultipliers.urgent.threshold) {
    return urgencyMultipliers.urgent.multiplier;
  }
  if (ticksUntilExpiry <= urgencyMultipliers.priority.threshold) {
    return urgencyMultipliers.priority.multiplier;
  }
  return 1.0;
};

const calculateContractPayment = (
  quantity: number,
  distance: number,
  ticksUntilExpiry: number,
) => {
  const basePayment = quantity * contractConfig.perUnitRate;
  const distancePremium = distance * contractConfig.distanceRate;
  const urgencyMultiplier = getUrgencyMultiplier(ticksUntilExpiry);

  if (
    notificationConfig.logContractNotifications.all ||
    notificationConfig.logContractNotifications.creation
  ) {
    logInfo(` - Base Payment: ${basePayment}`);
    logInfo(` - Distance Premium: ${distancePremium}`);
    logInfo(` - Urgency Multiplier: ${urgencyMultiplier}`);
  }

  return Math.round((basePayment + distancePremium) * urgencyMultiplier);
};

export const createContract = (
  state: IWorldState,
  companyId: string,
  destinationId: string,
  supplierId: string,
  resourceType: RESOURCE_TYPE,
  amount: number,
  dueTicks: number,
) => {
  if (
    notificationConfig.logContractNotifications.all ||
    notificationConfig.logContractNotifications.creation
  ) {
    logInfo(`[CONTRACT] Trying to create ${resourceType} contract...`);
  }

  const supplier = getLocationById(state, supplierId);
  const destination = getLocationById(state, destinationId);
  const distance = getDistanceBetweenPositions(
    destination.position,
    supplier.position,
  );
  const payment = calculateContractPayment(amount, distance, dueTicks);

  if (!canStoreResourceType(supplier.storage, resourceType)) {
    throw Error(
      `[CRITICAL CONTRACT ERROR] Supplier ${supplier.name} doesn't provide ${resourceType}`,
    );
  }
  if (!canStoreResourceType(destination.storage, resourceType)) {
    throw Error(
      `[CRITICAL CONTRACT ERROR] Destination ${destination.name} doesn't accept ${resourceType}`,
    );
  }

  const newContract: IContract = {
    ...createCompanyEntity(companyId),
    destinationId,
    supplierId,
    resourceType,
    deliveredAmount: 0,
    totalAmount: amount,
    payment,
    expectedTick: Math.round(state.currentTick + dueTicks),
  };

  if (
    notificationConfig.logContractNotifications.all ||
    notificationConfig.logContractNotifications.creation
  ) {
    logSuccess(
      `[CONTRACT] Created contract for ${amount} ${resourceType} from ${supplier.name} to ${destination.name}, due in ${dueTicks} ticks and paying ${payment}`,
    );
  }

  state.contracts.push(newContract);

  return newContract;
};

// .. READ

export const getContractByIdOrNull = (
  state: IWorldState,
  id: string | undefined,
) => {
  const contract = state.contracts.find((c) => c.id === id);

  return contract;
};

export const getContractByLocationIdOrNull = (
  state: IWorldState,
  locationId: Nullable<string>,
) => {
  const contract = state.contracts.find((c) => c.destinationId === locationId);

  return contract;
};

export const getContractByResource = (
  state: IWorldState,
  destinationId: string,
  resourceType: RESOURCE_TYPE,
) => {
  return state.contracts.find(
    (c) => c.destinationId === destinationId && c.resourceType === resourceType,
  );
};

export const getContractString = (state: IWorldState, contract: IContract) => {
  const contractCompany = getCompanyById(state, contract.companyId);
  const contractSupplier = getLocationById(state, contract.supplierId);
  const contractDestination = getLocationById(state, contract.destinationId);

  const amountResource = highlight.yellow(
    contract.totalAmount + " " + contract.resourceType,
  );
  const pickupDropoff = `Pickup: ${highlight.yellow(contractSupplier.name)} | Drop-off: ${highlight.yellow(contractDestination.name)}`;
  const owner = `Owner: ${highlight.yellow(contractCompany.name)}`;
  const dueIn = `Due in: ${highlight.yellow(contract.expectedTick - state.currentTick + " ticks")}`;
  const payment = `Payment: ${highlight.yellow(contract.payment + "")}`;

  return `| ${highlight.custom("███", contractCompany.color)} | ${amountResource} | ${pickupDropoff} | ${owner} | ${dueIn} | ${payment}`;
};

// .. UPDATE
export const updateContracts = (state: IWorldState) => {
  state.contracts.forEach((contract) => {
    const destination = state
      .getLocations()
      .find((l) => l.id === contract.destinationId);
    const supplier = state
      .getLocations()
      .find((l) => l.id === contract.supplierId);

    if (!destination) {
      throw Error(`[CRITICAL CONTRACT ERROR] A contract must have an owner`);
    }
    if (!supplier) {
      throw Error(`[CRITICAL CONTRACT ERROR] A contract must have a supplier`);
    }

    const contractDueTicks = contract.expectedTick - state.currentTick;

    if (contractDueTicks <= 0) {
      // contract has expired
      if (contract.shipperId) {
        breakContract(
          state,
          contract,
          CONTRACT_BREAK_TYPE.Breach,
          CONTRACT_BREAK_FAULT.Shipper,
        );
      } else {
        archiveContract(state, contract); // nobody took it, just clean it up
      }
    } else {
      if (
        notificationConfig.logContractNotifications.all ||
        notificationConfig.logContractNotifications.creation
      ) {
        logInfo(`Contract ${contract.id} is due in ${contractDueTicks} ticks`);
      }
    }
  });
};

export const assignContractToCompany = (
  state: IWorldState,
  contract: IContract,
  company: ICompany,
) => {
  if (
    notificationConfig.logContractNotifications.all ||
    notificationConfig.logContractNotifications.assignment
  ) {
    logInfo(
      `[CONTRACT] Trying to assign ${contract.resourceType} contract to company...`,
    );
  }

  if (contract.shipperId) {
    logError(
      ` - CONTRACT ASSIGNMENT ERROR: Contract already taken by another company - assignment not possible`,
    );
    return false;
  }

  contract.shipperId = company.id;
  contract.acceptedAtTick = state.currentTick;

  if (
    notificationConfig.logContractNotifications.all ||
    notificationConfig.logContractNotifications.assignment
  ) {
    logSuccess(
      `- SUCCESS: Contract ${highlight.yellow(contract.id)} assigned to ${highlight.yellow(company.name)}`,
    );
  }

  return true;
};
export const assignContractToTruck = (
  state: IWorldState,
  contract: IContract,
  truck: ITruck,
) => {
  if (
    notificationConfig.logContractNotifications.all ||
    notificationConfig.logContractNotifications.assignment
  ) {
    logInfo(
      `[CONTRACT] Trying to assign ${contract.resourceType} contract to truck...`,
    );
  }

  if (contract.truckId) {
    logError(
      ` - CONTRACT ASSIGNMENT ERROR: Contract already being shipped by another truck - assignment not possible`,
    );
    return false;
  }

  if (truck.storage.resourceType !== contract.resourceType) {
    logError(
      ` - CONTRACT ASSIGNMENT ERROR: Incompatible shipper resource type - assignment not possible`,
    );
    return false;
  }

  setTruckContract(truck, contract);
  contract.shipperId = truck.companyId;
  contract.truckId = truck.id;
  contract.acceptedAtTick = state.currentTick;

  if (
    notificationConfig.logContractNotifications.all ||
    notificationConfig.logContractNotifications.assignment
  ) {
    const truckCompany = getCompanyById(state, truck.companyId);
    logSuccess(
      `- SUCCESS: Contract ${highlight.yellow(contract.id)} assigned to ${highlight.yellow(truck.name)} of ${highlight.yellow(truckCompany.name)}`,
    );
  }

  return true;
};

// .. DELETE

const archiveContract = (state: IWorldState, contract: IContract) => {
  if (
    notificationConfig.logContractNotifications.all ||
    notificationConfig.logContractNotifications.completion
  ) {
    logInfo(` - Contract archived`);
  }

  state.contractHistory.push(contract);
  state.contracts = state.contracts.filter((c) => c.id !== contract.id);
};

export const completeContract = (state: IWorldState, contract: IContract) => {
  if (
    notificationConfig.logContractNotifications.all ||
    notificationConfig.logContractNotifications.completion
  ) {
    logInfo(
      `[CONTRACT] Trying to complete a ${contract.resourceType} contract...`,
    );
  }

  const destination = getLocationById(state, contract.destinationId);

  if (!contract.truckId) {
    logError(
      ` - CONTRACT COMPLETION ERROR: No truck assigned to contract - cannot complete contract without delivery`,
    );
    return false;
  }

  const truck = getTruckById(state, contract.truckId);
  if (!truck) {
    logError(
      ` - CONTRACT COMPLETION ERROR: Truck with id ${contract.truckId} doesn't exist`,
    );
    return false;
  }

  if (contract.deliveredAmount < contract.totalAmount) {
    if (
      notificationConfig.logContractNotifications.all ||
      notificationConfig.logContractNotifications.completion
    ) {
      logWarning(
        ` - WARNING: Requirements not satisfied - ${destination.name} needs ${contract.totalAmount} ${contract.resourceType} - only ${contract.deliveredAmount} delivered so far`,
      );
    }
    return false;
  }

  if (
    notificationConfig.logContractNotifications.all ||
    notificationConfig.logContractNotifications.completion
  ) {
    logSuccess(` - SUCCESS: All requirements met. Contract will be voided.`);
  }

  const truckCompany = getCompanyById(state, truck.companyId);

  const contractDestination = getLocationById(state, contract.destinationId);
  const contractDestinationCompany = getCompanyById(
    state,
    contractDestination.companyId,
  );

  transferCompanyFunds(
    contractDestinationCompany,
    truckCompany,
    contract.payment,
  );

  contract.deliveredTick = state.currentTick;
  archiveContract(state, contract);

  return true;
};

export enum CONTRACT_BREAK_TYPE {
  Cancellation,
  Breach,
}

export enum CONTRACT_BREAK_FAULT {
  None,
  Supplier,
  Shipper,
  Destination,
}

export const breakContract = (
  state: IWorldState,
  contract: IContract,
  breakType: CONTRACT_BREAK_TYPE,
  breakFault: CONTRACT_BREAK_FAULT = CONTRACT_BREAK_FAULT.None,
) => {
  const contractSupplier = getLocationById(state, contract.supplierId);
  const contractDestination = getLocationById(state, contract.destinationId);
  const contractDestinationCompany = getCompanyById(
    state,
    contractDestination.companyId,
  );

  if (
    notificationConfig.logContractNotifications.all ||
    notificationConfig.logContractNotifications.breach
  ) {
    logWarning(
      `[CONTRACT] Contract between ${contractSupplier.name} and ${contractDestination.name} was broken by the ${CONTRACT_BREAK_TYPE[breakType]}`,
    );
  }

  if (breakType === CONTRACT_BREAK_TYPE.Cancellation) {
    if (contract.truckId && breakFault !== CONTRACT_BREAK_FAULT.Shipper) {
      const contractTruck = getTruckById(state, contract.truckId);
      const truckCompany = getCompanyById(state, contractTruck.companyId);
      transferCompanyFunds(
        contractDestinationCompany,
        truckCompany,
        contract.payment,
      );
    }

    if (breakFault === CONTRACT_BREAK_FAULT.Supplier) {
      const allLocationsExceptContractParties = state
        .getLocations()
        .filter(
          (l) =>
            l.id !== contract.destinationId && l.id !== contract.supplierId,
        );
      const alternateSupplier = allLocationsExceptContractParties.find(
        (l) => getResourceStorage(contract.resourceType, l.storage).length > 0,
      );

      if (alternateSupplier) {
        contract.supplierId = alternateSupplier.id;
      } else {
        archiveContract(state, contract);
      }
    } else if (breakFault === CONTRACT_BREAK_FAULT.Destination) {
      archiveContract(state, contract);
    } else if (breakFault === CONTRACT_BREAK_FAULT.Shipper) {
      contract.shipperId = undefined;
      contract.truckId = undefined;
      contract.acceptedAtTick = undefined;

      if (
        notificationConfig.logContractNotifications.all ||
        notificationConfig.logContractNotifications.update
      ) {
        logInfo(
          ` - Contract ${highlight.yellow(contract.id)} was cancelled by the shipper - the contract is now open for other companies to take`,
        );
      }
    }
  } else {
    // .. if the contract was BREACHED rather than cancelled
    if (breakFault === CONTRACT_BREAK_FAULT.Shipper) {
      if (!contract.shipperId) {
        logError(
          ` - CONTRACT BREAK ERROR: Contract isn't currently assigned to a shipper - breach handling not possible`,
        );
        return;
      }
      // .. apply a financial penalty equal to the value of the goods NOT delivered
      // .. TODO: the penalty should also include the value of the goods in some cases, like if they were damaged in transit
      // or straight up lost by the shipper
      const penalty =
        (1 - contract.deliveredAmount / contract.totalAmount) *
        contract.payment *
        contractConfig.breachPenaltyMultiplier;
      const shipperCompany = getCompanyById(state, contract.shipperId!);

      if (contractConfig.debtCollectionEnabled) {
        collectFromCompany(
          state,
          shipperCompany,
          contractDestinationCompany,
          penalty,
          `${shipperCompany.name} (shipper) breached a contract with ${contractDestinationCompany.name}`,
        );
      }

      if (contract.truckId) {
        const truck = getTruckById(state, contract.truckId);
        stopTruck(truck);
        truck.contractId = undefined;
      }
      archiveContract(state, contract);

      if (
        notificationConfig.logContractNotifications.all ||
        notificationConfig.logContractNotifications.update
      ) {
        logInfo(
          ` - Contract ${highlight.yellow(contract.id)} was breached by the shipper - a penalty of ${penalty} has been transferred from the shipper to the destination company`,
        );
      }
    }
  }
};

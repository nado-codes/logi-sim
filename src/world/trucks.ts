import { StorageTransferResult } from "../entities/storage";
import { ITruck } from "../entities/truck";
import { loadNotificationConfig } from "../notifications";
import {
  assignContract,
  completeContract,
  getContractByIdOrNull,
} from "./contracts";
import { logSuccess, logInfo, highlight, logWarning } from "../utils/logUtils";
import {
  createCompanyEntity,
  getCompanyById,
  transferFundsToState,
} from "./companies";
import { getLocationById, getLocationByIdOrNull } from "./locations/locations";
import { IWorldState } from "../entities/world";
import { createAndGetStorage, transferResources } from "./storages";
import { RESOURCE_TYPE } from "../entities/resource";
import { loadConfig } from "../utils/configUtils";
import { measurementConfig } from "../utils/measurementUtils";

const notificationConfig = loadNotificationConfig();

interface ITruckConfig {
  fuelToWeightRatio: number;
  speedToWeightRatio: number;
  baseSpeed: number;
  baseFuelConsumptionRate: number;
}

const defaultConfig: ITruckConfig = {
  fuelToWeightRatio: 0.05,
  speedToWeightRatio: 0.005,
  baseSpeed: 2,
  baseFuelConsumptionRate: 0.01,
};

const truckConfig = loadConfig("truck", defaultConfig);

// .. CREATE
export const createTruck = (
  state: IWorldState,
  name: string,
  companyId: string,
  resourceType: RESOURCE_TYPE,
  resourceCapacity: number,
  position: number,
  speedModifier: number,
  operatingCostPerTick: number,
  resourceCount: number = 0,
) => {
  const companyEntity = createCompanyEntity(companyId);
  const storage = createAndGetStorage(
    companyEntity.id,
    resourceType,
    resourceCapacity,
    resourceCount,
  );

  const newTruck: ITruck = {
    ...companyEntity,
    name,
    speed:
      truckConfig.baseSpeed * speedModifier * measurementConfig.distanceScale,
    speedModifier,
    storage,
    position,
    operatingCostPerTick,
    fuel: 100,
  };

  state.trucks.push(newTruck);
};

// .. READ
export const getTrucks = (state: IWorldState) => {
  return state.trucks;
};

export const getTruckById = (state: IWorldState, id: string) => {
  const truck = state.trucks.find((t) => t.id === id);

  if (!truck) {
    throw Error(`Truck with id ${id} doesn't exist`);
  }

  return truck;
};

export const getTruckByPositionOrNull = (
  state: IWorldState,
  position: number,
) => {
  const truck = state.trucks.find((t) => Math.floor(t.position) === position);

  return truck;
};

export const getTruckString = (state: IWorldState, truck: ITruck) => {
  const truckLocation = state
    .getLocations()
    .find((l) => l.position === truck.position);
  const truckContract = getContractByIdOrNull(state, truck.contractId);

  const contractSupplier = getLocationByIdOrNull(
    state,
    truckContract?.supplierId,
  );
  const contractDestination = getLocationByIdOrNull(
    state,
    truckContract?.destinationId,
  );

  const locationString = truckLocation
    ? `Location: ${highlight.yellow(truckLocation.name)}`
    : `Position: ${highlight.yellow(truck.position + "")}`;
  const contractString = `Contract: ${truckContract ? highlight.yellow(`${contractSupplier?.name}-->${contractDestination?.name}`) : highlight.yellow("None")}`;

  const truckCompany = getCompanyById(state, truck.companyId);

  return `| ${highlight.custom("███", truckCompany.color)} | Carries: ${highlight.yellow(truck.storage.resourceType)} | ${locationString} | ${contractString}`;
};

const updateTruckPosition = (state: IWorldState, truck: ITruck) => {
  const truckDestination = getLocationByIdOrNull(state, truck.destinationId);

  if (!truckDestination) {
    return;
  }

  const distance = truck.position - truckDestination.position;
  const direction = Math.sign(distance);

  if (truck.position != truckDestination.position) {
    if (truck.fuel > 0) {
      truck.fuel -=
        truckConfig.baseFuelConsumptionRate +
        truck.storage.resourceWeight * truckConfig.fuelToWeightRatio;

      const weightModifier =
        truckConfig.speedToWeightRatio * truck.storage.resourceWeight;
      const adjustedSpeed =
        truckConfig.baseSpeed * truck.speedModifier * (1 - weightModifier);

      truck.speed = adjustedSpeed;
      truck.position -=
        direction * (truck.speed * measurementConfig.distanceScale);
    } else {
      logWarning(`[TRUCK] ${truck.name} ran out of fuel`);

      const fuelBaseCost = 1;
      const fuelCost = 100 * fuelBaseCost;
      truck.fuel = 100;
      const truckCompany = getCompanyById(state, truck.companyId);
      transferFundsToState(truckCompany, fuelCost);

      logSuccess(
        `- Refueled at a cost of ${highlight.yellow(`${measurementConfig.currency}` + fuelCost)}`,
      );
    }

    if (Math.abs(truck.position - truckDestination.position) < truck.speed) {
      truck.position = truckDestination.position; // Snap to destination
    }

    if (truck.position === truckDestination.position) {
      if (
        notificationConfig.logTruckNotifications.all ||
        notificationConfig.logTruckNotifications.movement
      ) {
        logSuccess(
          `[TRUCK] ${truck.name} has arrived at ${truckDestination.name}`,
        );
        truck.debugMessage = "AR";
      }
    } else {
      if (
        notificationConfig.logTruckNotifications.all ||
        notificationConfig.logTruckNotifications.movement
      ) {
        logInfo(
          `[TRUCK] ${truck.name} moved ${truck.speed}${measurementConfig.distanceUnit}/${measurementConfig.tickUnit} and is ${Math.abs(distance)}${measurementConfig.distanceUnit} away from the destination`,
        );
        truck.debugMessage = "MV";
      }
    }
  } else {
    truck.destinationId = undefined;
  }
};

// .. UPDATE
export const updateTrucks = (state: IWorldState) => {
  state.trucks.forEach((truck) => {
    const truckContract = getContractByIdOrNull(state, truck.contractId);

    updateTruckPosition(state, truck);

    if (truckContract) {
      const contractSupplier = getLocationById(state, truckContract.supplierId);
      const contractDestination = getLocationById(
        state,
        truckContract.destinationId,
      );

      if (truck.position === contractSupplier.position) {
        const amountLeftToLoad =
          truckContract.totalAmount - truck.storage.resourceCount;

        if (
          notificationConfig.logTruckNotifications.all ||
          notificationConfig.logTruckNotifications.loading
        ) {
          logInfo(
            `[TRUCK] ${truck.name} requested ${amountLeftToLoad} ${truckContract.resourceType} from ${contractSupplier.name}`,
          );
          truck.debugMessage = "LD-ST";
        }

        const loadResult = transferResources(
          state,
          amountLeftToLoad,
          truckContract.resourceType,
          contractSupplier.storage,
          [truck.storage],
        );

        if (
          (loadResult === StorageTransferResult.SUCCESS ||
            loadResult === StorageTransferResult.DESTINATION_FULL,
          amountLeftToLoad <= 0)
        ) {
          if (
            notificationConfig.logTruckNotifications.all ||
            notificationConfig.logTruckNotifications.loading
          ) {
            const contractDestination = state
              .getLocations()
              .find((l) => l.id === truckContract.destinationId);
            logSuccess(
              `[TRUCK] ${truck.name} finished loading at ${contractSupplier.name}. Heading to ${contractDestination!.name}`,
            );
            truck.debugMessage = "LD-FN";
          }
          truck.destinationId = truckContract.destinationId;
        } else if (StorageTransferResult.SOURCE_EMPTY) {
          if (
            notificationConfig.logTruckNotifications.all ||
            notificationConfig.logTruckNotifications.loading
          ) {
            logInfo(
              `[TRUCK] ${truck.name} will wait for the rest of the ${truckContract.resourceType} (${truckContract.totalAmount - truck.storage.resourceCount} left)`,
            );
            truck.debugMessage = "LD-WT";
          }
        }
      }

      if (truck.position === contractDestination.position) {
        const unloadResult = transferResources(
          state,
          truck.storage.resourceCount,
          truck.storage.resourceType,
          [truck.storage],
          contractDestination.storage,
        );

        if (unloadResult === StorageTransferResult.SUCCESS) {
          if (
            notificationConfig.logTruckNotifications.all ||
            notificationConfig.logTruckNotifications.unloading
          ) {
            logSuccess(
              `[TRUCK] ${truck.name} finished unloading at ${contractDestination.name}`,
            );
            truck.debugMessage = "UL-FN";
          }

          if (completeContract(state, truckContract)) {
            truck.destinationId = undefined;
            truck.contractId = undefined;

            if (!truckContract.acceptedAtTick) {
              throw Error(`Contract acceptedAtTick must be set`);
            }

            const truckCompany = getCompanyById(state, truck.companyId);
            const deliveryTime =
              state.currentTick - truckContract.acceptedAtTick;
            const operatingCost = deliveryTime * truck.operatingCostPerTick;

            // ..nowhere to pay funds to yet (e.g. petrol station, driver's bank account)
            // so we'll just transfer to the state (the void)
            transferFundsToState(truckCompany, operatingCost);

            if (
              notificationConfig.logTruckNotifications.all ||
              notificationConfig.logTruckNotifications.costs
            ) {
              logInfo(
                `[TRUCK] ${truck.name} was paid ${highlight.yellow(`${measurementConfig.currency}` + operatingCost)} for a ${highlight.yellow(deliveryTime + `-${measurementConfig.tickUnit}`)} job`,
              );
              truck.debugMessage = "CT-FN";
            }
          }
        } else if (unloadResult === StorageTransferResult.DESTINATION_FULL) {
          if (
            notificationConfig.logTruckNotifications.all ||
            notificationConfig.logTruckNotifications.unloading
          ) {
            logInfo(
              `[TRUCK] ${truck.name} will wait to unload the rest of the ${truckContract.resourceType} (${truck.storage.resourceCount} left)`,
            );
          }
          truck.debugMessage = "UL-WT";
        } else if (unloadResult === StorageTransferResult.SOURCE_EMPTY) {
          truck.destinationId = contractSupplier.id;
          truck.debugMessage = "CT-ST";
        }
      }
    } else {
      const validContract = state.contracts.find(
        (c) => c.resourceType === truck.storage.resourceType,
      );

      if (validContract) {
        if (assignContract(validContract, truck)) {
          truck.destinationId = validContract.supplierId;

          if (
            notificationConfig.logTruckNotifications.all ||
            notificationConfig.logTruckNotifications.movement
          ) {
            truck.debugMessage = "CT-ST";
          }
        } else {
          if (
            notificationConfig.logTruckNotifications.all ||
            notificationConfig.logTruckNotifications.movement
          ) {
            truck.debugMessage = "CT-FL";
          }
        }
      } else {
        if (
          notificationConfig.logTruckNotifications.all ||
          notificationConfig.logTruckNotifications.movement
        ) {
          truck.debugMessage = "N-CT";
        }
      }
    }
  });
};

// .. DELETE

// .. TODO? Deleting/selling trucks?

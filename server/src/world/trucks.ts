import {
  RESOURCE_TYPE,
  StorageTransferResult,
  WorldEntityType,
  ITruck,
  VEHICLE_TYPE,
  IWorldState,
  IContract,
  logSuccess,
  logInfo,
  highlight,
  logWarning,
} from "@logisim/lib";
import { loadNotificationConfig } from "../notifications";
import {
  breakContract,
  completeContract,
  CONTRACT_BREAK_TYPE,
  getContractByIdOrNull,
} from "./contracts";
import {
  createCompanyEntity,
  getCompanyById,
  transferCompanyFundsToState,
} from "./companies";
import { getLocationById, getLocationByIdOrNull } from "./locations/locations";
import { createAndGetStorage, transferResources } from "./storages";
import { loadConfig } from "../utils/configUtils";

interface ITruckConfig {
  baseOperatingCost: number;
  baseSalePrice: number;
}

const defaultConfig: ITruckConfig = {
  baseOperatingCost: 100,
  baseSalePrice: 10000,
};

export const loadTruckConfig = () => loadConfig("truck", defaultConfig);

const truckConfig = loadTruckConfig();
const notificationConfig = loadNotificationConfig();

// .. CREATE
export const createTruck = (
  state: IWorldState,
  name: string,
  companyId: string,
  resourceType: RESOURCE_TYPE,
  resourceCapacity: number,
  position: number,
  speed: number,
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
    speed,
    storage,
    position,
    type: WorldEntityType.Vehicle,
    vehicleType: VEHICLE_TYPE.Truck,
  };

  if (notificationConfig.logTruckNotifications.all) {
    logSuccess(
      `[TRUCK] Created a ${highlight.yellow(resourceType)} truck at position ${highlight.yellow(position)}`,
    );
  }

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
  const truck = state.trucks.find((t) => t.position === position);

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
    truck.position -= direction * truck.speed;

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
          `[TRUCK] ${truck.name} moved ${truck.speed} distance units and is ${Math.abs(distance)} units away from the destination`,
        );
        truck.debugMessage = "MV";
      }
    }
  } else {
    stopTruck(truck);
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
      } else if (truck.position === contractDestination.position) {
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
            stopTruck(truck);
            truck.contractId = undefined;

            if (!truckContract.acceptedAtTick) {
              throw Error(`Contract acceptedAtTick must be set`);
            }

            const truckCompany = getCompanyById(state, truck.companyId);
            const deliveryTime =
              state.currentTick - truckContract.acceptedAtTick;
            const operatingCost = deliveryTime * truckConfig.baseOperatingCost;

            transferCompanyFundsToState(truckCompany, operatingCost);

            if (
              notificationConfig.logTruckNotifications.all ||
              notificationConfig.logTruckNotifications.costs
            ) {
              logInfo(
                `[TRUCK] ${truck.name} was paid ${highlight.yellow("$" + operatingCost)} for a ${highlight.yellow(deliveryTime + "-tick")} job`,
              );

              if (notificationConfig.logTruckNotifications.all) {
                truck.debugMessage = "CT-FN";
              }
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

          if (notificationConfig.logTruckNotifications.all) {
            truck.debugMessage = "CT-ST";
          }
        }
      } else if (!truck.destinationId) {
        truck.destinationId = truckContract.supplierId;
      }
    }
  });
};

export const setTruckContract = (truck: ITruck, contract: IContract) => {
  truck.contractId = contract.id;
};

export const stopTruck = (truck: ITruck) => {
  truck.destinationId = undefined;
};

// .. DELETE

export const deleteTruck = (state: IWorldState, truck: ITruck) => {
  const truckContract = getContractByIdOrNull(state, truck.contractId);

  if (notificationConfig.logTruckNotifications) {
    logSuccess(
      `[TRUCK] Deleted a ${highlight.yellow(truck.storage.resourceType)} truck`,
    );
  }

  if (truckContract) {
    breakContract(state, truckContract, CONTRACT_BREAK_TYPE.SHIPPER);
  }

  state.trucks = state.trucks.filter((t) => t.id !== truck.id);
};

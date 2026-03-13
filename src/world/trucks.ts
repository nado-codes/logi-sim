import { RESOURCE_TYPE, StorageTransferResult } from "../entities/storage";
import { ITruck } from "../entities/truck";
import { loadNotificationConfig } from "../notifications";
import {
  assignContract,
  completeContract,
  getContractByIdOrNull,
} from "./contracts";
import { logSuccess, logInfo, highlight } from "../utils/logUtils";
import { createCompanyEntity, getCompanyById } from "./companies";
import { getLocationById, getLocationByIdOrNull } from "./locations/locations";
import { IWorldState } from "../entities/world";
import { createAndGetStorage, transferResources } from "./storages";

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
      if (notificationConfig.showTruckNotifications) {
        logSuccess(
          `[TRUCK] ${truck.id} has arrived at ${truckDestination.name}`,
        );
        truck.debugMessage = "AR";
      }
    } else {
      if (notificationConfig.showTruckNotifications) {
        logInfo(
          `[TRUCK] ${truck.id} moved ${truck.speed} distance units and is ${Math.abs(distance)} units away from the destination`,
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

    // TEMP - just debug code for showing messages - DO NOT CHECK THIS IN
    if (truck.storage.resourceType === RESOURCE_TYPE.FLOUR) {
      const truckSupplier = getLocationByIdOrNull(
        state,
        truckContract?.supplierId,
      );

      const truckDestination = getLocationByIdOrNull(
        state,
        truck.destinationId,
      );
      //truck.debugMessage = `Str: ${truck.storage.resourceCount} ${truck.storage.resourceType.substring(0, 2)}, Dst: ${truckDestination ? truckDestination.name : "N/A"}, CtrSup: ${truckSupplier ? truckSupplier.name : "N/A"}`;
    }

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

        if (notificationConfig.showTruckNotifications) {
          logInfo(
            `[TRUCK] ${truck.id} requested ${amountLeftToLoad} ${truckContract.resourceType} from ${contractSupplier.name}`,
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
          if (notificationConfig.showTruckNotifications) {
            const contractDestination = state
              .getLocations()
              .find((l) => l.id === truckContract.destinationId);
            logSuccess(
              `[TRUCK] ${truck.id} finished loading at ${contractSupplier.name}. Heading to ${contractDestination!.name}`,
            );
            truck.debugMessage = "LD-FN";
          }
          truck.destinationId = truckContract.destinationId;
        } else if (StorageTransferResult.SOURCE_EMPTY) {
          if (notificationConfig.showTruckNotifications) {
            logInfo(
              `[TRUCK] ${truck.id} will wait for the rest of the ${truckContract.resourceType} (${truckContract.totalAmount - truck.storage.resourceCount} left)`,
            );
            truck.debugMessage = "LD-WT";
          }
        }
      }

      if (truck.position === contractDestination.position) {
        if (notificationConfig.showTruckNotifications) {
          logInfo(
            `[TRUCK] ${truck.id} tried to unload ${truck.storage.resourceCount} ${truck.storage.resourceType} at ${contractDestination.name}`,
          );
          truck.debugMessage = "UL-ST";
        }

        const unloadResult = transferResources(
          state,
          truckContract.totalAmount,
          truckContract.resourceType,
          [truck.storage],
          contractDestination.storage,
        );

        if (unloadResult === StorageTransferResult.SUCCESS) {
          if (notificationConfig.showTruckNotifications) {
            logSuccess(
              `[TRUCK] ${truck.id} finished unloading at ${contractDestination.name}. Contract completed`,
            );
            truck.debugMessage = "UL-FN";
          }

          if (completeContract(state, truckContract)) {
            truck.destinationId = undefined;
            truck.contractId = undefined;

            if (notificationConfig.showTruckNotifications) {
              truck.debugMessage = "CT-FN";
            }
          }
        } else if (unloadResult === StorageTransferResult.DESTINATION_FULL) {
          if (notificationConfig.showTruckNotifications) {
            logInfo(
              `[TRUCK] ${truck.id} will wait to unload the rest of the ${truckContract.resourceType} (${truck.storage.resourceCount} left)`,
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

          if (notificationConfig.showTruckNotifications) {
            truck.debugMessage = "CT-ST";
          }
        } else {
          if (notificationConfig.showTruckNotifications) {
            truck.debugMessage = "CT-FL";
          }
        }
      } else {
        if (notificationConfig.showTruckNotifications) {
          truck.debugMessage = "N-CT";
        }
      }
    }
  });
};

// .. DELETE

// .. TODO? Deleting/selling trucks?

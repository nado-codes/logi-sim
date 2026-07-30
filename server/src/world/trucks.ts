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
import {
  getLocationById,
  getLocationByIdOrNull,
  getLocationByPositionOrNull,
} from "./locations/locations";
import {
  createAndGetStorage,
  resourceItemIdToResourceType,
  transferResources,
} from "./storages";
import { loadConfig } from "../utils/configUtils";
import {
  IWorldState,
  RESOURCE_TYPE,
  ITruck,
  WorldEntityType,
  VEHICLE_TYPE,
  StorageTransferResult,
  IContract,
  Pos3D,
  IVehicleItem,
  Nullable,
} from "@logisim/lib/entities";
import {
  logSuccess,
  highlight,
  logInfo,
  positionToString,
  positionsAreEqual,
  logError,
  getDistanceBetweenPositions,
  getVectorBetweenPositions,
  normaliseVector,
} from "@logisim/lib/utils";
import { loadJSON } from "../utils/fileUtils";

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

const defaultTrucksData: IVehicleItem[] = [
  {
    id: "truck-flour",
    name: "Flour Truck",
    resourceCapacity: 10000,
    resourceItemId: "resource-flour",
    speed: 2,
    price: 1000,
  },
  {
    id: "truck-grain",
    name: "Grain Truck",
    resourceCapacity: 10000,
    resourceItemId: "resource-grain",
    speed: 2,
    price: 1000,
  },
  {
    id: "truck-bigFlour",
    name: "Big Flour Truck",
    resourceCapacity: 1000000,
    resourceItemId: "resource-flour",
    speed: 1,
    price: 10000,
  },
];

const trucksData = loadJSON("trucks", defaultTrucksData) as IVehicleItem[];

// .. CREATE
export const createTruck = (
  state: IWorldState,
  name: string,
  companyId: string,
  resourceType: RESOURCE_TYPE,
  resourceCapacity: number,
  position: Pos3D,
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
    itemId: "CUSTOM",
    name,
    speed,
    storage,
    position,
    type: WorldEntityType.Vehicle,
    vehicleType: VEHICLE_TYPE.Truck,
  };

  if (notificationConfig.logTruckNotifications.all) {
    logSuccess(
      `[TRUCK] Created a ${highlight.yellow(resourceType)} truck at position ${highlight.yellow(positionToString(position))}`,
    );
  }

  state.trucks.push(newTruck);

  return newTruck;
};

export const createTruckFromItemId = (
  state: IWorldState,
  itemId: string,
  companyId: string,
  position: Pos3D,
) => {
  const truckData = trucksData.find((td) => td.id === itemId);

  if (truckData === undefined) {
    throw Error(`Truck with itemId ${itemId} doesn't exist`);
  }

  const { name, resourceItemId, resourceCapacity, speed } = truckData;

  const truck = createTruck(
    state,
    name,
    companyId,
    resourceItemIdToResourceType(resourceItemId),
    resourceCapacity,
    position,
    speed,
    0,
  );

  truck.itemId = itemId;

  return truck;
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
  position: Pos3D,
) => {
  const truck = state.trucks.find((t) =>
    positionsAreEqual(t.position, position),
  );

  return truck;
};

export const getTruckItemById = (id: string): IVehicleItem => {
  const truckData = trucksData.find((td) => td.id === id);

  if (truckData === undefined) {
    throw Error(`Truck with itemId ${id} doesn't exist`);
  }

  return truckData;
};

export const getTruckItemByIdOrNull = (
  id: string | undefined,
): Nullable<IVehicleItem> => {
  const truckData = trucksData.find((td) => td.id === id);

  return truckData;
};

export const getTruckItems = (): IVehicleItem[] => {
  return trucksData;
};

export const getTruckString = (state: IWorldState, truck: ITruck) => {
  const truckLocation = getLocationByPositionOrNull(state, truck.position);
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
    : `Position: ${highlight.yellow(positionToString(truck.position))}`;
  const contractString = `Contract: ${truckContract ? highlight.yellow(`${contractSupplier?.name}-->${contractDestination?.name}`) : highlight.yellow("None")}`;

  const truckCompany = getCompanyById(state, truck.companyId);

  return `| ${highlight.custom("███", truckCompany.color)} | Carries: ${highlight.yellow(truck.storage.resourceType)} | ${locationString} | ${contractString}`;
};

const updateTruckPosition = (state: IWorldState, truck: ITruck) => {
  const truckDestination = getLocationByIdOrNull(state, truck.destinationId);

  if (!truckDestination) {
    return;
  }

  const distanceToDestination = getDistanceBetweenPositions(
    truck.position,
    truckDestination.position,
  );
  const directionToDestination = normaliseVector(
    getVectorBetweenPositions(truck.position, truckDestination.position),
  );

  if (!positionsAreEqual(truck.position, truckDestination.position)) {
    if (distanceToDestination <= truck.speed) {
      truck.position = structuredClone(truckDestination.position);
    } else {
      truck.position.x += directionToDestination.x * truck.speed;
      truck.position.y += directionToDestination.y * truck.speed;
      truck.position.z += directionToDestination.z * truck.speed;
    }

    if (positionsAreEqual(truck.position, truckDestination.position)) {
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
          `[TRUCK] ${truck.name} moved ${truck.speed} distance units and is ${distanceToDestination} units away from the destination`,
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

      if (positionsAreEqual(truck.position, contractSupplier.position)) {
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
          loadResult === StorageTransferResult.SUCCESS ||
          loadResult === StorageTransferResult.DESTINATION_FULL
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
        } else if (loadResult === StorageTransferResult.SOURCE_EMPTY) {
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
      } else if (
        positionsAreEqual(truck.position, contractDestination.position)
      ) {
        const amountDelivered = truck.storage.resourceCount;
        const unloadResult = transferResources(
          state,
          truck.storage.resourceCount,
          truck.storage.resourceType,
          [truck.storage],
          contractDestination.storage,
        );
        truckContract.deliveredAmount += amountDelivered;

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

          if (truckContract.deliveredAmount < truckContract.totalAmount) {
            truck.destinationId = contractSupplier.id; // Go back to supplier for next load
            if (
              notificationConfig.logTruckNotifications.all ||
              notificationConfig.logTruckNotifications.unloading
            ) {
              logInfo(
                `[TRUCK] ${truck.name} will return to ${contractSupplier.name} to load the rest of the ${truckContract.resourceType} (${truckContract.totalAmount - truckContract.deliveredAmount} left)`,
              );
              truck.debugMessage = "UL-RT";
            }
          } else if (completeContract(state, truckContract)) {
            stopTruck(truck);
            truck.contractId = undefined;

            if (truckContract.acceptedAtTick === undefined) {
              logError(
                `Contract ${truckContract.id} doesn't have acceptedAtTick set`,
              );
              throw Error(`Contract acceptedAtTick must be set`);
            }

            const truckCompany = getCompanyById(state, truck.companyId);
            const deliveryTime =
              state.currentTick - truckContract.acceptedAtTick;
            const operatingCost = deliveryTime * truckConfig.baseOperatingCost;

            transferCompanyFundsToState(state, truckCompany, operatingCost);

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
    breakContract(state, truckContract, CONTRACT_BREAK_TYPE.Cancellation);
  }

  state.trucks = state.trucks.filter((t) => t.id !== truck.id);
};

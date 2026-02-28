import { randomUUID } from "crypto";
import {
  IStorage,
  RESOURCE_TYPE,
  createAndGetStorageUnsafe,
  createStorage,
  transferResources,
} from "../entities/storage";
import { ITruck, Truck } from "../entities/truck";
import { IWorldState } from "./state";
import { loadNotificationConfig } from "../notifications";
import { completeContract } from "./contracts";
import { logSuccess, logInfo, highlight } from "../utils/utils";
import { IWorld } from "./world";
import { createCompanyEntity as createCompanyEntityUnsafe } from "../entities/entity";
import { createCompanyAsset } from "./companies";
import { createWorldEntity } from "../entities";
import { OkResult } from "../utils/result";

const notificationConfig = loadNotificationConfig();

// .. CREATE
export const createTruckUnsafe = (
  state: IWorldState,
  name: string,
  companyId: string,
  resourceType: RESOURCE_TYPE,
  resourceCapacity: number,
  position: number,
  speed: number,
  resourceCount?: number,
) => {
  const newTruck = createCompanyEntityUnsafe(
    {
      name,
      position,
      speed,
      storage: createAndGetStorageUnsafe(
        resourceType,
        resourceCapacity,
        resourceCount,
      ),
    },
    companyId,
  );

  state.trucksUnsafe.push(newTruck);
};

export const createTruck = (
  state: IWorldState,
  companyId: string,
  position: number,
  name: string,
  resourceType: RESOURCE_TYPE,
  resourceCapacity: number,
  speed: number,
  resourceCount?: number,
): ITruck => {
  let destinationId: string | undefined = undefined;
  let contractId: string | undefined = undefined;

  const storage: IStorage = createStorage(
    resourceType,
    resourceCapacity,
    resourceCount,
  );

  const newTruck: ITruck = {
    ...createWorldEntity(position, name),
    ...createCompanyAsset(companyId, name),
    getSpeed: () => speed,
    getDestinationId: () => destinationId,
    getContractId: () => contractId,
    getStorage: () => storage,

    move: (direction: number) => move(direction),
  };

  const move = (direction: number) => {
    newTruck.setPosition(
      newTruck.getPosition() + direction * newTruck.getSpeed(),
    );

    return OkResult();
  };

  state.trucks.push(newTruck);

  return newTruck;
};

// .. READ
export const getTruckByPosition = (world: IWorld, position: number) => {
  const trucks = world.getTrucks();
  const truck = trucks.find((t) => t.getPosition() === position);

  return truck;
};

export const getTruckIcon = (world: IWorld, truck: ITruck) => {
  const company = world.getCompanyById(truck.getCompanyId());

  const icon = `[T${truck.getStorage().getResourceCount() > 0 ? "o" : ""}]`;
  return highlight.custom(icon, company.getColor());
};

export const getTruckString = (world: IWorld, truck: Truck) => {
  const truckLocation = world
    .getLocations()
    .find((l) => l.position === truck.position);

  const locationString = truckLocation
    ? `Location: ${highlight.yellow(truckLocation.name)}`
    : `Position: ${highlight.yellow(truck.position + "")}`;
  const contractString = `Contract: ${truck.contract ? highlight.yellow(`${truck.contract.supplier.name}-->${truck.contract.destination.name}`) : highlight.yellow("None")}`;

  return `| Carries: ${highlight.yellow(truck.storage.resourceType)} | ${locationString} | ${contractString}`;
};

// .. UPDATE
export const updateTrucks = (state: IWorldState) => {
  state.trucksUnsafe.forEach((truck) => {
    if (truck.destination) {
      const distance = truck.position - truck.destination.position;
      const direction = Math.sign(distance);

      if (truck.position != truck.destination.position) {
        truck.position -= direction * truck.speed;

        if (
          Math.abs(truck.position - truck.destination.position) < truck.speed
        ) {
          truck.position = truck.destination.position; // Snap to destination
        }

        if (truck.position === truck.destination.position) {
          if (notificationConfig.showTruckNotifications) {
            logSuccess(
              `[TRUCK] ${truck.id} has arrived at ${truck.destination.name}`,
            );
          }
        } else {
          if (notificationConfig.showTruckNotifications) {
            logInfo(
              `[TRUCK] ${truck.id} moved ${truck.speed} distance units and is ${Math.abs(distance)} units away from the destination`,
            );
          }
        }
      } else {
        if (truck.contract) {
          if (truck.destination === truck.contract.supplier) {
            const amountLeftToLoad =
              truck.contract.amount - truck.storage.resourceCount;

            if (notificationConfig.showTruckNotifications) {
              logInfo(
                `[TRUCK] ${truck.id} requested ${amountLeftToLoad} ${truck.contract.resourceType} from ${truck.destination.name}`,
              );
            }

            if (
              transferResources(
                amountLeftToLoad,
                truck.contract.resourceType,
                truck.destination.storage,
                [truck.storage],
              ) ||
              amountLeftToLoad <= 0
            ) {
              if (notificationConfig.showTruckNotifications) {
                logSuccess(
                  `[TRUCK] ${truck.id} finished loading at ${truck.destination.name}. Heading to ${truck.contract.destination.name}`,
                );
              }
              truck.destination = truck.contract.destination;
            } else {
              if (notificationConfig.showTruckNotifications) {
                logInfo(
                  `[TRUCK] ${truck.id} will wait for the rest of the ${truck.contract.resourceType} (${truck.contract.amount - truck.storage.resourceCount} left)`,
                );
              }
            }
          } else if (truck.destination === truck.contract.destination) {
            if (
              transferResources(
                truck.contract.amount,
                truck.contract.resourceType,
                [truck.storage],
                truck.destination.storage,
              )
            ) {
              if (notificationConfig.showTruckNotifications) {
                logSuccess(
                  `[TRUCK] ${truck.id} finished unloading at ${truck.destination.name}. Contract completed`,
                );
              }

              if (completeContract(state, truck.contract)) {
                truck.destination = undefined;
                truck.contract = undefined;
              }
            } else {
              if (notificationConfig.showTruckNotifications) {
                logInfo(
                  `[TRUCK] ${truck.id} will wait to unload the rest of the ${truck.contract.resourceType} (${truck.storage.resourceCount} left)`,
                );
              }
            }
          }
        }
      }
    } else if (truck.contract) {
      truck.destination = truck.contract.supplier;
    } else if (state.contracts.length > 0) {
      // TEST: disable the auto-acceptance for contracts so that the player has to manually do it
      // test if the core contract acceptance loop is fun
      /*
      if (notificationConfig.showTruckNotifications) {
        logInfo(`[TRUCK] ${truck.id} is looking for a contract...`);
      }

      // .. if there's a contract available and the truck is doing nothing, accept the contract
      const contract = state.contracts.filter(
        (c) => !c.shipper && c.resourceType === truck.storage.resourceType,
      )[0];

      // .. TODO: if a particular truck can't complete the contract on its own, it will subcontract it to someone who can

      if (!contract) {
        if (notificationConfig.showTruckNotifications) {
          logInfo(` - No contracts available`);
        }
      } else {
        contract.shipper = truck;
        truck.contract = contract;
        truck.destination = contract.supplier;

        if (notificationConfig.showTruckNotifications) {
          logSuccess(` - Accepted contract ${contract.id}`);
        }
      } */
    }
  });
};

// .. DELETE

// .. TODO: sell or delete a truck

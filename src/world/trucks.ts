import { randomUUID } from "crypto";
import {
  RESOURCE_TYPE,
  createAndGetStorage,
  transferResources,
} from "../entities/storage";
import { ITruck } from "../entities/truck";
import { IWorldState } from "./state";
import { loadNotificationConfig } from "../notifications";
import { completeContract } from "./contracts";
import { logSuccess, logInfo, yellow } from "../logUtils";
import { IWorld } from "./world";

const notificationConfig = loadNotificationConfig();

export const createTruck = (
  state: IWorldState,
  resourceType: RESOURCE_TYPE,
  resourceCapacity: number,
  position: number,
  speed: number,
  resourceCount?: number,
) => {
  const newTruck: ITruck = {
    id: randomUUID(),
    storage: createAndGetStorage(resourceType, resourceCapacity, resourceCount),
    position,
    speed,
  };

  state.trucks.push(newTruck);
};

export const getTruckString = (world: IWorld, truck: ITruck) => {
  const truckLocation = world
    .getLocations()
    .find((l) => l.position === truck.position);

  return `| Carries: ${truck.storage.resourceType} | ${truckLocation ? `Location: ${truckLocation.name}` : `Position: ${truck.position}`}`;
};

export const updateTrucks = (state: IWorldState) => {
  state.trucks.forEach((truck) => {
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
                  `[TRUCK] ${truck.id} finished loading at ${truck.destination.name}. Heading to ${truck.contract.owner.name}`,
                );
              }
              truck.destination = truck.contract.owner;
            } else {
              if (notificationConfig.showTruckNotifications) {
                logInfo(
                  `[TRUCK] ${truck.id} will wait for the rest of the ${truck.contract.resourceType} (${truck.contract.amount - truck.storage.resourceCount} left)`,
                );
              }
            }
          } else if (truck.destination === truck.contract.owner) {
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

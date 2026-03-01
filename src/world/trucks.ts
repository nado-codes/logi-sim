import {
  RESOURCE_TYPE,
  createAndGetStorage,
  transferResources,
} from "../entities/storage";
import { ITruck } from "../entities/truck";
import { IWorldState } from "./state";
import { loadNotificationConfig } from "../notifications";
import { completeContract } from "./contracts";
import { logSuccess, logInfo, highlight } from "../logUtils";
import { IWorld } from "./world";
import { createCompanyEntity } from "./companies";

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
  const storage = createAndGetStorage(
    resourceType,
    resourceCapacity,
    resourceCount,
  );

  const newTruck: ITruck = {
    ...createCompanyEntity(companyId),
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

export const getTruckByPositionOrNull = (
  state: IWorldState,
  position: number,
) => {
  const truck = state.trucks.find((t) => t.position === position);

  return truck;
};

export const getTruckString = (world: IWorld, truck: ITruck) => {
  const truckLocation = world
    .getLocations()
    .find((l) => l.position === truck.position);
  const truckContract = world.getContractByIdOrNull(truck.contractId);

  const contractSupplier = world.getLocationByIdOrNull(
    truckContract?.supplierId,
  );
  const contractDestination = world.getLocationByIdOrNull(
    truckContract?.destinationId,
  );

  const locationString = truckLocation
    ? `Location: ${highlight.yellow(truckLocation.name)}`
    : `Position: ${highlight.yellow(truck.position + "")}`;
  const contractString = `Contract: ${truckContract ? highlight.yellow(`${contractSupplier?.name}-->${contractDestination?.name}`) : highlight.yellow("None")}`;

  return `| Carries: ${highlight.yellow(truck.storage.resourceType)} | ${locationString} | ${contractString}`;
};

// .. UPDATE
export const updateTrucks = (state: IWorldState) => {
  state.trucks.forEach((truck) => {
    const truckDestination = state
      .getLocations()
      .find((l) => l.id === truck.destinationId);
    const truckContract = state.contracts.find(
      (c) => c.id === truck.contractId,
    );

    if (truckDestination) {
      const distance = truck.position - truckDestination.position;
      const direction = Math.sign(distance);

      if (truck.position != truckDestination.position) {
        truck.position -= direction * truck.speed;

        if (
          Math.abs(truck.position - truckDestination.position) < truck.speed
        ) {
          truck.position = truckDestination.position; // Snap to destination
        }

        if (truck.position === truckDestination.position) {
          if (notificationConfig.showTruckNotifications) {
            logSuccess(
              `[TRUCK] ${truck.id} has arrived at ${truckDestination.name}`,
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
        if (truckContract) {
          if (truck.destinationId === truckContract.supplierId) {
            const amountLeftToLoad =
              truckContract.amount - truck.storage.resourceCount;

            if (notificationConfig.showTruckNotifications) {
              logInfo(
                `[TRUCK] ${truck.id} requested ${amountLeftToLoad} ${truckContract.resourceType} from ${truckDestination.name}`,
              );
            }

            if (
              transferResources(
                amountLeftToLoad,
                truckContract.resourceType,
                truckDestination.storage,
                [truck.storage],
              ) ||
              amountLeftToLoad <= 0
            ) {
              if (notificationConfig.showTruckNotifications) {
                const contractDestination = state
                  .getLocations()
                  .find((l) => l.id === truckContract.destinationId);
                logSuccess(
                  `[TRUCK] ${truck.id} finished loading at ${truckDestination.name}. Heading to ${contractDestination!.name}`,
                );
              }
              truck.destinationId = truckContract.destinationId;
            } else {
              if (notificationConfig.showTruckNotifications) {
                logInfo(
                  `[TRUCK] ${truck.id} will wait for the rest of the ${truckContract.resourceType} (${truckContract.amount - truck.storage.resourceCount} left)`,
                );
              }
            }
          } else if (truck.destinationId === truckContract.destinationId) {
            if (
              transferResources(
                truckContract.amount,
                truckContract.resourceType,
                [truck.storage],
                truckDestination.storage,
              )
            ) {
              if (notificationConfig.showTruckNotifications) {
                logSuccess(
                  `[TRUCK] ${truck.id} finished unloading at ${truckDestination.name}. Contract completed`,
                );
              }

              if (completeContract(state, truckContract)) {
                truck.destinationId = undefined;
                truck.contractId = undefined;
              }
            } else {
              if (notificationConfig.showTruckNotifications) {
                logInfo(
                  `[TRUCK] ${truck.id} will wait to unload the rest of the ${truckContract.resourceType} (${truck.storage.resourceCount} left)`,
                );
              }
            }
          }
        }
      }
    } else if (truckContract) {
      truck.destinationId = truckContract.supplierId;
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
        truckContract = contract;
        truckDestination = contract.supplier;

        if (notificationConfig.showTruckNotifications) {
          logSuccess(` - Accepted contract ${contract.id}`);
        }
      } */
    }
  });
};

// .. DELETE

// .. TODO? Deleting/selling trucks?

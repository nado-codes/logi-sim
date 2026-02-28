import { BaseLocation, LOCATION_TYPE } from "../../entities/location";
import { getResourceStorage, RESOURCE_TYPE } from "../../entities/storage";
import { ITruck, Truck } from "../../entities/truck";
import { loadNotificationConfig } from "../../notifications";
import { logWarning, logInfo, logError, highlight } from "../../utils/utils";
import { getContractByResource, createContract } from "../contracts";
import { IWorldState } from "../state";
import { getTruckIcon } from "../trucks";
import { IWorld } from "../world";

const notificationConfig = loadNotificationConfig();

// .. CREATE

// .. READ
export const getMap = (world: IWorld) => {
  const locations = world.getLocations();

  const worldPositions = [
    ...locations.map((l) => l.position),
    ...world.getTrucksUnsafe().map((t) => t.position),
  ];
  const maxPosition = worldPositions.reduce((a, c) => Math.max(a, c));

  let map = "";

  for (var pos = 0; pos <= maxPosition; pos++) {
    const locationAtPos = locations.find((l) => l.position === pos);

    // .. getTruckByPosition
    let truckAtPos: Truck | undefined; //world.get;

    if (locationAtPos) {
      switch (locationAtPos.type) {
        case LOCATION_TYPE.PRODUCER:
          map += "[PRD";
          break;
        case LOCATION_TYPE.PROCESSOR:
          map += "[PRC";
          break;
        case LOCATION_TYPE.CONSUMER:
          map += "[CNS";
          break;
      }

      // .. getContractByDestinationId
      if (world.getContracts().find((c) => c.destination === locationAtPos)) {
        map += `\x1b[31m!\x1b[0m`;
      }
      map += "]";
    } else if (truckAtPos) {
      //map += getTruckIcon(world, truckAtPos);
      map += "[T";

      if (truckAtPos.storage.resourceCount > 0) {
        map += `\x1b[32mo\x1b[0m`;
      }

      map += "]";
    } else {
      map += "_";
    }
  }

  return map;
};

export const getLocationString = (location: BaseLocation) => {
  const locationString = `Position: ${highlight.yellow(location.position + "")}`;

  const inputs = Object.entries(location.recipe.inputs ?? []).map(
    ([res, amt]) => `${highlight.yellow(amt + " " + res)}`,
  );
  const inputsString =
    inputs.length > 0 ? inputs.join(",") : highlight.yellow("None");

  const outputs = Object.entries(location.recipe.outputs ?? []).map(
    ([res, amt]) => `${highlight.yellow(amt + " " + res)}`,
  );
  const outputsString =
    outputs.length > 0 ? outputs.join(",") : highlight.yellow("None");

  return `| ${highlight.yellow(location.name)} | Inputs: ${inputsString} | Outputs: ${outputsString} | ${locationString}`;
};

// .. UPDATE

export const replenishInputStorage = (
  state: IWorldState,
  location: BaseLocation,
  minInputThreshold?: number,
) => {
  Object.entries(location.recipe.inputs ?? {}).map(
    ([resourceType, requiredAmount]) => {
      const inputStorage = getResourceStorage(
        resourceType as RESOURCE_TYPE,
        location.storage,
      );
      const inputStorageCount = inputStorage
        .map((s) => s.resourceCount)
        .reduce((c, v) => c + v);

      const contract = getContractByResource(
        state,
        location.id,
        resourceType as RESOURCE_TYPE,
      );

      if (inputStorageCount < (minInputThreshold ?? requiredAmount)) {
        if (!contract) {
          if (notificationConfig.showLocationNotifications) {
            logWarning(
              `[LOCATION WARNING] ${location.name} doesn't have enough ${inputStorage[0].resourceType} ${inputStorageCount > 0 ? `(only ${inputStorageCount} available) ` : ""}- so we'll create a contract`,
            );
          }

          if (notificationConfig.showLocationNotifications) {
            logInfo(
              `[LOCATION INFO] ${location.name} is searching for a supplier...`,
            );
          }
          const suppliers = [
            ...state.consumers,
            ...state.processors,
            ...state.producers,
          ].filter((s) => {
            const hasResources = s.storage.some(
              (st) => st.resourceType === resourceType && st.resourceCount > 0,
            );

            if (s.id !== location.id) {
              if (notificationConfig.showLocationNotifications) {
                logInfo(
                  ` - Contacted ${s.name} -> ${hasResources ? "Found some resources!" : "Nothing available"}`,
                );
              }
            }
            return hasResources && s.id !== location.id;
          });

          if (suppliers.length === 0) {
            return undefined;
          }

          let closestSupplier = suppliers[0];
          let closestDistance = Math.abs(
            location.position - closestSupplier.position,
          );

          for (const supplier of suppliers) {
            const distance = Math.abs(location.position - supplier.position);

            if (distance < closestDistance) {
              closestSupplier = supplier;
              closestDistance = distance;
            }
          }

          if (!closestSupplier) {
            if (notificationConfig.showLocationNotifications) {
              logError(`- No nearby suppliers to resupply ${location.name}`);
            }
          } else {
            // .. if there's literally NO STOCK left, we need to create an URGENT contract (due sooner, more needs to be transported)
            createContract(
              state,
              "",
              location.companyId,
              location,
              closestSupplier,
              inputStorage[0].resourceType,
              Math.ceil((minInputThreshold ?? requiredAmount) * 1.5),
              100,
              10,
            );
          }
        } else if (!contract.shipper) {
          logError(
            `- ${location.name} was unable to create a contract because one already exists and is NOT being shipped`,
          );
        }
      }
    },
  );
};

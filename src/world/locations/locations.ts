import { createWorldEntity } from "../../entities";
import { Nullable } from "../../entities/entity";
import {
  IBaseLocation,
  LOCATION_TYPE,
} from "../../entities/locations/location";
import {
  getResourceStorage,
  IRecipe,
  IStorage,
  RESOURCE_TYPE,
} from "../../entities/storage";
import { loadNotificationConfig } from "../../notifications";
import { logWarning, logInfo, logError, highlight } from "../../logUtils";
import { getContractByResource, createContract } from "../contracts";
import { IWorld } from "../world";
import { IWorldState } from "../../entities/world";

const notificationConfig = loadNotificationConfig();

// .. CREATE

export const createBaseLocation = (
  name: string,
  companyId: string,
  position: number,
  storage: IStorage[],
  recipe: IRecipe,
  type: LOCATION_TYPE,
): IBaseLocation => {
  return {
    ...createWorldEntity(position, name),
    storage,
    recipe,
    type,
    companyId,
  };
};

export const getLocationById = (
  state: IWorldState,
  id: string,
): IBaseLocation => {
  const location = state.getLocations().find((l) => l.id === id);

  if (!location) {
    throw Error(`[CRITICAL SYSTEM ERROR] Location with id ${id} doesn't exist`);
  }

  return location;
};

export const getLocationByIdOrNull = (
  state: IWorldState,
  id: Nullable<string>,
): Nullable<IBaseLocation> => {
  const location = state.getLocations().find((l) => l.id === id);

  return location;
};

// .. READ

export const getLocationByPositionOrNull = (
  state: IWorldState,
  position: number,
) => {
  const location = state.getLocations().find((l) => l.position === position);

  return location;
};

export const getLocationString = (world: IWorld, location: IBaseLocation) => {
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

  const locationCompany = world.getCompanyById(location.companyId);

  return `| ${highlight.custom("███", locationCompany.color)} | ${highlight.yellow(location.name)} | Inputs: ${inputsString} | Outputs: ${outputsString} | ${locationString}`;
};

// .. UPDATE

export const replenishInputStorage = (
  state: IWorldState,
  location: IBaseLocation,
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
          const suppliers = state.getLocations().filter((s) => {
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
            const truckSpeed = 2;
            const dueTicks = closestDistance / truckSpeed;

            createContract(
              state,
              location.companyId,
              location.id,
              closestSupplier.id,
              inputStorage[0].resourceType,
              Math.ceil((minInputThreshold ?? requiredAmount) * 1.5),
              100,
              dueTicks,
            );
          }
        } else if (!contract.shipperId) {
          logError(
            `- ${location.name} was unable to create a contract because one already exists and is NOT being shipped`,
          );
        }
      }
    },
  );
};

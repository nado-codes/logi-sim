import {
  Nullable,
  WorldEntityType,
  IBaseLocation,
  LOCATION_TYPE,
  IRecipe,
  RESOURCE_TYPE,
} from "@logisim/lib";
import { loadNotificationConfig } from "../../notifications";
import {
  getContractByResource,
  createContract,
  breakContract,
  CONTRACT_BREAK_TYPE,
  getContractByLocationIdOrNull,
} from "../contracts";
import { IWorld } from "../world";
import { IWorldState } from "@logisim/lib";
import {
  loadStorageConfig,
  createRecipeStorage,
  getResourceStorage,
} from "../storages";
import { loadConfig } from "../../utils/configUtils";
import { createWorldEntity } from "../../entities";
import {
  highlight,
  logWarning,
  logInfo,
  logError,
  logSuccess,
} from "../../utils/logUtils";

interface ILocationConfig {
  baseSalePrice: number;
}

const defaultConfig: ILocationConfig = {
  baseSalePrice: 50000,
};

export const loadLocationConfig = () => loadConfig("location", defaultConfig);

const notificationConfig = loadNotificationConfig();
const storageConfig = loadStorageConfig();

// .. CREATE

export const createBaseLocation = (
  name: string,
  companyId: string,
  position: number,
  recipe: IRecipe,
  locationType: LOCATION_TYPE,
  startWithFullInputs: boolean = false,
  startWithFullOutputs: boolean = false,
): IBaseLocation => {
  const worldEntity = createWorldEntity(
    WorldEntityType.Location,
    position,
    name,
  );

  const storage = createRecipeStorage(
    worldEntity.id,
    recipe,
    startWithFullInputs,
    startWithFullOutputs,
  );

  return {
    ...worldEntity,
    storage,
    recipe,
    locationType,
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

export const checkInputStorage = (
  state: IWorldState,
  location: IBaseLocation,
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
      const inputStorageCapacity = inputStorage
        .map((s) => s.resourceCapacity)
        .reduce((c, v) => c + v);

      const contract = getContractByResource(
        state,
        location.id,
        resourceType as RESOURCE_TYPE,
      );

      if (
        inputStorageCount <
        inputStorageCapacity * storageConfig.storageLowThreshold
      ) {
        if (!contract) {
          if (notificationConfig.logLocationNotifications) {
            logWarning(
              `[LOCATION WARNING] ${location.name} doesn't have enough ${inputStorage[0].resourceType} ${inputStorageCount > 0 ? `(only ${inputStorageCount} available) ` : ""}- so we'll create a contract`,
            );
          }

          if (notificationConfig.logLocationNotifications) {
            logInfo(
              `[LOCATION INFO] ${location.name} is searching for a supplier...`,
            );
          }
          const suppliers = state.getLocations().filter((s) => {
            const hasResources = s.storage.some(
              (st) => st.resourceType === resourceType && st.resourceCount > 0,
            );

            if (s.id !== location.id) {
              if (notificationConfig.logLocationNotifications) {
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
            if (notificationConfig.logLocationNotifications) {
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
              requiredAmount * 100,
              dueTicks,
            );
          }
        } else if (!contract.truckId) {
          if (notificationConfig.logLocationNotifications) {
            logError(
              `- ${location.name} was unable to create a contract because one already exists and is NOT being shipped`,
            );
          }
        }
      }
    },
  );
};

// .. DELETE

export const deleteLocation = (state: IWorldState, location: IBaseLocation) => {
  const locationContract = getContractByLocationIdOrNull(state, location.id);

  if (notificationConfig.logLocationNotifications) {
    logSuccess(`[LOCATION] Deleted a ${location.name}`);
  }

  if (locationContract) {
    const breakType =
      location.id === locationContract.supplierId
        ? CONTRACT_BREAK_TYPE.SUPPLIER
        : CONTRACT_BREAK_TYPE.DESTINATION;

    breakContract(state, locationContract, breakType);
  }

  switch (location.locationType) {
    case LOCATION_TYPE.Producer:
      state.producers = state.producers.filter((p) => p.id !== location.id);
      break;
    case LOCATION_TYPE.Processor:
      state.processors = state.processors.filter((p) => p.id !== location.id);
      break;
    case LOCATION_TYPE.Consumer:
      break;
    case LOCATION_TYPE.Town:
      state.towns = state.towns.filter((t) => t.id !== location.id);
      break;
  }
};

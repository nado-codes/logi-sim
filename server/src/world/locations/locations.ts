import { loadNotificationConfig } from "../../notifications";
import {
  getContractByResource,
  createContract,
  breakContract,
  CONTRACT_BREAK_TYPE,
  getContractByLocationIdOrNull,
} from "../contracts";
import { IWorld } from "../world";
import {
  loadStorageConfig,
  createRecipeStorage,
  getResourceStorage,
  resourceItemIdToResourceType,
} from "../storages";
import { loadConfig } from "../../utils/configUtils";
import { createWorldEntity } from "../../entities";
import {
  IRecipe,
  LOCATION_TYPE,
  ILocation,
  WorldEntityType,
  IWorldState,
  Nullable,
  RESOURCE_TYPE,
  Pos3D,
  ILocationItem,
} from "@logisim/lib/entities";
import {
  highlight,
  logWarning,
  logInfo,
  logSuccess,
  vectorsAreEqual,
} from "@logisim/lib/utils";
import { loadJSON } from "../../utils/fileUtils";

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

export const createLocation = (
  name: string,
  companyId: string,
  position: Pos3D,
  recipe: IRecipe,
  locationType: LOCATION_TYPE,
  startWithFullInputs: boolean = false,
  startWithFullOutputs: boolean = false,
): ILocation => {
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

export const createLocationFromItemId = (state: IWorldState, itemId: string, companyId: string, position: Pos3D) => {
  const locationsData = loadJSON("data/locations.json") as ILocationItem[];
  const locationData = locationsData.find((ld) => ld.id === itemId);

  if (!locationData) {
    throw Error(`[CRITICAL SYSTEM ERROR] Location with id ${itemId} doesn't exist`);
  }

  const location = createLocation(
    locationData.name,
    companyId,
    position,
    locationData.recipe,
    locationData.locationType
  )

  return {...location,itemId};
};

// .. READ

export const getLocationById = (
  state: IWorldState,
  id: string,
): ILocation => {
  const location = state.getLocations().find((l) => l.id === id);

  if (!location) {
    throw Error(`[CRITICAL SYSTEM ERROR] Location with id ${id} doesn't exist`);
  }

  return location;
};

export const getLocationByIdOrNull = (
  state: IWorldState,
  id: Nullable<string>,
): Nullable<ILocation> => {
  const location = state.getLocations().find((l) => l.id === id);

  return location;
};

export const getLocationByPositionOrNull = (
  state: IWorldState,
  position: Pos3D,
) => {
  const location = state
    .getLocations()
    .find((l) => vectorsAreEqual(l.position, position));

  return location;
};

export const getLocationItemById = (id: string): ILocationItem => {
  const locationsData = loadJSON("data/locations.json") as ILocationItem[];
  const locationData = locationsData.find((ld) => ld.id === id);

  if (!locationData) {
    throw Error(`[CRITICAL SYSTEM ERROR] Location with id ${id} doesn't exist`);
  }

  return locationData;
}

export const getLocationItems = (): ILocationItem[] => {
  const locationsData = loadJSON("data/locations.json") as ILocationItem[];
  return locationsData;
}

export const getLocationString = (world: IWorld, location: ILocation) => {
  const locationString = `Position: ${highlight.yellow(location.position.x + "")}`;

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
  location: ILocation,
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
            location.position.x - closestSupplier.position.x,
          );

          for (const supplier of suppliers) {
            const distance = Math.abs(
              location.position.x - supplier.position.x,
            );

            if (distance < closestDistance) {
              closestSupplier = supplier;
              closestDistance = distance;
            }
          }

          if (!closestSupplier) {
            if (notificationConfig.logLocationNotifications) {
              logWarning(`- No nearby suppliers to resupply ${location.name}`);
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
            logWarning(
              `- ${location.name} was unable to create a contract because one already exists and is NOT being shipped`,
            );
          }
        }
      }
    },
  );
};

// .. DELETE

export const deleteLocation = (state: IWorldState, location: ILocation) => {
  const locationContract = getContractByLocationIdOrNull(state, location.id);

  if (notificationConfig.logLocationNotifications) {
    logSuccess(`[LOCATION] Deleted a ${location.name}`);
  }

  if (locationContract) {
    const breakType =
      location.id === locationContract.supplierId
        ? CONTRACT_BREAK_TYPE.Supplier
        : CONTRACT_BREAK_TYPE.Destination;

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

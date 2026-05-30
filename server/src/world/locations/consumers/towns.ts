import { createBaseConsumer, updateBaseConsumer } from "./consumers";
import { loadConfig } from "../../../utils/configUtils";
import { getInputStorage, loadStorageConfig } from "../../storages";
import {
  IWorldState,
  ResourceMap,
  LOCATION_TYPE,
  ITown,
  RESOURCE_TYPE,
  Pos3D,
} from "@logisim/lib/entities";
import { clamp, logInfo, logSuccess, logWarning } from "@logisim/lib/utils";
import { loadNotificationConfig } from "../../../notifications";

interface ITownConfig {
  populationGrowthThreshold: number;
  confidenceWarningThreshold: number;
  confidenceCriticalThreshold: number;
  baselinePopulation: number;
  baselineConfidence: number;
  populationScalingExponent: number;
  basePopulationGrowthRate: number;
  confidenceCriticalDeclineRate: number;
  confidenceWarningDeclineRate: number;
  minorConfidenceChange: number;
  majorConfidenceChange: number;
  catastrophicConfidenceChange: number;
  ptrRatio: number;
  stockCriticalThreshold: number;
  stockLowThreshold: number;
  stockOkThreshold: number;
  stockSafeThreshold: number;
  avgDwellingSize: number;
  townCatchmentRadius: number;
}

export const loadTownConfig = () => {
  const defaultConfig: ITownConfig = {
    populationGrowthThreshold: 70,
    confidenceWarningThreshold: 50,
    confidenceCriticalThreshold: 20,
    baselinePopulation: 100,
    baselineConfidence: 50,
    populationScalingExponent: 0.5, // .. 0.5 = square-root scaling
    basePopulationGrowthRate: 0.005,
    confidenceCriticalDeclineRate: 0.05,
    confidenceWarningDeclineRate: 0.01,
    minorConfidenceChange: 1,
    majorConfidenceChange: 3,
    catastrophicConfidenceChange: 5,
    ptrRatio: 10,
    stockCriticalThreshold: 0.2,
    stockLowThreshold: 0.4,
    stockOkThreshold: 0.75,
    stockSafeThreshold: 0.9,
    avgDwellingSize: 1,
    townCatchmentRadius: 6,
  };

  return loadConfig("town", defaultConfig);
};

const townConfig = loadTownConfig();
const storageConfig = loadStorageConfig();
const notificationConfig = loadNotificationConfig();

export const createTown = (
  state: IWorldState,
  name: string,
  companyId: string,
  position: Pos3D,
) => {
  // .. tier to be used to determine what resources are demanded

  const consumes: ResourceMap = {
    Flour: townConfig.baselinePopulation / townConfig.ptrRatio,
  };

  const newTown = {
    ...createBaseConsumer(name, companyId, position, consumes, true),
    locationType: LOCATION_TYPE.Town,
    confidence: townConfig.baselineConfidence,
    population: townConfig.baselinePopulation,
  };

  state.towns.push(newTown);

  return newTown;
};

export const townHasSpace = (town: ITown) => {
  const spaceTaken = town.population * townConfig.avgDwellingSize;
  if (
    notificationConfig.logTownNotifications.all ||
    notificationConfig.logTownNotifications.population
  ) {
    logInfo(
      "[TOWN] Checking available space of " +
        town.name +
        " - " +
        spaceTaken +
        " space taken against a catchment radius of " +
        townConfig.townCatchmentRadius * 2 +
        "...",
    );
  }
  return spaceTaken < townConfig.townCatchmentRadius * 2;
};

const updateTownConfidence = (town: ITown) => {
  const inputStorage = getInputStorage(town.recipe, town.storage);
  const stockLevels = inputStorage.map(
    (s) => s.resourceCount / s.resourceCapacity,
  );
  const avgStockLevel =
    stockLevels.reduce((a, c) => a + c) / stockLevels.length;

  if (avgStockLevel >= townConfig.stockSafeThreshold) {
    town.confidence += townConfig.majorConfidenceChange;
  } else if (avgStockLevel >= townConfig.stockOkThreshold) {
    town.confidence += townConfig.minorConfidenceChange;
  } else if (avgStockLevel >= townConfig.stockLowThreshold) {
    town.confidence -= townConfig.minorConfidenceChange;
  } else if (avgStockLevel >= townConfig.stockCriticalThreshold) {
    town.confidence -= townConfig.majorConfidenceChange;
  } else {
    town.confidence -= townConfig.catastrophicConfidenceChange;
  }

  // Apply to confidence
  town.confidence = clamp(town.confidence, 0, 100);
};

const updateTownPopulation = (town: ITown) => {
  const multiplier = Math.pow(
    town.population / townConfig.baselinePopulation,
    townConfig.populationScalingExponent,
  );

  if (
    notificationConfig.logTownNotifications.all ||
    notificationConfig.logTownNotifications.population
  ) {
    logInfo("[TOWN] Updating population for " + town.name + "...");
  }

  if (
    town.confidence >= townConfig.populationGrowthThreshold &&
    townHasSpace(town)
  ) {
    const growthRate = townConfig.basePopulationGrowthRate * multiplier;
    const gain = Math.max(town.population, 1) * growthRate;
    town.population += gain;
    if (
      notificationConfig.logTownNotifications.all ||
      notificationConfig.logTownNotifications.population
    ) {
      logSuccess(" - Town population has increased by " + gain);
    }
  } else if (town.confidence < townConfig.confidenceCriticalThreshold) {
    const declineRate = townConfig.confidenceCriticalDeclineRate * multiplier;
    const loss = town.population * declineRate;
    town.population -= loss;
    if (
      notificationConfig.logTownNotifications.all ||
      notificationConfig.logTownNotifications.population
    ) {
      logWarning(
        " - Town population has decreased by " +
          loss +
          " due to CRITICAL confidence",
      );
    }
  } else if (town.confidence < townConfig.confidenceWarningThreshold) {
    const declineRate = townConfig.confidenceWarningDeclineRate * multiplier;
    const loss = town.population * declineRate;
    town.population -= loss;
    if (
      notificationConfig.logTownNotifications.all ||
      notificationConfig.logTownNotifications.population
    ) {
      logWarning(
        " - Town population has decreased by " +
          loss +
          " due to low confidence",
      );
    }
  } else {
    if (
      notificationConfig.logTownNotifications.all ||
      notificationConfig.logTownNotifications.population
    ) {
      logWarning(
        " - Town population is unchanged because there's no space available",
      );
    }
  }

  town.population = Math.round(town.population);

  // e.g. 1 flour serves 10 (population-to-resource (PTR) ratio 1:10)
  const townInputs: ResourceMap = town.recipe.inputs ?? {};
  (Object.keys(townInputs ?? {}) as RESOURCE_TYPE[]).forEach((resourceType) => {
    const newConsumptionRate = Math.max(
      1,
      Math.round(town.population / townConfig.ptrRatio),
    );

    if (
      notificationConfig.logTownNotifications.all ||
      notificationConfig.logTownNotifications.population
    ) {
      logInfo(
        " - Resource consumption for " +
          resourceType +
          " was set to " +
          newConsumptionRate +
          " to reflect population",
      );
    }

    townInputs[resourceType] = newConsumptionRate;

    const resourceStorage = town.storage.filter(
      (s) => s.resourceType === resourceType,
    );
    resourceStorage.forEach((s) => {
      const newStorageCapacity =
        newConsumptionRate * storageConfig.recipeBufferStorageMultiplier;
      s.resourceCapacity = Math.max(s.resourceCount, newStorageCapacity);
    });

    if (
      notificationConfig.logTownNotifications.all ||
      notificationConfig.logTownNotifications.population
    ) {
      logInfo(
        " - Resource storage for " +
          resourceType +
          " was set to " +
          resourceStorage[0].resourceCapacity +
          " to reflect population",
      );
    }
  });
};

export const reseedTown = (town: ITown) => {
  town.confidence = townConfig.baselineConfidence;
  town.population = townConfig.baselinePopulation;

  const townInputs: ResourceMap = town.recipe.inputs ?? {};
  (Object.keys(townInputs ?? {}) as RESOURCE_TYPE[]).forEach((resourceType) => {
    townInputs[resourceType] = Math.max(
      1,
      Math.round(town.population / townConfig.ptrRatio),
    );
  });

  const townInputStorage = getInputStorage(town.recipe, town.storage);
  townInputStorage.forEach((s) => {
    s.resourceCount = 0;
    s.resourceCapacity =
      (town.population / townConfig.ptrRatio) *
      storageConfig.recipeBufferStorageMultiplier;
  });
};

export const updateTowns = (state: IWorldState) => {
  state.towns.forEach((town) => {
    updateBaseConsumer(state, town);
    updateTownConfidence(town);
    updateTownPopulation(town);
  });
};

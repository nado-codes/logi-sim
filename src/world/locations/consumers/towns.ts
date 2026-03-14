import { ITown } from "../../../entities/locations/consumer";
import { LOCATION_TYPE } from "../../../entities/locations/location";
import { RESOURCE_TYPE, ResourceMap } from "../../../entities/storage";
import { IWorldState } from "../../../entities/world";
import { getContractByLocationIdOrNull } from "../../contracts";
import { createBaseConsumer, updateBaseConsumer } from "./consumers";
import { loadConfig } from "../../../utils/configUtils";
import { clamp } from "../../../utils/mathUtils";
import { getInputStorage, loadStorageConfig } from "../../storages";

interface TownConfig {
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
}

const defaultConfig: TownConfig = {
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
};

const townConfig = loadConfig("town", defaultConfig);
const storageConfig = loadStorageConfig();

export const createTown = (
  state: IWorldState,
  name: string,
  companyId: string,
  position: number,
  startFull: boolean = false,
) => {
  // .. tier to be used to determine what resources are demanded

  const consumes: ResourceMap = {
    Flour: townConfig.baselinePopulation / townConfig.ptrRatio,
  };

  const newTown = {
    ...createBaseConsumer(name, companyId, position, consumes, true),
    type: LOCATION_TYPE.TOWN,
    confidence: townConfig.baselineConfidence,
    population: townConfig.baselinePopulation,
    migrationOffset: 0,
  };

  state.towns.push(newTown);
};

let stockHistory = [];

const updateTownConfidence = (state: IWorldState, town: ITown) => {
  // .. customers care if the shelves are empty whenever they go to buy something
  // .. if shelves are empty a lot of times in a row, confidence should fall

  const inputStorage = getInputStorage(town.recipe, town.storage);
  const stockLevels = inputStorage.map(
    (s) => s.resourceCount / s.resourceCapacity,
  );
  const avgStockLevel =
    stockLevels.reduce((a, c) => a + c) / stockLevels.length;
  stockHistory.push(avgStockLevel);

  const recentStockHistory = stockHistory.reverse().slice(0, 20);

  let confidenceChange = 0;

  recentStockHistory.forEach((avgStock) => {
    if (avgStock >= townConfig.stockSafeThreshold) {
      confidenceChange += townConfig.majorConfidenceChange;
    } else if (avgStock >= townConfig.stockOkThreshold) {
      confidenceChange += townConfig.minorConfidenceChange;
    } else if (avgStock >= townConfig.stockLowThreshold) {
      confidenceChange -= townConfig.minorConfidenceChange;
    } else if (avgStock >= townConfig.stockCriticalThreshold) {
      confidenceChange -= townConfig.majorConfidenceChange;
    } else {
      confidenceChange -= townConfig.catastrophicConfidenceChange;
    }
  });
  const avgChange =
    confidenceChange /
    (recentStockHistory.length > 0 ? recentStockHistory.length : 1);

  // Apply to confidence
  town.confidence += avgChange;
  town.confidence = clamp(town.confidence, 0, 100);

  town.debugMessage =
    "RecentStock: [" +
    recentStockHistory
      .map((h) => h.toFixed(2))
      .slice(0, 4)
      .join(",") +
    "], AvgConfChg: " +
    avgChange.toFixed(2) +
    ", P: " +
    Math.round(town.population) +
    ", C: " +
    Math.round(town.confidence) +
    "%";
};

const updateTownPopulation = (state: IWorldState, town: ITown) => {
  const multiplier = Math.pow(
    town.population / townConfig.baselinePopulation,
    townConfig.populationScalingExponent,
  );

  if (town.confidence >= townConfig.populationGrowthThreshold) {
    const growthRate = townConfig.basePopulationGrowthRate * multiplier;
    const gain = Math.max(town.population, 1) * growthRate;
    town.population += gain;
  } else if (town.confidence < townConfig.confidenceCriticalThreshold) {
    const declineRate = townConfig.confidenceCriticalDeclineRate * multiplier;
    const loss = town.population * declineRate;
    town.population -= loss;
  } else if (town.confidence < townConfig.confidenceWarningThreshold) {
    const declineRate = townConfig.confidenceWarningDeclineRate * multiplier;
    const loss = town.population * declineRate;
    town.population -= loss;
  }

  //town.population = Math.ceil(town.population);

  // e.g. 1 flour serves 10 (population-to-resource (PTR) ratio 1:10)
  const townInputs: ResourceMap = town.recipe.inputs ?? {};
  (Object.keys(townInputs ?? {}) as RESOURCE_TYPE[]).forEach((resourceType) => {
    const newConsumptionRate = Math.max(
      Math.floor(town.population / townConfig.ptrRatio),
      1,
    );

    townInputs[resourceType] = newConsumptionRate;

    const resourceStorage = town.storage.filter(
      (s) => s.resourceType === resourceType,
    );
    resourceStorage.forEach((s) => {
      s.resourceCapacity =
        newConsumptionRate * storageConfig.recipeBufferStorageMultiplier;
    });
  }); //
};

export const updateTowns = (state: IWorldState) => {
  state.towns.forEach((town) => {
    updateBaseConsumer(state, town);
    updateTownConfidence(state, town);
    updateTownPopulation(state, town);

    const activeContract = getContractByLocationIdOrNull(state, town.id);
    if (activeContract) {
      //town.debugMessage = getContractString(state, activeContract);
    }
  });
};

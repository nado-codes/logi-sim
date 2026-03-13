import { ITown, TownTier } from "../../../entities/locations/consumer";
import { LOCATION_TYPE } from "../../../entities/locations/location";
import { RESOURCE_TYPE, ResourceMap } from "../../../entities/storage";
import { IWorldState } from "../../../entities/world";
import { getContractByLocationIdOrNull } from "../../contracts";
import { createBaseConsumer, updateBaseConsumer } from "./consumers";
import { loadConfig } from "../../../utils/configUtils";
import { clamp } from "../../../utils/mathUtils";
import { loadStorageConfig } from "../../storages";

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
};

const townConfig = loadConfig("town", defaultConfig);
const storageConfig = loadStorageConfig();

export const createTown = (
  state: IWorldState,
  name: string,
  companyId: string,
  position: number,
  tier: TownTier,
  startFull: boolean = false,
) => {
  /*
    ALL OF THESE NEED TO BE REPRESENTED BY THE TOWN'S TIER LEVEL

    consumes: RESOURCE_TYPE,
    */

  const consumes: ResourceMap = {
    Flour: 10,
  };

  const newTown = {
    ...createBaseConsumer(name, companyId, position, consumes, startFull),
    type: LOCATION_TYPE.TOWN,
    confidence: townConfig.baselineConfidence,
    population: townConfig.baselinePopulation,
    migrationOffset: 0,
  };

  state.towns.push(newTown);
};

let stockHistory = [];

const updateTownConfidence = (state: IWorldState, town: ITown) => {
  // Track last N contracts (rolling window)
  /*const activeContract = getContractByLocationIdOrNull(state, town.id);
  const townContracts = state.contractHistory.filter(
    (c) => c.destinationId === town.id,
  );
  const recentContracts = townContracts.reverse().slice(0, 20);

  let confidenceChange = 0;

  if (activeContract) {
    const lateTicks = Math.max(
      0,
      state.currentTick - activeContract.expectedTick,
    );

    if (lateTicks > 9) {
      // extremely late
      confidenceChange -= townConfig.catastrophicConfidenceChange; // Catastrophic damage
    } else if (lateTicks > 2) {
      // Very late
      confidenceChange -= townConfig.majorConfidenceChange; // Major damage
    } else if (lateTicks > 0) {
      // Slightly late
      confidenceChange -= townConfig.minorConfidenceChange; // Minor damage
    }
  }

  recentContracts.forEach((contract) => {
    if (!contract.deliveredTick) {
      return;
    }

    const lateTicks = contract.deliveredTick - contract.expectedTick;

    if (lateTicks <= -2) {
      // Early delivery
      confidenceChange += townConfig.majorConfidenceChange; // Positive reputation
    } else if (lateTicks <= 0) {
      // On-time delivery
      confidenceChange += townConfig.minorConfidenceChange; // Good reputation
    } else if (lateTicks <= 3) {
      // Slightly late
      confidenceChange -= townConfig.minorConfidenceChange; // Minor damage
    } else if (lateTicks <= 10) {
      // Very late
      confidenceChange -= townConfig.majorConfidenceChange; // Major damage
    } else {
      // Expired/never delivered
      confidenceChange -= townConfig.catastrophicConfidenceChange; // Catastrophic damage
    }
  });

  // Average change
  const totalContractCount = recentContracts.length + (activeContract ? 1 : 0);
  const avgChange =
    confidenceChange / (totalContractCount > 0 ? totalContractCount : 1);*/

  // .. customers care if the shelves are empty whenever they go to buy something
  // .. if shelves are empty a lot of times in a row, confidence should fall

  stockHistory.push();

  // Apply to confidence
  town.confidence += avgChange;
  town.confidence = clamp(town.confidence, 0, 100);

  town.debugMessage =
    "AvgChg: " +
    avgChange +
    ", P: " +
    town.population +
    ", C: " +
    town.confidence +
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

  town.population = Math.ceil(town.population);

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

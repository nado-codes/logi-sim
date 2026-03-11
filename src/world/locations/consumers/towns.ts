import { ITown, TownTier } from "../../../entities/locations/consumer";
import { LOCATION_TYPE } from "../../../entities/locations/location";
import { RESOURCE_TYPE, ResourceMap } from "../../../entities/storage";
import { IWorldState } from "../../../entities/world";
import {
  getContractByIdOrNull,
  getContractByLocationIdOrNull,
  getContractByResource,
  getContractString,
} from "../../contracts";
import { createBaseConsumer, updateBaseConsumer } from "./consumers";
import { loadConfig } from "../../../utils/configUtils";

interface TownConfig {
  populationGrowthThreshold: number;
  confidenceWarningThreshold: number;
  confidenceCriticalThreshold: number;
  baselinePopulation: number;
  baselineConfidence: number;
  populationScalingExponent: number;
  basePopulationGrowthRate: number;
  criticalDeclineRate: number;
  warningDeclineRate: number;
  minorConfidenceChange: number;
  majorConfidenceChange: number;
  catastrophicConfidenceChange: number;
}

const CONFIG_PATH = "./town-config.json";
const defaultConfig: TownConfig = {
  populationGrowthThreshold: 70,
  confidenceWarningThreshold: 50,
  confidenceCriticalThreshold: 20,
  baselinePopulation: 100,
  baselineConfidence: 50,
  populationScalingExponent: 0.5, // .. 0.5 = square-root scaling
  basePopulationGrowthRate: 0.005,
  criticalDeclineRate: 0.05,
  warningDeclineRate: 0.01,
  minorConfidenceChange: 1,
  majorConfidenceChange: 3,
  catastrophicConfidenceChange: 5,
};

const townConfig = loadConfig(CONFIG_PATH, defaultConfig);

export const createTown = (
  state: IWorldState,
  name: string,
  companyId: string,
  position: number,
  tier: TownTier,
  startFull: boolean,
) => {
  /*
    ALL OF THESE NEED TO BE REPRESENTED BY THE TOWN'S TIER LEVEL

    consumes: RESOURCE_TYPE,
      consumptionRate: number,
      minInputThreshold: number,
      maxStock: number,
    */

  const consumes: ResourceMap = {
    Flour: 10,
  };
  const minInputThreshold = 12;
  const maxStock = 50;

  const newTown = {
    ...createBaseConsumer(
      state,
      name,
      companyId,
      position,
      consumes,
      minInputThreshold,
      maxStock,
      startFull,
    ),
    type: LOCATION_TYPE.TOWN,
    minInputThreshold,
    confidence: townConfig.baselineConfidence,
    population: townConfig.baselinePopulation,
  };

  state.towns.push(newTown);
};

const updateTownConfidence = (state: IWorldState, town: ITown) => {
  // Track last N contracts (rolling window)
  const activeContract = getContractByLocationIdOrNull(state, town.id);
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
    confidenceChange / (totalContractCount > 0 ? totalContractCount : 1);

  // Apply to confidence
  town.confidence += avgChange;
  town.confidence = Math.min(Math.max(0, town.confidence), 100);

  town.debugMessage =
    "AvgChg: " +
    Math.floor(avgChange) +
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
    const declineRate = townConfig.criticalDeclineRate * multiplier;
    const loss = town.population * declineRate;
    town.population -= loss;
  } else if (town.confidence < townConfig.confidenceWarningThreshold) {
    const declineRate = townConfig.warningDeclineRate * multiplier;
    const loss = town.population * declineRate;
    town.population -= loss;
  }

  town.population = Math.round(town.population);

  // e.g. 1 flour serves 10 (population-to-resource (PTR) ratio 1:10)
  const townInputs: ResourceMap = town.recipe.inputs ?? {};
  (Object.keys(townInputs ?? {}) as RESOURCE_TYPE[]).forEach((resourceType) => {
    townInputs[resourceType] = Math.floor(town.population / 10);

    const activeContract = getContractByResource(state, town.id, resourceType);

    if (activeContract) {
      activeContract.amount = townInputs[resourceType];
    }
  });
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

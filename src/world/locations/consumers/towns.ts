import { IContract } from "../../../entities/contract";
import { ITown, TownTier } from "../../../entities/locations/consumer";
import { LOCATION_TYPE } from "../../../entities/locations/location";
import { ResourceMap } from "../../../entities/storage";
import { IWorldState } from "../../../entities/world";
import { createBaseConsumer, updateBaseConsumer } from "./consumers";

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
  const population = 100;

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
    confidence: 50,
    population,
  };

  state.towns.push(newTown);
};

const updateTownPopulation = (town: ITown) => {
  // THRESHOLDS (Predictable structure)
  const populationGrowthThreshold = 70; // Prosperity needed for growth
  const prosperityWarningThreshold = 50; // Below this: warning decline
  const prosperityCriticalThreshold = 20; // Below this: critical decline

  // SCALING (Controlled tension)
  const baselinePopulation = 1000; // Population where multiplier = 1.0
  const populationScalingExponent = 0.5; // Square root scaling
  const scaleGrowth = true; // Apply scaling to growth
  const scaleDecline = false; // DON'T scale decline (asymmetric)

  // RATES (as decimals representing percentages)
  const basePopulationGrowthRate = 0.005; // 0.5% per tick
  const criticalDeclineRate = 0.05; // 5% per tick
  const warningDeclineRate = 0.01; // 1% per tick

  if (town.confidence >= populationGrowthThreshold) {
    // GROWTH (scaled by √population)
    const multiplier = scaleGrowth
      ? Math.pow(
          town.population / baselinePopulation,
          populationScalingExponent,
        )
      : 1.0;

    const growthRate = basePopulationGrowthRate * multiplier;
    const gain = town.population * growthRate;
    town.population += gain;
  } else if (town.confidence < prosperityCriticalThreshold) {
    // CRITICAL DECLINE (optionally scaled)
    const multiplier = scaleDecline
      ? Math.pow(
          town.population / baselinePopulation,
          populationScalingExponent,
        )
      : 1.0;

    const declineRate = criticalDeclineRate * multiplier;
    const loss = town.population * declineRate;
    town.population -= loss;
  } else if (town.confidence < prosperityWarningThreshold) {
    // WARNING DECLINE (optionally scaled)
    const multiplier = scaleDecline
      ? Math.pow(
          town.population / baselinePopulation,
          populationScalingExponent,
        )
      : 1.0;

    const declineRate = warningDeclineRate * multiplier;
    const loss = town.population * declineRate;
    town.population -= loss;
  }
};

const updateTownConfidence = (townContracts: IContract[], town: ITown) => {
  // Track last N contracts (rolling window)
  const recentContracts = townContracts.reverse().slice(0, 20);

  let confidenceChange = 0;

  recentContracts.forEach((contract) => {
    if (!contract.deliveredTick) {
      return;
    }

    const lateTicks = contract.deliveredTick - contract.expectedTick;

    if (lateTicks <= -2) {
      // Early delivery
      confidenceChange += 2; // Positive reputation
    } else if (lateTicks <= 0) {
      // On-time delivery
      confidenceChange += 1; // Good reputation
    } else if (lateTicks <= 3) {
      // Slightly late
      confidenceChange -= 1; // Minor damage
    } else if (lateTicks <= 10) {
      // Very late
      confidenceChange -= 3; // Major damage
    } else {
      // Expired/never delivered
      confidenceChange -= 5; // Catastrophic damage
    }
  });

  // Average change
  const avgChange = confidenceChange / recentContracts.length;

  // Apply to confidence
  town.confidence += avgChange; //
  town.confidence = Math.min(Math.max(0, town.confidence), 100);
};

export const updateTowns = (state: IWorldState) => {
  state.towns.forEach((town) => {
    updateBaseConsumer(state, town);

    const deliveredContracts = state.contracts.filter(
      (c) => c.destinationId === town.id && c.deliveredTick,
    );
    updateTownConfidence(deliveredContracts, town);

    updateTownPopulation(town);
  });
};

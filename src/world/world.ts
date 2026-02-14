import { IBaseLocation } from "../entities/location";
import { IRecipe, RESOURCE_TYPE } from "../entities/storage";
import { createConsumer, updateConsumers } from "./consumers";
import { createContract, updateContracts } from "./contracts";
import { createProcessor, updateProcessors } from "./processors";
import { createProducer, updateProducers } from "./producers";
import { IWorldState, createInitialState } from "./state";
import { createTruck, updateTrucks } from "./trucks";

export const createWorld = () => {
  const state: IWorldState = createInitialState();

  return {
    // state accessors

    // delegating to system modules
    // behaviour stays in its own file,
    // but is only accessible through world
    updateProcessors: () => updateProcessors(state),
    updateConsumers: () => updateConsumers(state),
    updateProducers: () => updateProducers(state),
    updateContracts: () => updateContracts(state),
    updateTrucks: () => updateTrucks(state),

    // factory methods
    createProducer: (
      name: string,
      position: number,
      produces: RESOURCE_TYPE,
      productionRate: number,
      maxStock: number,
      currentStock?: number,
    ) =>
      createProducer(
        state,
        name,
        position,
        produces,
        productionRate,
        maxStock,
        currentStock,
      ),

    createProcessor: (
      name: string,
      position: number,
      recipe: IRecipe,
      minInputThreshold: number,
      inputCapacity: number,
      outputCapacity: number,
      startWithFullInputs: boolean = false,
      startWithFullOutputs: boolean = false,
    ) =>
      createProcessor(
        state,
        name,
        position,
        recipe,
        minInputThreshold,
        inputCapacity,
        outputCapacity,
        startWithFullInputs,
        startWithFullOutputs,
      ),

    createConsumer: (
      name: string,
      position: number,
      consumes: RESOURCE_TYPE,
      consumptionRate: number,
      minStockThreshold: number,
      maxStock: number,
      currentStock?: number,
    ) =>
      createConsumer(
        state,
        name,
        position,
        consumes,
        consumptionRate,
        minStockThreshold,
        maxStock,
        currentStock,
      ),

    createContract: (
      owner: IBaseLocation,
      supplier: IBaseLocation,
      resourceType: RESOURCE_TYPE,
      amount: number,
      payment: number,
      dueTicks: number,
    ) =>
      createContract(
        state,
        owner,
        supplier,
        resourceType,
        amount,
        payment,
        dueTicks,
      ),

    createTruck: (
      resourceType: RESOURCE_TYPE,
      resourceCapacity: number,
      position: number,
      speed: number,
      resourceCount?: number,
    ) =>
      createTruck(
        state,
        resourceType,
        resourceCapacity,
        position,
        speed,
        resourceCount,
      ),
  };
};

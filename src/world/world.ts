import { IContract } from "../entities/contract";
import { IBaseLocation } from "../entities/location";
import { IRecipe, RESOURCE_TYPE } from "../entities/storage";
import { ITruck } from "../entities/truck";
import { createConsumer, updateConsumers } from "./consumers";
import { createContract, updateContracts } from "./contracts";
import { getMap } from "./locations";
import { createProcessor, updateProcessors } from "./processors";
import { createProducer, updateProducers } from "./producers";
import { IWorldState, createInitialState } from "./state";
import { createTruck, updateTrucks } from "./trucks";

export interface IWorld {
  updateProcessors: () => void;
  updateConsumers: () => void;
  updateProducers: () => void;
  updateContracts: () => void;
  updateTrucks: () => void;

  getMap: () => void;
  getContracts: () => IContract[];
  getTrucks: () => ITruck[];
  getLocations: () => IBaseLocation[];

  createProducer: (
    name: string,
    position: number,
    produces: RESOURCE_TYPE,
    productionRate: number,
    maxStock: number,
    currentStock?: number,
  ) => void;

  createProcessor: (
    name: string,
    position: number,
    recipe: IRecipe,
    minInputThreshold: number,
    inputCapacity: number,
    outputCapacity: number,
    startWithFullInputs?: boolean,
    startWithFullOutputs?: boolean,
  ) => void;

  createConsumer: (
    name: string,
    position: number,
    consumes: RESOURCE_TYPE,
    consumptionRate: number,
    minStockThreshold: number,
    maxStock: number,
    startFull?: boolean,
  ) => void;

  createContract: (
    owner: IBaseLocation,
    supplier: IBaseLocation,
    resourceType: RESOURCE_TYPE,
    amount: number,
    payment: number,
    dueTicks: number,
  ) => void;

  createTruck: (
    resourceType: RESOURCE_TYPE,
    resourceCapacity: number,
    position: number,
    speed: number,
    resourceCount?: number,
  ) => void;
}

export const createWorld = (): IWorld => {
  const state: IWorldState = createInitialState();

  return {
    updateProcessors: () => updateProcessors(state),
    updateConsumers: () => updateConsumers(state),
    updateProducers: () => updateProducers(state),
    updateContracts: () => updateContracts(state),
    updateTrucks: () => updateTrucks(state),

    getMap: () => getMap(state),
    getContracts: () => state.contracts,
    getTrucks: () => state.trucks,
    getLocations: () => [
      ...state.producers,
      ...state.processors,
      ...state.consumers,
    ],

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
      startFull: boolean = false,
    ) =>
      createConsumer(
        state,
        name,
        position,
        consumes,
        consumptionRate,
        minStockThreshold,
        maxStock,
        startFull,
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

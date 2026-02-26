import { Contract } from "../entities/contract";
import { BaseLocation } from "../entities/location";
import { IRecipe, RESOURCE_TYPE } from "../entities/storage";
import { Truck } from "../entities/truck";
import { createConsumer, updateConsumers } from "./locations/consumers";
import { createContract, updateContracts } from "./contracts";
import { getMap } from "./locations/locations";
import { createProcessor, updateProcessors } from "./locations/processors";
import { createProducer, updateProducers } from "./locations/producers";
import { IWorldState, createInitialState } from "./state";
import { createTruck, updateTrucks } from "./trucks";
import { BaseEntity } from "../entities/entity";
import { randomUUID } from "node:crypto";
import { Company } from "../entities/company/company";
import { CompanyEntity } from "../entities/company/companyEntity";

export interface IWorld {
  updateProcessors: () => void;
  updateConsumers: () => void;
  updateProducers: () => void;
  updateContracts: () => void;
  updateTrucks: () => void;

  getMap: () => void;
  getContracts: () => Contract[];
  getTrucks: () => Truck[];
  getLocations: () => BaseLocation[];
  getCompanies: () => Company[];

  createProducer: (
    name: string,
    companyId: string,
    position: number,
    produces: RESOURCE_TYPE,
    productionRate: number,
    maxStock: number,
    currentStock?: number,
  ) => void;

  createProcessor: (
    name: string,
    companyId: string,
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
    companyId: string,
    position: number,
    consumes: RESOURCE_TYPE,
    consumptionRate: number,
    minStockThreshold: number,
    maxStock: number,
    startFull?: boolean,
  ) => void;

  createContract: (
    name: string,
    companyId: string,
    destination: BaseLocation,
    supplier: BaseLocation,
    resourceType: RESOURCE_TYPE,
    amount: number,
    payment: number,
    dueTicks: number,
  ) => void;

  createTruck: (
    name: string,
    companyId: string,
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
    getCompanies: () => state.companies,

    createProducer: (
      name: string,
      companyId: string,
      position: number,
      produces: RESOURCE_TYPE,
      productionRate: number,
      maxStock: number,
      currentStock?: number,
    ) =>
      createProducer(
        state,
        name,
        companyId,
        position,
        produces,
        productionRate,
        maxStock,
        currentStock,
      ),

    createProcessor: (
      name: string,
      companyId: string,
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
        companyId,
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
      companyId: string,
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
        companyId,
        position,
        consumes,
        consumptionRate,
        minStockThreshold,
        maxStock,
        startFull,
      ),

    createContract: (
      name: string,
      companyId: string,
      destination: BaseLocation,
      supplier: BaseLocation,
      resourceType: RESOURCE_TYPE,
      amount: number,
      payment: number,
      dueTicks: number,
    ) =>
      createContract(
        state,
        name,
        companyId,
        destination,
        supplier,
        resourceType,
        amount,
        payment,
        dueTicks,
      ),

    createTruck: (
      name: string,
      companyId: string,
      resourceType: RESOURCE_TYPE,
      resourceCapacity: number,
      position: number,
      speed: number,
      resourceCount?: number,
    ) =>
      createTruck(
        state,
        name,
        companyId,
        resourceType,
        resourceCapacity,
        position,
        speed,
        resourceCount,
      ),
  };
};

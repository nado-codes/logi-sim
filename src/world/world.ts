import { IContract } from "../entities/contract";
import { IBaseLocation } from "../entities/location";
import { IRecipe, RESOURCE_TYPE } from "../entities/storage";
import { ITruck } from "../entities/truck";
import { createConsumer, updateConsumers } from "./locations/consumers";
import {
  createContract,
  getContractByIdOrNull,
  getContractByLocationIdOrNull,
  updateContracts,
} from "./contracts";
import {
  getLocationById,
  getLocationByIdOrNull,
  getLocationByPositionOrNull,
  getLocations,
} from "./locations/locations";
import { createProcessor, updateProcessors } from "./locations/processors";
import { createProducer, updateProducers } from "./locations/producers";
import { IWorldState, createInitialState } from "./state";
import {
  createTruck,
  getTruckById,
  getTruckByPositionOrNull,
  getTrucks,
  updateTrucks,
} from "./trucks";
import { ICompany } from "../entities/company";
import { createCompany, getCompanyById } from "./companies";
import { Color, highlight } from "../logUtils";
import { Nullable } from "../entities/entity";

export interface IWorld {
  updateProcessors: () => void;
  updateConsumers: () => void;
  updateProducers: () => void;
  updateContracts: () => void;
  updateTrucks: () => void;

  getMap: () => void;

  getContracts: () => IContract[];
  getContractByIdOrNull: (id: Nullable<string>) => Nullable<IContract>;
  getContractByLocationIdOrNull: (
    locationId: Nullable<string>,
  ) => Nullable<IContract>;

  getTrucks: () => ITruck[];
  getTruckById: (id: string) => ITruck;
  getTruckByPositionOrNull: (position: number) => Nullable<ITruck>;

  getLocations: () => IBaseLocation[];
  getLocationById: (id: string) => IBaseLocation;
  getLocationByIdOrNull: (id: Nullable<string>) => Nullable<IBaseLocation>;

  getCompanies: () => ICompany[];
  getCompanyById: (id: string) => ICompany;

  createCompany: (name: string, money: number, color: Color) => ICompany;

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
    companyId: string,
    destinationId: string,
    supplierId: string,
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

  const getMap = () => {
    const locations = getLocations(state);

    const worldPositions = [
      ...locations.map((l) => l.position),
      ...getTrucks(state).map((t) => t.position),
    ];
    const maxPosition = worldPositions.reduce((a, c) => Math.max(a, c));

    let map = "";

    for (var pos = 0; pos <= maxPosition; pos++) {
      const locationAtPos = getLocationByPositionOrNull(state, pos);
      const truckAtPos = getTruckByPositionOrNull(state, pos);

      if (locationAtPos) {
        const tagMap = {
          Producer: "PRD",
          Processor: "PRC",
          Consumer: "CNS",
        };
        const tag = tagMap[locationAtPos.type];
        const hasContract =
          getContractByLocationIdOrNull(state, locationAtPos.id) !== undefined;
        const notificationTag = hasContract ? highlight.red("!") : "";

        const locationCompany = getCompanyById(state, locationAtPos.companyId);

        map += `${highlight.custom(`[${tag}${notificationTag}]`, locationCompany.color)}`;
      } else if (truckAtPos) {
        const hasResources = truckAtPos.storage.resourceCount > 0;
        const truckCompany = getCompanyById(state, truckAtPos.companyId);

        map += `${highlight.custom(`[T${hasResources ? highlight.green("o") : ""}]`, truckCompany.color)}`;
      } else {
        map += "_";
      }
    }

    return map;
  };

  return {
    updateProcessors: () => updateProcessors(state),
    updateConsumers: () => updateConsumers(state),
    updateProducers: () => updateProducers(state),
    updateContracts: () => updateContracts(state),
    updateTrucks: () => updateTrucks(state),

    getMap: () => getMap(),

    getContracts: () => state.contracts,
    getContractByIdOrNull: (id: string | undefined) =>
      getContractByIdOrNull(state, id),
    getContractByLocationIdOrNull: (locationId: Nullable<string>) =>
      getContractByLocationIdOrNull(state, locationId),

    getTrucks: () => state.trucks,
    getTruckById: (id: string) => getTruckById(state, id),
    getTruckByPositionOrNull: (position: number) =>
      getTruckByPositionOrNull(state, position),

    getLocations: () => getLocations(state),
    getLocationById: (id: string) => getLocationById(state, id),
    getLocationByIdOrNull: (id: Nullable<string>) =>
      getLocationByIdOrNull(state, id),

    getCompanies: () => state.companies,
    getCompanyById: (id: string) => getCompanyById(state, id),

    createCompany: (name: string, money: number, color: Color) =>
      createCompany(state, name, money, color),

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
      companyId: string,
      destinationId: string,
      supplierId: string,
      resourceType: RESOURCE_TYPE,
      amount: number,
      payment: number,
      dueTicks: number,
    ) =>
      createContract(
        state,
        companyId,
        destinationId,
        supplierId,
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

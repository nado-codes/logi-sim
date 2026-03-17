import { IContract } from "../entities/contract";
import { IBaseLocation, LOCATION_TYPE } from "../entities/locations/location";
import { IRecipe, RESOURCE_TYPE } from "../entities/storage";
import { ITruck } from "../entities/truck";
import {
  createContract,
  getContractByIdOrNull,
  getContractByLocationIdOrNull,
  getContractString,
  updateContracts,
} from "./contracts";
import {
  getLocationById,
  getLocationByIdOrNull,
  getLocationByPositionOrNull,
} from "./locations/locations";
import { createProcessor, updateProcessors } from "./locations/processors";
import { createProducer, updateProducers } from "./locations/producers";
import {
  createTruck,
  getTruckById,
  getTruckByPositionOrNull,
  getTrucks,
  getTruckString,
  updateTrucks,
} from "./trucks";
import { ICompany } from "../entities/company";
import { createCompany, getCompanyById } from "./companies";
import { Color, highlight } from "../utils/logUtils";
import { Nullable } from "../entities/entity";
import { createTown, updateTowns } from "./locations/consumers/towns";
import { IWorldState } from "../entities/world";

export interface IWorld {
  advanceTick: () => void;
  updateProcessors: () => void;
  updateTowns: () => void;
  updateProducers: () => void;
  updateContracts: () => void;
  updateTrucks: () => void;

  getMap: () => void;
  getCurrentTick: () => number;

  getContracts: () => IContract[];
  getContractByIdOrNull: (id: Nullable<string>) => Nullable<IContract>;
  getContractByLocationIdOrNull: (
    locationId: Nullable<string>,
  ) => Nullable<IContract>;
  getContractString: (contract: IContract) => string;

  getTrucks: () => ITruck[];
  getTruckById: (id: string) => ITruck;
  getTruckByPositionOrNull: (position: number) => Nullable<ITruck>;
  getTruckString: (truck: ITruck) => string;

  getLocations: () => IBaseLocation[];
  getLocationById: (id: string) => IBaseLocation;
  getLocationByIdOrNull: (id: Nullable<string>) => Nullable<IBaseLocation>;

  getCompanies: () => ICompany[];
  getCompanyById: (id: string) => ICompany;

  createCompany: (
    name: string,
    money: number,
    color: Color,
    isState?: boolean,
  ) => ICompany;

  createProducer: (
    name: string,
    companyId: string,
    position: number,
    produces: RESOURCE_TYPE,
    productionRate: number,
    startFull?: boolean,
  ) => void;

  createProcessor: (
    name: string,
    companyId: string,
    position: number,
    recipe: IRecipe,
    startWithFullInputs?: boolean,
    startWithFullOutputs?: boolean,
  ) => void;

  createTown: (
    name: string,
    companyId: string,
    position: number,
    startFull?: boolean,
  ) => void;

  createContract: (
    companyId: string,
    destinationId: string,
    supplierId: string,
    resourceType: RESOURCE_TYPE,
    amount: number,
    dueTicks: number,
  ) => void;

  createTruck: (
    name: string,
    companyId: string,
    resourceType: RESOURCE_TYPE,
    resourceCapacity: number,
    position: number,
    speed: number,
    operatingCostPerTick: number,
    resourceCount?: number,
  ) => void;
}

const createInitialState = (): IWorldState => {
  const state = {
    currentTick: 0,
    producers: [],
    processors: [],
    towns: [],
    contracts: [],
    contractHistory: [],
    trucks: [],
    companies: [],
  };

  return {
    ...state,
    getLocations: () => [
      ...state.producers,
      ...state.processors,
      ...state.towns,
    ],
  };
};

export const createWorld = (): IWorld => {
  const state: IWorldState = createInitialState();

  const getMap = () => {
    const locations = state.getLocations();

    const worldPositions = [
      ...locations.map((l) => l.position),
      ...getTrucks(state).map((t) => t.position),
    ];
    const maxPosition = worldPositions.reduce((a, c) => Math.max(a, c));

    let map = "";
    let spaces = 0;

    for (var pos = 0; pos <= maxPosition; pos++) {
      const locationAtPos = getLocationByPositionOrNull(state, pos);
      const truckAtPos = getTruckByPositionOrNull(state, pos);

      if (locationAtPos) {
        const tagMap = {
          Producer: "PRD",
          Processor: "PRC",
          Consumer: "CNS",
          Town: "TWN",
        };
        const tag = tagMap[locationAtPos.type];
        const contract = getContractByLocationIdOrNull(state, locationAtPos.id);
        const notificationTag = contract ? highlight.red(`[!]`) : "";

        const locationCompany = getCompanyById(state, locationAtPos.companyId);

        const locationTag = `${notificationTag ? `${notificationTag}` : ""}${highlight.custom(`[${tag}]`, locationCompany.color)}`;
        const locationDebug = `${locationAtPos.debugMessage ? highlight.yellow("[" + locationAtPos.debugMessage + "]") : ""}`;

        map += locationTag + locationDebug;
        spaces +=
          5 + (locationAtPos.debugMessage?.length ?? 0) + (contract ? 3 : 0);
      }

      if (truckAtPos) {
        const hasResources = truckAtPos.storage.resourceCount > 0;
        const truckCompany = getCompanyById(state, truckAtPos.companyId);
        const truckTag = `${highlight.custom(`[T${hasResources ? highlight.green("o") : ""}]`, truckCompany.color)}`;
        const truckDebug = `${truckAtPos.debugMessage ? highlight.yellow("[" + truckAtPos.debugMessage + "]") : ""}`;

        map += truckTag + truckDebug;
        spaces +=
          3 + (hasResources ? 1 : 0) + (truckAtPos.debugMessage?.length ?? 0);
      }

      if (spaces <= 0 && !truckAtPos && !locationAtPos) {
        map += "_";
      }

      if (spaces > 0) {
        spaces--;
      }
    }

    return map;
  };

  return {
    advanceTick: () => state.currentTick++,
    updateProcessors: () => updateProcessors(state),
    updateTowns: () => updateTowns(state),
    updateProducers: () => updateProducers(state),
    updateContracts: () => updateContracts(state),
    updateTrucks: () => updateTrucks(state),

    getMap: () => getMap(),
    getCurrentTick: () => state.currentTick,

    getContracts: () => state.contracts,
    getContractByIdOrNull: (id: string | undefined) =>
      getContractByIdOrNull(state, id),
    getContractByLocationIdOrNull: (locationId: Nullable<string>) =>
      getContractByLocationIdOrNull(state, locationId),
    getContractString: (contract: IContract) =>
      getContractString(state, contract),

    getTrucks: () => state.trucks,
    getTruckById: (id: string) => getTruckById(state, id),
    getTruckByPositionOrNull: (position: number) =>
      getTruckByPositionOrNull(state, position),
    getTruckString: (truck: ITruck) => getTruckString(state, truck),

    getLocations: () => state.getLocations(),
    getLocationById: (id: string) => getLocationById(state, id),
    getLocationByIdOrNull: (id: Nullable<string>) =>
      getLocationByIdOrNull(state, id),

    getCompanies: () => state.companies,
    getCompanyById: (id: string) => getCompanyById(state, id),

    createCompany: (
      name: string,
      money: number,
      color: Color,
      isStateControlled: boolean = false,
    ) => createCompany(state, name, money, color, isStateControlled),

    createProducer: (
      name: string,
      companyId: string,
      position: number,
      produces: RESOURCE_TYPE,
      productionRate: number,
      startFull: boolean = false,
    ) =>
      createProducer(
        state,
        name,
        companyId,
        position,
        produces,
        productionRate,
        startFull,
      ),

    createProcessor: (
      name: string,
      companyId: string,
      position: number,
      recipe: IRecipe,
      startWithFullInputs: boolean = false,
      startWithFullOutputs: boolean = false,
    ) =>
      createProcessor(
        state,
        name,
        companyId,
        position,
        recipe,
        startWithFullInputs,
        startWithFullOutputs,
      ),

    createTown: (
      name: string,
      companyId: string,
      position: number,
      startFull: boolean = false,
    ) => createTown(state, name, companyId, position, startFull),

    createContract: (
      companyId: string,
      destinationId: string,
      supplierId: string,
      resourceType: RESOURCE_TYPE,
      amount: number,
      dueTicks: number,
    ) =>
      createContract(
        state,
        companyId,
        destinationId,
        supplierId,
        resourceType,
        amount,
        dueTicks,
      ),

    createTruck: (
      name: string,
      companyId: string,
      resourceType: RESOURCE_TYPE,
      resourceCapacity: number,
      position: number,
      speed: number,
      operatingCostPerTick: number,
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
        operatingCostPerTick,
        resourceCount,
      ),
  };
};

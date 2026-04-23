import {
  assignContract,
  createContract,
  getContractByIdOrNull,
  getContractByLocationIdOrNull,
  getContractString,
  updateContracts,
} from "./contracts";
import {
  deleteLocation,
  getLocationById,
  getLocationByIdOrNull,
} from "./locations/locations";
import { createProcessor, updateProcessors } from "./locations/processors";
import { createProducer, updateProducers } from "./locations/producers";
import {
  createTruck,
  deleteTruck,
  getTruckById,
  getTruckByPositionOrNull,
  getTrucks,
  getTruckString,
  updateTrucks,
} from "./trucks";
import {
  createCompany,
  getCompanyById,
  getCompanyByIdOrNull,
  getCompanyByName,
  updateCompanies,
} from "./companies";
import {
  createTown,
  reseedTown,
  updateTowns,
} from "./locations/consumers/towns";
import {
  createCoastline,
  createMountain,
  createResourceDeposit,
  createWater,
} from "./geographies";
import { getMap } from "./map";
import { getWorldEntityByPositionOrNull } from "./entities";
import {
  Nullable,
  IWorldEntity,
  IContract,
  ITruck,
  IBaseLocation,
  ICompany,
  ICoastline,
  IWater,
  IMountain,
  RESOURCE_TYPE,
  IResourceDeposit,
  ICreateCompanyOptions,
  IRecipe,
  IWorldState,
  defaultCompanyOptions,
  ITown,
  Vector3,
} from "@logisim/lib/entities";
import { Color } from "@logisim/lib/utils";

export interface IWorld {
  advanceTick: () => void;
  update: () => void;

  getMap: () => void;
  getCurrentTick: () => number;
  getWorldEntityByPositionOrNull: (position: Vector3) => Nullable<IWorldEntity>;

  getContracts: () => IContract[];
  getContractByIdOrNull: (id: Nullable<string>) => Nullable<IContract>;
  getContractByLocationIdOrNull: (
    locationId: Nullable<string>,
  ) => Nullable<IContract>;
  getContractString: (contract: IContract) => string;

  getTrucks: () => ITruck[];
  getTruckById: (id: string) => ITruck;
  getTruckByPositionOrNull: (position: Vector3) => Nullable<ITruck>;
  getTruckString: (truck: ITruck) => string;

  getLocations: () => IBaseLocation[];
  getLocationById: (id: string) => IBaseLocation;
  getLocationByIdOrNull: (id: Nullable<string>) => Nullable<IBaseLocation>;

  getCompanies: () => ICompany[];
  getCompanyById: (id: string) => ICompany;
  getCompanyByIdOrNull: (id: string) => Nullable<ICompany>;
  getCompanyByName: (name: string) => ICompany;

  createCoastline: (position: Vector3) => ICoastline;
  createWater: (position: Vector3) => IWater;
  createMountain: (
    position: Vector3,
    width: number,
    height: number,
  ) => IMountain;
  createResourceDeposit: (
    position: Vector3,
    resourceType: RESOURCE_TYPE,
  ) => IResourceDeposit;

  createCompany: (
    name: string,
    money: number,
    color: Color,
    options?: Partial<ICreateCompanyOptions>,
  ) => ICompany;

  createProducer: (
    name: string,
    companyId: string,
    position: Vector3,
    produces: RESOURCE_TYPE,
    productionRate: number,
    startFull?: boolean,
  ) => void;

  createProcessor: (
    name: string,
    companyId: string,
    position: Vector3,
    recipe: IRecipe,
    startWithFullInputs?: boolean,
    startWithFullOutputs?: boolean,
  ) => void;

  createTown: (
    name: string,
    companyId: string,
    position: Vector3,
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
    position: Vector3,
    speed: number,
    resourceCount?: number,
  ) => void;

  assignContract: (contract: IContract, truck: ITruck) => boolean;
  reseedTown: (town: ITown) => void;

  deleteTruck: (truck: ITruck) => void;
  deleteLocation: (location: IBaseLocation) => void;
}

const createInitialState = (): IWorldState => {
  const state: IWorldState = {
    currentTick: 0,
    producers: [],
    processors: [],
    towns: [],
    contracts: [],
    contractHistory: [],
    trucks: [],
    companies: [],
    geographies: [],
    getLocations: () => [],
  };

  state.getLocations = () => [
    ...state.producers,
    ...state.processors,
    ...state.towns,
  ];

  return state;
};

export const createWorld = (): IWorld => {
  const state: IWorldState = createInitialState();

  const update = (state: IWorldState) => {
    updateProcessors(state);
    updateTowns(state);
    updateProducers(state);
    updateContracts(state);
    updateTrucks(state);
    updateCompanies(state);

    state.currentTick++;
  };

  return {
    advanceTick: () => state.currentTick++,

    update: () => update(state),

    getMap: () => getMap(state),
    getCurrentTick: () => state.currentTick,
    getWorldEntityByPositionOrNull: (position: Vector3) =>
      getWorldEntityByPositionOrNull(state, position),

    getContracts: () => state.contracts,
    getContractByIdOrNull: (id: string | undefined) =>
      getContractByIdOrNull(state, id),
    getContractByLocationIdOrNull: (locationId: Nullable<string>) =>
      getContractByLocationIdOrNull(state, locationId),
    getContractString: (contract: IContract) =>
      getContractString(state, contract),

    getTrucks: () => state.trucks,
    getTruckById: (id: string) => getTruckById(state, id),
    getTruckByPositionOrNull: (position: Vector3) =>
      getTruckByPositionOrNull(state, position),
    getTruckString: (truck: ITruck) => getTruckString(state, truck),

    getLocations: () => state.getLocations(),
    getLocationById: (id: string) => getLocationById(state, id),
    getLocationByIdOrNull: (id: Nullable<string>) =>
      getLocationByIdOrNull(state, id),

    getCompanies: () => state.companies,
    getCompanyById: (id: string) => getCompanyById(state, id),
    getCompanyByIdOrNull: (id: string) => getCompanyByIdOrNull(state, id),
    getCompanyByName: (name: string) => getCompanyByName(state, name),

    createCoastline: (position: Vector3) => createCoastline(state, position),
    createWater: (position: Vector3) => createWater(state, position),
    createMountain: (position: Vector3, width: number, height: number) =>
      createMountain(state, position, width, height),
    createResourceDeposit: (position: Vector3, resourceType: RESOURCE_TYPE) =>
      createResourceDeposit(state, position, resourceType),

    createCompany: (
      name: string,
      money: number,
      color: Color,
      options: Partial<ICreateCompanyOptions> = defaultCompanyOptions,
    ) => createCompany(state, name, money, color, options),

    createProducer: (
      name: string,
      companyId: string,
      position: Vector3,
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
      position: Vector3,
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

    createTown: (name: string, companyId: string, position: Vector3) =>
      createTown(state, name, companyId, position),

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
      position: Vector3,
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

    assignContract: (contract: IContract, truck: ITruck) =>
      assignContract(state, contract, truck),
    reseedTown: (town: ITown) => {
      reseedTown(town);
    },

    deleteTruck: (truck: ITruck) => deleteTruck(state, truck),
    deleteLocation: (location: IBaseLocation) =>
      deleteLocation(state, location),
  };
};

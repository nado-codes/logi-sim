import {
  assignContractToCompany,
  assignContractToTruck,
  breakContract,
  CONTRACT_BREAK_FAULT,
  CONTRACT_BREAK_TYPE,
  createContract,
  getContractByDestinationIdResourceType,
  getContractByIdOrNull,
  getContractByDestinationIdOrNull,
  getContractString,
  updateContracts,
} from "./contracts";
import {
  createLocationFromItemId,
  deleteLocation,
  getLocationById,
  getLocationByIdOrNull,
  getLocationItemById,
  getLocationItems,
} from "./locations/locations";
import { createProcessor, updateProcessors } from "./locations/processors";
import { createProducer, updateProducers } from "./locations/producers";
import {
  createTruck,
  createTruckFromItemId,
  deleteTruck,
  getTruckById,
  getTruckByPositionOrNull,
  getTruckItemById,
  getTruckItems,
  getTruckString,
  updateTrucks,
} from "./trucks";
import {
  COMPANY_TRANSFER_RESULT,
  createCompany,
  getCompanyById,
  getCompanyByIdOrNull,
  getCompanyByName,
  getCompanyEntitiesByCompanyId,
  getCompanyEntityByCompanyIdEntityId,
  transferCompanyFunds,
  transferCompanyFundsFromState,
  transferCompanyFundsToState,
  updateCompanies,
  liquidateCompany,
} from "./companies";
import { createTown, updateTowns } from "./locations/consumers/towns";
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
  ILocation,
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
  Pos3D,
  ILocationItem,
  IVehicleItem,
  EMarketplaceTransactionResult,
  IMarketplaceEntity,
  ICompanyEntity,
} from "@logisim/lib/entities";
import { Color, highlight } from "@logisim/lib/utils";
import { purchaseItem, sellItem } from "./marketplace";

export interface IWorld {
  advanceTick: () => void;
  update: () => void;

  //MISC - GET
  getMap: () => void;
  getCurrentTick: () => number;
  getWorldEntityByPositionOrNull: (position: Pos3D) => Nullable<IWorldEntity>;

  //CONTRACT - GET
  getContracts: () => IContract[];
  getContractByIdOrNull: (id: Nullable<string>) => Nullable<IContract>;
  getContractByDestinationIdOrNull: (
    destinationId: Nullable<string>,
  ) => Nullable<IContract>;
  getContractByDestinationIdResourceType: (
    destinationId: string,
    resourceType: RESOURCE_TYPE,
  ) => Nullable<IContract>;
  getContractString: (contract: IContract) => string;

  //TRUCK - GET
  getTrucks: () => ITruck[];
  getTruckById: (id: string) => ITruck;
  getTruckByPositionOrNull: (position: Pos3D) => Nullable<ITruck>;
  getTruckItemById: (itemId: string) => IVehicleItem;
  getTruckItems: () => IVehicleItem[];
  getTruckString: (truck: ITruck) => string;

  //LOCATION - GET
  getLocations: () => ILocation[];
  getLocationById: (id: string) => ILocation;
  getLocationByIdOrNull: (id: Nullable<string>) => Nullable<ILocation>;
  getLocationItemById: (itemId: string) => ILocationItem;
  getLocationItems: () => ILocationItem[];

  //COMPANY - GET
  getCompanies: () => ICompany[];
  getCompanyById: (id: string) => ICompany;
  getCompanyByIdOrNull: (id: string) => Nullable<ICompany>;
  getCompanyByName: (name: string) => ICompany;
  getCompanyEntitiesByCompanyId: (
    id: string,
  ) => (IWorldEntity & IMarketplaceEntity & ICompanyEntity)[];
  getCompanyEntityByCompanyIdEntityId: (
    companyId: string,
    entityId: string,
  ) => IWorldEntity & IMarketplaceEntity & ICompanyEntity;

  //GEOGRAPHY
  createCoastline: (position: Pos3D) => ICoastline;
  createWater: (position: Pos3D) => IWater;
  createMountain: (position: Pos3D, width: number, height: number) => IMountain;
  createResourceDeposit: (
    position: Pos3D,
    resourceType: RESOURCE_TYPE,
  ) => IResourceDeposit;

  //COMPANY - CREATE
  createCompany: (
    name: string,
    money: number,
    color: Color,
    options?: Partial<ICreateCompanyOptions>,
  ) => ICompany;

  //LOCATION - CREATE
  createProducer: (
    name: string,
    companyId: string,
    position: Pos3D,
    produces: RESOURCE_TYPE,
    productionRate: number,
    startFull?: boolean,
  ) => ILocation;

  createProcessor: (
    name: string,
    companyId: string,
    position: Pos3D,
    recipe: IRecipe,
    startWithFullInputs?: boolean,
    startWithFullOutputs?: boolean,
  ) => ILocation;

  createLocationFromItemId: (
    itemId: string,
    companyId: string,
    position: Pos3D,
  ) => ILocation;

  createTown: (
    name: string,
    companyId: string,
    position: Pos3D,
    startFull?: boolean,
  ) => ITown;

  //CONTRACT - CREATE
  createContract: (
    companyId: string,
    destinationId: string,
    supplierId: string,
    resourceType: RESOURCE_TYPE,
    amount: number,
    dueTicks: number,
  ) => IContract;

  //TRUCK - CREATE
  createTruckFromItemId: (
    itemId: string,
    companyId: string,
    position: Pos3D,
  ) => ITruck;

  createTruck: (
    name: string,
    companyId: string,
    resourceType: RESOURCE_TYPE,
    resourceCapacity: number,
    position: Pos3D,
    speed: number,
    resourceCount?: number,
  ) => ITruck;

  //COMPANY - UPDATE
  assignContractToTruck: (contract: IContract, truck: ITruck) => boolean;
  assignContractToCompany: (contract: IContract, company: ICompany) => boolean;
  breakContract: (
    contract: IContract,
    breakType: CONTRACT_BREAK_TYPE,
    breakFault?: CONTRACT_BREAK_FAULT,
  ) => void;
  transferCompanyFunds: (
    fromCompany: ICompany,
    toCompany: ICompany,
    amount: number,
  ) => void;
  transferFundsToState: (
    fromCompany: ICompany,
    amount: number,
  ) => COMPANY_TRANSFER_RESULT;
  transferFundsFromState: (toCompany: ICompany, amount: number) => void;
  liquidateCompany: (company: ICompany) => void;

  // MARKETPLACE - UPDATE
  purchaseItem: (
    itemId: string,
    buyerCompany: ICompany,
  ) => EMarketplaceTransactionResult;
  sellItem: (
    itemId: string,
    sellerCompany: ICompany,
  ) => EMarketplaceTransactionResult;

  // DELETE
  deleteTruck: (truck: ITruck) => void;
  deleteLocation: (location: ILocation) => void;
}

export const STATE_COMPANY_NAME = "State";

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

  createCompany(state, "State", 0, Color.Magenta, {
    isGovernment: true,
    hasUnlimitedMoney: true,
  });

  const update = (state: IWorldState) => {
    updateProcessors(state);
    updateTowns(state);
    updateProducers(state);
    updateContracts(state);
    updateTrucks(state);
    updateCompanies(state);

    console.log(`World updated at tick ${highlight.yellow(state.currentTick)}`);

    state.currentTick++;
  };

  return {
    // MISC - UPDATE
    advanceTick: () => state.currentTick++,
    update: () => update(state),
    getMap: () => getMap(state),
    getCurrentTick: () => state.currentTick,
    getWorldEntityByPositionOrNull: (position: Pos3D) =>
      getWorldEntityByPositionOrNull(state, position),

    // CONTRACT - GET
    getContracts: () => state.contracts,
    getContractByIdOrNull: (id: string | undefined) =>
      getContractByIdOrNull(state, id),
    getContractByDestinationIdOrNull: (locationId: Nullable<string>) =>
      getContractByDestinationIdOrNull(state, locationId),
    getContractByDestinationIdResourceType: (
      destinationId: string,
      resourceType: RESOURCE_TYPE,
    ) =>
      getContractByDestinationIdResourceType(
        state,
        destinationId,
        resourceType,
      ),
    getContractString: (contract: IContract) =>
      getContractString(state, contract),

    // TRUCK - GET
    getTrucks: () => state.trucks,
    getTruckById: (id: string) => getTruckById(state, id),
    getTruckByPositionOrNull: (position: Pos3D) =>
      getTruckByPositionOrNull(state, position),
    getTruckItemById: (itemId: string) => getTruckItemById(itemId),
    getTruckItems: () => getTruckItems(),
    getTruckString: (truck: ITruck) => getTruckString(state, truck),

    // LOCATION - GET
    getLocations: () => state.getLocations(),
    getLocationById: (id: string) => getLocationById(state, id),
    getLocationByIdOrNull: (id: Nullable<string>) =>
      getLocationByIdOrNull(state, id),
    getLocationItemById: (itemId: string) => getLocationItemById(itemId),
    getLocationItems: () => getLocationItems(),

    // COMPANY - GET
    getCompanies: () => state.companies,
    getCompanyById: (id: string) => getCompanyById(state, id),
    getCompanyByIdOrNull: (id: string) => getCompanyByIdOrNull(state, id),
    getCompanyByName: (name: string) => getCompanyByName(state, name),
    getCompanyEntitiesByCompanyId: (id: string) =>
      getCompanyEntitiesByCompanyId(state, id),
    getCompanyEntityByCompanyIdEntityId: (
      companyId: string,
      entityId: string,
    ) => getCompanyEntityByCompanyIdEntityId(state, companyId, entityId),

    // GEOGRAPHY - CREATE
    createCoastline: (position: Pos3D) => createCoastline(state, position),
    createWater: (position: Pos3D) => createWater(state, position),
    createMountain: (position: Pos3D, width: number, height: number) =>
      createMountain(state, position, width, height),
    createResourceDeposit: (position: Pos3D, resourceType: RESOURCE_TYPE) =>
      createResourceDeposit(state, position, resourceType),

    // COMPANY - CREATE
    createCompany: (
      name: string,
      money: number,
      color: Color,
      options: Partial<ICreateCompanyOptions> = defaultCompanyOptions,
    ) => createCompany(state, name, money, color, options),

    // LOCATION - CREATE
    createProducer: (
      name: string,
      companyId: string,
      position: Pos3D,
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
      position: Pos3D,
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

    createLocationFromItemId: (
      itemId: string,
      companyId: string,
      position: Pos3D,
    ) => createLocationFromItemId(state, itemId, companyId, position),

    createTown: (name: string, companyId: string, position: Pos3D) =>
      createTown(state, name, companyId, position),

    // CONTRACT - CREATE
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

    // TRUCK - CREATE
    createTruck: (
      name: string,
      companyId: string,
      resourceType: RESOURCE_TYPE,
      resourceCapacity: number,
      position: Pos3D,
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

    createTruckFromItemId: (
      itemId: string,
      companyId: string,
      position: Pos3D,
    ) => createTruckFromItemId(state, itemId, companyId, position),

    // CONTRACT - UPDATE
    assignContractToTruck: (contract: IContract, truck: ITruck) =>
      assignContractToTruck(state, contract, truck),
    assignContractToCompany: (contract: IContract, company: ICompany) =>
      assignContractToCompany(state, contract, company),
    breakContract: (
      contract: IContract,
      breakType: CONTRACT_BREAK_TYPE,
      breakFault: CONTRACT_BREAK_FAULT = CONTRACT_BREAK_FAULT.None,
    ) => breakContract(state, contract, breakType, breakFault),

    // COMPANY - UPDATE
    transferCompanyFunds: (
      fromCompany: ICompany,
      toCompany: ICompany,
      amount: number,
    ) => transferCompanyFunds(fromCompany, toCompany, amount),
    transferFundsToState: (fromCompany: ICompany, amount: number) =>
      transferCompanyFundsToState(state, fromCompany, amount),
    transferFundsFromState: (toCompany: ICompany, amount: number) =>
      transferCompanyFundsFromState(state, toCompany, amount),
    liquidateCompany: (company: ICompany) => {
      const debtorLocations = state
        .getLocations()
        .filter((l) => l.companyId === company.id);
      const debtorTrucks = state.trucks.filter(
        (t) => t.companyId === company.id,
      );
      const debtorCreditors = company.debts.map((d) =>
        getCompanyById(state, d.creditorCompanyId),
      );
      const stateCompany = getCompanyByName(state, STATE_COMPANY_NAME);
      liquidateCompany(
        company,
        debtorLocations,
        debtorTrucks,
        debtorCreditors,
        stateCompany,
      );
    },

    // MARKETPLACE - UPDATE
    purchaseItem: (itemId: string, buyerCompany: ICompany) =>
      purchaseItem(state, itemId, buyerCompany),
    sellItem: (itemId: string, sellerCompany: ICompany) =>
      sellItem(state, itemId, sellerCompany),

    // DELETE
    deleteTruck: (truck: ITruck) => deleteTruck(state, truck),
    deleteLocation: (location: ILocation) => deleteLocation(state, location),
  };
};

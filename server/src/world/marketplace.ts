import {
  EMarketplaceTransactionResult,
  IBaseItem,
  ICompany,
  IVehicle,
  IWorldState,
  VEHICLE_TYPE,
  WorldEntityType,
} from "@logisim/lib/entities";
import { getLocationItems } from "./locations/locations";
import { deleteTruck, getTruckItems } from "./trucks";
import {
  COMPANY_TRANSFER_RESULT,
  getCompanyByName,
  getCompanyEntityByCompanyIdEntityId,
  transferCompanyFundsFromState,
  transferCompanyFundsToState,
} from "./companies";
import { logSuccess } from "@logisim/lib/utils";
import { STATE_COMPANY_NAME } from "./world";

export const getMarketplaceItemById = (itemId: string) => {
  const marketplaceItems = [
    ...getLocationItems(),
    ...getTruckItems(),
  ] as IBaseItem[];
  const marketplaceItem = marketplaceItems.find((i) => i.id === itemId);

  if (!marketplaceItem) {
    throw new Error(`Marketplace item with id ${itemId} doesn't exist`);
  }

  return marketplaceItem;
};

export const purchaseItem = (
  state: IWorldState,
  itemId: string,
  buyerCompany: ICompany,
): EMarketplaceTransactionResult => {
  // .. purchase a non-existant entity from the state
  // .. eventually, this will be overidden by the "sellItem" system where almost all items are traded between companies
  // .. and only certain items will be created by the state
  // .. the caller will then spawn it in exchange for cash
  const marketplaceItem = getMarketplaceItemById(itemId);
  const paymentResult = transferCompanyFundsToState(
    state,
    buyerCompany,
    marketplaceItem.price,
  );

  if (paymentResult === COMPANY_TRANSFER_RESULT.SUCCESS) {
    return EMarketplaceTransactionResult.SUCCESS;
  } else if (paymentResult === COMPANY_TRANSFER_RESULT.INSUFFICIENT_FUNDS) {
    return EMarketplaceTransactionResult.INSUFFICIENT_FUNDS;
  }

  return EMarketplaceTransactionResult.UNKNOWN_ERROR;
};

export const sellItem = (
  state: IWorldState,
  entityId: string,
  sellerCompany: ICompany,
): EMarketplaceTransactionResult => {
  const companyEntity = getCompanyEntityByCompanyIdEntityId(
    state,
    sellerCompany.id,
    entityId,
  );

  const isSellable =
    (companyEntity.type === WorldEntityType.Vehicle &&
      (companyEntity as IVehicle).vehicleType === VEHICLE_TYPE.Truck) ||
    companyEntity.type === WorldEntityType.Location;

  if (!isSellable) {
    return EMarketplaceTransactionResult.NOT_SELLABLE;
  }

  const marketplaceItem = getMarketplaceItemById(companyEntity.itemId);

  const paymentResult = transferCompanyFundsFromState(
    state,
    sellerCompany,
    marketplaceItem.price,
  );

  if (paymentResult === COMPANY_TRANSFER_RESULT.SUCCESS) {
    if (companyEntity.type === WorldEntityType.Vehicle) {
      const assetAsVehicle = companyEntity as IVehicle;

      if (assetAsVehicle.vehicleType === VEHICLE_TYPE.Truck) {
        deleteTruck(state, assetAsVehicle);
      }
    } else if (companyEntity.type === WorldEntityType.Location) {
      const stateCompany = getCompanyByName(state, STATE_COMPANY_NAME);
      companyEntity.companyId = stateCompany.id;
    }

    logSuccess(
      `${sellerCompany.name} sold their ${marketplaceItem.name} and was paid $${marketplaceItem.price}`,
    );

    return EMarketplaceTransactionResult.SUCCESS;
  }

  return EMarketplaceTransactionResult.UNKNOWN_ERROR;
};

import {
  EMarketplaceTransactionResult,
  IBaseItem,
  ICompany,
  ICompanyEntity,
  IMarketplaceEntity,
  IWorldState,
} from "@logisim/lib/entities";
import { getLocationItems } from "./locations/locations";
import { getTruckItems } from "./trucks";
import {
  COMPANY_TRANSFER_RESULT,
  transferCompanyFundsFromState,
  transferCompanyFundsToState,
} from "./companies";
import { logError } from "@logisim/lib/utils";

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
  itemId: string,
  sellerCompany: ICompany,
): EMarketplaceTransactionResult => {
  // .. transfer an existing entity from one company to another (or the state) in exchange for cash
  const marketplaceItem = getMarketplaceItemById(itemId);
  const paymentResult = transferCompanyFundsFromState(
    state,
    sellerCompany,
    marketplaceItem.price,
  );

  if (paymentResult === COMPANY_TRANSFER_RESULT.SUCCESS) {
    return EMarketplaceTransactionResult.SUCCESS;
  }

  return EMarketplaceTransactionResult.UNKNOWN_ERROR;
};

export const reposessItem = (
  debtorCompany: ICompany,
  creditorCompany: ICompany,
  item: IMarketplaceEntity & ICompanyEntity,
): EMarketplaceTransactionResult => {
  if (item.companyId !== debtorCompany.id) {
    logError(
      `[MARKETPLACE ERROR] The item with id ${item.id} doesn't belong to ${debtorCompany.name}`,
    );
    return EMarketplaceTransactionResult.REPOSESS_ERROR;
  }

  item.companyId = creditorCompany.id;

  return EMarketplaceTransactionResult.SUCCESS;
};

import { EItemType, IWorldState } from "@logisim/lib/entities";

export const purchaseItem = (
  state: IWorldState,
  itemType: EItemType,
  itemId: string,
  ownerCompanyId: string,
) => {
  // .. purchase a non-existant entity from the state and spawn it in exchange for cash
  // .. eventually, this will be overidden by the "sellItem" system where almost all items are traded between companies
  // .. and only certain items will be created by the state
};

export const sellItem = (state: IWorldState, entityId: string) => {
  // .. transfer an existing entity from one company to another (or the state) in exchange for cash
};

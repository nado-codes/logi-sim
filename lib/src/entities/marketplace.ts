export enum EMarketplaceTransactionResult {
  SUCCESS,
  INSUFFICIENT_FUNDS,
  REPOSESS_ERROR,
  UNKNOWN_ERROR,
  NOT_SELLABLE,
}

export interface IMarketplaceEntity {
  itemId: string;
}

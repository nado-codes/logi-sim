export enum EMarketplaceTransactionResult {
  SUCCESS,
  INSUFFICIENT_FUNDS,
  REPOSESS_ERROR,
  UNKNOWN_ERROR,
  NOT_SELLABLE,
  REGULATORY_RESTRICTED,
}

export interface IMarketplaceEntity {
  itemId: string;
}

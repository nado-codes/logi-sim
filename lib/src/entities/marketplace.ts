export enum EMarketplaceTransactionResult {
  SUCCESS,
  INSUFFICIENT_FUNDS,
  REPOSESS_ERROR,
  UNKNOWN_ERROR,
}

export interface IMarketplaceEntity {
  itemId: string;
}

export enum EMarketplaceTransactionResult {
  SUCCESS,
  INSUFFICIENT_FUNDS,
  UNKNOWN_ERROR,
}

export interface IMarketplaceEntity {
  itemId: string;
}

export enum EItemType {
  Location = "Location",
  Truck = "Truck",
}

export interface IBaseItem {
  id: string;
  itemType: EItemType;
  name: string;
  price: number;
}

export type Nullable<T> = T | undefined;

export interface IBaseEntity {
  id: string;
}

export interface INamedEntity extends IBaseEntity {
  name: string;
}

export enum WorldEntityType {
  Geography = "Geography",
  Location = "Location",
  Vehicle = "Vehicle",
}

export type Pos3D = {
  x: number;
  y: number;
  z: number;
};

export interface IWorldEntity extends INamedEntity {
  type: WorldEntityType;
  position: Pos3D;
  debugMessage?: string;
}

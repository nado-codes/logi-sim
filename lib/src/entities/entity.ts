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

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export interface IWorldEntity extends INamedEntity {
  type: WorldEntityType;
  position: Vector3;
  debugMessage?: string;
}

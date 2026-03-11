import { randomUUID } from "crypto";

export type Nullable<T> = T | undefined;

export interface IBaseEntity {
  id: string;
}

export interface INamedEntity extends IBaseEntity {
  name: string;
}

export interface IWorldEntity extends INamedEntity {
  position: number;
  debugMessage?: string;
}

export const generateId = () => randomUUID();

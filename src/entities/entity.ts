import { randomUUID } from "crypto";

export interface IBaseEntity {
  id: string;
}

export interface INamedEntity extends IBaseEntity {
  name: string;
}

export interface IWorldEntity extends INamedEntity {
  position: number;
}

export const generateId = () => randomUUID();

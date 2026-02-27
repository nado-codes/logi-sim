import { randomUUID } from "crypto";
import { IBaseEntity, INamedEntity, IWorldEntity } from "./entities/entity";

export const generateId = () => randomUUID();

export const createBaseEntity = (): IBaseEntity => {
  const id = generateId();

  return {
    getId: () => id,
  };
};

export const createNamedEntity = (name: string): INamedEntity => {
  return {
    ...createBaseEntity(),
    getName: () => name,
  };
};

export const createWorldEntity = (
  position: number,
  name: string,
): IWorldEntity => {
  return {
    ...createNamedEntity(name),
    getPosition: () => position,
  };
};

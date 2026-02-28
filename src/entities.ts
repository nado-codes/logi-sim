import { randomUUID } from "crypto";
import { IBaseEntity, INamedEntity, IWorldEntity } from "./entities/entity";

export const generateId = () => randomUUID();

export const createBaseEntity = (): IBaseEntity => {
  const id = generateId();

  return {
    id,
  };
};

export const createNamedEntity = (name: string): INamedEntity => {
  return {
    ...createBaseEntity(),
    name,
  };
};

export const createWorldEntity = (
  position: number,
  name: string,
): IWorldEntity => {
  return {
    ...createNamedEntity(name),
    position,
  };
};

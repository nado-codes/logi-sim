import { randomUUID } from "crypto";
import { IBaseEntity, INamedEntity, IWorldEntity } from "./entities/entity";
import { OkResult } from "./utils/result";

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
  let _position: number = position;

  return {
    ...createNamedEntity(name),
    getPosition: () => _position,

    setPosition: (position: number) => {
      _position = position;
      return OkResult();
    },
  };
};

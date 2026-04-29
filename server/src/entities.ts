import {
  IBaseEntity,
  INamedEntity,
  WorldEntityType,
  IWorldEntity,
  Vector3,
} from "@logisim/lib/entities";
import { randomUUID } from "crypto";

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
  type: WorldEntityType,
  position: Vector3,
  name: string,
): IWorldEntity => {
  return {
    ...createNamedEntity(name),
    type,
    position,
  };
};

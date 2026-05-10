import {
  IBaseEntity,
  INamedEntity,
  WorldEntityType,
  IWorldEntity,
  Pos3D,
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
  position: Pos3D,
  name: string,
): IWorldEntity => {
  return {
    ...createNamedEntity(name),
    type,
    position,
  };
};

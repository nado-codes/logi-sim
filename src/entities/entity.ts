import { randomUUID } from "crypto";

// Base entity that everything inherits from
export type BaseEntity = {
  id: string;
  name: string;
};

export interface IBaseEntity {
  getId: () => string;
}

export interface INamedEntity extends IBaseEntity {
  getName: () => string;
}

export interface IWorldEntity extends INamedEntity {
  getPosition: () => number;
}

// Company-owned entities
export type CompanyEntity = {
  companyId: string;
} & BaseEntity;

// ID generation (centralized - easy to change later)
export const generateId = () => randomUUID();

// Base entity creator
export function createBaseEntity<T extends Partial<BaseEntity>>(
  partial: T & { name: string },
): T & BaseEntity {
  return {
    id: generateId(),
    ...partial,
  } as T & BaseEntity;
}

// Company entity creator
export function createCompanyEntity<T extends Partial<CompanyEntity>>(
  partial: T & { name: string },
  companyId: string,
): T & CompanyEntity {
  return {
    ...createBaseEntity(partial),
    companyId,
  } as T & CompanyEntity;
}

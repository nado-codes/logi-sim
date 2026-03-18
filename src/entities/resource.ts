export enum RESOURCE_TYPE {
  GRAIN = "Grain",
  FLOUR = "Flour",
}

export type ResourceType = RESOURCE_TYPE;
export type ResourceDefinition = {
  name: string;
  weight: number;
};

export const Resource: Partial<Record<RESOURCE_TYPE, ResourceDefinition>> = {
  Grain: { name: RESOURCE_TYPE.GRAIN, weight: 2 },
  Flour: { name: RESOURCE_TYPE.FLOUR, weight: 1 },
};

export type ResourceMap = Partial<Record<RESOURCE_TYPE, number>>;

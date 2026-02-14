import { IBaseLocation } from "./entities/location";
import { RESOURCE_TYPE } from "./entities/storage";

export const findClosestSupplier = (
  destination: IBaseLocation,
  resourceType: RESOURCE_TYPE,
  candidates: IBaseLocation[],
): IBaseLocation | undefined => {
  console.log(`[LOGISTICS] ${destination.name} is searching for a supplier...`);
  const suppliers = candidates.filter((s) => {
    const hasResources = s.storage.some(
      (st) => st.resourceType === resourceType && st.resourceCount > 0,
    );

    if (s.id !== destination.id) {
      console.log(
        ` - Contacted ${s.name} -> ${hasResources ? "Found some resources!" : "Nothing available"}`,
      );
    }
    return hasResources && s.id !== destination.id;
  });

  if (suppliers.length === 0) {
    return undefined;
  }

  let closest = suppliers[0];
  let closestDistance = Math.abs(destination.position - closest.position);

  for (const supplier of suppliers) {
    const distance = Math.abs(destination.position - supplier.position);

    if (distance < closestDistance) {
      closest = supplier;
      closestDistance = distance;
    }
  }

  return closest;
};

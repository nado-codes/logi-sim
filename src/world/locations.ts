import { IBaseLocation } from "../entities/location";
import { getResourceStorage, RESOURCE_TYPE } from "../entities/storage";
import { loadNotificationConfig, notify } from "../notifications";
import { getContractByResource, createContract } from "./contracts";
import { IWorldState } from "./state";

const notificationConfig = loadNotificationConfig();

export const replenishInputStorage = (
  state: IWorldState,
  location: IBaseLocation,
  minInputThreshold?: number,
) => {
  Object.entries(location.recipe.inputs ?? {}).map(
    ([resourceType, requiredAmount]) => {
      const inputStorage = getResourceStorage(
        resourceType as RESOURCE_TYPE,
        location.storage,
      );
      const inputStorageCount = inputStorage
        .map((s) => s.resourceCount)
        .reduce((c, v) => c + v);

      const contract = getContractByResource(
        state,
        location.id,
        resourceType as RESOURCE_TYPE,
      );

      console.log(
        " - " + location.name + " contracts: ",
        state.contracts.filter((c) => c.owner.id === location.id).length,
      );

      if (inputStorageCount < (minInputThreshold ?? requiredAmount)) {
        if (!contract) {
          if (notificationConfig) {
            notify.warning(
              `[LOCATION WARNING] ${location.name} doesn't have enough ${inputStorage[0].resourceType} ${inputStorageCount > 0 ? `(only ${inputStorageCount} available) ` : ""}- so we'll create a contract`,
            );
          }

          if (notificationConfig.showLocationNotifications) {
            notify.info(
              `[LOCATION INFO] ${location.name} is searching for a supplier...`,
            );
          }
          const suppliers = [
            ...state.consumers,
            ...state.processors,
            ...state.producers,
          ].filter((s) => {
            const hasResources = s.storage.some(
              (st) => st.resourceType === resourceType && st.resourceCount > 0,
            );

            if (s.id !== location.id) {
              if (notificationConfig.showLocationNotifications) {
                notify.info(
                  ` - Contacted ${s.name} -> ${hasResources ? "Found some resources!" : "Nothing available"}`,
                );
              }
            }
            return hasResources && s.id !== location.id;
          });

          if (suppliers.length === 0) {
            return undefined;
          }

          let closestSupplier = suppliers[0];
          let closestDistance = Math.abs(
            location.position - closestSupplier.position,
          );

          for (const supplier of suppliers) {
            const distance = Math.abs(location.position - supplier.position);

            if (distance < closestDistance) {
              closestSupplier = supplier;
              closestDistance = distance;
            }
          }

          if (!closestSupplier) {
            if (notificationConfig.showLocationNotifications) {
              notify.error(
                `- No nearby suppliers to resupply ${location.name}`,
              );
            }
          } else {
            // .. if there's literally NO STOCK left, we need to create an URGENT contract (due sooner, more needs to be transported)
            createContract(
              state,
              location,
              closestSupplier,
              inputStorage[0].resourceType,
              Math.ceil((minInputThreshold ?? requiredAmount) * 1.5),
              100,
              10,
            );
          }
        } else if (!contract.shipper) {
          notify.error(
            `- ${location.name} was unable to create a contract because one already exists and is NOT being shipped`,
          );
        }
      }
    },
  );
};

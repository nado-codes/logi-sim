import axios from "axios";

import {
  createMenuPage,
  IMenuAction,
  IMenuPage,
  logMenuError,
  MenuItemType,
} from "../menu";
import { IUserSession } from "@logisim/lib";
import { RESOURCE_TYPE } from "@logisim/lib/entities";
import { highlight, logSuccess } from "@logisim/lib/utils";
import { randomUUID } from "node:crypto";

export const createManageTrucksPage = (
  apiBaseUrl: string,
  userSession: IUserSession,
): IMenuPage => {
  const truckSalePrice = 50000; // Base truck sale price
  const createViewTruckAction = (): IMenuAction => ({
    title: "View Truck",
    type: MenuItemType.Action,
    action: async (args: string[] = []) => {
      if (args.length === 0) {
        logMenuError("You need to select a truck");
        return false;
      }

      const choice = parseInt(args[0]);

      if (isNaN(choice)) {
        logMenuError("You must enter a number to select a truck");
        return false;
      }

      try {
        const trucks = (await axios.get(`${apiBaseUrl}/world/trucks`)).data;
        const truck = trucks[choice];

        if (!truck) {
          logMenuError(`Truck ${choice} doesn't exist`);
          return false;
        }

        return createMenuPage(`${truck.name}`, false, [], async () => {
          try {
            const contracts = (await axios.get(`${apiBaseUrl}/world/contracts`))
              .data;
            const locations = (await axios.get(`${apiBaseUrl}/world/locations`))
              .data;

            console.log(
              `  - Storage: ${highlight.yellow(truck.storage.resourceType)} | Stored: ${highlight.yellow(truck.storage.resourceCount + "")} | Capacity: ${highlight.yellow(truck.storage.resourceCapacity + "")}`,
            );

            const activeContracts = contracts.filter(
              (c: any) => c.truckId === truck.id,
            );

            console.log(" - Active Contracts: ");

            if (activeContracts.length <= 0) {
              console.log(`  - ${highlight.yellow("None")}`);
            } else {
              activeContracts.forEach((c: any) => {
                const contractSupplier = locations.find(
                  (l: any) => l.id === c.supplierId,
                );
                const contractDestination = locations.find(
                  (l: any) => l.id === c.destinationId,
                );
                console.log(
                  `  - Delivering ${highlight.yellow(c.totalAmount + " " + c.resourceType)} to ${highlight.yellow(contractDestination.name)} from ${highlight.yellow(contractSupplier.name)}`,
                );
              });
            }
          } catch (error) {
            console.log(highlight.error(`Failed to load truck data: ${error}`));
          }
        });
      } catch (error) {
        logMenuError(`Failed to load trucks: ${error}`);
        return false;
      }
    },
  });

  const createBuyTruckAction = (): IMenuAction => ({
    title: "Buy Truck",
    type: MenuItemType.Action,
    action: async (args: string[] = []) => {
      const availableResourceTypes = Object.keys(RESOURCE_TYPE);

      const createSelectResourceTypeAction = (): IMenuAction => ({
        title: "Select Resource Type",
        type: MenuItemType.Action,
        action: async (args: string[] = []) => {
          if (args.length === 0) {
            logMenuError("You need to select a resource type");
            return false;
          }

          const resourceChoice = parseInt(args[0]);

          if (isNaN(resourceChoice)) {
            logMenuError("You must enter a number to select a resource type");
            return false;
          }

          const resourceType = availableResourceTypes[resourceChoice];

          if (!resourceType) {
            logMenuError(`Resource ${resourceChoice} doesn't exist`);
            return false;
          }

          try {
            // Transfer funds to state first
            const transferRes = await axios.post(
              `${apiBaseUrl}/company/transfer-to-state`,
              {
                companyId: userSession.companyId,
                amount: truckSalePrice,
              },
            );

            if (!transferRes.data.success) {
              console.log(highlight.error(`Insufficient funds`));
              try {
                const company = (
                  await axios.get(
                    `${apiBaseUrl}/company/id/${userSession.companyId}`,
                  )
                ).data;
                console.log(
                  ` - You have ${highlight.yellow(`$${company.money}`)} - you need ${highlight.yellow(`$${truckSalePrice}`)}`,
                );
              } catch (e) {
                // Ignore error
              }
              return false;
            }

            // Create the truck
            await axios.post(`${apiBaseUrl}/truck/create`, {
              name: `Truck ${randomUUID()}`,
              companyId: userSession.companyId,
              resourceType: resourceType as RESOURCE_TYPE,
              resourceCapacity: 100,
              position: 0,
              speed: 2,
            });

            logSuccess(
              `Truck purchased for ${highlight.yellow(`$${truckSalePrice}`)}`,
            );
            console.log(highlight.success(`Truck purchased`));
            console.log(
              ` - You spent ${highlight.yellow(`$${truckSalePrice}`)}`,
            );
            console.log(
              ` - Your new ${highlight.yellow(resourceType)} truck is at position ${highlight.yellow(`0`)}`,
            );
          } catch (error) {
            logMenuError(`Failed to purchase truck: ${error}`);
            return false;
          }
        },
      });

      return createMenuPage(
        `Buy Truck`,
        false,
        [createSelectResourceTypeAction()],
        () => {
          console.log(`\nSelect the resource that your truck will hold: `);

          availableResourceTypes.forEach((resource, i) => {
            console.log(
              ` - [${i}] ${resource} ${highlight.yellow(`[$${truckSalePrice}]`)}`,
            );
          });
        },
      );
    },
  });

  const createSellTruckAction = (): IMenuAction => ({
    title: "Sell Truck",
    type: MenuItemType.Action,
    action: async (args: string[] = []) => {
      if (args.length === 0) {
        logMenuError("You need to select a truck");
        return false;
      }

      const choice = parseInt(args[0]);

      if (isNaN(choice)) {
        logMenuError("You must enter a number to select a truck");
        return false;
      }

      try {
        const trucks = (await axios.get(`${apiBaseUrl}/world/trucks`)).data;
        const truck = trucks[choice];

        if (!truck) {
          logMenuError(`Truck ${choice} doesn't exist`);
          return false;
        }

        const contracts = (await axios.get(`${apiBaseUrl}/world/contracts`))
          .data;
        const locations = (await axios.get(`${apiBaseUrl}/world/locations`))
          .data;

        const truckContract = contracts.find(
          (c: any) => c.id === truck.contractId,
        );
        const contractSupplier = truckContract
          ? locations.find((l: any) => l.id === truckContract.supplierId)
          : null;
        const contractDestination = truckContract
          ? locations.find((l: any) => l.id === truckContract.destinationId)
          : null;

        const createConfirmSellTruckAction = (): IMenuAction => ({
          title: "Confirm",
          type: MenuItemType.Action,
          action: async (args: string[] = []) => {
            try {
              // Transfer funds from state for selling
              await axios.post(`${apiBaseUrl}/company/transfer-from-state`, {
                companyId: userSession.companyId,
                amount: truckSalePrice,
              });

              // Delete the truck
              await axios.post(`${apiBaseUrl}/truck/delete`, {
                truckId: truck.id,
              });

              logSuccess(
                `Truck sold for ${highlight.yellow(`$${truckSalePrice}`)}`,
              );
              console.log(highlight.success(`Truck sold`));
              console.log(
                ` - You sold a ${highlight.yellow(truck.storage.resourceType)} truck for ${highlight.yellow(`$${truckSalePrice}`)}`,
              );
              if (contractSupplier && contractDestination) {
                console.log(
                  ` - The contract between ${highlight.yellow(contractSupplier.name)} and ${highlight.yellow(contractDestination.name)} was broken, forfeiting payment`,
                );
              }
            } catch (error) {
              logMenuError(`Failed to sell truck: ${error}`);
            }
          },
        });

        return createMenuPage(
          `Are you sure?`,
          false,
          [createConfirmSellTruckAction()],
          () => {
            console.log(
              `You're about to sell a ${highlight.yellow(truck.storage.resourceType)} truck for ${highlight.yellow(`$${truckSalePrice}`)}`,
            );

            if (contractSupplier && contractDestination) {
              console.log(
                ` - This will break a contract between ${highlight.yellow(contractSupplier.name)} and ${highlight.yellow(contractDestination.name)}, and will forfeit payment`,
              );
            }
          },
        );
      } catch (error) {
        logMenuError(`Failed to load truck data: ${error}`);
        return false;
      }
    },
  });

  return createMenuPage(
    "Manage Trucks",
    false,
    [createViewTruckAction(), createBuyTruckAction(), createSellTruckAction()],
    async () => {
      try {
        const trucks = (await axios.get(`${apiBaseUrl}/world/trucks`)).data;

        if (trucks.length === 0) {
          console.log(highlight.warning(` - There are no trucks available`));
          return;
        }

        console.log(`\nAvailable trucks: ${trucks.length}`);
        trucks.forEach((t: any, i: number) => {
          const truckString = `Truck ${highlight.yellow(t.id)} at position ${highlight.yellow(t.position.x)}`;
          console.log(` - [${i}] ${truckString}`);
        });
      } catch (error) {
        console.log(highlight.error(`Failed to load trucks: ${error}`));
      }
    },
  );
};

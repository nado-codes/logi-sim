import { randomUUID } from "node:crypto";
import { RESOURCE_TYPE } from "../../entities/storage";
import { IUserSession } from "../../session";
import { highlight, logSuccess, logWarning } from "../../utils/logUtils";
import {
  COMPANY_OP_RESULT,
  transferCompanyFundsFromState,
  transferCompanyFundsToState,
} from "../../world/companies";
import { loadTruckConfig } from "../../world/trucks";
import { IWorld } from "../../world/world";
import {
  createMenuPage,
  IMenuAction,
  IMenuPage,
  logMenuError,
  MenuItemType,
} from "../menu";

const truckConfig = loadTruckConfig();

export const createManageTrucksPage = (
  world: IWorld,
  userSession: IUserSession,
): IMenuPage => {
  const createViewTruckAction = (): IMenuAction => ({
    title: "View Truck",
    type: MenuItemType.Action,
    action: (args: string[] = []) => {
      if (args.length === 0) {
        logMenuError("You need to select a truck");
        return false;
      }

      const choice = parseInt(args[0]);

      if (isNaN(choice)) {
        logMenuError("You must enter a number to select a truck");
        return false;
      }

      const truck = world.getTrucks().find((_, i) => i === choice);

      if (!truck) {
        logMenuError(`Truck ${choice} doesn't exist`);
        return false;
      }

      return createMenuPage(`${truck.name}`, false, [], () => {
        console.log(
          `  - Storage: ${highlight.yellow(truck.storage.resourceType)} | Stored: ${highlight.yellow(truck.storage.resourceCount + "")} | Capacity: ${highlight.yellow(truck.storage.resourceCapacity + "")}`,
        );

        const activeContracts = world
          .getContracts()
          .filter((c) => c.truckId === truck.id);

        console.log(" - Active Contracts: ");

        if (activeContracts.length <= 0) {
          console.log(`  - ${highlight.yellow("None")}`);
        } else {
          activeContracts.forEach((c) => {
            const contractSupplier = world.getLocationById(c.supplierId);
            const contractDestination = world.getLocationById(c.destinationId);
            console.log(
              `  - Delivering ${highlight.yellow(c.totalAmount + " " + c.resourceType)} to ${highlight.yellow(contractDestination.name)} from ${highlight.yellow(contractSupplier.name)}`,
            );
          });
        }

        // .. show info about the location
      });
    },
  });

  const createBuyTruckAction = (): IMenuAction => ({
    title: "Buy Truck",
    type: MenuItemType.Action,
    action: (args: string[] = []) => {
      const availableResourceTypes = Object.keys(RESOURCE_TYPE);

      const createSelectResourceTypeAction = (): IMenuAction => ({
        title: "Select Resource Type",
        type: MenuItemType.Action,
        action: (args: string[] = []) => {
          if (args.length === 0) {
            logMenuError("You need to select a resource type");
            return false;
          }

          const resourceChoice = parseInt(args[0]);

          if (isNaN(resourceChoice)) {
            logMenuError("You must enter a number to select a resource type");
            return false;
          }

          const resourceType = availableResourceTypes.find(
            (_, i) => i === resourceChoice,
          );

          if (!resourceType) {
            logMenuError(`Resource ${resourceChoice} doesn't exist`);
            return false;
          }

          const playerCompany = world.getCompanyById(userSession.companyId);
          const result = transferCompanyFundsToState(
            playerCompany,
            truckConfig.baseSalePrice,
          );

          if (result === COMPANY_OP_RESULT.SUCCESS) {
            world.createTruck(
              `Truck ${randomUUID()}`,
              playerCompany.id,
              resourceType as RESOURCE_TYPE,
              100,
              0,
              2,
            );

            logSuccess(
              `${highlight.yellow(playerCompany.name)} purchased a ${highlight.yellow(resourceType)} for ${highlight.yellow(`$${truckConfig.baseSalePrice}`)}`,
            );

            console.log(highlight.success(`Truck purchased`));
            console.log(
              ` - You spent ${highlight.yellow(`$${truckConfig.baseSalePrice}`)}`,
            );
            console.log(
              ` - Your new ${highlight.yellow(resourceType)} truck is at position ${highlight.yellow(`0`)}`,
            );
          } else if (result === COMPANY_OP_RESULT.INSUFFICIENT_FUNDS) {
            console.log(highlight.error(`Insufficient funds`));
            console.log(
              ` - You have ${highlight.yellow(`$${playerCompany.money}`)} - you need ${highlight.yellow(`$${truckConfig.baseSalePrice}`)}`,
            );
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
              ` - [${i}] ${resource} ${highlight.yellow(`[$${truckConfig.baseSalePrice}]`)}`,
            );
          });
        },
      );
    },
  });

  const createSellTruckAction = (): IMenuAction => ({
    title: "Sell Truck",
    type: MenuItemType.Action,
    action: (args: string[] = []) => {
      if (args.length === 0) {
        logMenuError("You need to select a truck");
        return false;
      }

      const choice = parseInt(args[0]);

      if (isNaN(choice)) {
        logMenuError("You must enter a number to select a truck");
        return false;
      }

      const truck = world.getTrucks().find((_, i) => i === choice);

      if (!truck) {
        logMenuError(`Truck ${choice} doesn't exist`);
        return false;
      }

      const truckContract = world.getContractByIdOrNull(truck.contractId);
      const contractSupplier = world.getLocationByIdOrNull(
        truckContract?.supplierId,
      );
      const contractDestination = world.getLocationByIdOrNull(
        truckContract?.destinationId,
      );

      const createConfirmSellTruckAction = (): IMenuAction => ({
        title: "Confirm",
        type: MenuItemType.Action,
        action: (args: string[] = []) => {
          const truckCompany = world.getCompanyById(truck.companyId);

          transferCompanyFundsFromState(
            truckCompany,
            truckConfig.baseSalePrice,
          );

          logSuccess(
            `${highlight.yellow(truckCompany.name)} sold a ${highlight.yellow(truck.storage.resourceType)} truck for ${highlight.yellow(`$${truckConfig.baseSalePrice}`)}`,
          );
          console.log(highlight.success(`Truck sold`));
          console.log(
            ` - You sold a ${highlight.yellow(truck.storage.resourceType)} truck for ${highlight.yellow(`$${truckConfig.baseSalePrice}`)}`,
          );
          if (contractSupplier && contractDestination) {
            console.log(
              ` - The contract between ${highlight.yellow(contractSupplier.name)} and ${highlight.yellow(contractDestination.name)} was broken, forfeiting payment`,
            );
          }

          world.deleteTruck(truck);
        },
      });

      return createMenuPage(
        `Are you sure?`,
        false,
        [createConfirmSellTruckAction()],
        () => {
          console.log(
            `You're about to sell a ${highlight.yellow(truck.storage.resourceType)} truck for ${highlight.yellow(`$${truckConfig.baseSalePrice}`)}`,
          );

          if (contractSupplier && contractDestination) {
            console.log(
              ` - This will break a contract between ${highlight.yellow(contractSupplier.name)} and ${highlight.yellow(contractDestination.name)}, and will forfeit payment`,
            );
          }
        },
      );
    },
  });

  return createMenuPage(
    "Manage Trucks",
    false,
    [createViewTruckAction(), createBuyTruckAction(), createSellTruckAction()],
    () => {
      const availableTrucks = world.getTrucks();

      if (availableTrucks.length === 0) {
        console.log(highlight.warning(` - There are no trucks available`));
        return;
      }

      console.log(`\nAvailable trucks: ${availableTrucks.length}`);
      availableTrucks.forEach((t, i) => {
        console.log(` - [${i}] ${world.getTruckString(t)}`);
      });
    },
  );
};

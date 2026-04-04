import { highlight, logSuccess, logWarning } from "../utils/logUtils";
import { transferFundsFromState } from "../world/companies";
import { loadTruckConfig } from "../world/trucks";
import { IWorld } from "../world/world";
import { IMenuAction, IMenuPage, logError, MenuItemType } from "./menu";
import { createPage } from "./pages";

const truckConfig = loadTruckConfig();

export const createManageTrucksPage = (world: IWorld): IMenuPage => {
  const createViewTruckAction = (): IMenuAction => ({
    title: "View Truck",
    type: MenuItemType.Action,
    action: (args: string[] = []) => {
      if (args.length === 0) {
        logError("You need to select a truck");
        return false;
      }

      const choice = parseInt(args[0]);

      if (isNaN(choice)) {
        logError("You must enter a number to select a truck");
        return false;
      }

      const truck = world.getTrucks().find((_, i) => i === choice);

      if (!truck) {
        logError(`Truck ${choice} doesn't exist`);
        return false;
      }

      return createPage(`${truck.name}`, false, [], () => {
        console.log(
          `  - Storage: ${highlight.yellow(truck.storage.resourceType)} | Stored: ${highlight.yellow(truck.storage.resourceCount + "")} | Capacity: ${highlight.yellow(truck.storage.resourceCapacity + "")}`,
        );

        const activeContracts = world
          .getContracts()
          .filter((c) => c.shipperId === truck.id);

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
    title: "View Truck",
    type: MenuItemType.Action,
    action: (args: string[] = []) => {
      if (args.length === 0) {
        logError("You need to select a truck");
        return false;
      }

      const choice = parseInt(args[0]);

      if (isNaN(choice)) {
        logError("You must enter a number to select a truck");
        return false;
      }

      const truck = world.getTrucks().find((_, i) => i === choice);

      if (!truck) {
        logError(`Truck ${choice} doesn't exist`);
        return false;
      }

      return createPage(`${truck.name}`, false, [], () => {
        console.log(
          `  - Storage: ${highlight.yellow(truck.storage.resourceType)} | Stored: ${highlight.yellow(truck.storage.resourceCount + "")} | Capacity: ${highlight.yellow(truck.storage.resourceCapacity + "")}`,
        );

        const activeContracts = world
          .getContracts()
          .filter((c) => c.shipperId === truck.id);

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

  const createSellTruckAction = (): IMenuAction => ({
    title: "Sell Truck",
    type: MenuItemType.Action,
    action: (args: string[] = []) => {
      if (args.length === 0) {
        logError("You need to select a truck");
        return false;
      }

      const choice = parseInt(args[0]);

      if (isNaN(choice)) {
        logError("You must enter a number to select a truck");
        return false;
      }

      const truck = world.getTrucks().find((_, i) => i === choice);

      if (!truck) {
        logError(`Truck ${choice} doesn't exist`);
        return false;
      }

      const truckCompany = world.getCompanyById(truck.companyId);

      transferFundsFromState(truckCompany, truckConfig.baseSalePrice);
      world.deleteTruck(truck);

      logSuccess(`Truck sold`);
      console.log();
    },
  });

  return createPage(
    "Manage Trucks",
    false,
    [createViewTruckAction(), createBuyTruckAction(), createSellTruckAction()],
    () => {
      const availableTrucks = world.getTrucks();

      if (availableTrucks.length === 0) {
        logWarning(` - There are no trucks available`);
        return;
      }

      console.log(`\nAvailable trucks: ${availableTrucks.length}`);
      availableTrucks.forEach((t, i) => {
        console.log(` - [${i}] ${world.getTruckString(t)}`);
      });
    },
  );
};

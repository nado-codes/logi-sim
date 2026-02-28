import { logError, logSuccess, logWarning, highlight } from "../utils/utils";
import { assignContract, getContractString } from "../world/contracts";
import { getTruckString } from "../world/trucks";
import { IWorld } from "../world/world";
import { IMenuPage, IMenuAction, MenuItemType } from "./menu";
import { createPage } from "./pages";

export const createManageContractsPage = (world: IWorld): IMenuPage => {
  const createAcceptContractAction = (): IMenuAction => ({
    title: "Accept Contract",
    type: MenuItemType.Action,
    action: (args: string[] = []) => {
      if (args.length === 0) {
        logError("You need to select a contract");
        return false;
      }

      const contractChoice = parseInt(args[0]);

      if (isNaN(contractChoice)) {
        logError("You must enter a number to select a contract");
        return false;
      }

      const availableContracts = world
        .getContracts()
        .filter((c) => !c.shipperId);
      const contract = availableContracts.find((_, i) => i === contractChoice);

      if (!contract) {
        logError(`Contract ${contractChoice} doesn't exist`);
        return false;
      }

      const availableTrucks = world
        .getTrucksUnsafe()
        .filter(
          (t) =>
            !t.contractId && t.storage.resourceType === contract.resourceType,
        );
      const contractDestination = world.getLocationById(contract.destinationId);
      const contractSupplier = world.getLocationById(contract.supplierId);

      const supplierOwnerDistance = Math.abs(
        contractDestination.position - contractSupplier.position,
      );

      const createSelectTruckAction = (): IMenuAction => ({
        title: "Select Truck",
        type: MenuItemType.Action,
        action: (args: string[] = []) => {
          const truckChoice = parseInt(args[0]);

          if (isNaN(truckChoice)) {
            logError("You must enter a number to select a truck");
            return false;
          }

          const truck = availableTrucks.find((_, i) => i === truckChoice);

          if (!truck) {
            logError(`Truck ${truckChoice} doesn't exist`);
            return false;
          }

          if (assignContract(contract, truck)) {
            logSuccess(`Contract accepted`);
            console.log();

            const distance =
              Math.abs(truck.position - contractSupplier.position) +
              supplierOwnerDistance;

            console.log(
              ` - Truck ${highlight.yellow(truck.id)} will handle the contract`,
            );
            console.log(
              ` - It will take ${highlight.yellow("" + distance / truck.speed)} ticks to complete`,
            );
          } else {
            logError(
              `[CONTRACT ERROR] Unable to assign contract due to an unknown error`,
            );
          }
        },
      });

      return createPage(
        "Select A Truck",
        false,
        [createSelectTruckAction()],
        () => {
          console.log(`\nAvailable trucks: ${availableTrucks.length}`);
          availableTrucks.forEach((t, i) => {
            const supplierOwnerDistance = contract
              ? Math.abs(
                  contractDestination.position - contractSupplier.position,
                )
              : 0;

            const contractDistance = contract
              ? Math.abs(t.position - contractSupplier.position)
              : 0;
            const distance = contractDistance + supplierOwnerDistance;
            const distanceString = `Total Distance: ${highlight.yellow(distance + " units")}`;

            const truckString = `${getTruckString(world, t)} | ${distanceString}`;

            console.log(
              `${t.storage.resourceType === contract.resourceType ? `- [${i}] ${truckString}` : `- ${highlight.red(`[${i}] ${truckString}`)}`}`,
            );
          });

          if (availableTrucks.length === 0) {
            logWarning(
              ` Warning: There are no trucks that can handle this contract`,
            );
          }
        },
      );
    },
  });

  return createPage(
    "Manage Contracts",
    false,
    [createAcceptContractAction()],
    () => {
      const availableContracts = world
        .getContracts()
        .filter((c) => !c.shipperId);

      if (availableContracts.length === 0) {
        logWarning(` - There are no contracts available`);
        return;
      }

      console.log(`\nAvailable contracts: ${availableContracts.length}`);
      availableContracts.forEach((c, i) => {
        console.log(` - [${i}] ${getContractString(world, c)}`);
      });

      const availableTrucks = world
        .getTrucksUnsafe()
        .filter(
          (t) =>
            !t.contractId &&
            availableContracts.some(
              (c) => c.resourceType === t.storage.resourceType,
            ),
        );

      if (availableTrucks.length === 0) {
        logWarning(
          ` Warning: There are no trucks that can handle any of these contracts`,
        );
      }
    },
  );
};

import { highlight } from "../../utils/logUtils";
import { IWorld } from "../../world/world";
import {
  IMenuPage,
  IMenuAction,
  MenuItemType,
  createMenuPage,
  logMenuError,
} from "../menu";

export const createManageContractsPage = (world: IWorld): IMenuPage => {
  const createAcceptContractAction = (): IMenuAction => ({
    title: "Accept Contract",
    type: MenuItemType.Action,
    action: (args: string[] = []) => {
      if (args.length === 0) {
        console.log(highlight.error("You need to select a contract"));
        return false;
      }

      const contractChoice = parseInt(args[0]);

      if (isNaN(contractChoice)) {
        logMenuError("You must enter a number to select a contract");
        return false;
      }

      const availableContracts = world.getContracts().filter((c) => !c.truckId);
      const contract = availableContracts.find((_, i) => i === contractChoice);

      if (!contract) {
        console.log(
          highlight.error(`Contract ${contractChoice} doesn't exist`),
        );
        return false;
      }

      const availableTrucks = world
        .getTrucks()
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
            logMenuError("You must enter a number to select a truck");
            return false;
          }

          const truck = availableTrucks.find((_, i) => i === truckChoice);

          if (!truck) {
            console.log(highlight.error(`Truck ${truckChoice} doesn't exist`));
            return false;
          }

          if (world.assignContract(contract, truck)) {
            console.log(highlight.success(`Contract accepted`));
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
            console.log(
              highlight.error(
                `[CONTRACT ERROR] Unable to assign contract due to an unknown error`,
              ),
            );
          }
        },
      });

      return createMenuPage(
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

            const truckString = `${world.getTruckString(t)} | ${distanceString}`;

            console.log(
              `${t.storage.resourceType === contract.resourceType ? `- [${i}] ${truckString}` : `- ${highlight.red(`[${i}] ${truckString}`)}`}`,
            );
          });

          if (availableTrucks.length === 0) {
            console.log(
              highlight.warning(
                ` Warning: There are no trucks that can handle this contract`,
              ),
            );
          }
        },
      );
    },
  });

  const createViewContractsInProgressPage = (world: IWorld): IMenuPage => {
    return createMenuPage("Contracts In Progress", false, [], () => {
      const contractsInProgress = world.getContracts().filter((c) => c.truckId);

      if (contractsInProgress.length === 0) {
        console.log(highlight.warning(` - There are no contracts in progress`));
        return;
      }

      console.log(`\nContracts in progress: ${contractsInProgress.length}`);
      contractsInProgress.forEach((c, i) => {
        console.log(` - [${i}] ${world.getContractString(c)}`);
      });
    });
  };

  return createMenuPage(
    "Manage Contracts",
    false,
    [createAcceptContractAction(), createViewContractsInProgressPage(world)],
    () => {
      const availableContracts = world.getContracts().filter((c) => !c.truckId);

      if (availableContracts.length === 0) {
        console.log(highlight.warning(` - There are no contracts available`));
        return;
      }

      console.log(`\nAvailable contracts: ${availableContracts.length}`);
      availableContracts.forEach((c, i) => {
        console.log(` - [${i}] ${world.getContractString(c)}`);
      });

      const availableTrucks = world
        .getTrucks()
        .filter(
          (t) =>
            !t.contractId &&
            availableContracts.some(
              (c) => c.resourceType === t.storage.resourceType,
            ),
        );

      if (availableTrucks.length === 0) {
        console.log(
          highlight.warning(
            ` Warning: There are no trucks that can handle any of these contracts`,
          ),
        );
      }
    },
  );
};

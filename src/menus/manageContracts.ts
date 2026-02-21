import { logError, logSuccess, yellow, red, logWarning } from "../logUtils";
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

      const contracts = world.getContracts();
      const contract = contracts.find((_, i) => i === contractChoice);

      if (!contract) {
        logError(`Contract ${contractChoice} doesn't exist`);
        return false;
      }

      const idleTrucks = world.getTrucks().filter((t) => !t.contract);
      const supplierOwnerDistance = Math.abs(
        contract.owner.position - contract.supplier.position,
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

          const truck = idleTrucks.find((_, i) => i === truckChoice);

          if (!truck) {
            logError(`Truck ${truckChoice} doesn't exist`);
            return false;
          }

          logSuccess(`Contract accepted`);
          console.log();

          const distance =
            Math.abs(truck.position - contract.supplier.position) +
            supplierOwnerDistance;

          console.log(` - Truck ${yellow(truck.id)} will handle the contract`);
          console.log(
            ` - It will take ${yellow("" + distance / truck.speed)} ticks to complete`,
          );

          truck.contract = contract;
        },
      });

      return createPage(
        "Select A Truck",
        false,
        [createSelectTruckAction()],
        () => {
          console.log(`\nAvailable trucks: ${idleTrucks.length}`);
          idleTrucks.forEach((t, i) => {
            const supplierOwnerDistance = contract
              ? Math.abs(contract.owner.position - contract.supplier.position)
              : 0;

            const contractDistance = contract
              ? Math.abs(t.position - contract.supplier.position)
              : 0;
            const distance = contractDistance + supplierOwnerDistance;
            const distanceString = `Total Distance: ${yellow(distance + " units")}`;

            const truckString = `${getTruckString(world, t)} | ${distanceString}`;

            console.log(
              `${t.storage.resourceType === contract.resourceType ? `- [${i}] ${truckString}` : `- ${red(`[${i}] ${truckString}`)}`}`,
            );
          });

          const availableTrucks = idleTrucks.filter((t) =>
            contracts.some((c) => c.resourceType === t.storage.resourceType),
          );

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
      const contracts = world.getContracts();

      if (contracts.length === 0) {
        logWarning(` - There are no contracts available`);
        return;
      }

      console.log(`\nAvailable contracts: ${contracts.length}`);
      contracts.forEach((c, i) => {
        console.log(
          ` - [${i}] | ${c.amount} ${c.resourceType} | Pickup: ${c.supplier.name} | Drop-off: ${c.owner.name} | Due in: ${c.dueTicks} ticks`,
        );
      });

      const availableTrucks = world
        .getTrucks()
        .filter(
          (t) =>
            !t.contract &&
            contracts.some((c) => c.resourceType === t.storage.resourceType),
        );

      if (availableTrucks.length === 0) {
        logWarning(
          ` Warning: There are no trucks that can handle any of these contracts`,
        );
      }
    },
  );
};

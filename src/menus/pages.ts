import {
  MenuItemType,
  IMenuAction,
  IMenuPage,
  IMenuItem,
  logError,
} from "./menu";

import { IWorld } from "../world/world";
import { logSuccess, logWarning, red, yellow } from "../logUtils";

export const createPage = (
  title: string,
  isRoot: boolean,
  items: IMenuItem[],
  customRender?: () => void,
): IMenuPage => ({
  title,
  type: MenuItemType.Page,
  items: [
    ...items,
    {
      title: isRoot === true ? "Skip" : "Back",
      type: MenuItemType.Action,
      action: () => true,
    },
  ],
  customRender,
});

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
          const locations = world.getLocations();

          console.log(`\nAvailable trucks: ${idleTrucks.length}`);
          idleTrucks.forEach((t, i) => {
            const truckLocation = locations.find(
              (l) => l.position === t.position,
            );

            const distance =
              Math.abs(t.position - contract.supplier.position) +
              supplierOwnerDistance; //

            const truckString = `| Carries: ${t.storage.resourceType} | ${truckLocation ? `Location: ${truckLocation.name}` : `Position: ${t.position}`} | Total Distance: ${yellow(distance + " units")}`;

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

export const createTrucksPage = (world: IWorld): IMenuPage => {
  const createListTrucksAction = (): IMenuAction => ({
    title: "List Trucks",
    type: MenuItemType.Action,
    action: () => {
      const trucks = world.getTrucks();
      console.log(`\nTrucks: ${trucks.length}`);
      trucks.forEach((t) => {
        console.log(
          `  ${t.id}: at position ${t.position}, ${t.contract ? "has contract" : "idle"}`,
        );
      });
    },
  });

  return createPage("Trucks", false, [createListTrucksAction()]);
};

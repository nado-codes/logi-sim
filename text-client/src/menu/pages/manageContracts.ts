import axios from "axios";
import {
  IMenuPage,
  IMenuAction,
  MenuItemType,
  createMenuPage,
  logMenuError,
} from "../menu";
import { highlight } from "@logisim/lib/utils";
import { IUserSession } from "@logisim/lib";

export const createManageContractsPage = (
  apiBaseUrl: string,
  userSession: IUserSession,
): IMenuPage => {
  const createAcceptContractAction = (): IMenuAction => ({
    title: "Accept Contract",
    type: MenuItemType.Action,
    action: async (args: string[] = []) => {
      if (args.length === 0) {
        console.log(highlight.error("You need to select a contract"));
        return false;
      }

      const contractChoice = parseInt(args[0]);

      if (isNaN(contractChoice)) {
        logMenuError("You must enter a number to select a contract");
        return false;
      }

      try {
        const contracts = (await axios.get(`${apiBaseUrl}/world/contracts`))
          .data;
        const availableContracts = contracts.filter((c: any) => !c.truckId);
        const contract = availableContracts[contractChoice];

        if (!contract) {
          console.log(
            highlight.error(`Contract ${contractChoice} doesn't exist`),
          );
          return false;
        }

        const trucks = (await axios.get(`${apiBaseUrl}/world/trucks`)).data;
        const locations = (await axios.get(`${apiBaseUrl}/world/locations`))
          .data;

        const availableTrucks = trucks.filter(
          (t: any) =>
            !t.contractId && t.storage.resourceType === contract.resourceType,
        );

        const contractDestination = locations.find(
          (l: any) => l.id === contract.destinationId,
        );
        const contractSupplier = locations.find(
          (l: any) => l.id === contract.supplierId,
        );

        const supplierOwnerDistance = Math.abs(
          contractDestination.position - contractSupplier.position,
        );

        const createSelectTruckAction = (): IMenuAction => ({
          title: "Select Truck",
          type: MenuItemType.Action,
          action: async (args: string[] = []) => {
            const truckChoice = parseInt(args[0]);

            if (isNaN(truckChoice)) {
              logMenuError("You must enter a number to select a truck");
              return false;
            }

            const truck = availableTrucks[truckChoice];

            if (!truck) {
              console.log(
                highlight.error(`Truck ${truckChoice} doesn't exist`),
              );
              return false;
            }

            try {
              const response = await axios.post(
                `${apiBaseUrl}/contract/assign`,
                {
                  contractId: contract.id,
                  truckId: truck.id,
                },
              );

              if (response.data.success) {
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
            } catch (error) {
              console.log(
                highlight.error(
                  `[CONTRACT ERROR] Failed to assign contract: ${error}`,
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
            availableTrucks.forEach((t: any, i: number) => {
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

              const truckString = `Truck ${t.id} | ${distanceString}`;

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
      } catch (error) {
        logMenuError(`Failed to load contract data: ${error}`);
        return false;
      }
    },
  });

  const createViewContractsInProgressPage = (): IMenuPage => {
    return createMenuPage("Contracts In Progress", false, [], async () => {
      try {
        const contracts = (await axios.get(`${apiBaseUrl}/world/contracts`))
          .data;
        const contractsInProgress = contracts.filter((c: any) => c.truckId);

        if (contractsInProgress.length === 0) {
          console.log(
            highlight.warning(` - There are no contracts in progress`),
          );
          return;
        }

        console.log(`\nContracts in progress: ${contractsInProgress.length}`);
        contractsInProgress.forEach((c: any, i: number) => {
          console.log(` - [${i}] Contract ${c.id}`);
        });
      } catch (error) {
        console.log(highlight.error(`Failed to load contracts: ${error}`));
      }
    });
  };

  return createMenuPage(
    "Manage Contracts",
    false,
    [createAcceptContractAction(), createViewContractsInProgressPage()],
    async () => {
      try {
        const contracts = (await axios.get(`${apiBaseUrl}/world/contracts`))
          .data;
        const trucks = (await axios.get(`${apiBaseUrl}/world/trucks`)).data;
        const availableContracts = contracts.filter((c: any) => !c.truckId);

        if (availableContracts.length === 0) {
          console.log(highlight.warning(` - There are no contracts available`));
          return;
        }

        console.log(`\nAvailable contracts: ${availableContracts.length}`);
        availableContracts.forEach((c: any, i: number) => {
          console.log(` - [${i}] Contract ${c.id}`);
        });

        const availableTrucks = trucks.filter(
          (t: any) =>
            !t.contractId &&
            availableContracts.some(
              (c: any) => c.resourceType === t.storage.resourceType,
            ),
        );

        if (availableTrucks.length === 0) {
          console.log(
            highlight.warning(
              ` Warning: There are no trucks that can handle any of these contracts`,
            ),
          );
        }
      } catch (error) {
        console.log(highlight.error(`Failed to load data: ${error}`));
      }
    },
  );
};

import { randomUUID } from "crypto";
import { ITown } from "../entities/locations/consumer";
import { LOCATION_TYPE } from "../entities/locations/location";
import { RESOURCE_TYPE } from "../entities/storage";
import { highlight, logSuccess } from "../utils/logUtils";
import {
  transferCompanyFundsToState,
  COMPANY_OP_RESULT,
  transferCompanyFundsFromState,
} from "../world/companies";
import {
  getLocationString,
  loadLocationConfig,
} from "../world/locations/locations";
import { IWorld } from "../world/world";
import { IMenuPage, IMenuAction, MenuItemType, logError } from "./menu";
import { createPage } from "./pages";
import { IUserSession } from "../session";

const locationConfig = loadLocationConfig();

export const createManageLocationsPage = (
  world: IWorld,
  userSession: IUserSession,
): IMenuPage => {
  const createViewLocationAction = (): IMenuAction => ({
    title: "View Location",
    type: MenuItemType.Action,
    action: (args: string[] = []) => {
      if (args.length === 0) {
        console.log(highlight.error("You need to select a location"));
        return false;
      }

      const locationChoice = parseInt(args[0]);

      if (isNaN(locationChoice)) {
        console.log(
          highlight.error("You must enter a number to select a location"),
        );
        return false;
      }

      const availableLocations = world.getLocations();
      const location = availableLocations.find((_, i) => i === locationChoice);

      if (!location) {
        console.log(
          highlight.error(`Location ${locationChoice} doesn't exist`),
        );
        return false;
      }

      return createPage(`${location.name}`, false, [], () => {
        if (location.locationType === LOCATION_TYPE.Town) {
          const town = location as ITown;
          console.log(
            ` - Population: ${highlight.yellow(town.population + "")}`,
          );

          console.log(
            ` - Confidence: ${highlight.yellow(town.confidence + "")}`,
          );
        }

        const inputStrings = Object.entries(location.recipe?.inputs ?? []).map(
          ([k, v]) => `${v} ${k}`,
        );
        const outputStrings = Object.entries(
          location.recipe?.outputs ?? [],
        ).map(([k, v]) => `${v} ${k}`);
        console.log(
          ` - Recipe: ${highlight.yellow(inputStrings.length > 0 ? inputStrings.join(",") : "∞")} -> ${highlight.yellow(outputStrings.length > 0 ? outputStrings.join(",") : "∞")}`,
        );

        console.log(" - Storage: ");

        location.storage.forEach((s) => {
          console.log(
            `  - Type: ${highlight.yellow(s.resourceType)} | Stored: ${highlight.yellow(s.resourceCount + "")} | Capacity: ${highlight.yellow(s.resourceCapacity + "")}`,
          );
        });

        const activeContracts = world
          .getContracts()
          .filter(
            (c) =>
              c.supplierId === location.id || c.destinationId === location.id,
          );

        console.log(" - Active Contracts: ");

        if (activeContracts.length <= 0) {
          console.log(`  - ${highlight.yellow("None")}`);
        } else {
          activeContracts.forEach((c) => {
            if (c.supplierId === location.id) {
              const contractDestination = world.getLocationById(
                c.destinationId,
              );

              if (c.truckId) {
                const shipper = world.getTruckById(c.truckId);
                const shipperCompany = world.getCompanyById(shipper.companyId);
                console.log(
                  `  - Supplying ${highlight.yellow(c.totalAmount + " " + c.resourceType)} to ${highlight.yellow(contractDestination.name)} with ${highlight.yellow(shipperCompany.name)}`,
                );
              } else {
                console.log(
                  `  - Supplying ${highlight.yellow(c.totalAmount + " " + c.resourceType)} to ${highlight.yellow(contractDestination.name)} - waiting for shipper`,
                );
              }
            } else if (c.destinationId === location.id) {
              const contractSupplier = world.getLocationById(c.supplierId);

              if (c.truckId) {
                const shipper = world.getTruckById(c.truckId);
                const shipperCompany = world.getCompanyById(shipper.companyId);
                console.log(
                  `  - Awaiting delivery of ${highlight.yellow(c.totalAmount + " " + c.resourceType)} from ${highlight.yellow(contractSupplier.name)} by ${highlight.yellow(shipperCompany.name)}`,
                );
              } else {
                console.log(
                  `  - Awaiting delivery of ${highlight.yellow(c.totalAmount + " " + c.resourceType)} from ${highlight.yellow(contractSupplier.name)} - waiting for shipper`,
                );
              }
            }
          });
        }

        // .. show info about the location
      });
    },
  });

  const createManageIndustriesAction = (): IMenuAction => ({
    title: "Manage Industries",
    type: MenuItemType.Action,
    action: (args: string[] = []) => {
      const createBuyIndustryAction = (): IMenuAction => ({
        title: "Buy Industry",
        type: MenuItemType.Action,
        action: (args: string[] = []) => {
          const availableIndustryTypes = ["Farm", "Flour Mill"];

          const createSelectIndustryAction = (): IMenuAction => ({
            title: "Select Industry",
            type: MenuItemType.Action,
            action: (args: string[] = []) => {
              if (args.length === 0) {
                logError("You need to select an industry");
                return false;
              }

              const industryChoice = parseInt(args[0]);

              if (isNaN(industryChoice)) {
                logError("You must enter a number to select an industry");
                return false;
              }

              const industry = availableIndustryTypes.find(
                (_, i) => i === industryChoice,
              );

              if (!industry) {
                logError(`Industry ${industryChoice} doesn't exist`);
                return false;
              }

              const playerCompany = world.getCompanyById(userSession.companyId);

              if (playerCompany.money < locationConfig.baseSalePrice) {
                console.log(highlight.error(`Insufficient funds`));
                console.log(
                  ` - You have ${highlight.yellow(`$${playerCompany.money}`)} - you need ${highlight.yellow(`$${locationConfig.baseSalePrice}`)}`,
                );
                return false;
              }

              // TODO: need to allow the player to select the position of the industry visually on the map
              // e.g. "Left 10, Right 15, Set Position 20" ... and the map updates by refreshing the menu on the current page
              // ... once position is selected, spawn in the industry

              const result = transferCompanyFundsToState(
                playerCompany,
                locationConfig.baseSalePrice,
              );

              if (result === COMPANY_OP_RESULT.SUCCESS) {
                world.createTruck(
                  `Truck ${randomUUID()}`,
                  playerCompany.id,
                  industry as RESOURCE_TYPE,
                  100,
                  0,
                  2,
                );

                logSuccess(
                  `${highlight.yellow(playerCompany.name)} purchased a ${highlight.yellow(industry)} for ${highlight.yellow(`$${locationConfig.baseSalePrice}`)}`,
                );

                console.log(highlight.success(`Truck purchased`));
                console.log(
                  ` - You spent ${highlight.yellow(`$${locationConfig.baseSalePrice}`)}`,
                );
                console.log(
                  ` - Your new ${highlight.yellow(industry)} truck is at position ${highlight.yellow(`0`)}`,
                );
              } else if (result === COMPANY_OP_RESULT.INSUFFICIENT_FUNDS) {
                console.log(highlight.error(`Insufficient funds`));
                console.log(
                  ` - You have ${highlight.yellow(`$${playerCompany.money}`)} - you need ${highlight.yellow(`$${locationConfig.baseSalePrice}`)}`,
                );
              }
              console.log();
            },
          });

          return createPage(
            `Buy Industry`,
            false,
            [createSelectIndustryAction()],
            () => {
              console.log(`\nSelect the industry that you'd like to purchase:`);

              availableIndustryTypes.forEach((industry, i) => {
                console.log(
                  ` - [${i}] ${industry} ${highlight.yellow(`[$${locationConfig.baseSalePrice}]`)}`,
                );
              });
            },
          );
        },
      });

      const allIndustries = world
        .getLocations()
        .filter((l) => l.locationType !== LOCATION_TYPE.Town);

      const createSellIndustryAction = (): IMenuAction => ({
        title: "Sell Industry",
        type: MenuItemType.Action,
        action: (args: string[] = []) => {
          if (args.length === 0) {
            logError("You need to select an industry");
            return false;
          }

          const choice = parseInt(args[0]);

          if (isNaN(choice)) {
            logError("You must enter a number to select an industry");
            return false;
          }

          const industry = allIndustries.find((_, i) => i === choice);

          if (!industry) {
            logError(`Industry ${choice} doesn't exist`);
            return false;
          }

          const industryContracts = world
            .getContracts()
            .filter(
              (c) =>
                c.destinationId === industry.id || c.supplierId === industry.id,
            );

          const createConfirmSellIndustryAction = (): IMenuAction => ({
            title: "Confirm",
            type: MenuItemType.Action,
            action: (args: string[] = []) => {
              const industryCompany = world.getCompanyById(industry.companyId);

              transferCompanyFundsFromState(
                industryCompany,
                locationConfig.baseSalePrice,
              );

              logSuccess(
                `${highlight.yellow(industryCompany.name)} sold a ${highlight.yellow(industry.name)} for ${highlight.yellow(`$${locationConfig.baseSalePrice}`)}`,
              );
              console.log(highlight.success(`Industry sold`));
              console.log(
                ` - You sold a ${highlight.yellow(industry.name)} for ${highlight.yellow(`$${locationConfig.baseSalePrice}`)}`,
              );

              if (industryContracts.length > 0) {
                console.log(
                  ` - ${highlight.yellow(industryContracts.length)} contracts were voided - shippers will be paid out immediately`,
                );
                const industryTrucks = world
                  .getTrucks()
                  .filter((t) =>
                    industryContracts.some((c) => c.truckId === t.id),
                  );

                if (industryTrucks.length > 0) {
                  console.log(
                    ` - ${highlight.yellow(industryTrucks.length)} trucks have stopped moving`,
                  );
                }
              }

              world.deleteLocation(industry);
            },
          });

          return createPage(
            `Are you sure?`,
            false,
            [createConfirmSellIndustryAction()],
            () => {
              console.log(
                `You're about to sell a ${highlight.yellow(industry.name)} for ${highlight.yellow(`$${locationConfig.baseSalePrice}`)}`,
              );

              if (industryContracts.length > 0) {
                console.log(
                  ` - ${highlight.yellow(industryContracts.length)} contracts will be voided (shippers will be paid out immediately)`,
                );
                const industryTrucks = world
                  .getTrucks()
                  .filter((t) =>
                    industryContracts.some((c) => c.truckId === t.id),
                  );

                if (industryTrucks.length > 0) {
                  console.log(
                    ` - ${highlight.yellow(industryTrucks.length)} trucks will stop moving`,
                  );
                }
              }
            },
          );
        },
      });

      return createPage(
        "Manage Industries",
        false,
        [createBuyIndustryAction(), createSellIndustryAction()],
        () => {
          if (allIndustries.length === 0) {
            console.log(
              highlight.warning(` - There are no industries available`),
            );
            return;
          }

          console.log(`\nAvailable industries: ${allIndustries.length}`);
          allIndustries.forEach((l, i) => {
            console.log(` - [${i}] ${getLocationString(world, l)}`);
          });
        },
      );
    },
  });

  return createPage(
    "Manage Locations",
    false,
    [createViewLocationAction(), createManageIndustriesAction()],
    () => {
      const availableLocations = world.getLocations();

      if (availableLocations.length === 0) {
        console.log(highlight.warning(` - There are no locations available`));
        return;
      }

      console.log(`\nAvailable locations: ${availableLocations.length}`);
      availableLocations.forEach((l, i) => {
        console.log(` - [${i}] ${getLocationString(world, l)}`);
      });
    },
  );
};

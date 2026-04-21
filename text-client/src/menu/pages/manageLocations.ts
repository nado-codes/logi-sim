import axios from "axios";

import {
  IMenuPage,
  IMenuAction,
  MenuItemType,
  logMenuError,
  createMenuPage,
} from "../menu";
import { IUserSession } from "@logisim/lib";
import { LOCATION_TYPE, RESOURCE_TYPE } from "@logisim/lib/entities";
import { highlight, logSuccess } from "@logisim/lib/utils";

const locationSalePrice = 100000; // Base location sale price

enum IndustryType {
  Farm = "Farm",
  FlourMill = "Flour Mill",
}

export const createManageLocationsPage = (
  apiBaseUrl: string,
  userSession: IUserSession,
): IMenuPage => {
  const createViewLocationAction = (): IMenuAction => ({
    title: "View Location",
    type: MenuItemType.Action,
    action: async (args: string[] = []) => {
      if (args.length === 0) {
        logMenuError("You need to select a location");
        return false;
      }

      const locationChoice = parseInt(args[0]);

      if (isNaN(locationChoice)) {
        logMenuError("You must enter a number to select a location");
        return false;
      }

      try {
        const locations = (await axios.get(`${apiBaseUrl}/world/locations`))
          .data;
        const location = locations[locationChoice];

        if (!location) {
          logMenuError(`Location ${locationChoice} doesn't exist`);
          return false;
        }

        const createReseedTownAction = (): IMenuAction => ({
          title: "Reseed Town",
          type: MenuItemType.Action,
          action: async () => {
            try {
              await axios.post(`${apiBaseUrl}/town/reseed`, {
                locationId: location.id,
              });
              logSuccess("Town reseeded successfully");
            } catch (error) {
              const err = error as Error;
              logMenuError(`Failed to reseed town: ${err.message}`);
            }
          },
        });

        return createMenuPage(
          `${location.name}`,
          false,
          location.locationType === LOCATION_TYPE.Town
            ? [createReseedTownAction()]
            : [],
          async () => {
            try {
              const contracts = (
                await axios.get(`${apiBaseUrl}/world/contracts`)
              ).data;

              // Location type specific info
              if (location.locationType === LOCATION_TYPE.Town) {
                console.log(
                  ` - Population: ${highlight.yellow(location.population + "")}`,
                );
                console.log(
                  ` - Confidence: ${highlight.yellow(location.confidence + "")}`,
                );
              }

              const inputStrings = Object.entries(
                location.recipe?.inputs ?? {},
              ).map(([k, v]) => `${v} ${k}`);
              const outputStrings = Object.entries(
                location.recipe?.outputs ?? {},
              ).map(([k, v]) => `${v} ${k}`);
              console.log(
                ` - Recipe: ${highlight.yellow(inputStrings.length > 0 ? inputStrings.join(",") : "∞")} -> ${highlight.yellow(outputStrings.length > 0 ? outputStrings.join(",") : "∞")}`,
              );

              console.log(" - Storage: ");

              location.storage.forEach((s: any) => {
                console.log(
                  `  - Type: ${highlight.yellow(s.resourceType)} | Stored: ${highlight.yellow(s.resourceCount + "")} | Capacity: ${highlight.yellow(s.resourceCapacity + "")}`,
                );
              });

              const activeContracts = contracts.filter(
                (c: any) =>
                  c.supplierId === location.id ||
                  c.destinationId === location.id,
              );

              console.log(" - Active Contracts: ");

              if (activeContracts.length <= 0) {
                console.log(`  - ${highlight.yellow("None")}`);
              } else {
                activeContracts.forEach(async (c: any) => {
                  const contractDestination = locations.find(
                    (l: any) => l.id === c.destinationId,
                  );
                  const contractSupplier = locations.find(
                    (l: any) => l.id === c.supplierId,
                  );

                  if (c.supplierId === location.id) {
                    if (c.truckId) {
                      try {
                        const trucks = (
                          await axios.get(`${apiBaseUrl}/world/trucks`)
                        ).data;
                        const companies = (
                          await axios.get(`${apiBaseUrl}/companies`)
                        ).data;
                        const shipper = trucks.find(
                          (t: any) => t.id === c.truckId,
                        );
                        const shipperCompany = companies.find(
                          (comp: any) => comp.id === shipper?.companyId,
                        );
                        console.log(
                          `  - Supplying ${highlight.yellow(c.totalAmount + " " + c.resourceType)} to ${highlight.yellow(contractDestination?.name)} with ${highlight.yellow(shipperCompany?.name)}`,
                        );
                      } catch (e) {
                        // Ignore error
                      }
                    } else {
                      console.log(
                        `  - Supplying ${highlight.yellow(c.totalAmount + " " + c.resourceType)} to ${highlight.yellow(contractDestination?.name)} - waiting for shipper`,
                      );
                    }
                  } else if (c.destinationId === location.id) {
                    if (c.truckId) {
                      try {
                        const trucks = (
                          await axios.get(`${apiBaseUrl}/world/trucks`)
                        ).data;
                        const companies = (
                          await axios.get(`${apiBaseUrl}/companies`)
                        ).data;
                        const shipper = trucks.find(
                          (t: any) => t.id === c.truckId,
                        );
                        const shipperCompany = companies.find(
                          (comp: any) => comp.id === shipper?.companyId,
                        );
                        console.log(
                          `  - Awaiting delivery of ${highlight.yellow(c.totalAmount + " " + c.resourceType)} from ${highlight.yellow(contractSupplier?.name)} by ${highlight.yellow(shipperCompany?.name)}`,
                        );
                      } catch (e) {
                        // Ignore error
                      }
                    } else {
                      console.log(
                        `  - Awaiting delivery of ${highlight.yellow(c.totalAmount + " " + c.resourceType)} from ${highlight.yellow(contractSupplier?.name)} - waiting for shipper`,
                      );
                    }
                  }
                });
              }
            } catch (error) {
              console.log(
                highlight.error(`Failed to load location details: ${error}`),
              );
            }
          },
        );
      } catch (error) {
        logMenuError(`Failed to load locations: ${error}`);
        return false;
      }
    },
  });

  const createManageIndustriesAction = (): IMenuAction => ({
    title: "Manage Industries",
    type: MenuItemType.Action,
    action: async (args: string[] = []) => {
      const createBuyIndustryAction = (): IMenuAction => ({
        title: "Buy Industry",
        type: MenuItemType.Action,
        action: async (args: string[] = []) => {
          const createSelectIndustryAction = (): IMenuAction => ({
            title: "Select Industry",
            type: MenuItemType.Action,
            action: async (args: string[] = []) => {
              if (args.length === 0) {
                logMenuError("You need to select an industry");
                return false;
              }

              const industryChoice = parseInt(args[0]);

              if (isNaN(industryChoice)) {
                logMenuError("You must enter a number to select an industry");
                return false;
              }

              const industry = Object.values(IndustryType)[industryChoice];

              if (!industry) {
                logMenuError(`Industry ${industryChoice} doesn't exist`);
                return false;
              }

              const createSelectPositionAction = (): IMenuAction => ({
                title: "Select Position",
                type: MenuItemType.Action,
                action: async (args: string[] = []) => {
                  if (args.length == 0) {
                    logMenuError("You need to select a position");
                    return false;
                  }

                  const positionChoice = parseInt(args[0]);

                  if (isNaN(positionChoice)) {
                    logMenuError(
                      "You must enter a number to select a position",
                    );
                    return false;
                  }

                  try {
                    const locations = (
                      await axios.get(`${apiBaseUrl}/world/locations`)
                    ).data;
                    const entityAtPos = locations.find(
                      (l: any) => l.position.x === positionChoice,
                    );

                    if (entityAtPos) {
                      logMenuError(
                        `That position is already occupied by ${entityAtPos.name}. Please select another`,
                      );
                      return false;
                    }

                    // Transfer funds to state for purchasing
                    const transferRes = await axios.post(
                      `${apiBaseUrl}/company/transfer-to-state`,
                      {
                        companyId: userSession.companyId,
                        amount: locationSalePrice,
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
                          ` - You have ${highlight.yellow(`$${company.money}`)} - you need ${highlight.yellow(`$${locationSalePrice}`)}`,
                        );
                      } catch (e) {
                        // Ignore
                      }
                      return false;
                    }

                    // Create the industry
                    if (industry === IndustryType.Farm) {
                      await axios.post(
                        `${apiBaseUrl}/location/create-producer`,
                        {
                          name: `Grain Farm ${locations.length}`,
                          companyId: userSession.companyId,
                          position: { x: positionChoice },
                          resourceType: RESOURCE_TYPE.Grain,
                          productionRate: 25,
                        },
                      );
                    } else if (industry === IndustryType.FlourMill) {
                      await axios.post(
                        `${apiBaseUrl}/location/create-processor`,
                        {
                          name: `Flour Mill ${locations.length}`,
                          companyId: userSession.companyId,
                          position: { x: positionChoice },
                          recipe: {
                            inputs: { Grain: 6 },
                            outputs: { Flour: 3 },
                          },
                        },
                      );
                    }

                    logSuccess(
                      `Industry purchased for ${highlight.yellow(`$${locationSalePrice}`)}`,
                    );

                    console.log(highlight.success(`Industry purchased`));
                    console.log(
                      ` - You spent ${highlight.yellow(`$${locationSalePrice}`)}`,
                    );
                    console.log(
                      ` - Your new ${highlight.yellow(industry)} is at position ${highlight.yellow(positionChoice)}`,
                    );
                  } catch (error) {
                    logMenuError(`Failed to purchase industry: ${error}`);
                    return false;
                  }
                },
              });

              return createMenuPage(
                `Select Position`,
                false,
                [createSelectPositionAction()],
                () => {
                  console.log(
                    "Select a position on the map to spawn the industry",
                  );
                },
              );
            },
          });

          return createMenuPage(
            `Buy Industry`,
            false,
            [createSelectIndustryAction()],
            () => {
              console.log(`\nSelect the industry that you'd like to purchase:`);

              Object.values(IndustryType).forEach((industry, i) => {
                console.log(
                  ` - [${i}] ${industry} ${highlight.yellow(`[$${locationSalePrice}]`)}`,
                );
              });
            },
          );
        },
      });

      try {
        const locations = (await axios.get(`${apiBaseUrl}/world/locations`))
          .data;
        const allIndustries = locations.filter(
          (l: any) => l.locationType !== LOCATION_TYPE.Town,
        );

        const createSellIndustryAction = (): IMenuAction => ({
          title: "Sell Industry",
          type: MenuItemType.Action,
          action: async (args: string[] = []) => {
            if (args.length === 0) {
              logMenuError("You need to select an industry");
              return false;
            }

            const choice = parseInt(args[0]);

            if (isNaN(choice)) {
              logMenuError("You must enter a number to select an industry");
              return false;
            }

            const industry = allIndustries[choice];

            if (!industry) {
              logMenuError(`Industry ${choice} doesn't exist`);
              return false;
            }

            try {
              const contracts = (
                await axios.get(`${apiBaseUrl}/world/contracts`)
              ).data;
              const industryContracts = contracts.filter(
                (c: any) =>
                  c.destinationId === industry.id ||
                  c.supplierId === industry.id,
              );

              const createConfirmSellIndustryAction = (): IMenuAction => ({
                title: "Confirm",
                type: MenuItemType.Action,
                action: async (args: string[] = []) => {
                  try {
                    // Transfer funds from state for selling
                    await axios.post(
                      `${apiBaseUrl}/company/transfer-from-state`,
                      {
                        companyId: userSession.companyId,
                        amount: locationSalePrice,
                      },
                    );

                    // Delete the location
                    await axios.post(`${apiBaseUrl}/location/delete`, {
                      locationId: industry.id,
                    });

                    logSuccess(
                      `Industry sold for ${highlight.yellow(`$${locationSalePrice}`)}`,
                    );
                    console.log(highlight.success(`Industry sold`));
                    console.log(
                      ` - You sold a ${highlight.yellow(industry.name)} for ${highlight.yellow(`$${locationSalePrice}`)}`,
                    );

                    if (industryContracts.length > 0) {
                      console.log(
                        ` - ${highlight.yellow(industryContracts.length)} contracts were voided - shippers will be paid out immediately`,
                      );
                      const trucks = (
                        await axios.get(`${apiBaseUrl}/world/trucks`)
                      ).data;
                      const industryTrucks = trucks.filter((t: any) =>
                        industryContracts.some((c: any) => c.truckId === t.id),
                      );

                      if (industryTrucks.length > 0) {
                        console.log(
                          ` - ${highlight.yellow(industryTrucks.length)} trucks have stopped moving`,
                        );
                      }
                    }
                  } catch (error) {
                    logMenuError(`Failed to sell industry: ${error}`);
                  }
                },
              });

              return createMenuPage(
                `Are you sure?`,
                false,
                [createConfirmSellIndustryAction()],
                () => {
                  console.log(
                    `You're about to sell a ${highlight.yellow(industry.name)} for ${highlight.yellow(`$${locationSalePrice}`)}`,
                  );

                  if (industryContracts.length > 0) {
                    console.log(
                      ` - ${highlight.yellow(industryContracts.length)} contracts will be voided (shippers will be paid out immediately)`,
                    );
                    (async () => {
                      try {
                        const trucks = (
                          await axios.get(`${apiBaseUrl}/world/trucks`)
                        ).data;
                        const industryTrucks = trucks.filter((t: any) =>
                          industryContracts.some(
                            (c: any) => c.truckId === t.id,
                          ),
                        );

                        if (industryTrucks.length > 0) {
                          console.log(
                            ` - ${highlight.yellow(industryTrucks.length)} trucks will stop moving`,
                          );
                        }
                      } catch (e) {
                        // Ignore
                      }
                    })();
                  }
                },
              );
            } catch (error) {
              logMenuError(`Failed to load industry data: ${error}`);
              return false;
            }
          },
        });

        return createMenuPage(
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
            allIndustries.forEach((l: any, i: number) => {
              const locationString = `${highlight.yellow(l.name)} at position ${highlight.yellow(l.position.x)}`;
              console.log(` - [${i}] ${locationString}`);
            });
          },
        );
      } catch (error) {
        logMenuError(`Failed to load locations: ${error}`);
        return false;
      }
    },
  });

  return createMenuPage(
    "Manage Locations",
    false,
    [createViewLocationAction(), createManageIndustriesAction()],
    async () => {
      try {
        const locations = (await axios.get(`${apiBaseUrl}/world/locations`))
          .data;

        if (locations.length === 0) {
          console.log(highlight.warning(` - There are no locations available`));
          return;
        }

        console.log(`\nAvailable locations: ${locations.length}`);
        locations.forEach((l: any, i: number) => {
          const locationString = `${highlight.yellow(l.name)} at position ${highlight.yellow(l.position.x)}`;
          console.log(` - [${i}] ${locationString}`);
        });
      } catch (error) {
        console.log(highlight.error(`Failed to load locations: ${error}`));
      }
    },
  );
};

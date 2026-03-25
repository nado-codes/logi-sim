import { ITown } from "../entities/locations/consumer";
import { LOCATION_TYPE } from "../entities/locations/location";
import { logWarning, logError, highlight } from "../utils/logUtils";
import { getLocationString } from "../world/locations/locations";
import { IWorld } from "../world/world";
import { IMenuPage, IMenuAction, MenuItemType } from "./menu";
import { createPage } from "./pages";

export const createManageLocationsPage = (world: IWorld): IMenuPage => {
  const createViewLocationAction = (): IMenuAction => ({
    title: "View Location",
    type: MenuItemType.Action,
    action: (args: string[] = []) => {
      if (args.length === 0) {
        logError("You need to select a location");
        return false;
      }

      const locationChoice = parseInt(args[0]);

      if (isNaN(locationChoice)) {
        logError("You must enter a number to select a location");
        return false;
      }

      const availableLocations = world.getLocations();
      const location = availableLocations.find((_, i) => i === locationChoice);

      if (!location) {
        logError(`Location ${locationChoice} doesn't exist`);
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

              if (c.shipperId) {
                const shipper = world.getTruckById(c.shipperId);
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

              if (c.shipperId) {
                const shipper = world.getTruckById(c.shipperId);
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

  return createPage(
    "Manage Locations",
    false,
    [createViewLocationAction()],
    () => {
      const availableLocations = world.getLocations();

      if (availableLocations.length === 0) {
        logWarning(` - There are no locations available`);
        return;
      }

      console.log(`\nAvailable locations: ${availableLocations.length}`);
      availableLocations.forEach((l, i) => {
        console.log(` - [${i}] ${getLocationString(world, l)}`);
      });
    },
  );
};

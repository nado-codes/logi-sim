import { MenuItemType, IMenuAction, IMenuPage, IMenuItem } from "./menu";

import { IWorld } from "../world/world";
import { getTruckString } from "../world/trucks";
import { logWarning } from "../logUtils";
import { getLocationString } from "../world/locations";

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

export const createManageTrucksPage = (world: IWorld): IMenuPage => {
  return createPage("Manage Trucks", false, [], () => {
    const availableTrucks = world.getTrucks();

    if (availableTrucks.length === 0) {
      logWarning(` - There are no trucks available`);
      return;
    }

    console.log(`\nAvailable trucks: ${availableTrucks.length}`);
    availableTrucks.forEach((t, i) => {
      console.log(` - [${i}] ${getTruckString(world, t)}`);
    });
  });
};

export const createManageLocationsPage = (world: IWorld): IMenuPage => {
  return createPage("Manage Locations", false, [], () => {
    const availableLocations = world.getLocations();

    if (availableLocations.length === 0) {
      logWarning(` - There are no locations available`);
      return;
    }

    console.log(`\nAvailable locations: ${availableLocations.length}`);
    availableLocations.forEach((l, i) => {
      console.log(` - [${i}] ${getLocationString(l)}`);
    });
  });
};

import { MenuItemType, IMenuAction, IMenuPage, IMenuItem } from "./menu";

import { IWorld } from "../world/world";
import { getTruckString } from "../world/trucks";

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

export const createTrucksPage = (world: IWorld): IMenuPage => {
  const createListTrucksAction = (): IMenuAction => ({
    title: "List Trucks",
    type: MenuItemType.Action,
    action: () => {
      const trucks = world.getTrucks();
      console.log(`\nTrucks: ${trucks.length}`);
      trucks.forEach((t, i) => {
        console.log(` - [${i}] ${getTruckString(world, t)}`);
      });
    },
  });

  return createPage("Manage Trucks", false, [createListTrucksAction()]);
};

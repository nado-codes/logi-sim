import { MenuItemType, IMenuAction, IMenuPage, IMenuItem } from "../menu";
import { IWorld } from "../world/world";

export const createPage = (
  title: string,
  isRoot: boolean,
  items: IMenuItem[],
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
});

export const createContractsPage = (world: IWorld): IMenuPage => {
  const createListContractsAction = (): IMenuAction => ({
    title: "List Contracts",
    type: MenuItemType.Action,
    action: () => {
      const contracts = world.getContracts();
      console.log(`\nAvailable contracts: ${contracts.length}`);
      contracts.forEach((c) => {
        console.log(
          `  ${c.id}: ${c.amount} ${c.resourceType} from ${c.supplier.name} to ${c.owner.name}`,
        );
      });
    },
  });

  return createPage("Contracts", false, [createListContractsAction()]);
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

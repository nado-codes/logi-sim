import { IMenuAction, logMenuError, MenuItemType } from "./menu";

export const createMenuAction = (
  title: string,
  action: (args: string[] | undefined) => any,
): IMenuAction => {
  return {
    title,
    type: MenuItemType.Action,
    action,
  };
};

export const createEntitySelectorAction = (
  title: string,
  entityName: string,
  action: (choice: number) => any,
): IMenuAction => {
  return {
    title,
    type: MenuItemType.Action,
    action: (args: string[] | undefined = []) => {
      if (args.length === 0) {
        logMenuError(`You must select a ${entityName}`);
        return false;
      }

      const entityChoice = parseInt(args[0]);

      if (isNaN(entityChoice)) {
        logMenuError(`You must enter a number to select a ${entityName}`);
        return false;
      }

      return action(entityChoice);
    },
  };
};

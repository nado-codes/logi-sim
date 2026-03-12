import { MenuItemType, IMenuAction, IMenuPage, IMenuItem } from "./menu";

import { IWorld } from "../world/world";
import { highlight, logEntries, logWarning } from "../utils/logUtils";
import { getCompanyString } from "../world/companies";

export const createPage = (
  title: string,
  isRoot: boolean,
  items: IMenuItem[],
  customRender?: () => void,
): IMenuPage => {
  let _items = items;

  if (!isRoot) {
    _items.push({
      title: "Back",
      type: MenuItemType.Action,
      action: () => true,
    });
  }

  return {
    title,
    type: MenuItemType.Page,
    items: _items,
    isRoot,
    customRender,
  };
};

export const createManageCompaniesPage = (world: IWorld): IMenuPage => {
  return createPage("Manage Companies", false, [], () => {
    const companies = world.getCompanies();

    if (companies.length === 0) {
      logWarning(` - There are no companies available`);
      return;
    }

    console.log(`\nAvailable companies: ${companies.length}`);
    companies.forEach((c, i) => {
      console.log(` - [${i}] ${getCompanyString(c)}`);
    });
  });
};

export const createViewLogsPage = (): IMenuPage => {
  return createPage("Logs", false, [], () => {
    logEntries.forEach((logEntry) => {
      console.log(
        `Tick ${highlight.yellow(logEntry.tick + "")} | ${logEntry.entry}`,
      );
    });
  });
};

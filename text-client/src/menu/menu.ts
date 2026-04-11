// menu.ts
import readline from "readline";
import { createWorld } from "../../../server/src/world/world";
import { createViewLogsPage } from "./pages/viewLogs";
import { createManageContractsPage } from "./pages/manageContracts";
import { getCompanyString } from "../../../server/src/world/companies";
import { createManageLocationsPage } from "./pages/manageLocations";
import { highlight } from "../../../lib/utils/logUtils";
import { createManageTrucksPage } from "./pages/manageTrucks";
import { IUserSession } from "../../../server/src/userSession";
import { createManageCompaniesPage } from "./pages/manageCompanies";

export enum MenuItemType {
  Page,
  Action,
}

interface IMenuItemBase {
  title: string;
  type: MenuItemType;
}

export interface IMenuPage extends IMenuItemBase {
  title: string;
  items: IMenuItem[];
  isRoot: boolean;
  customRender?: () => void;
}

export interface IMenuAction extends IMenuItemBase {
  action: (args?: string[]) => any;
}

export type IMenuItem = IMenuPage | IMenuAction;

export const logMenuError = (errorMessage: string) => {
  console.log(`\x1b[31m${errorMessage}\x1b[0m`);
};

export const createMenuPage = (
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

export const createMenu = (
  callback: () => void,
  world: ReturnType<typeof createWorld>,
  userSession: IUserSession,
) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const mainMenu: IMenuPage = createMenuPage("Main Menu", true, [
    createManageContractsPage(world),
    createManageTrucksPage(world, userSession),
    createManageLocationsPage(world, userSession),
    createManageCompaniesPage(world),
    createViewLogsPage(),
  ]);

  let activePage: IMenuPage = mainMenu;
  let navHistory: IMenuPage[] = [mainMenu];

  const pause = (callback?: () => void) => {
    rl.once("line", callback ?? finish);
  };

  const finish = () => {
    console.clear();
    navHistory = [mainMenu];

    callback();
    renderPage(activePage);
    waitForInput();
  };

  const renderPrevPage = () => {
    const prevPageIndex = navHistory.findIndex((p) => p === activePage) - 1;
    activePage = navHistory[prevPageIndex];

    if (activePage === mainMenu) {
      navHistory = [mainMenu];
    }

    renderPage(activePage);
    waitForInput();
  };

  const renderPage = (page: IMenuPage, errorMessage?: string) => {
    console.clear();

    if (!navHistory.find((p) => p === page)) {
      navHistory.push(page);
    }

    console.log(
      `WORLD MAP (Tick: ${highlight.yellow(world.getCurrentTick() + "")}):`,
    );
    console.log(world.getMap());
    console.log();

    const playerCompany = world.getCompanyById(userSession.companyId);
    console.log(`YOUR COMPANY:`);
    console.log(getCompanyString(playerCompany));
    console.log();
    console.log(`RIVAL COMPANIES:`);
    world
      .getCompanies()
      .filter((c) => c !== playerCompany && !c.options.isGovernment)
      .forEach((c) => {
        console.log(` - ${getCompanyString(c)}`);
      });
    console.log();

    console.log(`===${page.title.toUpperCase()}===`);

    if (page.customRender !== undefined) {
      page.customRender();
      console.log();
    }

    page.items.forEach((item, i) => {
      console.log(` - [${i + 1}] ${item.title}`);
    });

    console.log();

    if (errorMessage) {
      logMenuError(errorMessage);
    }

    console.log(
      "Enter a number corresponding to one of the above options or press enter to advance tick",
    );
  };

  const executeAction = (action: IMenuAction, args: any) => {
    console.clear();
    console.log(`===${action.title.toUpperCase()}===`);

    const result = action.action(args);

    if (result && result.type === MenuItemType.Page) {
      // Action returned a page - navigate to it
      activePage = result;
      renderPage(result);
      waitForInput();
    } else if (result !== false) {
      // Action returned void - normal action behavior
      console.log("\nPress any key to continue");
      activePage = mainMenu;
      console.log("\nPress any key to continue");
      pause(() => {
        renderPage(activePage);
        waitForInput();
      });
    } else {
      console.log("\nPress any key to continue");
      pause(() => {
        renderPage(activePage);
        waitForInput();
      });
    }
  };

  const waitForInput = () => {
    rl.removeAllListeners();

    rl.once("line", (input) => {
      // .. input gets processed
      const [command, ...args] = input.trim().split(" ");

      if (command) {
        const menuItem = activePage.items.find(
          (_, i) => i + 1 === parseInt(command),
        );

        if (menuItem) {
          if (menuItem.type === MenuItemType.Page) {
            activePage = menuItem as IMenuPage;
            renderPage(activePage);
            waitForInput();
          } else {
            if (menuItem.title === "Skip") {
              finish();
            } else if (menuItem.title == "Back") {
              renderPrevPage();
            } else {
              executeAction(menuItem as IMenuAction, args);
            }
          }
        } else {
          renderPage(activePage, `"${command}" is not a valid option`);
          waitForInput();
        }
      } else {
        finish();
      }
    });
  };

  return {
    show: () => {
      renderPage(mainMenu);
      waitForInput();
    },
    pause,
  };
};

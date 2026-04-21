// menu.ts
import readline from "readline";
import { createViewLogsPage } from "./pages/viewLogs";
import { createManageContractsPage } from "./pages/manageContracts";
import { createManageLocationsPage } from "./pages/manageLocations";
import { createManageTrucksPage } from "./pages/manageTrucks";
import { createManageCompaniesPage } from "./pages/manageCompanies";
import axios from "axios";
import { IUserSession } from "@logisim/lib";
import { highlight } from "@logisim/lib/utils";

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
  customRender?: () => void | Promise<void>;
}

export interface IMenuAction extends IMenuItemBase {
  action: (args?: string[]) => any;
}

export type IMenuItem = IMenuPage | IMenuAction;

export const logMenuError = (errorMessage: string) => {
  console.log(`\x1b[31m${errorMessage}\x1b[0m`);
};

const apiBaseUrl = `http://localhost:3001/api`;

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

export const createMenu = (callback: () => void, userSession: IUserSession) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const mainMenu: IMenuPage = createMenuPage("Main Menu", true, [
    createManageContractsPage(apiBaseUrl, userSession),
    createManageTrucksPage(apiBaseUrl, userSession),
    createManageLocationsPage(apiBaseUrl, userSession),
    createManageCompaniesPage(apiBaseUrl),
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

  const renderPrevPage = async () => {
    const prevPageIndex = navHistory.findIndex((p) => p === activePage) - 1;
    activePage = navHistory[prevPageIndex];
    navHistory.pop();

    if (activePage === mainMenu) {
      navHistory = [mainMenu];
    }

    await renderPage(activePage);
    waitForInput();
  };

  const renderPage = async (page: IMenuPage, errorMessage?: string) => {
    console.clear();

    if (!navHistory.find((p) => p === page)) {
      navHistory.push(page);
    }

    // .. TODO: fetch all world-related state via api

    const worldTick = (await axios.get(`${apiBaseUrl}/world/tick`)).data;
    console.log(`WORLD MAP (Tick: ${highlight.yellow(worldTick + "")}):`);
    console.log((await axios.get(`${apiBaseUrl}/world/map`)).data);
    console.log();

    const playerCompany = (
      await axios.get(`${apiBaseUrl}/company/id/${userSession.companyId}`)
    ).data;
    console.log(`YOUR COMPANY:`);
    const playerCompanyString = `Name: ${highlight.yellow(playerCompany.name)} | Money: ${highlight.yellow(playerCompany.money + "")}`;
    console.log(playerCompanyString);
    console.log();
    console.log(`RIVAL COMPANIES:`);
    const rivalCompanies = (await axios.get(`${apiBaseUrl}/companies`)).data;
    rivalCompanies
      .filter((c: any) => c.id !== playerCompany.id && !c.options.isGovernment)
      .forEach((c: any) => {
        const companyString = `Name: ${highlight.yellow(c.name)} | Money: ${highlight.yellow(c.money + "")}`;
        console.log(` - ${companyString}`);
      });
    console.log();

    console.log(`===${page.title.toUpperCase()}===`);

    if (page.customRender !== undefined) {
      await page.customRender();
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

  const executeAction = async (action: IMenuAction, args: any) => {
    console.clear();
    console.log(`===${action.title.toUpperCase()}===`);

    const result = await action.action(args);

    if (result && result.type === MenuItemType.Page) {
      // Action returned a page - navigate to it
      activePage = result;
      await renderPage(result);
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

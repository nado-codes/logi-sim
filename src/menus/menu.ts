// menu.ts
import readline from "readline";
import { createWorld } from "../world/world";
import { createPage, createTrucksPage } from "./pages";
import { createManageContractsPage } from "./manageContracts";
import { red } from "../logUtils";

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
  customRender?: () => void;
}

export interface IMenuAction extends IMenuItemBase {
  action: (args?: string[]) => any;
}

export type IMenuItem = IMenuPage | IMenuAction;

export const logError = (errorMessage: string) => {
  console.log(`\x1b[31m${errorMessage}\x1b[0m`);
  console.log();
};

export const createMenu = (
  callback: () => void,
  world: ReturnType<typeof createWorld>,
) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const mainMenu: IMenuPage = createPage("Main Menu", true, [
    createManageContractsPage(world),
    createTrucksPage(world),
  ]);

  let prevPage: IMenuPage;
  let activePage: IMenuPage = mainMenu;

  const pause = (callback?: () => void) => {
    rl.once("line", callback ?? finish);
  };

  const finish = () => {
    console.clear();
    activePage = mainMenu;
    prevPage = mainMenu;
    callback();
  };

  const renderPrevPage = () => {
    activePage = prevPage;
    renderPage(activePage);
  };

  const renderPage = (page: IMenuPage, errorMessage?: string) => {
    console.clear();
    console.log(`WORLD MAP:`);
    console.log(world.getMap());
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
      logError(errorMessage);
    }
    console.log("Enter a number corresponding to one of the above options");
  };

  const executeAction = (action: IMenuAction, args: any) => {
    console.clear();
    console.log(`===${action.title.toUpperCase()}===`);
    console.clear();

    const result = action.action(args);

    if (result && result.type === MenuItemType.Page) {
      // Action returned a page - navigate to it
      activePage = result;
      renderPage(result);
      waitForInput();
    } else if (result !== false) {
      // Action returned void - normal action behavior
      console.log("\nPress any key to continue");
      pause();
    } else {
      console.log("\nPress any key to continue");
      pause(renderPrevPage);
      waitForInput();
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
            prevPage = activePage;
            activePage = menuItem as IMenuPage;
            renderPage(activePage);
            waitForInput();
          } else {
            if (menuItem.title === "Skip") {
              finish();
            } else if (menuItem.title == "Back") {
              renderPrevPage();
              waitForInput();
            } else {
              executeAction(menuItem as IMenuAction, args);
            }
          }
        } else {
          renderPage(activePage, `"${command}" is not a valid option`);
          waitForInput();
        }
      } else {
        renderPage(activePage, `Please choose an option`);
        waitForInput();
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

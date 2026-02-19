// menu.ts
import readline from "readline";
import { createWorld } from "./world/world";
import {
  createContractsPage,
  createPage,
  createTrucksPage,
} from "./menus/pages";

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
}

export interface IMenuAction extends IMenuItemBase {
  action: (...args: any) => any;
}

export type IMenuItem = IMenuPage | IMenuAction;

const renderPage = (page: IMenuPage, errorMessage?: string) => {
  console.clear();
  console.log(`===${page.title.toUpperCase()}===`);
  page.items.forEach((item, i) => {
    console.log(` - [${i + 1}] ${item.title}`);
  });
  console.log();

  if (errorMessage) {
    console.log(`\x1b[31m${errorMessage}\x1b[0m`);
    console.log();
  }
  console.log("Enter a number corresponding to one of the above options");
};

const executeAction = (action: IMenuAction, args: any) => {
  console.clear();
  console.log(`===${action.title.toUpperCase()}===`);
  action.action(args);
  console.log();
  console.log("Press any key to continue");
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
    createContractsPage(world),
    createTrucksPage(world),
  ]);

  let prevPage: IMenuPage;
  let activePage: IMenuPage = mainMenu;

  const pause = () => {
    rl.once("line", finish);
  };

  const finish = () => {
    console.clear();
    activePage = mainMenu;
    prevPage = mainMenu;
    callback();
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
              activePage = prevPage;
              renderPage(activePage);
              waitForInput();
            } else {
              executeAction(menuItem as IMenuAction, args);
              pause();
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

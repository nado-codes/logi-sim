import { ICompany } from "@logisim/lib/entities";
import { highlight, logWarning } from "@logisim/lib/utils";
import axios from "axios";
import {
  IMenuPage,
  logMenuError,
  createMenuPage,
  IMenuAction,
  MenuItemType,
} from "../../menu";

export const createManageCompanyMoneyPage = (
  apiBaseUrl: string,
  company: ICompany,
): IMenuPage => {
  const createAddMoneyAction = (): IMenuAction => ({
    title: "Add Money",
    type: MenuItemType.Action,
    action: async (args: string[] = []) => {
      if (args.length === 0) {
        logMenuError("You need to specify an amount");
        return false;
      }

      const amount = parseFloat(args[0]);

      if (isNaN(amount)) {
        logMenuError("The amount must be a number");
        return false;
      }

      if (amount < 0) {
        logMenuError("The amount must not be negative");
        return false;
      }

      try {
        const response = await axios.post(
          `${apiBaseUrl}/company/${company.id}/funds/update`,
          {
            amount: company.money + amount,
          },
        );

        if (response.data.success) {
          console.log(highlight.success(`Funds added`));
          console.log();

          console.log(
            ` - ${highlight.yellow(company.name)} now has $${highlight.yellow(amount + company.money)} in funds`,
          );
        } else {
          logMenuError(
            `[COMPANY ERROR] Unable to add funds due to an unknown error`,
          );
          return false;
        }
      } catch (error) {
        logMenuError(`[COMPANY ERROR] Failed to add funds: ${error}`);
        return false;
      }
    },
  });

  const createRemoveMoneyAction = (): IMenuAction => ({
    title: "Remove Money",
    type: MenuItemType.Action,
    action: async (args: string[] = []) => {
      if (args.length === 0) {
        logMenuError("You need to specify an amount");
        return false;
      }

      const amount = parseFloat(args[0]);

      if (isNaN(amount)) {
        logMenuError("The amount must be a number");
        return false;
      }

      if (amount < 0) {
        logMenuError("The amount must not be negative");
        return false;
      }

      if (amount > company.money) {
        logMenuError(
          `The amount must be greater than or equal to the company's current funds ($${company.money})`,
        );
        return false;
      }

      try {
        const response = await axios.post(
          `${apiBaseUrl}/company/${company.id}/funds/update`,
          {
            amount: company.money - amount,
          },
        );

        if (response.data.success) {
          console.log(highlight.success(`Funds removed`));
          console.log();

          console.log(
            ` - ${highlight.yellow(company.name)} now has $${highlight.yellow(company.money - amount)} in funds`,
          );
        } else {
          logMenuError(
            `[COMPANY ERROR] Unable to remove funds due to an unknown error`,
          );
          return false;
        }
      } catch (error) {
        logMenuError(`[COMPANY ERROR] Failed to remove funds: ${error}`);
        return false;
      }
    },
  });

  const createSetMoneyAction = (): IMenuAction => ({
    title: "Set Money",
    type: MenuItemType.Action,
    action: async (args: string[] = []) => {
      if (args.length === 0) {
        logMenuError("You need to specify an amount");
        return false;
      }

      const amount = parseFloat(args[0]);

      if (isNaN(amount)) {
        logMenuError("The amount must be a number");
        return false;
      }

      if (amount < 0) {
        logMenuError("The amount must not be negative");
        return false;
      }

      try {
        const response = await axios.post(
          `${apiBaseUrl}/company/${company.id}/funds/update`,
          {
            amount,
          },
        );

        if (response.data.success) {
          console.log(highlight.success(`Funds set`));
          console.log();

          console.log(
            ` - ${highlight.yellow(company.name)} now has $${highlight.yellow(amount)} in funds`,
          );
        } else {
          logMenuError(
            `[COMPANY ERROR] Unable to set funds due to an unknown error`,
          );
          return false;
        }
      } catch (error) {
        logMenuError(`[COMPANY ERROR] Failed to set funds: ${error}`);
        return false;
      }
    },
  });

  return createMenuPage(
    "Manage Company Money",
    false,
    [createAddMoneyAction(), createRemoveMoneyAction(), createSetMoneyAction()],
    async () => {
      try {
        console.log(`\nAvailable funds: $${company.money}`);
      } catch (error) {
        console.log(highlight.error(`Failed to load company funds: ${error}`));
      }
    },
  );
};

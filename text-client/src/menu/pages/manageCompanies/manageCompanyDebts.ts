import { ICompany, ICompanyDebt, IContract } from "@logisim/lib/entities";
import { highlight, sum, logWarning } from "@logisim/lib/utils";
import axios from "axios";
import {
  IMenuPage,
  logMenuError,
  createMenuPage,
  IMenuAction,
  MenuItemType,
} from "../../menu";
import { createEntitySelectorAction, createMenuAction } from "../../menuAction";

export const createManageCompanyDebtsPage = (
  apiBaseUrl: string,
  company: ICompany,
  companies: ICompany[],
): IMenuPage => {
  const createModifyDebtAction = createEntitySelectorAction(
    "Modify Debt",
    "debt",
    async (debtChoiceIndex: number) => {
      try {
        const debt = company.debts[debtChoiceIndex] as ICompanyDebt;
        if (!debt) {
          logMenuError(`Debt ${debtChoiceIndex} doesn't exist`);
          return false;
        }

        const creditorCompany = companies.find(
          (c) => c.id === debt.creditorCompanyId,
        );
        if (!creditorCompany) {
          logMenuError(
            `Company with id ${debt.creditorCompanyId} doesn't exist`,
          );
          return false;
        }

        const createUpdateDebtAmountAction = (): IMenuAction => ({
          title: "Update Amount",
          type: MenuItemType.Action,
          action: async (args: string[] = []) => {
            if (args.length === 0) {
              console.log(highlight.error("You need to enter an amount"));
              return false;
            }

            const amount = parseFloat(args[0]);

            if (isNaN(amount)) {
              logMenuError("The amount must be a number");
              return false;
            }

            try {
              const response = await axios.post(
                `${apiBaseUrl}/company/${company.id}/debts/${creditorCompany.id}/update`,
                {
                  amount,
                },
              );

              if (response.data.success) {
                console.log(highlight.success(`Debt updated`));
                console.log();

                console.log(
                  ` - ${highlight.yellow(company.name)} is now $${highlight.yellow(amount)} in debt with ${creditorCompany.name}`,
                );
              } else {
                console.log(
                  highlight.error(
                    `[CONTRACT ERROR] Unable to update debt due to an unknown error`,
                  ),
                );
              }
            } catch (error) {
              console.log(
                highlight.error(
                  `[COMPANY ERROR] Failed to modify debt: ${error}`,
                ),
              );
            }
          },
        });

        return createMenuPage(
          `${company.name} - Debt with ${creditorCompany.name}`,
          false,
          [createUpdateDebtAmountAction()],
          async () => {
            try {
              const contracts: IContract[] = (
                await axios.get(`${apiBaseUrl}/world/contracts`)
              ).data;
              const locations = (
                await axios.get(`${apiBaseUrl}/world/locations`)
              ).data;

              console.log(` - Amount: ${highlight.yellow(`$${debt.amount}`)}`);
              console.log(
                ` - Payment Per Tick: ${highlight.yellow(`$${debt.paymentPerTick}`)}`,
              );
              console.log(` - Reason: ${highlight.yellow(`$${debt.reason}`)}`);
            } catch (error) {
              console.log(
                highlight.error(`Failed to load company data: ${error}`),
              );
            }
          },
        );
      } catch (error) {
        logMenuError(`Failed to load companies: ${error}`);
        return false;
      }
    },
  );

  return createMenuPage(
    "Manage Companies",
    false,
    [createModifyDebtAction, createDeleteDebtAction],
    async () => {
      try {
        const companies = (await axios.get(`${apiBaseUrl}/companies`)).data;

        if (companies.length === 0) {
          logWarning(` - There are no debts available`);
          return;
        }

        console.log(`\nAvailable companies: ${companies.length}`);
        companies.forEach((c: any, i: number) => {
          const companyString = `Name: ${highlight.yellow(c.name)} | Money: ${highlight.yellow(c.money + "")}`;
          console.log(` - [${i}] ${companyString}`);
        });
      } catch (error) {
        console.log(highlight.error(`Failed to load companies: ${error}`));
      }
    },
  );
};

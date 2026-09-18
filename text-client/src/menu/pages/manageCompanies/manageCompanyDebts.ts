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
  const createAddDebtAction = (): IMenuAction => ({
    title: "Create Debt",
    type: MenuItemType.Action,
    action: async (args: string[] = []) => {
      if (args.length === 0) {
        logMenuError("You need to specify information about the debt");
        return false;
      }

      if (!args[0]) {
        logMenuError("You need to enter the name of a company");
        return false;
      }

      const creditorCompany = companies.find((c) => c.name === args[0]);

      if (!creditorCompany) {
        logMenuError(`Company  "${args[0]}" doesn't exist`);
        return false;
      }

      const amount = parseFloat(args[1]);

      if (isNaN(amount)) {
        logMenuError("The amount must be a number");
        return false;
      }

      const paymentPerTick = parseFloat(args[2]);

      if (isNaN(paymentPerTick)) {
        logMenuError("The paymentPerTick must be a number");
        return false;
      }

      if (!args[3]) {
        logMenuError("You must specify a reason for the debt");
        return false;
      }

      try {
        const response = await axios.post(
          `${apiBaseUrl}/company/${company.id}/debts/${creditorCompany.id}/create`,
          {
            amount,
            paymentPerTick,
            reason: args[3],
          },
        );

        if (response.data.success) {
          console.log(highlight.success(`Debt created`));
          console.log();

          console.log(
            ` - ${highlight.yellow(company.name)} is now $${highlight.yellow(amount)} in debt with ${creditorCompany.name}`,
          );
        } else {
          logMenuError(
            `[DEBT ERROR] Unable to create debt due to an unknown error`,
          );
          return false;
        }
      } catch (error) {
        logMenuError(`[COMPANY ERROR] Failed to create debt: ${error}`);
        return false;
      }
    },
  });

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
                    `[DEBT ERROR] Unable to update debt due to an unknown error`,
                  ),
                );
              }
            } catch (error) {
              console.log(
                highlight.error(`[DEBT ERROR] Failed to modify debt: ${error}`),
              );
            }
          },
        });

        const createUpdateDebtPaymentPerTickAction = (): IMenuAction => ({
          title: "Update Payment Per Tick",
          type: MenuItemType.Action,
          action: async (args: string[] = []) => {
            if (args.length === 0) {
              console.log(highlight.error("You need to enter an amount"));
              return false;
            }

            const paymentPerTick = parseFloat(args[0]);

            if (isNaN(paymentPerTick)) {
              logMenuError("The amount must be a number");
              return false;
            }

            try {
              const response = await axios.post(
                `${apiBaseUrl}/company/${company.id}/debts/${creditorCompany.id}/update`,
                {
                  paymentPerTick,
                },
              );

              if (response.data.success) {
                console.log(highlight.success(`Debt updated`));
                console.log();

                console.log(
                  ` - ${highlight.yellow(company.name)} will now pay $${highlight.yellow(paymentPerTick)} to ${creditorCompany.name} per tick`,
                );
              } else {
                console.log(
                  highlight.error(
                    `[DEBT ERROR] Unable to update debt due to an unknown error`,
                  ),
                );
              }
            } catch (error) {
              console.log(
                highlight.error(`[DEBT ERROR] Failed to modify debt: ${error}`),
              );
            }
          },
        });

        return createMenuPage(
          `${company.name} - Debt with ${creditorCompany.name}`,
          false,
          [
            createUpdateDebtAmountAction(),
            createUpdateDebtPaymentPerTickAction(),
          ],
          async () => {
            try {
              console.log(` - Amount: ${highlight.yellow(`$${debt.amount}`)}`);
              console.log(
                ` - Payment Per Tick: ${highlight.yellow(`$${debt.paymentPerTick}`)}`,
              );
              console.log(` - Reason: ${highlight.yellow(`$${debt.reason}`)}`);
            } catch (error) {
              console.log(
                highlight.error(`Failed to load debt data: ${error}`),
              );
            }
          },
        );
      } catch (error) {
        logMenuError(`Failed to load debt data: ${error}`);
        return false;
      }
    },
  );

  const createDeleteDebtAction = createEntitySelectorAction(
    "Delete Debt",
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

        const createConfirmDeleteDebtAction = (): IMenuAction => ({
          title: "Confirm",
          type: MenuItemType.Action,
          action: async () => {
            try {
              const response = await axios.post(
                `${apiBaseUrl}/company/${company.id}/debts/${creditorCompany.id}/delete`,
              );

              if (response.data.success) {
                console.log(highlight.success(`Debt deleted`));
                console.log();

                console.log(
                  ` - ${highlight.yellow(company.name)} is no longer in debt with ${creditorCompany.name}`,
                );
              } else {
                console.log(
                  highlight.error(
                    `[CONTRACT ERROR] Unable to delete debt due to an unknown error`,
                  ),
                );
              }
            } catch (error) {
              console.log(
                highlight.error(
                  `[COMPANY ERROR] Failed to delete debt: ${error}`,
                ),
              );
            }
          },
        });

        const createCancelDeleteDebtAction = (): IMenuAction => ({
          title: "Cancel",
          type: MenuItemType.Action,
          action: async () => {
            console.log(highlight.success(`Deletion cancelled`));
            console.log();

            console.log(
              ` - The debt between ${highlight.yellow(company.name)} and ${creditorCompany.name} was unchanged`,
            );
          },
        });

        return createMenuPage(
          `${company.name} - Delete Debt with ${creditorCompany.name}`,
          false,
          [createConfirmDeleteDebtAction(), createCancelDeleteDebtAction()],
          async () => {
            try {
              console.log(` - Amount: ${highlight.yellow(`$${debt.amount}`)}`);
              console.log(
                ` - Payment Per Tick: ${highlight.yellow(`$${debt.paymentPerTick}`)}`,
              );
              console.log(` - Reason: ${highlight.yellow(`$${debt.reason}`)}`);
            } catch (error) {
              console.log(
                highlight.error(`Failed to load debt data: ${error}`),
              );
            }
          },
        );
      } catch (error) {
        logMenuError(`Failed to load debt data: ${error}`);
        return false;
      }
    },
  );

  return createMenuPage(
    "Manage Company Debts",
    false,
    [createAddDebtAction(), createModifyDebtAction, createDeleteDebtAction],
    async () => {
      try {
        if (company.debts.length === 0) {
          logWarning(` - There are no debts available`);
          return;
        }

        console.log(`\nAvailable debts: ${companies.length}`);
        company.debts.forEach((debt, i) => {
          const creditorCompany = companies.find(
            (c) => c.id === debt.creditorCompanyId,
          );
          const amountString = `Amount: ${highlight.yellow(`$${debt.amount}`)}`;
          const creditorString = `Creditor: ${highlight.yellow(creditorCompany ? creditorCompany.name : "Unknown")}`;
          const paymentString = `Payment Per Tick: ${highlight.yellow(`$${debt.paymentPerTick}`)}`;
          const reasonString = `Reason: ${highlight.yellow(debt.reason)}`;
          console.log(
            `[0] ${amountString} | ${creditorString} | ${paymentString} | ${reasonString}`,
          );
        });
      } catch (error) {
        console.log(highlight.error(`Failed to load company debts: ${error}`));
      }
    },
  );
};

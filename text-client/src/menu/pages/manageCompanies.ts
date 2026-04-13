import axios from "axios";
import { createMenuPage, IMenuPage, logMenuError } from "../menu";
import { createEntitySelectorAction } from "../menuAction";
import { highlight, logWarning, sum } from "@logisim/lib/utils";

export const createManageCompaniesPage = (apiBaseUrl: string): IMenuPage => {
  const createViewCompanyAction = createEntitySelectorAction(
    "View Company",
    "company",
    async (companyChoiceIndex: number) => {
      try {
        const companies = (await axios.get(`${apiBaseUrl}/world/companies`))
          .data;
        const company = companies[companyChoiceIndex];

        if (!company) {
          logMenuError(`Company ${companyChoiceIndex} doesn't exist`);
          return false;
        }

        return createMenuPage(company.name, false, [], async () => {
          try {
            const contracts = (await axios.get(`${apiBaseUrl}/world/contracts`))
              .data;
            const locations = (await axios.get(`${apiBaseUrl}/world/locations`))
              .data;

            const companyContracts = contracts.filter(
              (c: any) => c.shipperId === company.id,
            );
            const totalCompanyRecievables = sum(
              companyContracts.map((c: any) => c.payment),
            );
            const totalCompanyPayables = sum(
              companyContracts.map((c: any) => {
                const supplier = locations.find(
                  (l: any) => l.id === c.supplierId,
                );
                const destination = locations.find(
                  (l: any) => l.id === c.destinationId,
                );
                const distance = Math.abs(
                  destination.position - supplier.position,
                );

                // Assuming base operating cost is around 10 per unit distance
                return distance * 10;
              }),
            );

            console.log(
              ` - Total Receivables: ${highlight.yellow(`$${totalCompanyRecievables}`)}`,
            );
            console.log(
              ` - Total Payables: ${highlight.yellow(`$${totalCompanyPayables}`)}`,
            );
            console.log(
              ` - Active Contracts: ${companyContracts.length > 0 ? "" : highlight.yellow(`None`)}`,
            );
            companyContracts.forEach((contract: any) => {
              console.log(` - Contract ${contract.id}`);
            });
          } catch (error) {
            console.log(
              highlight.error(`Failed to load company data: ${error}`),
            );
          }
        });
      } catch (error) {
        logMenuError(`Failed to load companies: ${error}`);
        return false;
      }
    },
  );

  return createMenuPage(
    "Manage Companies",
    false,
    [createViewCompanyAction],
    async () => {
      try {
        const companies = (await axios.get(`${apiBaseUrl}/world/companies`))
          .data;

        if (companies.length === 0) {
          logWarning(` - There are no companies available`);
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

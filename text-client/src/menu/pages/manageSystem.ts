import { highlight } from "@logisim/lib/utils";
import axios from "axios";
import { IMenuPage, logMenuError, createMenuPage } from "../menu";
import { ITimespans } from "@logisim/lib";

export const createManageSystemPage = (apiBaseUrl: string): IMenuPage => {
  /*const createViewCompanyAction = createEntitySelectorAction(
    "View Company",
    "company",
    async (companyChoiceIndex: number) => {
      try {
        const companies: ICompany[] = (
          await axios.get(`${apiBaseUrl}/companies`)
        ).data;
        const company = companies[companyChoiceIndex] as ICompany;

        if (!company) {
          logMenuError(`Company ${companyChoiceIndex} doesn't exist`);
          return false;
        }

        return createMenuPage(
          company.name,
          false,
          [createManageCompanyDebtsPage(apiBaseUrl, company, companies)],
          async () => {
            try {
              const contracts: IContract[] = (
                await axios.get(`${apiBaseUrl}/world/contracts`)
              ).data;
              const locations = (
                await axios.get(`${apiBaseUrl}/world/locations`)
              ).data;

              console.log(
                ` - Insolvent: ${highlight.yellow(`${company.isInsolvent ? "Yes" : "No"}`)}`,
              );
              console.log(
                ` - Liquidated: ${highlight.yellow(`${company.isLiquidated ? "Yes" : "No"}`)}`,
              );

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
                    destination.position.x - supplier.position.x,
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
                ` - Total Debts: ${highlight.yellow(`$${company.debts.map((d) => d.amount).reduce((a, c) => a + c, 0)}`)}`,
              );

              console.log(
                ` - Active Contracts: ${companyContracts.length > 0 ? "" : highlight.yellow(`None`)}`,
              );
              const contractStrings = (
                await Promise.all(
                  companyContracts.map(async ({ id }) =>
                    axios.get(`${apiBaseUrl}/contract/getString`, {
                      params: { contractId: id },
                    }),
                  ),
                )
              ).map((res) => res.data);

              contractStrings.forEach((str) => {
                console.log(`  - ${str}`);
              });

              console.log(
                ` - Active Debt Accounts: ${company.debts.length > 0 ? "" : highlight.yellow(`None`)}`,
              );
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
  );*/

  return createMenuPage("Manage System", false, [], async () => {
    try {
      const tickRateMS = (await axios.get(`${apiBaseUrl}/world/tick/rate`))
        .data;
      const timespans: ITimespans = (
        await axios.get(`${apiBaseUrl}/world/tick/timespans`)
      ).data;

      console.log(`\nSystem Tick Rate (ms): ${highlight.yellow(tickRateMS)}`);
      console.log(
        ` - Hour Length : ${highlight.yellow(timespans.hourLengthTicks)} ticks (${highlight.yellow(timespans.hourLengthMS + "ms")})`,
      );
      console.log(
        ` - Day Length : ${highlight.yellow(timespans.dayLengthTicks)} ticks (${highlight.yellow(timespans.dayLengthMS + "ms")})`,
      );
      console.log(
        ` - Week Length : ${highlight.yellow(timespans.weekLengthTicks)} ticks (${highlight.yellow(timespans.weekLengthMS + "ms")})`,
      );
      console.log(
        ` - Month Length : ${highlight.yellow(timespans.monthLengthTicks)} ticks (${highlight.yellow(timespans.monthLengthMS + "ms")}`,
      );
      console.log(
        ` - Year Length : ${highlight.yellow(timespans.yearLengthTicks)} ticks (${highlight.yellow(timespans.yearLengthMS + "ms")})`,
      );
    } catch (error) {
      console.log(highlight.error(`Failed to load system data: ${error}`));
    }
  });
};

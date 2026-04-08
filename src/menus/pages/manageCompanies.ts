import { highlight, logWarning } from "../../utils/logUtils";
import { sum } from "../../utils/mathUtils";
import { getCompanyString } from "../../world/companies";
import { loadTruckConfig } from "../../world/trucks";
import { IWorld } from "../../world/world";
import { createMenuPage, IMenuPage, logMenuError } from "../menu";
import { createEntitySelectorAction } from "../menuAction";

const truckConfig = loadTruckConfig();

export const createManageCompaniesPage = (world: IWorld): IMenuPage => {
  const companies = world.getCompanies();

  // .. TODO: create a way to view company receivables + payables, active contracts, total asset values etc
  // .. print out a company balance sheet?
  const createViewCompanyAction = createEntitySelectorAction(
    "View Company",
    "company",
    (companyChoiceIndex: number) => {
      const company = companies.find((_, i) => i === companyChoiceIndex);

      if (!company) {
        logMenuError(`Company ${companyChoiceIndex} doesn't exist`);
        return false;
      }

      return createMenuPage(company.name, false, [], () => {
        const companyContracts = world
          .getContracts()
          .filter((c) => c.shipperId === company.id);
        const totalCompanyRecievables = sum(
          companyContracts.map((c) => c.payment),
        );
        const totalCompanyPayables = sum(
          companyContracts.map((c) => {
            const supplier = world.getLocationById(c.supplierId);
            const destination = world.getLocationById(c.destinationId);
            const distance = Math.abs(destination.position - supplier.position);

            return distance * truckConfig.baseOperatingCost;
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
        ); //
        companyContracts.forEach((contract) => {
          console.log(` - ${world.getContractString(contract)}`);
        });
      });
    },
  );

  return createMenuPage(
    "Manage Companies",
    false,
    [createViewCompanyAction],
    () => {
      if (companies.length === 0) {
        logWarning(` - There are no companies available`);
        return;
      }

      console.log(`\nAvailable companies: ${companies.length}`);
      companies.forEach((c, i) => {
        console.log(` - [${i}] ${getCompanyString(c)}`);
      });
    },
  );
};

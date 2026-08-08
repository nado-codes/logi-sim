import {
  ICompany,
  IContract,
  ILocation,
  RESOURCE_TYPE,
} from "@logisim/lib/entities";
import { beforeEach, describe, expect, it } from "vitest";
import { createWorld } from "../../src/world/world";
import { Color } from "@logisim/lib/utils";
import {
  CONTRACT_BREAK_TYPE,
  CONTRACT_BREAK_FAULT,
} from "../../src/world/contracts";

describe("collectFromCompany unit tests", () => {
  let world: ReturnType<typeof createWorld>;
  let company: ICompany, debtorCompany: ICompany;
  const companyStartMoney = 1000;
  let creditorContract: IContract, supplier: ILocation, destination: ILocation;

  beforeEach(() => {
    world = createWorld();
    company = world.createCompany("Creditor Co", companyStartMoney, Color.Red, {
      isAiEnabled: true,
    });
    supplier = world.createProcessor(
      "Creditor Supplier",
      company.id,
      { x: 0, y: 0, z: 0 },
      { inputs: {}, outputs: { Grain: 0 } },
    );
    destination = world.createProcessor(
      "Creditor Destination",
      company.id,
      { x: 0, y: 0, z: 0 },
      { inputs: { Grain: 0 }, outputs: {} },
    );
    debtorCompany = world.createCompany("Debtor Inc", 0, Color.Blue, {
      isAiEnabled: true,
    });
    creditorContract = world.createContract(
      company.id,
      destination.id,
      supplier.id,
      RESOURCE_TYPE.Grain,
      1,
      1,
    );
    creditorContract.payment = 1;
  });

  it("should create a contract", () => {
    debtorCompany.money = 1;
    world.assignContractToCompany(creditorContract, debtorCompany);
    world.breakContract(
      creditorContract,
      CONTRACT_BREAK_TYPE.Breach,
      CONTRACT_BREAK_FAULT.Shipper,
    );

    expect(debtorCompany.money).equals(0);
    expect(debtorCompany.isInsolvent).equals(false);
    expect(company.money).equals(1);
  });
});

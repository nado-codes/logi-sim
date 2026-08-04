import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/utils/configUtils", () => ({
  loadConfig: (_name: string, defaults: unknown) => defaults,
}));

vi.mock("../../src/utils/fileUtils", () => ({
  loadJSON: (_name: string, defaults: unknown) => defaults,
}));

import {
  CONTRACT_BREAK_FAULT,
  CONTRACT_BREAK_TYPE,
} from "../../src/world/contracts";
import {
  ICompany,
  IContract,
  ILocation,
  Pos3DZero,
  RESOURCE_TYPE,
} from "@logisim/lib/entities";
import { createWorld } from "../../src/world/world";
import { Color } from "@logisim/lib/utils";

describe("collectFromCompany unit tests", () => {
  let world: ReturnType<typeof createWorld>;
  let creditorCompany: ICompany, debtorCompany: ICompany;
  let creditorContract: IContract, supplier: ILocation, destination: ILocation;

  beforeEach(() => {
    world = createWorld();
    creditorCompany = world.createCompany("Creditor Co", 0, Color.Red, {
      isAiEnabled: true,
    });
    supplier = world.createProcessor(
      "Creditor Supplier",
      creditorCompany.id,
      { x: 0, y: 0, z: 0 },
      { inputs: {}, outputs: { Grain: 0 } },
    );
    destination = world.createProcessor(
      "Creditor Destination",
      creditorCompany.id,
      { x: 0, y: 0, z: 0 },
      { inputs: { Grain: 0 }, outputs: {} },
    );
    debtorCompany = world.createCompany("Debtor Inc", 0, Color.Blue, {
      isAiEnabled: true,
    });
    creditorContract = world.createContract(
      creditorCompany.id,
      destination.id,
      supplier.id,
      RESOURCE_TYPE.Grain,
      1,
      1,
    );
    creditorContract.payment = 1;
  });

  /*
  1. Full payment — debtor can afford it. Company has $100K, penalty is $50K. After collection: debtor has $50K, creditor received $50K, no debt entry created, isInsolvent 
  stays false. This is the happy path — confirms that collectFromCompany behaves identically to a normal transferCompanyFunds when the debtor is solvent.
  */
  it("should recover the full amount from the debtor company, because they can afford it", () => {
    debtorCompany.money = 1;
    world.assignContractToCompany(creditorContract, debtorCompany);
    world.breakContract(
      creditorContract,
      CONTRACT_BREAK_TYPE.Breach,
      CONTRACT_BREAK_FAULT.Shipper,
    );

    expect(debtorCompany.money).equals(0);
    expect(debtorCompany.isInsolvent).equals(false);
    expect(creditorCompany.money).equals(1);
  });

  /*
  2. Partial payment — debtor can't cover the full amount. Company has $30K, penalty is $80K. After collection: debtor has -$50K, creditor received $30K (what was available), 
  one debt entry exists for $50K with the correct creditorCompanyId and reason, isInsolvent is true.
  */
  it("should collect some funds from the debtor company and then set up a debt entry", () => {
    creditorContract.payment = 2;
    debtorCompany.money = 1;
    world.assignContractToCompany(creditorContract, debtorCompany);
    world.breakContract(
      creditorContract,
      CONTRACT_BREAK_TYPE.Breach,
      CONTRACT_BREAK_FAULT.Shipper,
    );

    expect(debtorCompany.money).equals(0);
    expect(debtorCompany.isInsolvent).equals(true);

    const debtEntry = debtorCompany.debts.find(
      (d) => d.creditorCompanyId === creditorCompany.id,
    );
    expect(debtEntry).toBeDefined();
    expect(debtEntry?.amount).equals(1);

    expect(creditorCompany.money).equals(1);
  });

  /*
  3. Multiple debts to same creditor — amounts aggregate. Company already has an existing debt of $40K to Creditor A. A new $30K penalty comes in from Creditor A. After 
  collection: the existing debt entry's amount is $70K, not two separate entries. Confirms the deduplication logic on creditorCompanyId.
  */
  it("should aggregate multiple debts to the same creditor under one entry", () => {
    const secondContract = world.createContract(
      creditorCompany.id,
      destination.id,
      supplier.id,
      RESOURCE_TYPE.Grain,
      1,
      1,
    );
    secondContract.payment = 1;

    world.assignContractToCompany(creditorContract, debtorCompany);
    world.assignContractToCompany(secondContract, debtorCompany);
    world.breakContract(
      creditorContract,
      CONTRACT_BREAK_TYPE.Breach,
      CONTRACT_BREAK_FAULT.Shipper,
    );
    world.breakContract(
      secondContract,
      CONTRACT_BREAK_TYPE.Breach,
      CONTRACT_BREAK_FAULT.Shipper,
    );

    const debtEntry = debtorCompany.debts.find(
      (d) => d.creditorCompanyId === creditorCompany.id,
    );
    expect(debtEntry).toBeDefined();
    expect(debtEntry?.amount).equals(2);
  });
  /*
  4. AI auto-resolve — assets repossessed to cover debt. AI company has $0, owns two trucks worth $1K each, penalty is $1.5K. After collection: one truck's companyId has 
  changed to the creditor, amountLeftToPay reduced by that truck's value, second truck still belongs to debtor (only enough assets sold to cover the debt). Confirms the 
  sorted-by-value iteration stops once the debt is covered, and that repossessAsset actually transfers ownership.
  */
  it("should automatically reposess assets to resolve company debts if possible", () => {
    debtorCompany.money = 0;
    world.createTruckFromItemId("truck-flour", debtorCompany.id, Pos3DZero);

    world.assignContractToCompany(creditorContract, debtorCompany);
    world.breakContract(
      creditorContract,
      CONTRACT_BREAK_TYPE.Breach,
      CONTRACT_BREAK_FAULT.Shipper,
    );

    expect(debtorCompany.debts.length).toEqual(0);
    expect(debtorCompany.money).toEqual(999);
    expect(creditorCompany.money).toEqual(1);
  });

  /*
  5. AI auto-resolve — if asset values cannot account for the debts that a company has, it should be liquidated
  */
  it.todo(
    "should trigger liquidation if the sum of a debtor company's capital and asset values cannot pay back their debts",
    () => {
      debtorCompany.money = 0;

      const secondContract = world.createContract(
        creditorCompany.id,
        destination.id,
        supplier.id,
        RESOURCE_TYPE.Grain,
        1,
        1,
      );
      secondContract.payment = 1;

      world.assignContractToCompany(creditorContract, debtorCompany);
      world.assignContractToCompany(secondContract, debtorCompany);
      world.breakContract(
        creditorContract,
        CONTRACT_BREAK_TYPE.Breach,
        CONTRACT_BREAK_FAULT.Shipper,
      );
      world.breakContract(
        secondContract,
        CONTRACT_BREAK_TYPE.Breach,
        CONTRACT_BREAK_FAULT.Shipper,
      );

      // .. TODO: liquidation hasn't actually been implemented yet
      // .. also, liquidated companies should distribute assets between creditors
      // .. check the LS Dev claude chat for how to implement this
    },
  );
});

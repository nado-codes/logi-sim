import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/utils/configUtils", () => ({
  loadConfig: (_name: string, defaults: unknown) => defaults,
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
    creditorCompany = world.createCompany("Creditor Co", 100000, Color.Red);
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
    debtorCompany = world.createCompany("Debtor Inc", 100000, Color.Blue);
    creditorContract = world.createContract(
      creditorCompany.id,
      destination.id,
      supplier.id,
      RESOURCE_TYPE.Grain,
      1,
      1,
    );
    creditorContract.payment = 100;
  });

  /*
  1. Full payment — debtor can afford it. Company has $100K, penalty is $50K. After collection: debtor has $50K, creditor received $50K, no debt entry created, isInsolvent 
  stays false. This is the happy path — confirms that collectFromCompany behaves identically to a normal transferCompanyFunds when the debtor is solvent.
  */
  it("should recover the full amount from the debtor company, because they can afford it", () => {
    world.assignContractToCompany(creditorContract, debtorCompany);
    world.breakContract(
      creditorContract,
      CONTRACT_BREAK_TYPE.Breach,
      CONTRACT_BREAK_FAULT.Shipper,
    );

    expect(debtorCompany.money).equals(99900);
    expect(debtorCompany.isInsolvent).equals(false);
    expect(creditorCompany.money).equals(100100);
  });

  /*
  2. Partial payment — debtor can't cover the full amount. Company has $30K, penalty is $80K. After collection: debtor has -$50K, creditor received $30K (what was available), 
  one debt entry exists for $50K with the correct creditorCompanyId and reason, isInsolvent is true.
  */
  it("should collect some funds from the debtor company and then set up a debt entry", () => {
    const location = world.createLocationFromItemId(
      "location-bakery",
      "company-1",
      Pos3DZero,
    );
    expect(location.recipe.inputs).toEqual({ [RESOURCE_TYPE.Flour]: 800 });
    expect(location.recipe.outputs).toEqual({ [RESOURCE_TYPE.Bread]: 600 });
  });

  /*
  3. Zero funds — debtor is completely broke. Company has $0, penalty is $60K. After collection: debtor has -$60K, creditor received nothing, debt entry exists for the full $60K, 
  isInsolvent is true. Edge case confirming the system doesn't break when there's literally nothing to transfer.
  */
  it("shouldn't collect any funds from the debtor company because they are completely broke, and create a debt entry", () => {});
  /*
  4. Multiple debts to same creditor — amounts aggregate. Company already has an existing debt of $40K to Creditor A. A new $30K penalty comes in from Creditor A. After 
  collection: the existing debt entry's amount is $70K, not two separate entries. Confirms the deduplication logic on creditorCompanyId.
  */
  it("should aggregate multiple debts to the same creditor under one entry", () => {});
  /*
  5. AI auto-resolve — assets repossessed to cover debt. AI company has $0, owns two trucks worth $1K each, penalty is $1.5K. After collection: one truck's companyId has 
  changed to the creditor, amountLeftToPay reduced by that truck's value, second truck still belongs to debtor (only enough assets sold to cover the debt). Confirms the 
  sorted-by-value iteration stops once the debt is covered, and that repossessAsset actually transfers ownership.
  */
  it("should automatically reposess assets to resolve company debts if possible", () => {});

  /*
  5. AI auto-resolve — assets repossessed to cover debt. AI company has $0, owns two trucks worth $1K each, penalty is $1.5K. After collection: one truck's companyId has 
  changed to the creditor, amountLeftToPay reduced by that truck's value, second truck still belongs to debtor (only enough assets sold to cover the debt). Confirms the 
  sorted-by-value iteration stops once the debt is covered, and that repossessAsset actually transfers ownership.
  */
  it("should trigger liquidation if the sum of a debtor company's capital and asset values cannot pay back their debts", () => {});
});

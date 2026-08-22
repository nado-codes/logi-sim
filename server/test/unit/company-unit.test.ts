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
  RESOURCE_TYPE,
} from "@logisim/lib/entities";
import { createWorld } from "../../src/world/world";
import { Color } from "@logisim/lib/utils";
import { processCompanyDebts } from "../../src/world/companies";
import { loadConfig } from "../../src/utils/configUtils";

const setupBaseWorld = () => {
  const creditorCompanyStartMoney = 0;

  const world = createWorld();
  const creditorCompany = world.createCompany(
    "Creditor Co",
    creditorCompanyStartMoney,
    Color.Red,
    {
      isAiEnabled: true,
    },
  );
  const supplier = world.createProcessor(
    "Creditor Supplier",
    creditorCompany.id,
    { x: 0, y: 0, z: 0 },
    { inputs: {}, outputs: { Grain: 0 } },
  );
  const destination = world.createProcessor(
    "Creditor Destination",
    creditorCompany.id,
    { x: 0, y: 0, z: 0 },
    { inputs: { Grain: 0 }, outputs: {} },
  );

  const creditorContract = world.createContract(
    creditorCompany.id,
    destination.id,
    supplier.id,
    RESOURCE_TYPE.Grain,
    1,
    1,
  );
  creditorContract.payment = 1;

  return { world, creditorCompany, creditorContract, supplier, destination };
};

describe("processCompanyDebt unit tests", () => {
  let world: ReturnType<typeof createWorld>;
  let creditorCompany: ICompany, debtorCompany: ICompany;
  let creditorContract: IContract, supplier: ILocation, destination: ILocation;

  beforeEach(() => {
    const data = setupBaseWorld();
    world = data.world;
    creditorCompany = data.creditorCompany;
    creditorContract = data.creditorContract;
    supplier = data.supplier;
    destination = data.destination;
    debtorCompany = world.createCompany("Debtor Inc", 0, Color.Blue, {
      isAiEnabled: true,
    });

    /*world.assignContractToCompany(creditorContract, debtorCompany);
    world.breakContract(
      creditorContract,
      CONTRACT_BREAK_TYPE.Breach,
      CONTRACT_BREAK_FAULT.Shipper,
    );*/
  });

  it("should reduce the debt amount and transfer funds to the creditor", () => {
    const startingDebtAmount = 100;
    debtorCompany.money = 100;
    const startingCreditorMoney = creditorCompany.money;

    const debtEntry = {
      creditorCompanyId: creditorCompany.id,
      amount: startingDebtAmount,
      paymentPerTick: 10,
      reason: "Test Debt",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntry);
    const creditors = [creditorCompany];

    processCompanyDebts(debtorCompany, creditors, []);

    expect(debtorCompany.isLiquidated).toBeFalsy();
    expect(debtorCompany.isInsolvent).toBeFalsy();
    expect(debtorCompany.insolvencyCounter).toEqual(0);
    expect(debtEntry.amount).toEqual(
      startingDebtAmount - debtEntry.paymentPerTick,
    );
    expect(creditorCompany.money).toEqual(
      startingCreditorMoney + debtEntry.paymentPerTick,
    );
  });

  it("should remove the debt entry when the debt is fully paid", () => {
    debtorCompany.money = 10;

    const debtEntry = {
      creditorCompanyId: creditorCompany.id,
      amount: 10,
      paymentPerTick: 10,
      reason: "Test Debt",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntry);

    processCompanyDebts(debtorCompany, [creditorCompany], []);

    const finalDebtEntry = debtorCompany.debts.find(
      (d) => d.creditorCompanyId === creditorCompany.id,
    );
    expect(finalDebtEntry).toBeUndefined();
  });

  it("should reset the insolvency counter when the debtor has no more debts", () => {
    debtorCompany.insolvencyCounter = 2;
    debtorCompany.money = 10;

    const debtEntry = {
      creditorCompanyId: creditorCompany.id,
      amount: 10,
      paymentPerTick: 10,
      reason: "Test Debt",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntry);

    processCompanyDebts(debtorCompany, [creditorCompany], []);

    expect(debtorCompany.insolvencyCounter).toEqual(0);
  });

  it("should fail to collect funds from the debtor and increase the insolvency counter", () => {
    const debtEntry = {
      creditorCompanyId: creditorCompany.id,
      amount: 10,
      paymentPerTick: 10,
      reason: "Test Debt",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntry);
    debtorCompany.money = 0;

    processCompanyDebts(debtorCompany, [creditorCompany], []);

    expect(debtorCompany.insolvencyCounter).toEqual(1);
  });

  it("should succeed in collecting funds from the debtor and reduce the insolvency counter", () => {
    const debtEntry = {
      creditorCompanyId: creditorCompany.id,
      amount: 20,
      paymentPerTick: 10,
      reason: "Test Debt",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntry);
    debtorCompany.insolvencyCounter = 2;
    debtorCompany.money = 10;

    processCompanyDebts(debtorCompany, [creditorCompany], []);

    expect(debtorCompany.insolvencyCounter).toEqual(1);
  });

  it("should mark the debtor as solvent when the insolvency counter is reset", () => {
    const debtEntry = {
      creditorCompanyId: creditorCompany.id,
      amount: 10,
      paymentPerTick: 10,
      reason: "Test Debt",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntry);
    debtorCompany.insolvencyCounter = 1;
    debtorCompany.money = 10;

    processCompanyDebts(debtorCompany, [creditorCompany], []);

    expect(debtorCompany.insolvencyCounter).toEqual(0);
  });

  it("should liquidate the debtor company when the insolvency counter reaches the threshold", () => {
    const companyConfig = loadConfig("company", {
      insolvencyThreshold: 3,
    });
    const debtEntry = {
      creditorCompanyId: creditorCompany.id,
      amount: 10,
      paymentPerTick: 10,
      reason: "Test Debt",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntry);
    debtorCompany.money = 0;
    debtorCompany.insolvencyCounter = companyConfig.insolvencyThreshold;

    world.update();

    expect(debtorCompany.isLiquidated).toBeTruthy();
  });
});

describe("collectFromCompany unit tests", () => {
  let world: ReturnType<typeof createWorld>;
  let creditorCompany: ICompany, debtorCompany: ICompany;
  let creditorContract: IContract, supplier: ILocation, destination: ILocation;

  beforeEach(() => {
    const data = setupBaseWorld();
    world = data.world;
    creditorCompany = data.creditorCompany;
    creditorContract = data.creditorContract;
    supplier = data.supplier;
    destination = data.destination;

    debtorCompany = world.createCompany("Debtor Inc", 0, Color.Blue, {
      isAiEnabled: true,
    });
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
});

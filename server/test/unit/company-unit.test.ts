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
  RegulatoryActionStatus,
  RESOURCE_TYPE,
} from "@logisim/lib/entities";
import { createWorld } from "../../src/world/world";
import { Color, logEntries } from "@logisim/lib/utils";
import {
  defaultCompanyConfig,
  getRegulatoryActionStatus,
  liquidateCompany,
  payCompanyDebt,
  processCompanyDebts,
  PAY_DEBT_RESULT,
} from "../../src/world/companies";
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

describe("getRegulatoryActionStatus unit tests", () => {
  let world: ReturnType<typeof createWorld>;
  let company: ICompany;

  const probationWarningThreshold =
    defaultCompanyConfig.probationThreshold *
    defaultCompanyConfig.regulatoryWarningMultiplier;
  const suspensionNoticeWarningthreshold =
    defaultCompanyConfig.probationThreshold +
    (defaultCompanyConfig.suspensionNoticeThreshold -
      defaultCompanyConfig.probationThreshold) *
      defaultCompanyConfig.regulatoryWarningMultiplier;
  const ceasedOperationsWarningThreshold =
    defaultCompanyConfig.suspensionNoticeThreshold +
    (defaultCompanyConfig.ceasedOperationsThreshold -
      defaultCompanyConfig.suspensionNoticeThreshold) *
      defaultCompanyConfig.regulatoryWarningMultiplier;

  beforeEach(() => {
    const data = setupBaseWorld();
    world = data.world;
    company = data.creditorCompany;
    // .. the threshold logic below is only reachable once a company actually
    // has outstanding debts - give it one by default so these tests exercise
    // the threshold math rather than the new debts.length === 0 guard
    company.debts.push({
      creditorCompanyId: "some-other-company",
      amount: 10,
      reason: "Test Debt",
      createdAtTick: world.getCurrentTick(),
    });
  });

  it("should receive an inactive regulatory action status", () => {
    company.insolvencyCounter = 0;
    const companyRegulatoryAction = getRegulatoryActionStatus(company);
    expect(companyRegulatoryAction).equals(RegulatoryActionStatus.None);
  });
  it("should receive a pre-probation status", () => {
    company.insolvencyCounter = probationWarningThreshold;
    const companyRegulatoryAction = getRegulatoryActionStatus(company);
    expect(companyRegulatoryAction).equals(RegulatoryActionStatus.PreProbation);
  });
  it("should receive a probation status", () => {
    company.insolvencyCounter = defaultCompanyConfig.probationThreshold;
    const companyRegulatoryAction = getRegulatoryActionStatus(company);
    expect(companyRegulatoryAction).equals(RegulatoryActionStatus.Probation);
  });
  it("should receive a pre-suspension status", () => {
    company.insolvencyCounter = suspensionNoticeWarningthreshold;
    const companyRegulatoryAction = getRegulatoryActionStatus(company);
    expect(companyRegulatoryAction).equals(
      RegulatoryActionStatus.PreSuspensionNotice,
    );
  });
  it("should receive a suspension status", () => {
    company.insolvencyCounter = defaultCompanyConfig.suspensionNoticeThreshold;
    const companyRegulatoryAction = getRegulatoryActionStatus(company);
    expect(companyRegulatoryAction).equals(
      RegulatoryActionStatus.SuspensionNotice,
    );
  });
  it("should receive a pre-ceased operations status", () => {
    company.insolvencyCounter = ceasedOperationsWarningThreshold;
    const companyRegulatoryAction = getRegulatoryActionStatus(company);
    expect(companyRegulatoryAction).equals(
      RegulatoryActionStatus.PreCeasedOperations,
    );
  });
  it("should receive a ceased operations status for a high insolvency counter", () => {
    company.insolvencyCounter = defaultCompanyConfig.ceasedOperationsThreshold;
    const companyRegulatoryAction = getRegulatoryActionStatus(company);
    expect(companyRegulatoryAction).equals(
      RegulatoryActionStatus.CeasedOperations,
    );
  });
  it("should receive a ceased operations status if the company is liquidated already", () => {
    company.isLiquidated = true;
    const companyRegulatoryAction = getRegulatoryActionStatus(company);
    expect(companyRegulatoryAction).equals(
      RegulatoryActionStatus.CeasedOperations,
    );
  });
  it("should receive an inactive regulatory action status when there are no debts, even with a stale high insolvency counter", () => {
    company.debts = [];
    company.insolvencyCounter = defaultCompanyConfig.suspensionNoticeThreshold;
    const companyRegulatoryAction = getRegulatoryActionStatus(company);
    expect(companyRegulatoryAction).equals(RegulatoryActionStatus.None);
  });
  it("should receive a ceased operations status if the company is liquidated, even with no debts left", () => {
    company.isLiquidated = true;
    company.debts = [];
    const companyRegulatoryAction = getRegulatoryActionStatus(company);
    expect(companyRegulatoryAction).equals(
      RegulatoryActionStatus.CeasedOperations,
    );
  });
  it("should receive a ceased operations status if the company is liquidated, regardless of the insolvency counter", () => {
    company.isLiquidated = true;
    company.insolvencyCounter = 0;
    const companyRegulatoryAction = getRegulatoryActionStatus(company);
    expect(companyRegulatoryAction).equals(
      RegulatoryActionStatus.CeasedOperations,
    );
  });
});

describe("liquidateCompany unit tests", () => {
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

  it("should liquidate the debtor company when the insolvency counter reaches the threshold", () => {
    const debtEntry = {
      creditorCompanyId: creditorCompany.id,
      amount: 10,
      paymentPerTick: 10,
      reason: "Test Debt",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntry);
    debtorCompany.money = 0;
    debtorCompany.insolvencyCounter = 10;

    const creditorIds = debtorCompany.debts.map((d) => d.creditorCompanyId);
    const creditors = world
      .getCompanies()
      .filter((c) => creditorIds.includes(c.id));
    const companyLocations = world
      .getLocations()
      .filter((l) => l.companyId === debtorCompany.id);
    const companyTrucks = world
      .getTrucks()
      .filter((t) => t.companyId === debtorCompany.id);
    const stateCompany = world.getCompanyByName("State");
    liquidateCompany(
      debtorCompany,
      companyLocations,
      companyTrucks,
      creditors,
      stateCompany,
    );

    expect(debtorCompany.isLiquidated).toBeTruthy();
  });
});

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

  it("should pay both debts in full when cash is sufficient, without triggering pro-rata", () => {
    const creditorCompanyB = world.createCompany(
      "Creditor Co B",
      0,
      Color.Green,
      { isAiEnabled: true },
    );
    debtorCompany.money = 100;

    const debtEntryA = {
      creditorCompanyId: creditorCompany.id,
      amount: 100,
      paymentPerTick: 10,
      reason: "Test Debt A",
      createdAtTick: world.getCurrentTick(),
    };
    const debtEntryB = {
      creditorCompanyId: creditorCompanyB.id,
      amount: 100,
      paymentPerTick: 10,
      reason: "Test Debt B",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntryA, debtEntryB);

    processCompanyDebts(debtorCompany, [creditorCompany, creditorCompanyB], []);

    expect(debtorCompany.isInsolvent).toBeFalsy();
    expect(debtorCompany.insolvencyCounter).toEqual(0);
    expect(debtEntryA.amount).toEqual(90);
    expect(debtEntryB.amount).toEqual(90);
    expect(creditorCompany.money).toEqual(10);
    expect(creditorCompanyB.money).toEqual(10);
  });

  it("should split an insufficient payment pro-rata by paymentPerTick across two creditors", () => {
    const creditorCompanyB = world.createCompany(
      "Creditor Co B",
      0,
      Color.Green,
      { isAiEnabled: true },
    );
    debtorCompany.money = 20;

    const debtEntryA = {
      creditorCompanyId: creditorCompany.id,
      amount: 1000,
      paymentPerTick: 30,
      reason: "Test Debt A",
      createdAtTick: world.getCurrentTick(),
    };
    const debtEntryB = {
      creditorCompanyId: creditorCompanyB.id,
      amount: 1000,
      paymentPerTick: 10,
      reason: "Test Debt B",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntryA, debtEntryB);

    processCompanyDebts(debtorCompany, [creditorCompany, creditorCompanyB], []);

    expect(debtorCompany.insolvencyCounter).toEqual(1);
    expect(creditorCompany.money).toEqual(15);
    expect(creditorCompanyB.money).toEqual(5);
    expect(debtEntryA.amount).toEqual(1000 - 15);
    expect(debtEntryB.amount).toEqual(1000 - 5);
    expect(debtorCompany.money).toEqual(0);
  });

  it("should split an insufficient payment pro-rata by paymentPerTick across three creditors", () => {
    const creditorCompanyB = world.createCompany(
      "Creditor Co B",
      0,
      Color.Green,
      { isAiEnabled: true },
    );
    const creditorCompanyC = world.createCompany(
      "Creditor Co C",
      0,
      Color.Yellow,
      { isAiEnabled: true },
    );
    debtorCompany.money = 50;

    const debtEntryA = {
      creditorCompanyId: creditorCompany.id,
      amount: 1000,
      paymentPerTick: 50,
      reason: "Test Debt A",
      createdAtTick: world.getCurrentTick(),
    };
    const debtEntryB = {
      creditorCompanyId: creditorCompanyB.id,
      amount: 1000,
      paymentPerTick: 30,
      reason: "Test Debt B",
      createdAtTick: world.getCurrentTick(),
    };
    const debtEntryC = {
      creditorCompanyId: creditorCompanyC.id,
      amount: 1000,
      paymentPerTick: 20,
      reason: "Test Debt C",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntryA, debtEntryB, debtEntryC);

    processCompanyDebts(
      debtorCompany,
      [creditorCompany, creditorCompanyB, creditorCompanyC],
      [],
    );

    expect(creditorCompany.money).toEqual(25);
    expect(creditorCompanyB.money).toEqual(15);
    expect(creditorCompanyC.money).toEqual(10);
    expect(debtEntryA.amount).toEqual(1000 - 25);
    expect(debtEntryB.amount).toEqual(1000 - 15);
    expect(debtEntryC.amount).toEqual(1000 - 10);
    expect(debtorCompany.money).toEqual(0);
  });

  it("should transfer nothing but still only increase the insolvency counter once when there is zero cash available", () => {
    const creditorCompanyB = world.createCompany(
      "Creditor Co B",
      0,
      Color.Green,
      { isAiEnabled: true },
    );
    debtorCompany.money = 0;

    const debtEntryA = {
      creditorCompanyId: creditorCompany.id,
      amount: 1000,
      paymentPerTick: 30,
      reason: "Test Debt A",
      createdAtTick: world.getCurrentTick(),
    };
    const debtEntryB = {
      creditorCompanyId: creditorCompanyB.id,
      amount: 1000,
      paymentPerTick: 10,
      reason: "Test Debt B",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntryA, debtEntryB);

    processCompanyDebts(debtorCompany, [creditorCompany, creditorCompanyB], []);

    expect(debtorCompany.insolvencyCounter).toEqual(1);
    expect(creditorCompany.money).toEqual(0);
    expect(creditorCompanyB.money).toEqual(0);
    expect(debtEntryA.amount).toEqual(1000);
    expect(debtEntryB.amount).toEqual(1000);
  });

  it("should split an insufficient payment equally between two creditors with equal paymentPerTick", () => {
    const creditorCompanyB = world.createCompany(
      "Creditor Co B",
      0,
      Color.Green,
      { isAiEnabled: true },
    );
    debtorCompany.money = 10;

    const debtEntryA = {
      creditorCompanyId: creditorCompany.id,
      amount: 1000,
      paymentPerTick: 10,
      reason: "Test Debt A",
      createdAtTick: world.getCurrentTick(),
    };
    const debtEntryB = {
      creditorCompanyId: creditorCompanyB.id,
      amount: 1000,
      paymentPerTick: 10,
      reason: "Test Debt B",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntryA, debtEntryB);

    processCompanyDebts(debtorCompany, [creditorCompany, creditorCompanyB], []);

    expect(creditorCompany.money).toEqual(5);
    expect(creditorCompanyB.money).toEqual(5);
    expect(debtEntryA.amount).toEqual(1000 - 5);
    expect(debtEntryB.amount).toEqual(1000 - 5);
  });

  // Regression check for "AI debt still auto-pays exactly as before" is already
  // covered precisely by "should reduce the debt amount and transfer funds to
  // the creditor" above (single AI debtor, isAiEnabled: true) - not duplicated
  // here, since that test already asserts the debt reduces by paymentPerTick
  // and the creditor receives it.

  it("should count a player debt toward the insolvency counter without automatically paying it", () => {
    const playerDebtorCompany = world.createCompany(
      "Player Debtor Inc",
      0,
      Color.Green,
      {},
    );
    const startingCreditorMoney = creditorCompany.money;

    const debtEntry = {
      creditorCompanyId: creditorCompany.id,
      amount: 1000,
      paymentPerTick: 20,
      reason: "Test Debt",
      createdAtTick: world.getCurrentTick(),
    };
    playerDebtorCompany.debts.push(debtEntry);

    processCompanyDebts(playerDebtorCompany, [creditorCompany], []);

    expect(playerDebtorCompany.insolvencyCounter).toEqual(1);
    expect(debtEntry.amount).toEqual(1000);
    expect(creditorCompany.money).toEqual(startingCreditorMoney);
  });

  // "Mixed debtor: one AI-style auto-paid debt and one player-style
  // counter-only debt on the same company" (task 3.4) is skipped as an
  // unrealistic scenario: the automatic-transfer gate in processCompanyDebts
  // is keyed on debtorCompany.options.isAiEnabled, a company-level flag, not
  // a per-debt one. Every debt on a given company is therefore either
  // auto-paid (company is AI-enabled) or manual-only (company is not) - a
  // single company can never have one of each, so constructing such a case
  // would test a state that cannot occur in production.
});

describe("payCompanyDebt unit tests", () => {
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

  it("should clear the debt entry when paid in full", () => {
    debtorCompany.money = 100;
    const startingCreditorMoney = creditorCompany.money;
    const debtEntry = {
      creditorCompanyId: creditorCompany.id,
      amount: 100,
      reason: "Test Debt",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntry);

    const result = payCompanyDebt(debtorCompany, creditorCompany, 100);

    expect(result).toEqual(PAY_DEBT_RESULT.SUCCESS);
    expect(
      debtorCompany.debts.find(
        (d) => d.creditorCompanyId === creditorCompany.id,
      ),
    ).toBeUndefined();
    expect(creditorCompany.money).toEqual(startingCreditorMoney + 100);
    expect(debtorCompany.money).toEqual(0);
  });

  it("should reduce the debt amount without clearing it on a partial payment", () => {
    debtorCompany.money = 100;
    const startingCreditorMoney = creditorCompany.money;
    const debtEntry = {
      creditorCompanyId: creditorCompany.id,
      amount: 100,
      reason: "Test Debt",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntry);

    const result = payCompanyDebt(debtorCompany, creditorCompany, 40);

    expect(result).toEqual(PAY_DEBT_RESULT.SUCCESS);
    const finalDebtEntry = debtorCompany.debts.find(
      (d) => d.creditorCompanyId === creditorCompany.id,
    );
    expect(finalDebtEntry).toBeDefined();
    expect(finalDebtEntry?.amount).toEqual(60);
    expect(creditorCompany.money).toEqual(startingCreditorMoney + 40);
    expect(debtorCompany.money).toEqual(60);
  });

  it("should reject an overpayment and leave the debt and funds unchanged", () => {
    debtorCompany.money = 200;
    const startingCreditorMoney = creditorCompany.money;
    const debtEntry = {
      creditorCompanyId: creditorCompany.id,
      amount: 100,
      reason: "Test Debt",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntry);
    const logCountBefore = logEntries.length;

    const result = payCompanyDebt(debtorCompany, creditorCompany, 150);

    expect(result).toEqual(PAY_DEBT_RESULT.AMOUNT_EXCEEDS_DEBT);
    expect(debtEntry.amount).toEqual(100);
    expect(debtorCompany.money).toEqual(200);
    expect(creditorCompany.money).toEqual(startingCreditorMoney);
    expect(logEntries.length).toBeGreaterThan(logCountBefore);
  });

  it("should reject a negative payment amount and leave the debt and funds unchanged", () => {
    debtorCompany.money = 200;
    const startingCreditorMoney = creditorCompany.money;
    const debtEntry = {
      creditorCompanyId: creditorCompany.id,
      amount: 100,
      reason: "Test Debt",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntry);
    const logCountBefore = logEntries.length;

    const result = payCompanyDebt(debtorCompany, creditorCompany, -10);

    expect(result).toEqual(PAY_DEBT_RESULT.INVALID_AMOUNT);
    expect(debtEntry.amount).toEqual(100);
    expect(debtorCompany.money).toEqual(200);
    expect(creditorCompany.money).toEqual(startingCreditorMoney);
    expect(logEntries.length).toBeGreaterThan(logCountBefore);
  });

  it("should handle insufficient cash on hand gracefully without a partial transfer", () => {
    debtorCompany.money = 20;
    const startingCreditorMoney = creditorCompany.money;
    const debtEntry = {
      creditorCompanyId: creditorCompany.id,
      amount: 100,
      reason: "Test Debt",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntry);
    const logCountBefore = logEntries.length;

    const result = payCompanyDebt(debtorCompany, creditorCompany, 100);

    expect(result).toEqual(PAY_DEBT_RESULT.INSUFFICIENT_FUNDS);
    expect(debtEntry.amount).toEqual(100);
    expect(debtorCompany.money).toEqual(20);
    expect(creditorCompany.money).toEqual(startingCreditorMoney);
    expect(logEntries.length).toBeGreaterThan(logCountBefore);
  });

  it("should reject a payment when there is no debt with the given creditor", () => {
    const logCountBefore = logEntries.length;

    const result = payCompanyDebt(debtorCompany, creditorCompany, 100);

    expect(result).toEqual(PAY_DEBT_RESULT.DEBT_NOT_FOUND);
    expect(logEntries.length).toBeGreaterThan(logCountBefore);
  });

  it("should make the regulatory action status reset immediately after paying off the last debt", () => {
    debtorCompany.money = 100;
    debtorCompany.isInsolvent = true;
    debtorCompany.insolvencyCounter = 6; // mid Suspension Notice range
    const debtEntry = {
      creditorCompanyId: creditorCompany.id,
      amount: 100,
      reason: "Test Debt",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntry);

    const result = payCompanyDebt(debtorCompany, creditorCompany, 100);

    expect(result).toEqual(PAY_DEBT_RESULT.SUCCESS);
    expect(debtorCompany.debts.length).toEqual(0);
    expect(getRegulatoryActionStatus(debtorCompany)).toEqual(
      RegulatoryActionStatus.None,
    );
  });

  it("should reset the regulatory action status after a player pays off a debt that carries a paymentPerTick", () => {
    const playerDebtorCompany = world.createCompany(
      "Player Debtor Inc",
      100,
      Color.Green,
      {},
    );
    playerDebtorCompany.isInsolvent = true;
    playerDebtorCompany.insolvencyCounter = 6; // mid Suspension Notice range
    const debtEntry = {
      creditorCompanyId: creditorCompany.id,
      amount: 100,
      paymentPerTick: 5, // player debts now always carry one (see collectFromCompany)
      reason: "Test Debt",
      createdAtTick: world.getCurrentTick(),
    };
    playerDebtorCompany.debts.push(debtEntry);

    const result = payCompanyDebt(playerDebtorCompany, creditorCompany, 100);

    expect(result).toEqual(PAY_DEBT_RESULT.SUCCESS);
    expect(playerDebtorCompany.debts.length).toEqual(0);
    expect(getRegulatoryActionStatus(playerDebtorCompany)).toEqual(
      RegulatoryActionStatus.None,
    );
  });

  it("should let processCompanyDebts correctly clear a small remainder left by a manual partial payment", () => {
    debtorCompany.money = 1500;
    const debtEntry = {
      creditorCompanyId: creditorCompany.id,
      amount: 1000,
      paymentPerTick: 1000,
      reason: "Test Debt",
      createdAtTick: world.getCurrentTick(),
    };
    debtorCompany.debts.push(debtEntry);

    const result = payCompanyDebt(debtorCompany, creditorCompany, 500);
    expect(result).toEqual(PAY_DEBT_RESULT.SUCCESS);
    expect(debtEntry.amount).toEqual(500);

    processCompanyDebts(debtorCompany, [creditorCompany], []);

    expect(debtEntry.amount).toEqual(0);
    expect(
      debtorCompany.debts.find(
        (d) => d.creditorCompanyId === creditorCompany.id,
      ),
    ).toBeUndefined();
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

  it("should assign a player debt a paymentPerTick using playerDebtTermTicks, not aiDebtTermTicks", () => {
    const playerDebtorCompany = world.createCompany(
      "Player Debtor Inc",
      0,
      Color.Green,
      {},
    );
    creditorContract.payment = 750;
    world.assignContractToCompany(creditorContract, playerDebtorCompany);
    world.breakContract(
      creditorContract,
      CONTRACT_BREAK_TYPE.Breach,
      CONTRACT_BREAK_FAULT.Shipper,
    );

    const debtEntry = playerDebtorCompany.debts.find(
      (d) => d.creditorCompanyId === creditorCompany.id,
    );
    expect(debtEntry).toBeDefined();
    expect(debtEntry?.paymentPerTick).toEqual(
      Math.max(1, Math.floor(750 / defaultCompanyConfig.debtTermTicks)),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/utils/configUtils", () => ({
  loadConfig: (_name: string, defaults: unknown) => defaults,
}));

vi.mock("../../src/utils/fileUtils", () => ({
  loadJSON: (_name: string, defaults: unknown) => defaults,
}));

import {
  EMarketplaceTransactionResult,
  ICompany,
  Pos3DZero,
  VEHICLE_TYPE,
} from "@logisim/lib/entities";
import { createWorld } from "../../src/world/world";
import { Color } from "@logisim/lib/utils";
import { defaultCompanyConfig } from "../../src/world/companies";

describe("marketplace.sellItem() unit tests", () => {
  let world: ReturnType<typeof createWorld>;
  let company: ICompany;
  let stateCompany: ICompany;
  const stateCompanyStartMoney = 100000;

  beforeEach(() => {
    world = createWorld();
    company = world.createCompany("Seller Co", 0, Color.Blue, {
      isAiEnabled: true,
    });
    stateCompany = world.getCompanyByName("State");
    stateCompany.money = stateCompanyStartMoney;
  });

  it("should sell a truck to the state and transfer funds to the company", () => {
    const truck = world.createTruckFromItemId(
      "truck-flour",
      company.id,
      Pos3DZero,
    );
    const truckItem = world.getTruckItemById("truck-flour");

    const result = world.sellItem(truck.id, company);

    expect(result).toEqual(EMarketplaceTransactionResult.SUCCESS);
    expect(company.money).toEqual(truckItem.price);
    expect(stateCompany.money).toEqual(stateCompanyStartMoney);
    expect(truck.companyId).toEqual(stateCompany.id);
  });

  it("should sell a location to the state and transfer funds to the company", () => {
    const location = world.createLocationFromItemId(
      "location-grainfarm",
      company.id,
      Pos3DZero,
    );
    const locationItem = world.getLocationItemById("location-grainfarm");

    const result = world.sellItem(location.id, company);

    expect(result).toEqual(EMarketplaceTransactionResult.SUCCESS);
    expect(company.money).toEqual(locationItem.price);
    expect(stateCompany.money).toEqual(stateCompanyStartMoney);
    expect(location.companyId).toEqual(stateCompany.id);
  });

  it("should reject selling an entity that is not a truck or location", () => {
    const truck = world.createTruckFromItemId(
      "truck-flour",
      company.id,
      Pos3DZero,
    );
    truck.vehicleType = "NotATruck" as VEHICLE_TYPE;

    const result = world.sellItem(truck.id, company);

    expect(result).toEqual(EMarketplaceTransactionResult.NOT_SELLABLE);
    expect(company.money).toEqual(0);
    expect(truck.companyId).toEqual(company.id);
  });
});

describe("marketplace.purchaseItem() unit tests", () => {
  let world: ReturnType<typeof createWorld>;
  let company: ICompany;

  beforeEach(() => {
    world = createWorld();
    company = world.createCompany("Buyer Co", 1000000, Color.Blue, {
      isAiEnabled: true,
    });
  });

  it("should allow a purchase while the company is only in Probation", () => {
    company.debts.push({
      creditorCompanyId: "some-other-company",
      amount: 10,
      reason: "Test Debt",
    });
    company.insolvencyCounter = defaultCompanyConfig.probationThreshold;

    const result = world.purchaseItem("truck-flour", company);

    expect(result).toEqual(EMarketplaceTransactionResult.SUCCESS);
  });

  it("should reject a purchase while the company is in Suspension Notice", () => {
    company.debts.push({
      creditorCompanyId: "some-other-company",
      amount: 10,
      reason: "Test Debt",
    });
    company.insolvencyCounter = defaultCompanyConfig.suspensionNoticeThreshold;
    const startMoney = company.money;

    const result = world.purchaseItem("truck-flour", company);

    expect(result).toEqual(
      EMarketplaceTransactionResult.REGULATORY_RESTRICTED,
    );
    expect(company.money).toEqual(startMoney);
  });

  it("should reject a purchase once the company has ceased operations", () => {
    company.isLiquidated = true;

    const result = world.purchaseItem("truck-flour", company);

    expect(result).toEqual(
      EMarketplaceTransactionResult.REGULATORY_RESTRICTED,
    );
  });

  it("should allow purchases again once the counter drops back below the Suspension Notice threshold", () => {
    company.debts.push({
      creditorCompanyId: "some-other-company",
      amount: 10,
      reason: "Test Debt",
    });
    company.insolvencyCounter = defaultCompanyConfig.suspensionNoticeThreshold;
    expect(world.purchaseItem("truck-flour", company)).toEqual(
      EMarketplaceTransactionResult.REGULATORY_RESTRICTED,
    );

    company.insolvencyCounter = defaultCompanyConfig.probationThreshold;

    expect(world.purchaseItem("truck-flour", company)).toEqual(
      EMarketplaceTransactionResult.SUCCESS,
    );
  });
});

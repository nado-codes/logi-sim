import {
  CONTRACT_BREAK_FAULT,
  CONTRACT_BREAK_TYPE,
} from "../../src/world/contracts";
import {
  ICompany,
  IContract,
  ILocation,
  ITruck,
  Pos3DZero,
  RESOURCE_TYPE,
} from "@logisim/lib/entities";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createWorld } from "../../src/world/world";
import { Color } from "@logisim/lib/utils";

vi.mock("../../src/utils/configUtils", () => ({
  loadConfig: (_name: string, defaults: unknown) => defaults,
}));

vi.mock("../../src/utils/fileUtils", () => ({
  loadJSON: (_name: string, defaults: unknown) => defaults,
}));

describe("contract unit tests", () => {
  let world: ReturnType<typeof createWorld>;
  let company: ICompany, debtorCompany: ICompany;
  const companyStartMoney = 1000;
  let supplier: ILocation, destination: ILocation;

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
  });

  it("should create a contract", () => {
    const contract = world.createContract(
      company.id,
      destination.id,
      supplier.id,
      RESOURCE_TYPE.Grain,
      1,
      1,
    );

    expect(contract).toBeDefined();
    expect(contract.companyId).toEqual(company.id);
    expect(contract.destinationId).toEqual(destination.id);
    expect(contract.supplierId).toEqual(supplier.id);
    expect(contract.resourceType).toEqual(RESOURCE_TYPE.Grain);
    expect(contract.totalAmount).toEqual(1);
    expect(contract.payment).toEqual(10);
    expect(contract.expectedTick).toBe(world.getCurrentTick() + 1);
  });

  it("should get the contract by id or null", () => {
    const contract = world.createContract(
      company.id,
      destination.id,
      supplier.id,
      RESOURCE_TYPE.Grain,
      1,
      1,
    );
    const fetchedContract = world.getContractByIdOrNull(contract.id);
    const nullContract = world.getContractByIdOrNull("non-existent-id");

    expect(fetchedContract).toBeDefined();
    expect(nullContract).toBeUndefined();
  });

  it("should get the contract by destination id or null", () => {
    world.createContract(
      company.id,
      destination.id,
      supplier.id,
      RESOURCE_TYPE.Grain,
      1,
      1,
    );
    const fetchedContract = world.getContractByDestinationIdOrNull(
      destination.id,
    );
    const nullContract =
      world.getContractByDestinationIdOrNull("non-existent-id");

    expect(fetchedContract).toBeDefined();
    expect(fetchedContract?.destinationId).toEqual(destination.id);
    expect(nullContract).toBeUndefined();
  });

  it("should get the contract by resource type and destination id", () => {
    world.createContract(
      company.id,
      destination.id,
      supplier.id,
      RESOURCE_TYPE.Grain,
      1,
      1,
    );
    const fetchedContract = world.getContractByDestinationIdResourceType(
      destination.id,
      RESOURCE_TYPE.Grain,
    );
    const nullContract = world.getContractByDestinationIdResourceType(
      "non-existent-id",
      RESOURCE_TYPE.Grain,
    );

    expect(fetchedContract).toBeDefined();
    expect(fetchedContract?.destinationId).toEqual(destination.id);
    expect(fetchedContract?.resourceType).toEqual(RESOURCE_TYPE.Grain);
    expect(nullContract).toBeUndefined();
  });

  it("should fail to create a contract when the supplier does not provide the requested resource", () => {
    const badSupplier = world.createProcessor(
      "Bad Supplier",
      company.id,
      { x: 1, y: 0, z: 0 },
      { inputs: {}, outputs: {} },
    );

    expect(() =>
      world.createContract(
        company.id,
        destination.id,
        badSupplier.id,
        RESOURCE_TYPE.Grain,
        1,
        1,
      ),
    ).toThrow();
  });

  it("should fail to create a contract when the destination does not accept the resource", () => {
    const badDestination = world.createProcessor(
      "Bad Destination",
      company.id,
      { x: 1, y: 0, z: 0 },
      { inputs: {}, outputs: {} },
    );

    expect(() =>
      world.createContract(
        company.id,
        badDestination.id,
        supplier.id,
        RESOURCE_TYPE.Grain,
        1,
        1,
      ),
    ).toThrow();
  });

  it("should return a readable contract string", () => {
    const contract = world.createContract(
      company.id,
      destination.id,
      supplier.id,
      RESOURCE_TYPE.Grain,
      1,
      1,
    );

    const contractString = world.getContractString(contract);

    expect(contractString).toContain(company.name);
    expect(contractString).toContain(supplier.name);
    expect(contractString).toContain(destination.name);
    expect(contractString).toContain("1 Grain");
  });

  it("should assign a contract to a company and reject reassignment", () => {
    const contract = world.createContract(
      company.id,
      destination.id,
      supplier.id,
      RESOURCE_TYPE.Grain,
      1,
      1,
    );
    const shipper = world.createCompany("Shipper Co", 0, Color.Blue, {
      isAiEnabled: true,
    });

    const firstAssignment = world.assignContractToCompany(contract, shipper);
    const secondAssignment = world.assignContractToCompany(
      contract,
      world.createCompany("Other Co", 0, Color.Green, {
        isAiEnabled: true,
      }),
    );

    expect(firstAssignment).toBe(true);
    expect(contract.shipperId).toEqual(shipper.id);
    expect(secondAssignment).toBe(false);
  });

  it("should assign a compatible truck to a contract and reject incompatible trucks", () => {
    const contract = world.createContract(
      company.id,
      destination.id,
      supplier.id,
      RESOURCE_TYPE.Grain,
      1,
      1,
    );
    const shipper = world.createCompany("Truck Co", 0, Color.Blue, {
      isAiEnabled: true,
    });
    const goodTruck = world.createTruck(
      "Grain Truck",
      shipper.id,
      RESOURCE_TYPE.Grain,
      10,
      { x: 0, y: 0, z: 0 },
      1,
    );
    const badTruck = world.createTruck(
      "Flour Truck",
      shipper.id,
      RESOURCE_TYPE.Flour,
      10,
      { x: 0, y: 0, z: 0 },
      1,
    );

    expect(world.assignContractToTruck(contract, goodTruck)).toBe(true);
    expect(contract.truckId).toEqual(goodTruck.id);
    expect(contract.shipperId).toEqual(shipper.id);
    expect(world.assignContractToTruck(contract, badTruck)).toBe(false);
  });

  /*it("should not complete a contract without delivery and should complete it once delivered", () => {
    const shipper = world.createCompany("Shipper Co", 0, Color.Blue, {
      isAiEnabled: true,
    });
    const contract = world.createContract(
      company.id,
      destination.id,
      supplier.id,
      RESOURCE_TYPE.Grain,
      1,
      1,
    );
    const truck = world.createTruck(
      "Grain Truck",
      shipper.id,
      RESOURCE_TYPE.Grain,
      10,
      { x: 0, y: 0, z: 0 },
      1,
    );

    world.assignContractToTruck(contract, truck);

    expect(world.completeContract(contract)).toBe(false);

    contract.deliveredAmount = 1;
    const result = world.completeContract(contract);

    expect(result).toBe(true);
    expect(world.getContractByIdOrNull(contract.id)).toBeUndefined();
    expect(shipper.money).toEqual(contract.payment);
  });*/

  it("should archive an expired contract with no shipper when the world updates", () => {
    const contract = world.createContract(
      company.id,
      destination.id,
      supplier.id,
      RESOURCE_TYPE.Grain,
      1,
      0,
    );

    world.update();

    expect(world.getContractByIdOrNull(contract.id)).toBeUndefined();
  });

  it("should break an expired contract assigned to a shipper when the world updates", () => {
    const shipper = world.createCompany("Shipper Co", 0, Color.Blue, {
      isAiEnabled: true,
    });
    const contract = world.createContract(
      company.id,
      destination.id,
      supplier.id,
      RESOURCE_TYPE.Grain,
      1,
      0,
    );

    world.assignContractToCompany(contract, shipper);
    world.update();

    expect(world.getContractByIdOrNull(contract.id)).toBeUndefined();
    expect(shipper.money).toEqual(-contract.payment);
  });

  it("should cancel a contract assigned to a truck and keep it open", () => {
    const shipper = world.createCompany("Shipper Co", 0, Color.Blue, {
      isAiEnabled: true,
    });
    const contract = world.createContract(
      company.id,
      destination.id,
      supplier.id,
      RESOURCE_TYPE.Grain,
      1,
      1,
    );
    const truck = world.createTruck(
      "Grain Truck",
      shipper.id,
      RESOURCE_TYPE.Grain,
      10,
      { x: 0, y: 0, z: 0 },
      1,
    );

    world.assignContractToTruck(contract, truck);
    world.breakContract(
      contract,
      CONTRACT_BREAK_TYPE.Cancellation,
      CONTRACT_BREAK_FAULT.Shipper,
    );

    expect(contract.shipperId).toBeUndefined();
    expect(contract.truckId).toBeUndefined();
    expect(contract.acceptedAtTick).toBeUndefined();
    expect(world.getContractByIdOrNull(contract.id)).toBeDefined();
  });

  it("should reassign the supplier when a contract is cancelled due to supplier failure", () => {
    const alternateSupplier = world.createProcessor(
      "Alternate Supplier",
      company.id,
      { x: 1, y: 0, z: 0 },
      { inputs: {}, outputs: { Grain: 0 } },
    );
    const contract = world.createContract(
      company.id,
      destination.id,
      supplier.id,
      RESOURCE_TYPE.Grain,
      1,
      1,
    );

    world.breakContract(
      contract,
      CONTRACT_BREAK_TYPE.Cancellation,
      CONTRACT_BREAK_FAULT.Supplier,
    );

    expect(contract.supplierId).toEqual(alternateSupplier.id);
    expect(world.getContractByIdOrNull(contract.id)).toBeDefined();
  });

  it("should archive a contract when the destination causes a cancellation", () => {
    const contract = world.createContract(
      company.id,
      destination.id,
      supplier.id,
      RESOURCE_TYPE.Grain,
      1,
      1,
    );

    world.breakContract(
      contract,
      CONTRACT_BREAK_TYPE.Cancellation,
      CONTRACT_BREAK_FAULT.Destination,
    );

    expect(world.getContractByIdOrNull(contract.id)).toBeUndefined();
  });

  it("should breach a contract assigned to a shipper and apply the penalty", () => {
    const shipper = world.createCompany("Shipper Co", 0, Color.Blue, {
      isAiEnabled: true,
    });
    const contract = world.createContract(
      company.id,
      destination.id,
      supplier.id,
      RESOURCE_TYPE.Grain,
      1,
      1,
    );
    const truck = world.createTruck(
      "Grain Truck",
      shipper.id,
      RESOURCE_TYPE.Grain,
      10,
      { x: 0, y: 0, z: 0 },
      1,
    );

    world.assignContractToTruck(contract, truck);
    world.breakContract(
      contract,
      CONTRACT_BREAK_TYPE.Breach,
      CONTRACT_BREAK_FAULT.Shipper,
    );

    expect(world.getContractByIdOrNull(contract.id)).toBeUndefined();
    expect(shipper.money).toEqual(-contract.payment);
    expect(company.money).toEqual(companyStartMoney + contract.payment);
    expect(truck.contractId).toBeUndefined();
  });
});

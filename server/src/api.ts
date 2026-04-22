import express from "express";
import { IWorld } from "./world/world";
import {
  transferCompanyFundsToState,
  transferCompanyFundsFromState,
} from "./world/companies";
import { ITown, LOCATION_TYPE } from "@logisim/lib/entities";

export const logisimApi = (world: IWorld) => {
  const app = express();
  app.use(express.json());

  const start = () => {
    // GET /api/state — Read the current world snapshot
    // Useful for a future web UI to poll and render the map

    // WORLD
    app.get("/api/world/tick", (req, res) => {
      res.send(world.getCurrentTick());
    });

    app.get("/api/world/map", (req, res) => {
      res.send(world.getMap());
    });

    //MISC
    app.get("/api/world/contracts", (req, res) => {
      res.send(world.getContracts());
    });

    app.get("/api/world/trucks", (req, res) => {
      res.send(world.getTrucks());
    });

    app.get("/api/world/locations", (req, res) => {
      res.send(world.getLocations());
    });

    app.post("/api/advanceTick", (req, res) => {
      world.advanceTick();
      res.send();
    });

    // COMPANIES

    app.get("/api/companies", (req, res) => {
      res.send(world.getCompanies());
    });

    app.get<{ name: string }>("/api/company/name/:name", (req, res) => {
      res.send(world.getCompanyByName(req.params.name));
    });

    app.get<{ id: string }>("/api/company/id/:id", (req, res) => {
      res.send(world.getCompanyById(req.params.id));
    });

    // TRUCKS
    app.get<{ id: string }>("/api/truck/id/:id", (req, res) => {
      try {
        res.send(world.getTruckById(req.params.id));
      } catch (error) {
        res.status(404).send({ error: "Truck not found" });
      }
    });

    app.post("/api/truck/create", (req, res) => {
      try {
        const {
          name,
          companyId,
          resourceType,
          resourceCapacity,
          position,
          speed,
          resourceCount,
        } = req.body;
        world.createTruck(
          name,
          companyId,
          resourceType,
          resourceCapacity,
          position,
          speed,
          resourceCount,
        );
        res.send({ success: true });
      } catch (error) {
        res.status(400).send({ error: "Failed to create truck" });
      }
    });

    app.post("/api/truck/delete", (req, res) => {
      try {
        const { truckId } = req.body;
        const truck = world.getTruckById(truckId);
        world.deleteTruck(truck);
        res.send({ success: true });
      } catch (error) {
        res.status(400).send({ error: "Failed to delete truck" });
      }
    });

    app.post("/api/truck/buy", (req, res) => {
      try {
        const { companyId, resourceType } = req.body;
        const { name, speed, capacity } = req.body;
        world.createTruck(
          name || `Truck ${Math.random().toString(36).substr(2, 9)}`,
          companyId,
          resourceType,
          capacity || 100,
          { x: 0, y: 0, z: 0 },
          speed || 2,
        );
        res.send({ success: true });
      } catch (error) {
        res.status(400).send({ error: "Failed to create truck" });
      }
    });

    app.post("/api/truck/sell", (req, res) => {
      try {
        const { truckId } = req.body;
        const truck = world.getTruckById(truckId);
        world.deleteTruck(truck);
        res.send({ success: true });
      } catch (error) {
        res.status(400).send({ error: "Failed to sell truck" });
      }
    });

    // CONTRACTS
    app.get("/api/contract/getString", (req, res) => {
      try {
        const { contractId } = req.query;
        const contract = world.getContractByIdOrNull(contractId as string);

        if (!contract) {
          res.status(404).send({ error: "Contract not found" });
          return;
        }

        res.send(world.getContractString(contract));
      } catch (error) {
        res.status(400).send({ error: "Failed to get contract string" });
      }
    });
    app.post("/api/contract/assign", (req, res) => {
      try {
        const { contractId, truckId } = req.body;
        const contract = world.getContractByIdOrNull(contractId);
        const truck = world.getTruckById(truckId);

        if (!contract) {
          res.status(404).send({ error: "Contract not found" });
          return;
        }

        const result = world.assignContract(contract, truck);
        res.send({ success: result });
      } catch (error) {
        res.status(400).send({ error: "Failed to assign contract" });
      }
    });

    // LOCATIONS
    app.get<{ id: string }>("/api/location/id/:id", (req, res) => {
      try {
        res.send(world.getLocationById(req.params.id));
      } catch (error) {
        res.status(404).send({ error: "Location not found" });
      }
    });

    app.post("/api/location/create-producer", (req, res) => {
      try {
        const {
          name,
          companyId,
          position,
          resourceType,
          productionRate,
          startFull,
        } = req.body;
        world.createProducer(
          name,
          companyId,
          position,
          resourceType,
          productionRate,
          startFull,
        );
        res.send({ success: true });
      } catch (error) {
        res.status(400).send({ error: "Failed to create producer" });
      }
    });

    app.post("/api/location/create-processor", (req, res) => {
      try {
        const {
          name,
          companyId,
          position,
          recipe,
          startWithFullInputs,
          startWithFullOutputs,
        } = req.body;
        world.createProcessor(
          name,
          companyId,
          position,
          recipe,
          startWithFullInputs,
          startWithFullOutputs,
        );
        res.send({ success: true });
      } catch (error) {
        res.status(400).send({ error: "Failed to create processor" });
      }
    });

    app.post("/api/location/delete", (req, res) => {
      try {
        const { locationId } = req.body;
        const location = world.getLocationById(locationId);
        world.deleteLocation(location);
        res.send({ success: true });
      } catch (error) {
        res.status(400).send({ error: "Failed to delete location" });
      }
    });

    app.post("/api/town/reseed", (req, res) => {
      try {
        const { locationId } = req.body;
        const location = world.getLocationById(locationId);

        if (location.locationType !== LOCATION_TYPE.Town) {
          res.status(400).send({ error: "Location is not a town" });
          return;
        }

        world.reseedTown(location as ITown);
        res.send({ success: true });
      } catch (error) {
        const err = error as Error;
        res
          .status(400)
          .send({ error: `Failed to reseed town: ${err.message}` });
      }
    });

    // COMPANY OPERATIONS
    app.post("/api/company/transfer-to-state", (req, res) => {
      try {
        const { companyId, amount } = req.body;
        const company = world.getCompanyById(companyId);
        const result = transferCompanyFundsToState(company, amount);
        res.send({ success: result === 0 }); // 0 = SUCCESS
      } catch (error) {
        res.status(400).send({ error: "Failed to transfer funds" });
      }
    });

    app.post("/api/company/transfer-from-state", (req, res) => {
      try {
        const { companyId, amount } = req.body;
        const company = world.getCompanyById(companyId);
        transferCompanyFundsFromState(company, amount);
        res.send({ success: true });
      } catch (error) {
        res.status(400).send({ error: "Failed to transfer funds" });
      }
    });

    const PORT = process.env.PORT || 3001;

    app.listen(PORT, () => {
      console.log(`LogiSim API running on http://localhost:${PORT}`);
    });
  };

  return {
    start,
  };
};

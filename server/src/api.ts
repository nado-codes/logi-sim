import express from "express";
import { IWorld } from "./world/world";

export const logisimApi = (world: IWorld) => {
  const app = express();
  app.use(express.json());

  const start = () => {
    // GET /api/state — Read the current world snapshot
    // Useful for a future web UI to poll and render the map
    app.get("/api/test", (req, res) => {
      res.send("Hello, world!");
    });

    app.get<{ name: string }>("/api/company/name/:name", (req, res) => {
      res.send(world.getCompanyByName(req.params.name));
    });

    app.get<{ id: string }>("/api/company/id/:id", (req, res) => {
      res.send(world.getCompanyById(req.params.id));
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

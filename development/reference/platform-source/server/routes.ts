import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/overview/stats", async (_req, res) => {
    try {
      const stats = await storage.getOverviewStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/overview/activities", async (_req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/projects", async (_req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const { name, description, domain, target_market } = req.body;
      if (!name) return res.status(400).json({ message: "Name is required" });
      const user = await storage.getDefaultUser();
      const project = await storage.createProject({ name, description, domain, target_market, owner_id: user.id });
      res.json(project);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/ideas", async (_req, res) => {
    try {
      const ideas = await storage.getIdeas();
      res.json(ideas);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/ideas", async (req, res) => {
    try {
      const { project_id, title, summary, problem_statement, solution_statement, target_users, value_proposition } = req.body;
      if (!project_id || !title || !summary) return res.status(400).json({ message: "project_id, title, and summary are required" });
      const idea = await storage.createIdea({ project_id, title, summary, problem_statement, solution_statement, target_users, value_proposition });
      res.json(idea);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/evaluations", async (_req, res) => {
    try {
      const evaluations = await storage.getEvaluations();
      res.json(evaluations);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/prototypes", async (_req, res) => {
    try {
      const prototypes = await storage.getPrototypes();
      res.json(prototypes);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/agent-templates", async (_req, res) => {
    try {
      const templates = await storage.getAgentTemplates();
      res.json(templates);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/populations", async (_req, res) => {
    try {
      const populations = await storage.getPopulations();
      res.json(populations);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/scenarios", async (_req, res) => {
    try {
      const scenarios = await storage.getScenarios();
      res.json(scenarios);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/simulations", async (_req, res) => {
    try {
      const runs = await storage.getSimulationRuns();
      res.json(runs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/simulations/run", async (req, res) => {
    try {
      const { scenario_id } = req.body;
      if (!scenario_id) return res.status(400).json({ message: "scenario_id is required" });
      const run = await storage.runSimulation(scenario_id);
      res.json(run);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/validation", async (_req, res) => {
    try {
      const results = await storage.getValidationResults();
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/viability", async (_req, res) => {
    try {
      const results = await storage.getViabilityResults();
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/investors", async (_req, res) => {
    try {
      const investors = await storage.getInvestors();
      res.json(investors);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/matches", async (_req, res) => {
    try {
      const matches = await storage.getMatches();
      res.json(matches);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/reports", async (_req, res) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/graph/entities", async (_req, res) => {
    try {
      const entities = await storage.getGraphEntities();
      res.json(entities);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/graph/edges", async (_req, res) => {
    try {
      const edges = await storage.getGraphEdges();
      res.json(edges);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/users", async (_req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  return httpServer;
}

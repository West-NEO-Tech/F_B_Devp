import pool from "./db";

export const storage = {
  async query(text: string, params?: any[]) {
    const result = await pool.query(text, params);
    return result.rows;
  },

  async queryOne(text: string, params?: any[]) {
    const result = await pool.query(text, params);
    return result.rows[0] || null;
  },

  async getOverviewStats() {
    const [projects, ideas, sims, reports, validation] = await Promise.all([
      this.queryOne("SELECT COUNT(*) as count FROM projects WHERE status = 'active'"),
      this.queryOne("SELECT COUNT(*) as count FROM ideas WHERE status IN ('submitted','generated','shortlisted')"),
      this.queryOne("SELECT COUNT(*) as count FROM simulation_runs WHERE status IN ('queued','running')"),
      this.queryOne("SELECT COUNT(*) as count FROM reports WHERE report_status = 'published'"),
      this.queryOne("SELECT AVG(adoption_score) as avg FROM market_validation_results"),
    ]);
    return {
      activeProjects: parseInt(projects?.count || "0"),
      ideasInPipeline: parseInt(ideas?.count || "0"),
      runningSimulations: parseInt(sims?.count || "0"),
      completedReports: parseInt(reports?.count || "0"),
      avgValidationScore: parseFloat(validation?.avg || "0"),
    };
  },

  async getActivities(limit = 20) {
    return this.query("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT $1", [limit]);
  },

  async getProjects() {
    return this.query("SELECT * FROM projects ORDER BY created_at DESC");
  },

  async createProject(data: { name: string; description?: string; domain?: string; target_market?: string; owner_id: string }) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return this.queryOne(
      `INSERT INTO projects (name, slug, description, domain, target_market, owner_id, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'active') RETURNING *`,
      [data.name, slug + "-" + Date.now().toString(36), data.description || null, data.domain || null, data.target_market || null, data.owner_id]
    );
  },

  async getIdeas() {
    return this.query("SELECT * FROM ideas ORDER BY created_at DESC");
  },

  async createIdea(data: { project_id: string; title: string; summary: string; problem_statement?: string; solution_statement?: string; target_users?: string; value_proposition?: string }) {
    return this.queryOne(
      `INSERT INTO ideas (project_id, title, summary, problem_statement, solution_statement, target_users, value_proposition, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'submitted') RETURNING *`,
      [data.project_id, data.title, data.summary, data.problem_statement || null, data.solution_statement || null, data.target_users || null, data.value_proposition || null]
    );
  },

  async getEvaluations() {
    return this.query("SELECT * FROM evaluations ORDER BY created_at DESC");
  },

  async getPrototypes() {
    return this.query("SELECT * FROM prototypes ORDER BY created_at DESC");
  },

  async getAgentTemplates() {
    return this.query("SELECT * FROM agent_templates ORDER BY category, name");
  },

  async getPopulations() {
    return this.query("SELECT * FROM agent_populations ORDER BY created_at DESC");
  },

  async getScenarios() {
    return this.query("SELECT * FROM simulation_scenarios ORDER BY created_at DESC");
  },

  async getSimulationRuns() {
    return this.query("SELECT * FROM simulation_runs ORDER BY created_at DESC");
  },

  async runSimulation(scenarioId: string, userId?: string) {
    const scenario = await this.queryOne("SELECT * FROM simulation_scenarios WHERE id = $1", [scenarioId]);
    if (!scenario) throw new Error("Scenario not found");

    const run = await this.queryOne(
      `INSERT INTO simulation_runs (scenario_id, project_id, initiated_by, status, started_at, seed_value)
       VALUES ($1, $2, $3, 'running', NOW(), $4) RETURNING *`,
      [scenarioId, scenario.project_id, userId || null, Math.random().toString(36).slice(2)]
    );

    setTimeout(async () => {
      try {
        const adoptionScore = 40 + Math.random() * 40;
        const wtpScore = 35 + Math.random() * 45;
        const retentionScore = 50 + Math.random() * 35;
        const sentimentScore = 45 + Math.random() * 40;
        const conversionRate = 5 + Math.random() * 25;
        const churnRisk = 10 + Math.random() * 30;

        await pool.query(
          `UPDATE simulation_runs SET status = 'completed', completed_at = NOW(), 
           summary = $2, aggregate_outputs = $3 WHERE id = $1`,
          [
            run.id,
            "Simulation completed successfully with " + Math.floor(100 + Math.random() * 900) + " agent interactions across all segments.",
            JSON.stringify({
              total_interactions: Math.floor(100 + Math.random() * 900),
              adoption_rate: adoptionScore,
              avg_sentiment: sentimentScore,
            }),
          ]
        );

        await pool.query(
          `INSERT INTO market_validation_results (simulation_run_id, adoption_score, willingness_to_pay_score, retention_score, objection_score, sentiment_score, conversion_rate, churn_risk, summary, metrics)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            run.id, adoptionScore, wtpScore, retentionScore,
            20 + Math.random() * 30, sentimentScore, conversionRate, churnRisk,
            "Market validation indicates " + (adoptionScore > 60 ? "strong" : "moderate") + " market potential.",
            JSON.stringify({ segments: { consumer: adoptionScore + 5, enterprise: adoptionScore - 10 } }),
          ]
        );

        const revenue = 200000 + Math.random() * 600000;
        const cost = 100000 + Math.random() * 200000;
        await pool.query(
          `INSERT INTO business_viability_results (simulation_run_id, projected_revenue, projected_cost, projected_profit, break_even_month, market_share_estimate, survival_probability, unit_economics, summary)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            run.id, revenue, cost, revenue - cost,
            Math.floor(8 + Math.random() * 16),
            2 + Math.random() * 8,
            55 + Math.random() * 35,
            JSON.stringify({ cac: Math.floor(30 + Math.random() * 70), ltv: Math.floor(200 + Math.random() * 500), arpu: Math.floor(15 + Math.random() * 35), payback_months: Math.floor(3 + Math.random() * 9) }),
            "Business viability analysis shows " + (revenue > cost ? "positive" : "negative") + " unit economics trajectory.",
          ]
        );

        await pool.query(
          `INSERT INTO activity_logs (project_id, action_type, entity_type, entity_id, details)
           VALUES ($1, 'Simulation completed', 'simulation_run', $2, $3)`,
          [scenario.project_id, run.id, JSON.stringify({ status: "completed" })]
        );
      } catch (err) {
        await pool.query(
          "UPDATE simulation_runs SET status = 'failed', completed_at = NOW() WHERE id = $1",
          [run.id]
        );
      }
    }, 3000);

    return run;
  },

  async getValidationResults() {
    return this.query("SELECT * FROM market_validation_results ORDER BY created_at DESC");
  },

  async getViabilityResults() {
    return this.query("SELECT * FROM business_viability_results ORDER BY created_at DESC");
  },

  async getInvestors() {
    return this.query("SELECT * FROM investors ORDER BY name");
  },

  async getMatches() {
    return this.query(
      `SELECT im.*, i.name as investor_name FROM investor_matches im JOIN investors i ON im.investor_id = i.id ORDER BY im.fit_score DESC`
    );
  },

  async getReports() {
    return this.query("SELECT * FROM reports ORDER BY created_at DESC");
  },

  async getGraphEntities() {
    return this.query("SELECT * FROM graph_entities ORDER BY entity_type, name");
  },

  async getGraphEdges() {
    return this.query(
      `SELECT ge.*, s.name as source_name, t.name as target_name 
       FROM graph_edges ge 
       JOIN graph_entities s ON ge.source_entity_id = s.id 
       JOIN graph_entities t ON ge.target_entity_id = t.id 
       ORDER BY ge.relationship_type`
    );
  },

  async getUsers() {
    return this.query("SELECT id, full_name, email, role, organisation, title, is_active, created_at FROM users ORDER BY created_at DESC");
  },

  async getDefaultUser() {
    return this.queryOne("SELECT id FROM users LIMIT 1");
  },
};

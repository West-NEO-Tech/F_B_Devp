export interface User {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: 'researcher' | 'innovator' | 'industry_partner' | 'investor_viewer' | 'admin';
  organisation: string | null;
  title: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  domain: string | null;
  target_market: string | null;
  status: 'draft' | 'active' | 'in_review' | 'validated' | 'archived';
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Idea {
  id: string;
  project_id: string;
  title: string;
  summary: string;
  problem_statement: string | null;
  solution_statement: string | null;
  target_users: string | null;
  value_proposition: string | null;
  source_type: string | null;
  source_reference: string | null;
  status: 'submitted' | 'generated' | 'shortlisted' | 'rejected' | 'approved';
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Evaluation {
  id: string;
  idea_id: string;
  evaluator_type: string;
  evaluator_name: string | null;
  novelty_score: number | null;
  feasibility_score: number | null;
  market_potential_score: number | null;
  risk_score: number | null;
  readiness_score: number | null;
  overall_score: number | null;
  rationale: string | null;
  evidence: Record<string, any>;
  created_at: string;
}

export interface Prototype {
  id: string;
  project_id: string;
  idea_id: string | null;
  name: string;
  description: string | null;
  architecture_summary: string | null;
  feature_backlog: any[];
  api_plan: any[];
  data_model_plan: any[];
  status: 'not_started' | 'planned' | 'in_progress' | 'generated' | 'deployed' | 'failed';
  repo_url: string | null;
  deployment_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  category: 'consumer' | 'enterprise_buyer' | 'investor' | 'competitor' | 'supplier' | 'regulator' | 'technical_expert' | 'mentor';
  description: string | null;
  target_segment: string | null;
  prompt_profile: string | null;
  persona_attributes: Record<string, any>;
  economic_attributes: Record<string, any>;
  decision_parameters: Record<string, any>;
  memory_settings: Record<string, any>;
  behavior_model: Record<string, any>;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentPopulation {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  total_agents: number;
  distribution: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SimulationScenario {
  id: string;
  project_id: string;
  prototype_id: string | null;
  population_id: string | null;
  name: string;
  description: string | null;
  market_conditions: Record<string, any>;
  pricing_config: Record<string, any>;
  competitor_config: Record<string, any>;
  regulatory_config: Record<string, any>;
  event_timeline: any[];
  run_parameters: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SimulationRun {
  id: string;
  scenario_id: string;
  project_id: string;
  initiated_by: string | null;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string | null;
  completed_at: string | null;
  seed_value: string | null;
  summary: string | null;
  aggregate_outputs: Record<string, any>;
  logs: any[];
  created_at: string;
}

export interface MarketValidationResult {
  id: string;
  simulation_run_id: string;
  adoption_score: number | null;
  willingness_to_pay_score: number | null;
  retention_score: number | null;
  objection_score: number | null;
  sentiment_score: number | null;
  conversion_rate: number | null;
  churn_risk: number | null;
  summary: string | null;
  metrics: Record<string, any>;
  created_at: string;
}

export interface BusinessViabilityResult {
  id: string;
  simulation_run_id: string;
  projected_revenue: number | null;
  projected_cost: number | null;
  projected_profit: number | null;
  break_even_month: number | null;
  market_share_estimate: number | null;
  survival_probability: number | null;
  unit_economics: Record<string, any>;
  scenario_metrics: Record<string, any>;
  summary: string | null;
  created_at: string;
}

export interface Investor {
  id: string;
  name: string;
  investor_type: string | null;
  stage_focus: string | null;
  industry_focus: string[];
  geography: string | null;
  typical_ticket_min: number | null;
  typical_ticket_max: number | null;
  thesis: string | null;
  website: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface InvestorMatch {
  id: string;
  project_id: string;
  investor_id: string;
  simulation_run_id: string | null;
  fit_score: number | null;
  stage_alignment_score: number | null;
  sector_alignment_score: number | null;
  readiness_score: number | null;
  rationale: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Report {
  id: string;
  project_id: string;
  simulation_run_id: string | null;
  title: string;
  executive_summary: string | null;
  report_status: 'draft' | 'generated' | 'published';
  report_payload: Record<string, any>;
  generated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  project_id: string | null;
  user_id: string | null;
  action_type: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, any>;
  created_at: string;
}

export interface OverviewStats {
  activeProjects: number;
  ideasInPipeline: number;
  runningSimulations: number;
  completedReports: number;
  avgValidationScore: number;
}

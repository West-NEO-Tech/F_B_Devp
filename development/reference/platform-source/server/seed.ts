import pool from "./db";

export async function seed() {
  const existingUsers = await pool.query("SELECT COUNT(*) as count FROM users");
  if (parseInt(existingUsers.rows[0].count) > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  console.log("Seeding database...");

  const users = await pool.query(`
    INSERT INTO users (full_name, email, password_hash, role, organisation, title) VALUES
    ('Dr. Sarah Chen', 'sarah.chen@research.edu', '$2b$10$placeholder', 'admin', 'MIT Innovation Lab', 'Platform Director'),
    ('James Rodriguez', 'j.rodriguez@startup.io', 'placeholder', 'innovator', 'NovaTech Inc.', 'CEO & Founder'),
    ('Prof. Emily Watson', 'e.watson@oxford.ac.uk', 'placeholder', 'researcher', 'Oxford Business School', 'Professor of Innovation'),
    ('Michael Park', 'm.park@ventures.com', 'placeholder', 'investor_viewer', 'Horizon Ventures', 'Managing Partner'),
    ('Aisha Patel', 'a.patel@industry.com', 'placeholder', 'industry_partner', 'TechCorp Global', 'VP of Strategy')
    RETURNING id
  `);
  const userIds = users.rows.map((r: any) => r.id);

  const projects = await pool.query(`
    INSERT INTO projects (owner_id, name, slug, description, domain, target_market, status, tags) VALUES
    ($1, 'AI Nutrition Recommendation Platform', 'ai-nutrition-platform', 
     'An AI-powered platform that provides personalized nutrition recommendations based on individual health profiles, dietary preferences, and real-time biometric data from wearable devices.',
     'HealthTech', 'B2C', 'active', ARRAY['AI', 'nutrition', 'health', 'personalization']),
    ($2, 'Smart Manufacturing Defect Detection', 'smart-manufacturing-defect',
     'Computer vision and deep learning system for real-time quality control and defect detection in manufacturing production lines, reducing waste and improving product quality.',
     'Manufacturing', 'B2B', 'active', ARRAY['manufacturing', 'computer-vision', 'quality-control']),
    ($3, 'SME Supply Chain Forecasting Assistant', 'sme-supply-chain',
     'AI-driven supply chain optimization tool designed specifically for small and medium enterprises, providing demand forecasting, inventory management, and supplier risk assessment.',
     'Supply Chain', 'B2B', 'in_review', ARRAY['supply-chain', 'SME', 'forecasting', 'logistics'])
    RETURNING id
  `, [userIds[1], userIds[1], userIds[2]]);
  const projectIds = projects.rows.map((r: any) => r.id);

  const ideas = await pool.query(`
    INSERT INTO ideas (project_id, title, summary, problem_statement, solution_statement, target_users, value_proposition, status, tags) VALUES
    ($1, 'Personalized Meal Planning with Microbiome Analysis',
     'Combine gut microbiome data with AI-driven meal planning for optimal nutrient absorption and health outcomes.',
     'Most nutrition apps provide generic advice without considering individual gut health and microbiome composition.',
     'Integrate microbiome testing results with machine learning models to generate highly personalized meal plans.',
     'Health-conscious consumers aged 25-55', 'Up to 40% improvement in nutrient absorption through personalized recommendations',
     'approved', ARRAY['microbiome', 'personalization', 'meal-planning']),
    ($1, 'Real-time Allergen Detection via Food Photography',
     'AI-powered image recognition that identifies potential allergens in prepared meals using smartphone camera.',
     'People with food allergies face daily risk when eating meals they did not prepare themselves.',
     'Deep learning model trained on millions of food images to detect and flag potential allergens with 95%+ accuracy.',
     'Food allergy sufferers, parents of children with allergies', 'Life-saving allergen detection in under 3 seconds',
     'shortlisted', ARRAY['allergens', 'computer-vision', 'safety']),
    ($2, 'Multi-Spectral Quality Inspection System',
     'Combine visible light, infrared, and X-ray imaging for comprehensive defect detection across material types.',
     'Single-spectrum inspection misses 15-20% of defects in complex manufactured products.',
     'Fusion of multiple imaging modalities with ensemble deep learning for near-complete defect coverage.',
     'Manufacturing QA teams, production engineers', 'Reduce defect escape rate to below 0.1%',
     'approved', ARRAY['multi-spectral', 'deep-learning', 'inspection']),
    ($2, 'Predictive Maintenance Integration Module',
     'Connect defect detection patterns with equipment health data to predict maintenance needs before failures occur.',
     'Reactive maintenance causes unplanned downtime costing manufacturers millions annually.',
     'Pattern recognition across defect trends correlated with machine sensor data for predictive maintenance scheduling.',
     'Plant managers, maintenance teams', 'Reduce unplanned downtime by 60%',
     'submitted', ARRAY['predictive-maintenance', 'IoT']),
    ($3, 'Supplier Risk Scoring Dashboard',
     'Real-time supplier reliability scoring based on delivery history, financial health, and geopolitical factors.',
     'SMEs lack visibility into supplier risk, leading to unexpected disruptions.',
     'Aggregate multiple data sources into a single risk score with trend analysis and early warning alerts.',
     'Procurement managers at SMEs', 'Reduce supply disruption incidents by 45%',
     'shortlisted', ARRAY['risk-scoring', 'supplier-management']),
    ($3, 'Demand Sensing with Social Media Signals',
     'Incorporate social media trend analysis into demand forecasting models for early signal detection.',
     'Traditional demand forecasting relies solely on historical sales data, missing emerging trends.',
     'NLP analysis of social media combined with time-series forecasting for 2-4 week advance demand signals.',
     'SME sales and operations teams', 'Improve forecast accuracy by 25% for trending products',
     'submitted', ARRAY['demand-sensing', 'NLP', 'social-media'])
    RETURNING id
  `, [projectIds[0], projectIds[1], projectIds[2]]);
  const ideaIds = ideas.rows.map((r: any) => r.id);

  await pool.query(`
    INSERT INTO evaluations (idea_id, evaluator_type, evaluator_name, novelty_score, feasibility_score, market_potential_score, risk_score, readiness_score, overall_score, rationale) VALUES
    ($1, 'AI Technical Expert', 'TechEval Agent v2', 82.5, 71.0, 88.0, 32.0, 65.0, 78.5, 'Strong technical foundation with proven microbiome research. Market timing is favorable with growing consumer interest in personalized nutrition.'),
    ($1, 'AI Market Analyst', 'MarketSense Agent', 75.0, 78.0, 91.0, 28.0, 72.0, 82.0, 'Large addressable market with clear willingness to pay. Competitive landscape is fragmented, offering entry opportunity.'),
    ($2, 'AI Technical Expert', 'TechEval Agent v2', 88.0, 62.0, 75.0, 45.0, 55.0, 72.0, 'Novel approach but accuracy requirements are extremely high for safety-critical application. Regulatory pathway needs clarity.'),
    ($3, 'AI Technical Expert', 'TechEval Agent v2', 71.0, 85.0, 82.0, 22.0, 78.0, 81.0, 'Well-established technology components. Integration challenge is moderate. Strong market demand in manufacturing.'),
    ($3, 'AI Market Analyst', 'MarketSense Agent', 65.0, 82.0, 85.0, 25.0, 80.0, 79.0, 'Clear ROI proposition for manufacturers. Existing competitors but room for differentiation through multi-spectral approach.'),
    ($4, 'AI Technical Expert', 'TechEval Agent v2', 68.0, 58.0, 72.0, 48.0, 45.0, 62.0, 'Interesting concept but requires significant R&D investment. IoT integration adds complexity.'),
    ($5, 'AI Market Analyst', 'MarketSense Agent', 72.0, 75.0, 78.0, 35.0, 68.0, 74.0, 'Strong demand from SME segment. Clear value proposition but customer acquisition in SME market is challenging.')
  `, [ideaIds[0], ideaIds[1], ideaIds[2], ideaIds[3], ideaIds[4]]);

  await pool.query(`
    INSERT INTO prototypes (project_id, idea_id, name, description, architecture_summary, status, feature_backlog, api_plan, data_model_plan) VALUES
    ($1, $4, 'NutriAI Platform v1', 'Full-stack nutrition recommendation engine',
     'Microservice architecture with recommendation engine, user profile service, meal database, and mobile API gateway.',
     'in_progress',
     '[{"name":"User Onboarding","status":"done"},{"name":"Health Profile Builder","status":"done"},{"name":"Microbiome Data Import","status":"in_progress"},{"name":"Meal Plan Generator","status":"planned"},{"name":"Nutrient Tracking Dashboard","status":"planned"},{"name":"Wearable Integration","status":"planned"}]',
     '[{"endpoint":"/api/profiles","method":"CRUD","description":"User health profiles"},{"endpoint":"/api/meals","method":"GET","description":"Meal recommendations"},{"endpoint":"/api/tracking","method":"POST","description":"Nutrient intake tracking"}]',
     '[{"entity":"UserProfile","fields":["id","healthData","preferences","microbiomeId"]},{"entity":"MealPlan","fields":["id","userId","meals","nutrients","score"]}]'),
    ($2, $5, 'DefectVision Pro', 'Multi-spectral inspection system prototype',
     'Edge computing architecture with camera array integration, real-time inference engine, and cloud analytics dashboard.',
     'planned',
     '[{"name":"Camera Integration SDK","status":"planned"},{"name":"Inference Engine","status":"planned"},{"name":"Defect Classification Model","status":"planned"},{"name":"Dashboard UI","status":"planned"},{"name":"Alert System","status":"planned"}]',
     '[{"endpoint":"/api/inspections","method":"POST","description":"Submit inspection images"},{"endpoint":"/api/defects","method":"GET","description":"Query detected defects"},{"endpoint":"/api/models","method":"GET","description":"Model version management"}]',
     '[{"entity":"Inspection","fields":["id","imageUrls","timestamp","result"]},{"entity":"Defect","fields":["id","type","severity","location","confidence"]}]'),
    ($3, $6, 'SupplyIQ Assistant', 'SME supply chain intelligence tool',
     'SaaS platform with demand forecasting module, supplier scoring engine, and inventory optimization service.',
     'generated',
     '[{"name":"Supplier Database","status":"done"},{"name":"Risk Scoring Algorithm","status":"done"},{"name":"Demand Forecasting","status":"done"},{"name":"Inventory Optimizer","status":"in_progress"},{"name":"Alert & Notifications","status":"planned"},{"name":"ERP Integration","status":"planned"}]',
     '[{"endpoint":"/api/suppliers","method":"CRUD","description":"Supplier management"},{"endpoint":"/api/forecasts","method":"GET","description":"Demand forecasts"},{"endpoint":"/api/inventory","method":"CRUD","description":"Inventory management"}]',
     '[{"entity":"Supplier","fields":["id","name","riskScore","deliveryHistory"]},{"entity":"Forecast","fields":["id","productId","period","demand","confidence"]}]')
  `, [projectIds[0], projectIds[1], projectIds[2], ideaIds[0], ideaIds[2], ideaIds[4]]);

  const templates = await pool.query(`
    INSERT INTO agent_templates (name, category, description, target_segment, persona_attributes, economic_attributes, decision_parameters, memory_settings, behavior_model) VALUES
    ('Price-Sensitive Consumer', 'consumer', 'Budget-conscious consumer who prioritizes value for money and compares prices extensively before purchasing.',
     'Budget consumers', '{"age_range":"25-45","income_level":"lower-middle","tech_savviness":"moderate","shopping_behavior":"comparison-shopper"}'::jsonb,
     '{"price_sensitivity":0.9,"willingness_to_pay":"low","budget_range":"$5-15/month"}'::jsonb,
     '{"adoption_threshold":0.3,"price_elasticity":1.8,"brand_loyalty":0.2}'::jsonb,
     '{"retention_window":30,"memory_decay":0.1}'::jsonb,
     '{"risk_aversion":0.7,"novelty_seeking":0.3,"social_influence":0.6}'::jsonb),
    ('Health-Conscious Consumer', 'consumer', 'Health-focused individual willing to invest in products that improve well-being and longevity.',
     'Health & wellness', '{"age_range":"28-55","income_level":"upper-middle","tech_savviness":"high","health_awareness":"very_high"}'::jsonb,
     '{"price_sensitivity":0.3,"willingness_to_pay":"high","budget_range":"$20-50/month"}'::jsonb,
     '{"adoption_threshold":0.5,"price_elasticity":0.6,"brand_loyalty":0.7}'::jsonb,
     '{"retention_window":90,"memory_decay":0.05}'::jsonb,
     '{"risk_aversion":0.4,"novelty_seeking":0.8,"social_influence":0.5}'::jsonb),
    ('Enterprise Procurement Buyer', 'enterprise_buyer', 'Corporate buyer evaluating solutions for organizational deployment with focus on ROI and compliance.',
     'Enterprise procurement', '{"company_size":"500-5000","industry":"manufacturing","decision_cycle":"3-6 months","stakeholders":"5-8"}'::jsonb,
     '{"budget_authority":"$50K-500K","ROI_requirement":"18 months","TCO_focus":true}'::jsonb,
     '{"adoption_threshold":0.7,"vendor_evaluation_depth":"comprehensive","pilot_requirement":true}'::jsonb,
     '{"retention_window":365,"memory_decay":0.02}'::jsonb,
     '{"risk_aversion":0.8,"innovation_appetite":0.5,"reference_requirement":true}'::jsonb),
    ('Early-Stage Investor', 'investor', 'Angel/seed stage investor looking for high-growth potential startups with strong founding teams.',
     'Seed to Series A', '{"investment_stage":"seed-seriesA","check_size":"$100K-$2M","portfolio_size":15,"sector_focus":"deep-tech"}'::jsonb,
     '{"return_expectation":"10x","hold_period":"5-7 years","follow_on_capacity":true}'::jsonb,
     '{"team_weight":0.35,"market_weight":0.3,"technology_weight":0.2,"traction_weight":0.15}'::jsonb,
     '{"deal_memory":180,"market_trends":365}'::jsonb,
     '{"risk_tolerance":0.7,"FOMO_sensitivity":0.6,"contrarian_tendency":0.3}'::jsonb),
    ('Conservative Regulator', 'regulator', 'Regulatory body representative focused on consumer protection, data privacy, and safety compliance.',
     'Health & Safety regulation', '{"jurisdiction":"US/EU","regulatory_framework":"FDA/GDPR","enforcement_style":"precautionary"}'::jsonb,
     '{"compliance_cost_threshold":"moderate","impact_assessment":"required"}'::jsonb,
     '{"approval_threshold":0.85,"evidence_requirement":"clinical_trials","safety_margin":2.0}'::jsonb,
     '{"precedent_memory":730,"incident_tracking":true}'::jsonb,
     '{"precautionary_bias":0.8,"innovation_friendliness":0.3,"transparency_requirement":0.9}'::jsonb),
    ('Aggressive Competitor', 'competitor', 'Well-funded competitor likely to respond aggressively to market entry with price wars or feature acceleration.',
     'Market incumbents', '{"market_share":"25-40%","funding_status":"well-funded","response_speed":"fast"}'::jsonb,
     '{"pricing_flexibility":"high","marketing_budget":"large","R&D_investment":"aggressive"}'::jsonb,
     '{"response_threshold":0.1,"price_matching":true,"feature_parity_timeline":"6 months"}'::jsonb,
     '{"competitor_tracking":90,"market_intelligence":"continuous"}'::jsonb,
     '{"aggression_level":0.8,"defensive_strategy":"price_and_feature","acquisition_tendency":0.4}'::jsonb),
    ('Technical Infrastructure Expert', 'technical_expert', 'Senior technical architect evaluating system scalability, security, and technical debt.',
     'Technical assessment', '{"experience_years":15,"specialization":"distributed_systems","cloud_native":true}'::jsonb,
     '{"infrastructure_cost_model":"cloud_first","scalability_requirement":"10x"}'::jsonb,
     '{"architecture_score_threshold":0.7,"security_compliance":"SOC2","performance_SLA":"99.9%"}'::jsonb,
     '{"tech_stack_memory":365,"vulnerability_tracking":true}'::jsonb,
     '{"pragmatism":0.7,"innovation_bias":0.5,"security_focus":0.8}'::jsonb),
    ('Startup Mentor', 'mentor', 'Experienced entrepreneur providing strategic guidance on go-to-market, fundraising, and team building.',
     'Startup advisory', '{"exits":3,"mentoring_years":10,"network_strength":"strong","domain":"healthtech"}'::jsonb,
     '{"advisory_rate":"equity-based","time_commitment":"4hrs/month"}'::jsonb,
     '{"startup_stage_preference":"early","team_assessment_weight":0.4,"market_timing_weight":0.3}'::jsonb,
     '{"founder_relationship":365,"market_cycles":1825}'::jsonb,
     '{"encouragement_bias":0.6,"reality_check":0.7,"network_activation":0.8}'::jsonb)
    RETURNING id
  `);
  const templateIds = templates.rows.map((r: any) => r.id);

  const pops = await pool.query(`
    INSERT INTO agent_populations (project_id, name, description, total_agents, distribution) VALUES
    ($1, 'Health Consumer Market Segment', 'Mixed population of health-conscious and price-sensitive consumers for nutrition platform validation', 500,
     '{"health_conscious":60,"price_sensitive":40}'::jsonb),
    ($2, 'Manufacturing Enterprise Buyers', 'Enterprise procurement decision makers for defect detection system', 200,
     '{"enterprise_buyers":70,"technical_evaluators":30}'::jsonb),
    ($3, 'SME Supply Chain Stakeholders', 'Mixed SME stakeholders for supply chain tool validation', 300,
     '{"sme_buyers":50,"competitors":20,"regulators":15,"investors":15}'::jsonb)
    RETURNING id
  `, [projectIds[0], projectIds[1], projectIds[2]]);
  const popIds = pops.rows.map((r: any) => r.id);

  const scenarios = await pool.query(`
    INSERT INTO simulation_scenarios (project_id, population_id, name, description, market_conditions, pricing_config, competitor_config, regulatory_config) VALUES
    ($1, $4, 'Nutrition Platform Market Entry', 'Simulate market entry for AI nutrition platform with mixed consumer population',
     '{"market_size":"$12B","growth_rate":"15%","maturity":"growing","seasonality":"low"}'::jsonb,
     '{"base_price":19.99,"discount_range":"10-25%","freemium_tier":true}'::jsonb,
     '{"num_competitors":5,"market_leader_share":"35%","price_war_probability":0.3}'::jsonb,
     '{"fda_approval_needed":false,"data_privacy":"HIPAA","compliance_timeline":"6 months"}'::jsonb),
    ($2, $5, 'Manufacturing Defect Detection Enterprise Sale', 'Simulate enterprise sales cycle for defect detection system',
     '{"market_size":"$3.2B","growth_rate":"22%","maturity":"emerging","cycle":"long"}'::jsonb,
     '{"base_price":50000,"annual_license":true,"implementation_fee":15000}'::jsonb,
     '{"num_competitors":3,"differentiation":"multi-spectral","switching_cost":"high"}'::jsonb,
     '{"safety_standards":"ISO_9001","certification_required":true,"audit_frequency":"annual"}'::jsonb),
    ($3, $6, 'SME Supply Chain Tool Launch', 'Simulate SaaS launch targeting SME supply chain management',
     '{"market_size":"$1.8B","growth_rate":"18%","maturity":"growing","fragmentation":"high"}'::jsonb,
     '{"base_price":299,"tiers":["starter","professional","enterprise"],"trial_days":14}'::jsonb,
     '{"num_competitors":8,"open_source_alternatives":true,"price_pressure":"moderate"}'::jsonb,
     '{"data_regulations":"GDPR","cross_border":"yes","export_controls":"limited"}'::jsonb)
    RETURNING id
  `, [projectIds[0], projectIds[1], projectIds[2], popIds[0], popIds[1], popIds[2]]);
  const scenarioIds = scenarios.rows.map((r: any) => r.id);

  const simRuns = await pool.query(`
    INSERT INTO simulation_runs (scenario_id, project_id, initiated_by, status, started_at, completed_at, seed_value, summary, aggregate_outputs) VALUES
    ($1, $4, $7, 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '45 minutes', 'seed_abc123',
     'Simulation completed with 487 agent interactions across 6 segments. Strong adoption signal from health-conscious consumers.',
     '{"total_interactions":487,"adoption_rate":72.5,"avg_sentiment":76.3,"price_acceptance":68.2}'::jsonb),
    ($2, $5, $7, 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '30 minutes', 'seed_def456',
     'Enterprise simulation completed. 198 buyer agent evaluations show strong product-market fit for manufacturing QA.',
     '{"total_interactions":198,"adoption_rate":58.2,"avg_sentiment":71.8,"price_acceptance":82.5}'::jsonb),
    ($3, $6, $8, 'completed', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours' + INTERVAL '25 minutes', 'seed_ghi789',
     'SME market simulation indicates moderate demand with high price sensitivity. Freemium model recommended.',
     '{"total_interactions":312,"adoption_rate":45.8,"avg_sentiment":62.4,"price_acceptance":55.1}'::jsonb)
    RETURNING id
  `, [scenarioIds[0], scenarioIds[1], scenarioIds[2], projectIds[0], projectIds[1], projectIds[2], userIds[0], userIds[2]]);
  const runIds = simRuns.rows.map((r: any) => r.id);

  await pool.query(`
    INSERT INTO market_validation_results (simulation_run_id, adoption_score, willingness_to_pay_score, retention_score, objection_score, sentiment_score, conversion_rate, churn_risk, summary, metrics) VALUES
    ($1, 72.50, 68.20, 78.30, 22.10, 76.30, 18.50, 15.20,
     'Strong market validation. Health-conscious segment shows high adoption and retention. Price sensitivity moderate in target demographic.',
     '{"segments":{"health_conscious":{"adoption":82,"wtp":75,"sentiment":85},"price_sensitive":{"adoption":58,"wtp":52,"sentiment":62}},"top_objections":["data_privacy","accuracy_concerns","subscription_fatigue"]}'::jsonb),
    ($2, 58.20, 82.50, 85.10, 18.50, 71.80, 12.30, 8.50,
     'Enterprise buyers show strong willingness to pay and high retention expectations. Longer sales cycle but higher lifetime value.',
     '{"segments":{"enterprise_buyers":{"adoption":62,"wtp":88,"sentiment":74},"technical_evaluators":{"adoption":55,"wtp":72,"sentiment":68}},"top_objections":["integration_complexity","training_requirements","vendor_lock_in"]}'::jsonb),
    ($3, 45.80, 55.10, 62.40, 35.20, 62.40, 8.90, 28.50,
     'Moderate market reception. Price sensitivity is the primary barrier. Freemium model could significantly improve initial adoption.',
     '{"segments":{"sme_buyers":{"adoption":52,"wtp":48,"sentiment":65},"competitors":{"response":"moderate","price_pressure":true}},"top_objections":["cost","complexity","existing_solutions"]}'::jsonb)
  `, [runIds[0], runIds[1], runIds[2]]);

  await pool.query(`
    INSERT INTO business_viability_results (simulation_run_id, projected_revenue, projected_cost, projected_profit, break_even_month, market_share_estimate, survival_probability, unit_economics, summary) VALUES
    ($1, 480000, 285000, 195000, 14, 4.20, 72.50,
     '{"cac":45,"ltv":380,"arpu":22,"payback_months":5,"gross_margin":62}'::jsonb,
     'Positive unit economics with strong LTV/CAC ratio of 8.4x. Break-even projected at month 14 with current growth trajectory.'),
    ($2, 1250000, 680000, 570000, 11, 8.50, 81.20,
     '{"cac":12000,"ltv":125000,"arpu":4200,"payback_months":3,"gross_margin":72}'::jsonb,
     'Enterprise model shows excellent unit economics. High ACV with low churn creates predictable revenue. Break-even at month 11.'),
    ($3, 320000, 240000, 80000, 18, 2.80, 58.30,
     '{"cac":85,"ltv":420,"arpu":28,"payback_months":8,"gross_margin":45}'::jsonb,
     'Challenging but viable. SME market requires efficient customer acquisition. Recommend optimizing CAC through content marketing and partnerships.')
  `, [runIds[0], runIds[1], runIds[2]]);

  await pool.query(`
    INSERT INTO investors (name, investor_type, stage_focus, industry_focus, geography, typical_ticket_min, typical_ticket_max, thesis, website) VALUES
    ('Horizon Ventures', 'Venture Capital', 'Seed to Series A', ARRAY['HealthTech','AI','Deep Tech'], 'North America', 500000, 5000000,
     'We invest in transformative deep-tech companies that leverage AI to solve fundamental human challenges in health and wellbeing.', 'https://horizonventures.example.com'),
    ('GreenField Capital', 'Venture Capital', 'Series A to B', ARRAY['Manufacturing','Industrial IoT','Automation'], 'Global', 2000000, 15000000,
     'Focused on Industry 4.0 technologies that digitize and optimize manufacturing processes for the next generation of smart factories.', 'https://greenfieldcap.example.com'),
    ('TechBridge Angels', 'Angel Network', 'Pre-seed to Seed', ARRAY['SaaS','AI','Supply Chain'], 'Europe', 50000, 500000,
     'A network of experienced entrepreneurs supporting early-stage B2B SaaS and AI-first startups with capital and mentorship.', 'https://techbridgeangels.example.com'),
    ('Impact Innovation Fund', 'Impact Fund', 'Seed to Series B', ARRAY['HealthTech','CleanTech','EdTech'], 'Global', 1000000, 10000000,
     'Investing in technology companies creating measurable positive social and environmental impact alongside financial returns.', 'https://impactinnovation.example.com'),
    ('Digital Frontier Partners', 'Corporate VC', 'Series A to C', ARRAY['AI','Enterprise Software','Manufacturing'], 'Asia-Pacific', 5000000, 25000000,
     'Strategic corporate venture arm investing in technologies that complement our parent company portfolio in enterprise digital transformation.', 'https://digitalfrontier.example.com')
    RETURNING id
  `);

  const investorRows = await pool.query("SELECT id FROM investors");
  const investorIds = investorRows.rows.map((r: any) => r.id);

  await pool.query(`
    INSERT INTO investor_matches (project_id, investor_id, simulation_run_id, fit_score, stage_alignment_score, sector_alignment_score, readiness_score, rationale) VALUES
    ($1, $4, $7, 85.0, 82.0, 92.0, 75.0, 'Strong alignment with HealthTech thesis. AI-driven nutrition platform matches investment focus on transformative health technologies.'),
    ($1, $8, $7, 72.0, 78.0, 85.0, 70.0, 'Good fit with impact investment criteria. Measurable health outcomes align with social impact metrics.'),
    ($2, $5, $9, 88.0, 85.0, 95.0, 80.0, 'Excellent manufacturing focus alignment. Industry 4.0 thesis directly maps to defect detection innovation.'),
    ($2, $10, $9, 78.0, 75.0, 88.0, 72.0, 'Strategic interest in enterprise AI for manufacturing. Potential for follow-on investment and distribution partnership.'),
    ($3, $6, $11, 68.0, 90.0, 75.0, 62.0, 'Early-stage focus aligns well. Supply chain is adjacent to primary sector interest. Mentorship value is high.')
  `, [projectIds[0], projectIds[1], projectIds[2], investorIds[0], investorIds[1], investorIds[2], runIds[0], investorIds[3], runIds[1], investorIds[4], runIds[2]]);

  await pool.query(`
    INSERT INTO reports (project_id, simulation_run_id, title, executive_summary, report_status, report_payload, generated_by) VALUES
    ($1, $4, 'AI Nutrition Platform - Validation Report',
     'The AI Nutrition Recommendation Platform demonstrates strong market potential with a validation score of 72.5%. Health-conscious consumers show particularly high adoption willingness. Unit economics are favorable with LTV/CAC ratio of 8.4x. Recommended next steps include clinical validation studies and strategic partnerships with health data providers.',
     'published',
     '{"sections":["executive_summary","market_analysis","competitive_landscape","financial_projections","risk_assessment","recommendations"]}'::jsonb,
     $7),
    ($2, $5, 'Smart Manufacturing Defect Detection - Validation Report',
     'Enterprise validation indicates excellent product-market fit with 82.5% willingness to pay at proposed pricing. The multi-spectral approach provides clear differentiation. Break-even projected at month 11 with strong gross margins. Key risk: long enterprise sales cycle requires adequate runway.',
     'generated',
     '{"sections":["executive_summary","market_analysis","technical_assessment","financial_projections","risk_assessment"]}'::jsonb,
     $7),
    ($3, $6, 'SME Supply Chain Assistant - Validation Report',
     'Moderate market validation with primary barrier being price sensitivity in SME segment. Freemium model recommended to improve initial adoption. Survival probability of 58.3% indicates need for efficient go-to-market strategy and potential pivot to mid-market positioning.',
     'draft',
     '{"sections":["executive_summary","market_analysis","pricing_analysis","competitive_landscape"]}'::jsonb,
     $8)
  `, [projectIds[0], projectIds[1], projectIds[2], runIds[0], runIds[1], runIds[2], userIds[0], userIds[2]]);

  const entities = await pool.query(`
    INSERT INTO graph_entities (project_id, entity_type, name, description, properties) VALUES
    (NULL, 'technology', 'Machine Learning', 'Subset of AI focused on learning from data', '{"maturity":"mature","adoption":"high"}'::jsonb),
    (NULL, 'technology', 'Computer Vision', 'AI field for image and video understanding', '{"maturity":"mature","adoption":"growing"}'::jsonb),
    (NULL, 'technology', 'Natural Language Processing', 'AI for understanding human language', '{"maturity":"mature","adoption":"high"}'::jsonb),
    (NULL, 'technology', 'Microbiome Analysis', 'Genomic analysis of gut microorganisms', '{"maturity":"emerging","adoption":"early"}'::jsonb),
    (NULL, 'problem', 'Personalized Nutrition', 'Need for individualized dietary recommendations', '{"severity":"high","market_size":"$12B"}'::jsonb),
    (NULL, 'problem', 'Manufacturing Defects', 'Quality control challenges in production', '{"severity":"critical","market_size":"$3.2B"}'::jsonb),
    (NULL, 'problem', 'SME Supply Chain Risk', 'Small business vulnerability to supply disruptions', '{"severity":"high","market_size":"$1.8B"}'::jsonb),
    (NULL, 'market', 'HealthTech B2C', 'Consumer health technology market', '{"size":"$150B","growth":"12%"}'::jsonb),
    (NULL, 'market', 'Industrial IoT', 'Connected manufacturing and industry', '{"size":"$200B","growth":"22%"}'::jsonb),
    (NULL, 'market', 'SME SaaS', 'Software as a service for small/medium enterprises', '{"size":"$80B","growth":"18%"}'::jsonb),
    (NULL, 'researcher', 'Dr. Sarah Chen', 'Platform director, MIT Innovation Lab', '{}'::jsonb),
    (NULL, 'startup', 'NutriAI', 'AI nutrition recommendation platform', '{}'::jsonb),
    (NULL, 'startup', 'DefectVision', 'Smart manufacturing defect detection', '{}'::jsonb),
    (NULL, 'startup', 'SupplyIQ', 'SME supply chain forecasting assistant', '{}'::jsonb)
    RETURNING id
  `);
  const entityIds = entities.rows.map((r: any) => r.id);

  await pool.query(`
    INSERT INTO graph_edges (source_entity_id, target_entity_id, relationship_type, weight) VALUES
    ($1, $5, 'solves', 0.85),
    ($2, $6, 'solves', 0.92),
    ($3, $7, 'enables', 0.78),
    ($4, $5, 'enables', 0.72),
    ($1, $8, 'targets', 0.80),
    ($2, $9, 'targets', 0.88),
    ($3, $10, 'targets', 0.75),
    ($11, $12, 'advises', 0.90),
    ($11, $13, 'advises', 0.85),
    ($11, $14, 'advises', 0.80),
    ($12, $8, 'operates_in', 0.95),
    ($13, $9, 'operates_in', 0.92),
    ($14, $10, 'operates_in', 0.88)
  `, [entityIds[0], entityIds[1], entityIds[2], entityIds[3], entityIds[4], entityIds[5], entityIds[6], entityIds[7], entityIds[8], entityIds[9], entityIds[10], entityIds[11], entityIds[12], entityIds[13]]);

  await pool.query(`
    INSERT INTO activity_logs (project_id, user_id, action_type, entity_type, details) VALUES
    ($1, $4, 'Project created', 'project', '{"name":"AI Nutrition Recommendation Platform"}'::jsonb),
    ($1, $4, 'Idea submitted', 'idea', '{"title":"Personalized Meal Planning with Microbiome Analysis"}'::jsonb),
    ($1, $4, 'Evaluation completed', 'evaluation', '{"overall_score":78.5}'::jsonb),
    ($1, $4, 'Simulation started', 'simulation_run', '{"scenario":"Nutrition Platform Market Entry"}'::jsonb),
    ($1, $4, 'Simulation completed', 'simulation_run', '{"adoption_rate":72.5}'::jsonb),
    ($1, $4, 'Report published', 'report', '{"title":"AI Nutrition Platform - Validation Report"}'::jsonb),
    ($2, $5, 'Project created', 'project', '{"name":"Smart Manufacturing Defect Detection"}'::jsonb),
    ($2, $5, 'Idea approved', 'idea', '{"title":"Multi-Spectral Quality Inspection System"}'::jsonb),
    ($2, $5, 'Simulation completed', 'simulation_run', '{"adoption_rate":58.2}'::jsonb),
    ($3, $6, 'Project created', 'project', '{"name":"SME Supply Chain Forecasting Assistant"}'::jsonb),
    ($3, $6, 'Idea shortlisted', 'idea', '{"title":"Supplier Risk Scoring Dashboard"}'::jsonb),
    ($3, $6, 'Investor match found', 'investor_match', '{"investor":"TechBridge Angels","fit_score":68}'::jsonb)
  `, [projectIds[0], projectIds[1], projectIds[2], userIds[0], userIds[1], userIds[2]]);

  console.log("Seed data inserted successfully!");
}

# AI-Agent Industry Innovation Testbed Platform

## Overview
A full-stack research platform for AI-agent driven business innovation concept verification. The platform supports idea discovery, evaluation, prototype planning, synthetic market validation via AI-agent simulations, business viability analysis, and investment matching.

## Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Express.js (Node.js)
- **Database**: PostgreSQL (raw SQL via pg driver, not Drizzle ORM)
- **Charts**: Recharts
- **State Management**: TanStack React Query v5
- **Routing**: Wouter
- **Styling**: Tailwind CSS with Inter font

## Architecture
- Database schema uses raw SQL (tables created directly, not via Drizzle migrations)
- Storage layer in `server/storage.ts` uses pg pool directly
- Seed data loaded at startup from `server/seed.ts`
- Types defined in `shared/schema.ts` as TypeScript interfaces (not Drizzle tables)

## Database
- PostgreSQL with 20+ tables including users, projects, ideas, evaluations, prototypes, agent_templates, agent_populations, simulation_scenarios, simulation_runs, market_validation_results, business_viability_results, investors, investor_matches, reports, graph_entities, graph_edges, workflow_jobs, activity_logs
- Uses JSONB fields for flexible agent attributes, scenario parameters, and simulation outputs
- Seeded with 3 demo projects, 6 ideas, 8 agent templates, 3 populations, 3 scenarios, 3 simulation runs with full results

## Pages (13 total)
1. **Overview** (`/`) - Platform dashboard with stats, charts, activity feed
2. **Projects** (`/projects`) - Project listing and creation
3. **Idea Discovery** (`/ideas`) - Idea submission and management
4. **Evaluation** (`/evaluation`) - Multi-dimensional scoring with radar/bar charts
5. **Prototypes** (`/prototypes`) - Prototype tracking with feature progress
6. **Agent Populations** (`/agents`) - Agent templates and population management
7. **Simulations** (`/simulations`) - Scenario selection and simulation runs
8. **Market Validation** (`/validation`) - Adoption curves, sentiment, funnel
9. **Business Viability** (`/viability`) - Revenue projections, pricing scenarios
10. **Investment Matching** (`/investments`) - Investor database and fit scores
11. **Knowledge Graph** (`/graph`) - Entity and relationship explorer
12. **Reports** (`/reports`) - Validation report listing
13. **Admin** (`/admin`) - User management and system health

## API Endpoints
- GET/POST `/api/projects`
- GET/POST `/api/ideas`
- GET `/api/evaluations`
- GET `/api/prototypes`
- GET `/api/agent-templates`
- GET `/api/populations`
- GET `/api/scenarios`
- GET `/api/simulations`, POST `/api/simulations/run`
- GET `/api/validation`
- GET `/api/viability`
- GET `/api/investors`
- GET `/api/matches`
- GET `/api/reports`
- GET `/api/graph/entities`, `/api/graph/edges`
- GET `/api/admin/users`
- GET `/api/overview/stats`, `/api/overview/activities`

## Simulation Engine
- Mock simulation engine that generates realistic results after a 3-second delay
- Creates market validation results, business viability results, and activity logs
- Supports 8 agent categories: consumer, enterprise_buyer, investor, competitor, supplier, regulator, technical_expert, mentor

## Running
- `npm run dev` starts Express backend + Vite frontend on port 5000

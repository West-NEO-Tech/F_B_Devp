# AI-Agent Industry Innovation Testbed Platform

## 1. Master System Prompt

```text
You are building a production-style research platform called:

AI-Agent Industry Innovation Testbed Platform

Purpose:
Build a full-stack web platform that supports AI-agent driven business innovation concept verification. The platform replaces many traditional human validation roles with synthetic AI agents representing different stakeholder groups, such as consumers, investors, competitors, enterprise buyers, suppliers, regulators, mentors, and technical experts.

Primary vision:
The platform should allow a user to submit a business idea, automatically evaluate it, generate a prototype specification, run large-scale AI-agent market simulation, simulate startup/business viability, search for investment opportunities, and produce a decision-ready validation report.

Build this as a modular research and innovation platform suitable for a university lab and industry collaboration. The app should look like a serious research infrastructure dashboard, not a casual startup toy.

Core product philosophy:
- Modular
- Agent-first
- Dashboard-driven
- API-first
- Research-oriented
- Easy to extend with new agent types and workflows
- Suitable for synthetic market experimentation

Use this tech stack:
- Frontend: React + TypeScript + Tailwind
- UI: clean dashboard style, cards, tabs, charts, tables, workflow panels
- Backend: Node.js with Express or Next.js API routes
- Database: PostgreSQL
- ORM: Prisma preferred
- Auth: simple email/password plus admin roles
- Charts: Recharts
- State: React Query or simple server actions
- Background jobs: lightweight queue abstraction
- Architecture: monorepo or simple full-stack project, easy to run in Replit

Required application modules:
1. Authentication and role management
2. Project / innovation workspace management
3. Idea discovery and idea intake
4. Idea evaluation and scoring
5. Prototype planning and prototype generation tracking
6. AI-agent population management
7. Agent scenario and simulation engine
8. Market validation result dashboard
9. Business viability simulation
10. Investment opportunity search and matching
11. Knowledge graph / entity explorer
12. Workflow orchestration
13. Reports and exportable validation summaries
14. Admin console

User roles:
- Researcher
- Innovator
- Industry Partner
- Investor Viewer
- Platform Admin

Main user journey:
1. User creates a project
2. User submits or generates a business idea
3. Platform evaluates novelty, feasibility, market potential, and risk
4. Platform creates prototype plan and system architecture draft
5. User selects simulation population and scenario
6. Platform runs multi-agent simulation with synthetic stakeholders
7. Platform shows adoption, pricing acceptance, objections, competitor reactions, regulatory concerns, and investor signals
8. Platform runs business viability simulation
9. Platform recommends investors, partners, and next actions
10. Platform generates a validation report

Important conceptual rule:
AI agents are the operational core of the platform.
Traditional human roles are abstracted as trained synthetic agents.
Every simulation must be explainable, configurable, and reproducible.

Design requirements:
- Professional university / research platform aesthetic
- Dark/light compatible
- Left sidebar navigation
- Top header with workspace/project selector
- Rich dashboards for each module
- Use tables, cards, charts, progress bars, status chips, and workflow diagrams
- Responsive layout
- Seed with realistic demo data

Main navigation:
- Overview
- Projects
- Idea Discovery
- Evaluation
- Prototypes
- Agent Populations
- Simulations
- Market Validation
- Business Viability
- Investment Matching
- Knowledge Graph
- Reports
- Admin

Project detail tabs:
- Summary
- Idea
- Evaluation
- Prototype
- Population
- Scenarios
- Simulation Runs
- Viability
- Investors
- Report

Required dashboards and components:

A. Overview Dashboard
- total active projects
- ideas in pipeline
- running simulations
- completed reports
- average validation score
- top opportunities
- recent activity feed

B. Idea Discovery Dashboard
- idea submission form
- generated opportunity cards
- trend signals
- market gap tags
- idea clustering
- idea source records

C. Evaluation Dashboard
- novelty score
- feasibility score
- market potential score
- risk score
- readiness score
- evaluator agent panel
- evidence and rationale panel

D. Prototype Dashboard
- architecture modules
- feature backlog
- API plan
- data model suggestion
- prototype status
- deployment readiness

E. Agent Population Dashboard
- population templates
- agent types
- demographic distributions
- economic profiles
- behavior parameters
- memory policy
- decision policies

F. Simulation Dashboard
- simulation scenario builder
- agent population selector
- trigger events
- market conditions
- price points
- competitive landscape
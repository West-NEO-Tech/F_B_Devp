from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent_template import AgentTemplate

SEED_TEMPLATES = [
    {
        "name": "Consumer Decision Maker",
        "role": "consumer",
        "description": (
            "Simulates individual consumer purchasing decisions"
            " based on needs, budget, and social influence."
        ),
        "model_tier": "core",
        "typical_count_min": 50,
        "typical_count_max": 150,
        "default_config": {
            "persona_traits": ["price_sensitivity", "brand_loyalty", "social_influence"],
            "decision_model": "weighted_utility",
        },
    },
    {
        "name": "Enterprise Buyer",
        "role": "enterprise_buyer",
        "description": "Simulates B2B procurement processes with multi-stakeholder approval flows.",
        "model_tier": "core",
        "typical_count_min": 10,
        "typical_count_max": 30,
        "default_config": {
            "persona_traits": ["budget_authority", "technical_requirement", "vendor_preference"],
            "decision_model": "committee_consensus",
        },
    },
    {
        "name": "Market Competitor",
        "role": "competitor",
        "description": (
            "Simulates competitive responses including pricing,"
            " feature, and marketing strategy adjustments."
        ),
        "model_tier": "core",
        "typical_count_min": 3,
        "typical_count_max": 10,
        "default_config": {
            "persona_traits": ["market_share", "innovation_speed", "pricing_aggressiveness"],
            "decision_model": "game_theory",
        },
    },
    {
        "name": "Investment Evaluator",
        "role": "investor",
        "description": (
            "Evaluates business viability, market potential,"
            " and financial projections from investor perspective."
        ),
        "model_tier": "core",
        "typical_count_min": 3,
        "typical_count_max": 8,
        "default_config": {
            "persona_traits": ["risk_tolerance", "sector_expertise", "return_expectation"],
            "decision_model": "due_diligence_scorecard",
        },
    },
    {
        "name": "Supply Chain Participant",
        "role": "supplier",
        "description": (
            "Simulates supplier negotiations, capacity"
            " constraints, and partnership dynamics."
        ),
        "model_tier": "community",
        "typical_count_min": 5,
        "typical_count_max": 15,
        "default_config": {
            "persona_traits": ["reliability", "cost_structure", "capacity"],
            "decision_model": "contract_negotiation",
        },
    },
    {
        "name": "Policy Regulator",
        "role": "regulator",
        "description": (
            "Simulates regulatory compliance checks, policy"
            " impact assessment, and enforcement actions."
        ),
        "model_tier": "community",
        "typical_count_min": 2,
        "typical_count_max": 5,
        "default_config": {
            "persona_traits": ["jurisdiction", "enforcement_strictness", "policy_focus"],
            "decision_model": "compliance_framework",
        },
    },
    {
        "name": "Technical Expert",
        "role": "technical_expert",
        "description": (
            "Evaluates technical feasibility, architecture"
            " decisions, and technology stack choices."
        ),
        "model_tier": "community",
        "typical_count_min": 3,
        "typical_count_max": 8,
        "default_config": {
            "persona_traits": ["domain_expertise", "innovation_awareness", "scalability_focus"],
            "decision_model": "technical_assessment",
        },
    },
    {
        "name": "Startup Mentor",
        "role": "mentor",
        "description": (
            "Provides strategic guidance based on industry"
            " experience, network connections, and pattern recognition."
        ),
        "model_tier": "edge",
        "typical_count_min": 1,
        "typical_count_max": 3,
        "default_config": {
            "persona_traits": ["industry_experience", "network_breadth", "mentoring_style"],
            "decision_model": "pattern_matching",
        },
    },
]


async def seed_agent_templates(session: AsyncSession) -> None:
    """Insert seed templates if the table is empty. Idempotent."""
    count = (
        await session.execute(
            select(func.count()).select_from(AgentTemplate)
        )
    ).scalar_one()

    if count > 0:
        return

    for template_data in SEED_TEMPLATES:
        session.add(AgentTemplate(**template_data))

    await session.flush()

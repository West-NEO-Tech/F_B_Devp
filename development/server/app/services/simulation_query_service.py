"""Synthesize a natural-language simulation brief from project context."""

from __future__ import annotations

import logging

from app.llm import (
    LLMNotConfiguredError,
    LLMServiceError,
    LLMTimeoutError,
    SIMULATION_QUERY_SYSTEM_PROMPT,
    build_simulation_query_prompt,
    chat_completion,
)
from app.models.project import Project
from app.models.scenario import SimulationScenario
from app.services.market_qa_parse import base_description, parse_additional_information

logger = logging.getLogger(__name__)

_AGENT_ROLE_LABELS: dict[str, str] = {
    "consumer": "consumers",
    "enterprise_buyer": "enterprise buyers",
    "competitor": "competitors",
    "investor": "investors",
    "supplier": "suppliers",
    "regulator": "regulators",
    "technical_expert": "technical experts",
    "mentor": "mentors",
}


def _agent_roles_phrase(scenario: SimulationScenario) -> str:
    dist = (scenario.market_config or {}).get("agent_distribution") or {}
    if not isinstance(dist, dict):
        return "market participants"
    parts: list[str] = []
    for role, count in dist.items():
        if not count:
            continue
        label = _AGENT_ROLE_LABELS.get(str(role), str(role).replace("_", " "))
        parts.append(f"{label} ({count})")
    return ", ".join(parts) if parts else "market participants"


def fallback_simulation_query(project: Project, scenario: SimulationScenario) -> str:
    """Deterministic brief when LLM is unavailable."""
    overview = base_description(project.description or "").strip()
    qa = parse_additional_information(project.description or "")
    roles = _agent_roles_phrase(scenario)

    paragraphs: list[str] = []
    if overview:
        paragraphs.append(overview)
    if project.product_type:
        paragraphs.append(f"This is a {project.product_type} venture.")
    for item in qa:
        paragraphs.append(f"{item['question']} {item['answer']}")
    paragraphs.append(
        f"Simulate how {roles} respond to this situation: what collective dynamics "
        "and narratives emerge from their interactions, who adapts, who hesitates, "
        "and what opportunities or risks surface?"
    )
    return "\n\n".join(paragraphs)


async def generate_simulation_query(
    project: Project,
    scenario: SimulationScenario,
) -> str:
    """Return a cohesive natural-language simulation query for external runners."""
    prompt = build_simulation_query_prompt(
        project_name=project.name,
        product_type=project.product_type,
        overview=base_description(project.description or ""),
        additional_qa=parse_additional_information(project.description or ""),
        agent_depth=scenario.agent_depth,
        agent_count=scenario.agent_count,
        agent_roles_phrase=_agent_roles_phrase(scenario),
    )

    try:
        content = await chat_completion(
            messages=[
                {"role": "system", "content": SIMULATION_QUERY_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            json_mode=False,
            max_tokens=1400,
        )
        text = (content or "").strip()
        if text:
            return text
    except (LLMNotConfiguredError, LLMTimeoutError, LLMServiceError) as exc:
        logger.warning("Simulation query LLM failed: %s", exc)
    except Exception:
        logger.exception("Simulation query unexpected error")

    return fallback_simulation_query(project, scenario)

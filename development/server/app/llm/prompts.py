SYSTEM_PROMPT = (
    "You are a business analyst helping entrepreneurs validate their business ideas. "
    "You analyze market conditions, target audiences, and competitive landscapes. "
    "Always respond in valid JSON format with the exact keys requested. "
    "Do not include any text outside the JSON object."
)

# Map of field names to human-readable descriptions and format hints for the LLM.
FIELD_DESCRIPTIONS: dict[str, str] = {
    "description": "A concise product description (max 500 characters)",
    "target_market": "The primary target market and geographic focus (max 200 characters)",
    "target_audience": "Detailed target audience profile and demographics",
    "pricing_model": "Pricing strategy with specific price points (max 100 characters)",
    "competitors": (
        'A plain JSON array of 3-5 competitor name strings, e.g. ["Rover", "Wag", "PetSmart"]. '
        "Each element MUST be a plain string, not an object."
    ),
}


def build_ai_complete_prompt(
    project_name: str,
    product_type: str | None,
    existing_fields: dict[str, str | list[str]],
    empty_fields: list[str],
) -> str:
    """Build the user prompt for AI Complete.

    Args:
        project_name: The project name (e.g. "PetMatch").
        product_type: The product type (e.g. "Marketplace"), or None.
        existing_fields: Fields that already have values, as context for the LLM.
        empty_fields: Field names (snake_case) that need to be completed.

    Returns:
        A formatted prompt string for the user message.
    """
    lines: list[str] = []

    # Project context
    lines.append(f"Project: {project_name}")
    if product_type:
        lines.append(f"Product Type: {product_type}")
    lines.append("")

    # Existing fields as context
    if existing_fields:
        lines.append(
            "The following fields are already filled (use as context, do NOT repeat them):"
        )
        for field, value in existing_fields.items():
            lines.append(f"  - {field}: {value}")
        lines.append("")

    # Fields to complete
    lines.append(
        "Please complete the following fields. Return a JSON object with these exact keys:"
    )
    lines.append("")
    for field in empty_fields:
        hint = FIELD_DESCRIPTIONS.get(field, field)
        if field == "competitors":
            lines.append(f'  "{field}": {hint}')
        else:
            lines.append(f'  "{field}": "{hint}"')
    lines.append("")
    lines.append("Return ONLY the JSON object, no additional text.")

    return "\n".join(lines)


SEED_BUILDER_SYSTEM_PROMPT = (
    "You are a market research analyst. Return ONLY valid JSON matching the user schema. "
    "Be specific to the business concept. Keep every string concise."
)

_SEED_OUTPUT_COUNTS: dict[str, tuple[int, int, int, int]] = {
    # competitors, personas, topics, key_stats
    "quick": (2, 3, 4, 2),
    "standard": (3, 4, 4, 3),
    "deep": (3, 5, 5, 4),
}

SEED_BUILDER_MAX_TOKENS: dict[str, int] = {
    "quick": 900,
    "standard": 1100,
    "deep": 1400,
}


def seed_builder_max_tokens(agent_depth: str) -> int:
    return SEED_BUILDER_MAX_TOKENS.get(agent_depth, SEED_BUILDER_MAX_TOKENS["standard"])


def build_seed_builder_prompt(
    *,
    project_name: str,
    description: str | None,
    product_type: str | None,
    target_market: str | None,
    target_audience: str | None,
    pricing_model: str | None,
    competitors: list[str] | None,
    agent_depth: str,
    agent_distribution: dict[str, int] | None,
) -> str:
    lines = [f"## Business Concept: {project_name}"]
    if description:
        lines.append(f"Description: {description}")
    if product_type:
        lines.append(f"Product Type: {product_type}")
    if target_market:
        lines.append(f"Target Market: {target_market}")
    if target_audience:
        lines.append(f"Target Audience: {target_audience}")
    if pricing_model:
        lines.append(f"Pricing Model: {pricing_model}")
    if competitors:
        lines.append(f"Known Competitors: {', '.join(competitors)}")
    lines.append(f"\nSimulation Depth: {agent_depth}")
    if agent_distribution:
        dist_str = ", ".join(f"{k}: {v}" for k, v in agent_distribution.items())
        lines.append(f"Agent Distribution: {dist_str}")

    n_competitors, n_personas, n_topics, n_stats = _SEED_OUTPUT_COUNTS.get(
        agent_depth, _SEED_OUTPUT_COUNTS["standard"]
    )

    lines.append(f"""
## Required Output (JSON)

Return a JSON object with these exact keys:

{{
  "market_context": {{
    "market_size": "<e.g. $85M>",
    "growth_rate": "<e.g. +12% YoY>",
    "key_stats": [{{"label": "<stat>", "value": "<value>"}}],
    "summary": "<2 short sentences>"
  }},
  "competitors": [{{"name": "<name>", "positioning": "<one line>"}}],
  "consumer_personas": [{{"name": "<name>", "emoji": "<emoji>", "description": "<one sentence>"}}],
  "discussion_topics": [{{"topic": "<topic>", "relevance": "high|medium|low"}}]
}}

Counts: exactly {n_competitors} competitors, {n_personas} personas, {n_topics} topics, {n_stats} key_stats.
Do not add extra keys. No strengths/weaknesses/pain_points arrays.""")

    return "\n".join(lines)


SIMULATION_QUERY_SYSTEM_PROMPT = (
    "You are a business simulation scenario writer. "
    "Given a project brief and follow-up Q&A, write ONE cohesive natural-language simulation query. "
    "Output plain text only: no JSON, no markdown headings, no bullet lists. "
    "Use 2-4 short paragraphs. Write like a vivid policy-or-market shock brief that sets up a multi-agent simulation."
)


def build_simulation_query_prompt(
    *,
    project_name: str,
    product_type: str | None,
    overview: str,
    additional_qa: list[dict[str, str]],
    agent_depth: str,
    agent_count: int,
    agent_roles_phrase: str,
) -> str:
    lines = [f"Project: {project_name}"]
    if product_type:
        lines.append(f"Product type: {product_type}")
    lines.append(f"Simulation depth: {agent_depth} ({agent_count} agents)")
    lines.append(f"Agent roles in this run: {agent_roles_phrase}")
    lines.append("")
    lines.append("## Project overview (description)")
    lines.append(overview.strip() or "(not provided)")
    lines.append("")
    if additional_qa:
        lines.append("## Additional information (Market Info Q&A)")
        for item in additional_qa:
            lines.append(f"Q: {item['question']}")
            lines.append(f"A: {item['answer']}")
            lines.append("")
    lines.append("""
## Your task

Write a single simulation query that we will send to a multi-agent market simulator.

Requirements:
1. Weave ALL user-provided facts into a flowing narrative (do not omit material details from the Q&A).
2. Structure the story implicitly with: background context, constraints/limitations, additional conditions, and the commercial or strategic purpose of this simulation.
3. End by asking how the listed agent roles each respond, what collective dynamics and narratives emerge, who adapts vs. hesitates, and what opportunities or risks surface — tailored to THIS project (not a generic template).
4. Match the tone of a professional scenario brief (see style reference below).

Style reference (structure and tone only — do NOT copy topic or geography):
"The Western Australian state government just announced an emergency 7% stamp duty surcharge on all residential property purchases by foreign investors, effective immediately. Simultaneously, the RBA cut interest rates by 50 basis points.

Simulate how these two simultaneous policy shocks ripple through the Perth property market: how do foreign investors, local first-home buyers, existing landlords, real estate agents, and the regulator each respond? What collective market dynamics and narratives emerge from their interactions over the following weeks? Who adapts, who panics, and what opportunities or risks surface?"

Return only the final simulation query text.""")
    return "\n".join(lines)

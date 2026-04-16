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
    "You are a market research analyst AI. "
    "Given a business concept, generate comprehensive seed materials "
    "for a business validation simulation. "
    "You MUST respond with valid JSON matching the exact structure specified. "
    "Be specific, data-driven, and realistic. Use real market data when possible."
)


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

    lines.append("""
## Required Output (JSON)

Return a JSON object with these exact keys:

{
  "market_context": {
    "market_size": "<e.g. $85M or A$2.1B>",
    "growth_rate": "<e.g. +12% annually>",
    "key_stats": [{"label": "<stat name>", "value": "<stat value>"}],
    "summary": "<2-3 sentence market overview>"
  },
  "competitors": [
    {
      "name": "<competitor name>",
      "positioning": "<brief positioning>",
      "strengths": ["<strength 1>", "<strength 2>"],
      "weaknesses": ["<weakness 1>", "<weakness 2>"]
    }
  ],
  "consumer_personas": [
    {
      "name": "<persona name>",
      "emoji": "<single emoji>",
      "age_range": "<e.g. 25-35>",
      "description": "<2-3 sentence description>",
      "pain_points": ["<pain point 1>", "<pain point 2>"]
    }
  ],
  "discussion_topics": [
    {
      "topic": "<topic name>",
      "description": "<why this matters>",
      "relevance": "<high|medium|low>"
    }
  ]
}

Generate 3-5 competitors, 3-5 consumer personas, and 4-6 discussion topics.
Be specific to the business concept and market.""")


    return "\n".join(lines)

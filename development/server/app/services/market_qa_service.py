from __future__ import annotations

import json

from app.llm import LLMNotConfiguredError, LLMServiceError, LLMTimeoutError, chat_completion
from app.schemas.market_qa import MarketQAQuestion
from app.services import market_qa_priority as priority


MIN_QUESTIONS = 3
MAX_QUESTIONS = 5

SYSTEM = (
    "You are a product strategy analyst. Return ONLY valid JSON. "
    f"Generate {MIN_QUESTIONS}-{MAX_QUESTIONS} follow-up questions. "
    f"Always return at least {MIN_QUESTIONS} questions. "
    "Follow the priority rule in the user message: ask about missing Target Market, "
    "Target Audience, Pricing, and Competitors before supplemental analysis questions. "
    "Each question must be detailed and reference specifics from the user's description. "
    "Pack all needed detail into the question text; always return ask_for as []."
)


def _supplemental_fallback_questions(product_type: str) -> list[MarketQAQuestion]:
    """Non-priority fallback questions for business-analysis supplementation."""
    base = [
        MarketQAQuestion(
            id="core_problem",
            question=(
                "What is the core problem you solve, how do customers handle it today, and "
                "what breaks in that workflow?"
            ),
            ask_for=[
                "The single most painful problem in the user's own words",
                "Current alternatives/tools and why they are insufficient",
                "Quantified pain (time, cost, error rate, revenue impact) if known",
            ],
            why="We need baseline workflow and pain intensity.",
            example_answer=(
                "Teams spend ~6 hours/week consolidating data from Slack, email, and Sheets. "
                "Alternatives: Airtable + Zapier, but breaks on edge cases and lacks audit trail. "
                "Pain: ~15% reporting errors and delayed decisions by 2–3 days per cycle."
            ),
        ),
        MarketQAQuestion(
            id="value_metric",
            question=(
                "What measurable outcomes will customers care about, and how would you prove "
                "value in the first 30–90 days?"
            ),
            ask_for=[
                "Top 2–3 success metrics (time saved, revenue, conversion, risk reduced, etc.)",
                "How you would measure them (before/after, pilot design, data sources)",
                "A realistic target range for early customers",
            ],
            why="Helps pricing and ROI reasoning.",
            example_answer=(
                "Metrics: reporting cycle time, error rate, analyst hours. "
                "Measurement: baseline week vs week-4 pilot on one team. "
                "Target: cut cycle from 6h to 2h, errors from 15% to <5%."
            ),
        ),
        MarketQAQuestion(
            id="go_to_market",
            question=(
                "How will you reach and convert your first 100 customers, and what makes that "
                "channel credible for your product?"
            ),
            ask_for=[
                "Primary acquisition channels for the first 100 users",
                "Messaging wedge / hook tied to the pain you solve",
                "Expected CAC range or cost assumptions and sales motion (self-serve vs sales-led)",
            ],
            why="Determines feasibility and distribution constraints.",
            example_answer=(
                "Channels: ops leader communities, LinkedIn outbound, 2 design-partner referrals. "
                "Hook: 'Close books 3× faster without rebuilding your stack.' "
                "Motion: sales-assisted pilot; CAC target $800–1,200 in year one."
            ),
        ),
        MarketQAQuestion(
            id="constraints",
            question=(
                "What constraints will shape how fast you can build and sell—including team, "
                "budget, compliance, and integrations?"
            ),
            ask_for=[
                "Team capacity, runway or budget limits, and timeline milestones",
                "Must-have integrations or data access requirements",
                "Regulatory, privacy, or procurement blockers you already know about",
            ],
            why="Constraints heavily shape the recommended plan.",
            example_answer=(
                "Team: 2 engineers + founder selling; 9-month runway. "
                "Integrations: Salesforce + Snowflake read-only in v1. "
                "Blockers: SOC2 not required for pilots; enterprise SSO in Q3."
            ),
        ),
        MarketQAQuestion(
            id="differentiation",
            question=(
                "What is your defensible differentiation beyond features—speed, data, "
                "distribution, brand, or network effects?"
            ),
            ask_for=[
                "Top 2–3 differentiators customers would cite in a bake-off",
                "Evidence you can sustain them (IP, partnerships, workflow lock-in)",
                "What would make a well-funded competitor hard to displace you",
            ],
            why="Clarifies moat and positioning for analysis.",
            example_answer=(
                "Proprietary benchmark dataset + 48h implementation; distribution via "
                "existing SI partners; switching cost from embedded compliance workflows."
            ),
        ),
    ]
    if "marketplace" in product_type.lower():
        base.insert(
            1,
            MarketQAQuestion(
                id="supply_demand",
                question=(
                    "For your marketplace idea, which side is harder to win first, and what "
                    "liquidity wedge will you use to bootstrap both sides?"
                ),
                ask_for=[
                    "Supply vs demand: which side you prioritize and why",
                    "Initial wedge offer (geography, category, use case)",
                    "How you prevent disintermediation or low-quality listings early on",
                ],
                why="Marketplace liquidity strategy depends on this.",
                example_answer=(
                    "Start with supply: 30 vetted tutors in one city/subject. "
                    "Wedge: guaranteed first booking within 48h for parents. "
                    "Quality: manual review + minimum rating threshold before scale."
                ),
            ),
        )
    return base


def _ensure_min_questions(
    questions: list[MarketQAQuestion],
    product_type: str,
    description: str,
) -> list[MarketQAQuestion]:
    ordered = priority.reorder_questions_by_priority(questions, description)
    if len(ordered) >= MIN_QUESTIONS:
        return [_strip_ask_for(q) for q in ordered[:MAX_QUESTIONS]]

    fallback = priority.build_priority_ordered_fallback(
        product_type,
        description,
        _supplemental_fallback_questions(product_type),
    )
    seen = {q.id for q in ordered}
    out = list(ordered)
    for fq in fallback:
        if len(out) >= MIN_QUESTIONS:
            break
        if fq.id not in seen:
            out.append(fq)
            seen.add(fq.id)
    merged = out if len(out) >= MIN_QUESTIONS else fallback
    result = priority.reorder_questions_by_priority(merged, description)[:MAX_QUESTIONS]
    return [_strip_ask_for(q) for q in result]


def _prompt(description: str, product_type: str) -> str:
    pt = product_type.strip() or "Not specified yet (infer from description if helpful)"
    priority_section = priority.priority_prompt_section(description)
    return f"""
Idea Description:
{description}

Product Type:
{pt}

{priority_section}

Task:
Return {MIN_QUESTIONS}-{MAX_QUESTIONS} questions (at least {MIN_QUESTIONS}).

Rules for EACH question:
- "question": 2-4 sentences; include every sub-point the user should address inside this text (no separate bullet list).
- "ask_for": always [] (empty array).
- "example_answer": 3-6 sentences; realistic sample answer for THIS idea (clearly fictional but plausible).
- "why": one short sentence.

Return JSON with this exact shape:
{{
  "questions": [
    {{
      "id": "snake_case_id",
      "question": "long contextual question",
      "ask_for": [],
      "why": "short reason",
      "example_answer": "multi-sentence example"
    }}
  ]
}}
""".strip()


SINGLE_QUESTION_SYSTEM = (
    "You are a product strategy analyst. Return ONLY valid JSON for ONE follow-up question. "
    "Put all requested detail in the question field. ask_for must be []. example_answer: 2-4 sentences."
)


def _strip_ask_for(question: MarketQAQuestion) -> MarketQAQuestion:
    return question.model_copy(update={"ask_for": []})


def _fallback_one_question(
    description: str,
    product_type: str,
    index: int,
    target_count: int,
    existing_ids: set[str],
) -> MarketQAQuestion:
    slots = priority.plan_question_slots(description, target_count)
    topic_id = slots[min(index, len(slots) - 1)]
    priority_map = priority.priority_fallback_questions()
    if topic_id in priority_map:
        q = _strip_ask_for(priority_map[topic_id].model_copy(deep=True))
        if q.id in existing_ids:
            q = q.model_copy(update={"id": f"{q.id}_{index + 1}"})
        return q
    for fq in _supplemental_fallback_questions(product_type):
        if fq.id not in existing_ids:
            return _strip_ask_for(fq.model_copy(deep=True))
    return MarketQAQuestion(
        id=f"follow_up_{index + 1}",
        question=(
            "What else should we know to strengthen the business analysis—key assumptions, "
            "biggest risks, and your next milestone?"
        ),
        ask_for=[],
        why="Captures remaining context.",
        example_answer="Assumption: buyers want faster reporting. Risk: long sales cycles. Milestone: 5 pilot customers in 90 days.",
    )


def _single_question_prompt(
    description: str,
    product_type: str,
    index: int,
    target_count: int,
    existing: list[MarketQAQuestion],
) -> str:
    pt = product_type.strip() or "Not specified yet (infer from description if helpful)"
    slot_id = priority.plan_question_slots(description, target_count)[
        min(index, target_count - 1)
    ]
    focus = priority.slot_focus_hint(slot_id)
    prev = "\n".join(f"- {q.question}" for q in existing) or "(none yet)"
    return f"""
Idea Description:
{description}

Product Type:
{pt}

{priority.priority_prompt_section(description)}

Generate exactly ONE follow-up question (index {index + 1} of {target_count}).
Primary focus for this question: {focus}
Preferred id: {slot_id}

Do NOT repeat or paraphrase these earlier questions:
{prev}

Return JSON:
{{
  "id": "{slot_id}",
  "question": "2-4 sentences; weave in what you need (segment, metrics, etc.) in the question itself",
  "ask_for": [],
  "why": "short reason",
  "example_answer": "sample answer"
}}
""".strip()


async def generate_one_question(
    description: str,
    product_type: str,
    index: int,
    target_count: int,
    existing: list[MarketQAQuestion],
) -> MarketQAQuestion:
    target_count = max(MIN_QUESTIONS, min(MAX_QUESTIONS, target_count))
    index = max(0, min(index, target_count - 1))
    existing_ids = {q.id for q in existing}

    try:
        content = await chat_completion(
            messages=[
                {"role": "system", "content": SINGLE_QUESTION_SYSTEM},
                {
                    "role": "user",
                    "content": _single_question_prompt(
                        description, product_type, index, target_count, existing
                    ),
                },
            ],
            json_mode=True,
            max_tokens=700,
        )
        raw = json.loads(content)
        if isinstance(raw, dict):
            payload = raw if "ask_for" in raw or "askFor" in raw else raw.get("question", raw)
            if not isinstance(payload, dict):
                raise ValueError("invalid question payload")
            parsed = _strip_ask_for(MarketQAQuestion.model_validate(payload))
            if parsed.id in existing_ids:
                parsed = parsed.model_copy(update={"id": f"{parsed.id}_{index + 1}"})
            return parsed
    except (LLMNotConfiguredError, LLMTimeoutError, LLMServiceError, Exception):
        pass

    return _fallback_one_question(
        description, product_type, index, target_count, existing_ids
    )


async def generate_questions(description: str, product_type: str) -> list[MarketQAQuestion]:
    try:
        content = await chat_completion(
            messages=[
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": _prompt(description, product_type)},
            ],
            json_mode=True,
            max_tokens=2400,
        )
    except (LLMNotConfiguredError, LLMTimeoutError, LLMServiceError):
        return _ensure_min_questions([], product_type, description)

    try:
        raw = json.loads(content)
        questions = raw.get("questions") if isinstance(raw, dict) else None
        if not isinstance(questions, list) or len(questions) == 0:
            return _ensure_min_questions([], product_type, description)
        parsed = [_strip_ask_for(MarketQAQuestion.model_validate(q)) for q in questions]
        return _ensure_min_questions(parsed, product_type, description)
    except Exception:
        return _ensure_min_questions([], product_type, description)

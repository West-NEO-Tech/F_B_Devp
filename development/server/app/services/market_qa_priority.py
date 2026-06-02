"""Priority rules for Market Info Q&A question generation."""

from __future__ import annotations

import re
from typing import NamedTuple

from app.schemas.market_qa import MarketQAQuestion


class PriorityTopic(NamedTuple):
    id: str
    label: str
    patterns: tuple[str, ...]


PRIORITY_TOPICS: tuple[PriorityTopic, ...] = (
    PriorityTopic(
        "target_market",
        "Target Market",
        (
            r"\btarget market\b",
            r"\bmarket size\b",
            r"\bTAM\b",
            r"\bSAM\b",
            r"\bgeograph",
            r"\b(region|country|countries|global|local)\b",
            r"\bvertical\b",
            r"\bindustry vertical\b",
            r"\bmarket segment\b",
            r"目标市场",
            r"市场范围",
        ),
    ),
    PriorityTopic(
        "target_audience",
        "Target Audience",
        (
            r"\btarget audience\b",
            r"\bcustomer persona\b",
            r"\bICP\b",
            r"\bideal customer\b",
            r"\bend user\b",
            r"\bprimary buyer\b",
            r"\bpersona\b",
            r"\bdemographic\b",
            r"\bcustomer segment\b",
            r"目标用户",
            r"目标受众",
            r"用户画像",
        ),
    ),
    PriorityTopic(
        "pricing",
        "Pricing",
        (
            r"\bpricing\b",
            r"\bprice point\b",
            r"\bmonetiz",
            r"\bsubscription\b",
            r"\bfreemium\b",
            r"\bARPU\b",
            r"\bMRR\b",
            r"\$\d",
            r"\bper seat\b",
            r"\bper user\b",
            r"\brevenue model\b",
            r"定价",
            r"收费",
            r"价格",
        ),
    ),
    PriorityTopic(
        "competitors",
        "Competitors",
        (
            r"\bcompetitor",
            r"\bcompetition\b",
            r"\balternative(s)?\b",
            r"\bincumbent\b",
            r"\bvs\.?\s",
            r"\bcompared to\b",
            r"\bcompetitive landscape\b",
            r"竞品",
            r"竞争对手",
        ),
    ),
)

TOPIC_MATCH_HINTS: dict[str, tuple[str, ...]] = {
    "target_market": (
        "target_market",
        "target market",
        "geography",
        "region",
        "vertical",
        "market size",
        "tam",
        "segment",
    ),
    "target_audience": (
        "target_audience",
        "target audience",
        "persona",
        "buyer",
        "icp",
        "customer",
        "end user",
        "demographic",
    ),
    "pricing": ("pricing", "price", "monetiz", "subscription", "revenue model", "arpu"),
    "competitors": ("competitor", "competition", "alternative", "incumbent", "versus"),
}


def _topic_mentioned(description: str, patterns: tuple[str, ...]) -> bool:
    return any(re.search(p, description, re.IGNORECASE) for p in patterns)


def analyze_description_coverage(description: str) -> tuple[list[str], list[str]]:
    """Return (missing_topic_ids, covered_topic_ids) in priority order."""
    text = description.strip()
    if not text:
        return [t.id for t in PRIORITY_TOPICS], []

    missing: list[str] = []
    covered: list[str] = []
    for topic in PRIORITY_TOPICS:
        if _topic_mentioned(text, topic.patterns):
            covered.append(topic.id)
        else:
            missing.append(topic.id)
    return missing, covered


def topic_label(topic_id: str) -> str:
    for topic in PRIORITY_TOPICS:
        if topic.id == topic_id:
            return topic.label
    return topic_id


def priority_prompt_section(description: str) -> str:
    missing, covered = analyze_description_coverage(description)
    missing_labels = [topic_label(t) for t in missing]
    covered_labels = [topic_label(t) for t in covered]

    if missing:
        return f"""
Priority rule (MANDATORY — Market Info Q&A):
The description does NOT adequately cover these topics: {", ".join(missing_labels)}.
- You MUST allocate question slots to the missing topics FIRST, in this order: {", ".join(missing_labels)}.
- Use question ids when possible: {", ".join(missing)} (one id per topic).
- Do NOT ask redundant questions for topics already covered: {", ".join(covered_labels) or "none"}.
- After all missing priority topics have a dedicated question, use any remaining slots for the highest-value supplemental business-analysis gaps (GTM, metrics, differentiation, constraints, etc.).
""".strip()

    return """
Priority rule (MANDATORY — Market Info Q&A):
The description already mentions Target Market, Target Audience, Pricing, and Competitors.
- Do NOT ask questions that only repeat those four topics.
- Focus every question on the highest-priority supplemental gaps needed for business analysis (e.g. problem depth, GTM, traction, unit economics, moat, risks).
""".strip()


def _question_matches_topic(question: MarketQAQuestion, topic_id: str) -> bool:
    blob = f"{question.id} {question.question} {' '.join(question.ask_for)}".lower()
    return any(hint in blob for hint in TOPIC_MATCH_HINTS.get(topic_id, ()))


def reorder_questions_by_priority(
    questions: list[MarketQAQuestion], description: str
) -> list[MarketQAQuestion]:
    missing, _ = analyze_description_coverage(description)
    if not missing:
        return questions

    def sort_key(q: MarketQAQuestion) -> tuple[int, str]:
        for index, topic_id in enumerate(missing):
            if q.id == topic_id or _question_matches_topic(q, topic_id):
                return (index, q.id)
        return (len(missing), q.id)

    return sorted(questions, key=sort_key)


def priority_fallback_questions() -> dict[str, MarketQAQuestion]:
    return {
        "target_market": MarketQAQuestion(
            id="target_market",
            question=(
                "Which target market will you pursue first—geography, industry vertical, "
                "and segment size—and why is that wedge winnable now?"
            ),
            ask_for=[
                "Primary geography and industry/vertical focus",
                "Segment definition (company size, maturity, regulation, etc.)",
                "Why this market is attractive and reachable in the next 12 months",
            ],
            why="Target market scopes TAM, positioning, and GTM.",
            example_answer=(
                "US mid-market healthcare providers (50–500 beds) in states with new "
                "interoperability mandates; wedge is understaffed IT teams facing 2026 deadlines."
            ),
        ),
        "target_audience": MarketQAQuestion(
            id="target_audience",
            question=(
                "Who is your target audience in detail—economic buyer, end users, and the "
                "situation where they feel the problem most?"
            ),
            ask_for=[
                "Primary persona(s): role, seniority, and organization context",
                "Buyer vs user if different, and who influences the purchase",
                "Trigger moments, jobs-to-be-done, and willingness to adopt",
            ],
            why="Audience definition drives messaging, channels, and product scope.",
            example_answer=(
                "Buyer: Director of Clinical Ops; users: nurses + analysts; trigger: monthly "
                "quality reporting crunch; adoption when errors threaten accreditation."
            ),
        ),
        "pricing": MarketQAQuestion(
            id="pricing",
            question=(
                "How will you price the product—model, price band, and what value metric "
                "justifies that price versus alternatives?"
            ),
            ask_for=[
                "Pricing model (subscription, usage, transaction, etc.) and rough price range",
                "Who pays and which budget line the purchase comes from",
                "Value metric or ROI anchor used to defend the price",
            ],
            why="Pricing underpins revenue model and positioning.",
            example_answer=(
                "$8k/year per site + $15/active user/mo; paid from clinical ops budget; "
                "ROI anchored on 20 hours/month analyst time saved."
            ),
        ),
        "competitors": MarketQAQuestion(
            id="competitors",
            question=(
                "Who are your main competitors or alternatives today, and how will you "
                "differentiate on dimensions customers actually care about?"
            ),
            ask_for=[
                "Direct competitors and substitute workflows (including DIY/status quo)",
                "Their strengths and where they fall short for your audience",
                "Your differentiation: feature, speed, cost, trust, or distribution",
            ],
            why="Competitive context shapes positioning and win strategy.",
            example_answer=(
                "Epic modules + Excel; Epic is trusted but slow to customize; we win on "
                "2-week deployment and nurse-friendly UX at 40% lower TCO for mid-market."
            ),
        ),
    }


SUPPLEMENTAL_SLOT_IDS: tuple[str, ...] = (
    "core_problem",
    "value_metric",
    "go_to_market",
    "constraints",
    "differentiation",
)


def plan_question_slots(description: str, target_total: int) -> list[str]:
    """Ordered topic ids for incremental question generation (index → slot)."""
    missing, _ = analyze_description_coverage(description)
    slots: list[str] = []
    for topic_id in missing:
        if len(slots) >= target_total:
            break
        slots.append(topic_id)
    for topic_id in SUPPLEMENTAL_SLOT_IDS:
        if len(slots) >= target_total:
            break
        slots.append(topic_id)
    while len(slots) < target_total:
        slots.append(f"supplemental_{len(slots)}")
    return slots[:target_total]


def slot_focus_hint(topic_id: str) -> str:
    if topic_id in priority_fallback_questions():
        return topic_label(topic_id)
    hints = {
        "core_problem": "Core problem and current alternatives",
        "value_metric": "Measurable customer value and proof",
        "go_to_market": "Go-to-market and first customers",
        "constraints": "Constraints (team, budget, compliance)",
        "differentiation": "Differentiation and moat",
    }
    return hints.get(topic_id, "Important business context")


def build_priority_ordered_fallback(
    product_type: str, description: str, supplemental: list[MarketQAQuestion]
) -> list[MarketQAQuestion]:
    """Fallback list: missing priority topics first, then supplemental questions."""
    missing, _ = analyze_description_coverage(description)
    priority_map = priority_fallback_questions()
    seen: set[str] = set()
    out: list[MarketQAQuestion] = []

    for topic_id in missing:
        q = priority_map[topic_id]
        out.append(q)
        seen.add(q.id)

    for q in supplemental:
        if q.id in seen:
            continue
        out.append(q)
        seen.add(q.id)

    return out

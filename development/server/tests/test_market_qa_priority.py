from app.services.market_qa_priority import (
    analyze_business_goal_coverage,
    analyze_description_coverage,
    needs_simulation_business_goal_question,
    plan_question_slots,
    reorder_questions_by_priority,
    SIMULATION_BUSINESS_GOAL_SLOT_ID,
)
from app.schemas.market_qa import MarketQAQuestion


def test_missing_priority_topics_detected():
    missing, covered = analyze_description_coverage(
        "A B2B SaaS for workflow automation with strong product-market fit."
    )
    assert "target_market" in missing
    assert "target_audience" in missing
    assert "pricing" in missing
    assert "competitors" in missing
    assert covered == []


def test_covered_topics_not_requested_again():
    desc = (
        "Target market: US healthcare mid-market. "
        "Target audience: clinical ops directors. "
        "Pricing: $8k/site/year. "
        "Competitors: Epic and Excel."
    )
    missing, covered = analyze_description_coverage(desc)
    assert missing == []
    assert len(covered) == 4


def test_reorder_puts_missing_topics_first():
    missing_desc = "We build an AI copilot for sales teams."
    questions = [
        MarketQAQuestion(
            id="go_to_market",
            question="GTM?",
            ask_for=["channels"],
            example_answer="LinkedIn",
        ),
        MarketQAQuestion(
            id="target_market",
            question="Market?",
            ask_for=["geo"],
            example_answer="US",
        ),
        MarketQAQuestion(
            id="pricing",
            question="Price?",
            ask_for=["model"],
            example_answer="$99/mo",
        ),
    ]
    ordered = reorder_questions_by_priority(questions, missing_desc)
    assert ordered[0].id == "target_market"
    assert ordered[1].id == "pricing"


def test_business_goal_missing_reserves_last_slot():
    desc = "We build an AI copilot for sales teams."
    assert analyze_business_goal_coverage(desc) == "missing"
    assert needs_simulation_business_goal_question(desc)
    slots = plan_question_slots(desc, 5)
    assert slots[-1] == SIMULATION_BUSINESS_GOAL_SLOT_ID


def test_business_goal_vague_reserves_last_slot():
    desc = "A pet app for market validation and product-market fit."
    assert analyze_business_goal_coverage(desc) == "vague"
    slots = plan_question_slots(desc, 4)
    assert slots[-1] == SIMULATION_BUSINESS_GOAL_SLOT_ID


def test_business_goal_clear_no_reserved_slot():
    desc = (
        "Target market: US SMB. Our simulation goal is to validate willingness to pay "
        "$99/mo before we launch paid beta."
    )
    assert analyze_business_goal_coverage(desc) == "clear"
    assert not needs_simulation_business_goal_question(desc)
    slots = plan_question_slots(desc, 5)
    assert SIMULATION_BUSINESS_GOAL_SLOT_ID not in slots

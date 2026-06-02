# Market Info Q&A — Question Priority Rules

The Market Info step generates follow-up questions from the project **description** and **product type**. Question selection follows a fixed priority.

## Priority topics (ask first if missing)

| Order | Topic | What “mentioned” means (examples) |
|------:|-------|-----------------------------------|
| 1 | **Target Market** | Geography, vertical, segment, TAM/SAM, “target market” |
| 2 | **Target Audience** | Persona, ICP, buyer, end user, “target audience” |
| 3 | **Pricing** | Model, price points, subscription, monetization |
| 4 | **Competitors** | Named competitors, alternatives, competitive landscape |

Detection uses keyword/heuristic matching on the **base description** (content before `### Market Info (Q&A)`).

## Behavior

1. **Any priority topic missing** → generate questions for missing topics **first**, in the table order. Use remaining slots (3–5 total) for supplemental business-analysis questions.
2. **All four covered** → do **not** ask redundant questions on those topics; focus entirely on supplemental gaps (GTM, unit economics, differentiation, constraints, traction, etc.).

## API

**Incremental (wizard UI):** `POST /api/market-qa/questions/one` — body `{ description, productType, index, targetCount, existingQuestions }`. Returns a single question; the frontend chains calls so Q1 appears quickly while the user answers.

**Batch (legacy):** `POST /api/market-qa/questions` — body `{ description, productType }` returns all questions at once.

Server applies rules in `app/services/market_qa_priority.py` and `app/services/market_qa_service.py`.

## For developers

- Cursor rule: `development/.cursor/rules/market-info-questions.mdc`
- Tests: `development/server/tests/test_market_qa_priority.py`

"""Parse Market Info Q&A embedded in project descriptions."""

from __future__ import annotations

import re

MARKET_QA_MARKER = "### Market Info (Q&A)"
_QA_BLOCK_PATTERN = re.compile(
    r"-\s*Q:\s*(.+?)\n\s*A:\s*(.+?)(?=\n-\s*Q:|\s*$)",
    re.DOTALL,
)


def base_description(description: str | None) -> str:
    if not description:
        return ""
    idx = description.find(MARKET_QA_MARKER)
    return (description[:idx] if idx >= 0 else description).strip()


def parse_additional_information(description: str | None) -> list[dict[str, str]]:
    if not description or MARKET_QA_MARKER not in description:
        return []

    section = description[description.find(MARKET_QA_MARKER) + len(MARKET_QA_MARKER) :].strip()
    if not section:
        return []

    entries: list[dict[str, str]] = []
    for question, answer in _QA_BLOCK_PATTERN.findall(section):
        q, a = question.strip(), answer.strip()
        if q and a:
            entries.append({"question": q, "answer": a})
    return entries

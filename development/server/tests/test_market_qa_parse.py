from app.services.market_qa_parse import base_description, parse_additional_information


def test_base_description_strips_qa_block():
    text = "Core idea.\n\n### Market Info (Q&A)\n\n- Q: Q1\n  A: A1\n"
    assert base_description(text) == "Core idea."


def test_parse_additional_information():
    text = (
        "Core.\n\n### Market Info (Q&A)\n\n"
        "- Q: First question?\n"
        "  A: First answer.\n\n"
        "- Q: Second?\n"
        "  A: Second answer.\n"
    )
    items = parse_additional_information(text)
    assert len(items) == 2
    assert items[0]["question"] == "First question?"
    assert items[1]["answer"] == "Second answer."

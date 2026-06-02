from app.llm.prompts import build_seed_builder_prompt, seed_builder_max_tokens


def test_seed_builder_prompt_counts_by_depth():
    quick = build_seed_builder_prompt(
        project_name="P",
        description="Core idea",
        product_type="SaaS",
        target_market=None,
        target_audience=None,
        pricing_model=None,
        competitors=None,
        agent_depth="quick",
        agent_distribution=None,
    )
    assert "exactly 2 competitors" in quick
    assert "3 personas" in quick
    assert seed_builder_max_tokens("quick") == 900


def test_seed_builder_context_truncation():
    from app.models.project import Project
    from app.services.seed_builder_service import _project_context_for_seed

    long_core = "x" * 3000
    qa_block = (
        "\n\n### Market Info (Q&A)\n\n"
        "- Q: Who is the buyer?\n  A: " + ("y" * 500) + "\n"
    )
    project = Project(name="T", description=long_core + qa_block)
    ctx = _project_context_for_seed(project)
    assert len(ctx) < len(long_core) + len(qa_block)
    assert "Market research Q&A" in ctx

# Design: 004 llm-integration

> Date: 2026-03-29
> Status: Draft
> Phase: P1 — 用户输入 → 种子材料生成

---

## 目标

将 `POST /api/projects/{id}/ai-complete` 从 stub 模板切换为真实 LLM 调用。通过 `AsyncOpenAI` SDK + 环境变量统一入口，本地用 LiteLLM 代理 GitHub Copilot（$0），生产用 OpenRouter。

**不在范围内**：Credit / 计费系统、前端改动、种子材料生成。

---

## 完整 spec 文件

详见 [specs/004-llm-integration/spec.md](/specs-archive/004-llm-integration/spec.md)

# AI 商业化架构方案

> 平台托管 AI 的技术方案
> 2026-03-29

---

## 一、工具调研

实现平台托管 LLM 的可选工具：

| 工具 | Stars | 核心能力 | 局限 |
|------|-------|---------|------|
| [**LiteLLM**](https://github.com/BerriAI/litellm) | 41.4k | Proxy Server：OpenAI 兼容 API，Virtual Keys（per-user 预算），花费追踪，Admin UI。需 PostgreSQL。也支持作为 Python SDK 直接调用。 | 自建方案需部署运维，P95 ~8ms |
| [**Portkey Gateway**](https://github.com/portkey-ai/gateway) | 11.1k | TypeScript，<1ms / 122KB。retry / fallback / 负载均衡 / guardrails | 开源版无 Key 管理和花费追踪（需 Enterprise） |
| [**OpenRouter**](https://openrouter.ai) | SaaS | 300+ 模型，自动 fallback，response 返回 `usage.cost`（USD），5.5% 平台费 | 无 per-user 预算控制，只有平台级统计 |
| [**aisuite**](https://github.com/andrewyng/aisuite) | 13.7k | Andrew Ng 出品，Python SDK，统一多 provider 调用 | 纯客户端库，无 gateway / key 管理 |

**选型结论**：

- **生产 API 供应商 → OpenRouter**：零改造（现有 `AsyncOpenAI` 直接兼容），response 自带 `cost` 精确到美元，5.5% 手续费可忽略（单次对话 < $0.003）
- **开发免费调用 → LiteLLM SDK**：本地 `litellm --model github/gpt-4o --port 4000` 代理 GitHub Copilot，暴露 OpenAI 兼容 API，开发成本 $0
- **未来 per-user 预算控制 → LiteLLM Proxy**：当需要 Virtual Keys（per-user 预算 / 花费追踪 / Admin UI）时，部署 LiteLLM Proxy 替代自建 Credit 系统

---

## 二、推荐方案

### 统一入口架构

所有环境（开发 / 生产）使用同一个调用方式，通过环境变量切换后端：

```
AsyncOpenAI(base_url=LLM_BASE_URL, api_key=LLM_API_KEY)
```

| 环境 | `LLM_BASE_URL` | `LLM_API_KEY` | 成本 |
|------|----------------|---------------|------|
| 本地开发 | `http://localhost:4100`（LiteLLM → Copilot） | 任意 | $0 |
| CI/pytest | LiteLLM 或 `unittest.mock.patch` | - | $0 |
| Production | `https://openrouter.ai/api/v1` | 平台 OpenRouter Key | 真实计费 |

代码里没有 `if mode == "mock"` 的分支。一个入口，一个出口，环境变量决定行为。

### 商业模式

用 **Credit 积分** 对用户屏蔽 token 概念（1 Credit ≈ $0.01）：

| 操作类型 | 建议定价 |
|---------|---------|
| `chat_message` | 2 credits |
| `chat_message_multimodal`（含截图） | 5 credits |
| `quick_analysis` | 8 credits |
| `decision_checklist` | 5 credits |
| `concept_explain` | 3 credits |
| `memory_extraction` / `soul_update` | 0（免费，增强粘性） |

套餐初期只开放 Free（50 credits/月）+ Pro（$29.99 / 2000 credits/月），验证 PMF 后再细分。

---

## 三、技术改造

### 3.1 改造后请求流程

```
用户发消息 → POST /api/v1/chat/stream
    → CreditService：检查余额，预扣减
    → get_llm_client()：从 LLM_BASE_URL + LLM_API_KEY 创建 AsyncOpenAI client
    → ChatLoop.execute()（不变）
    → UsageService：从 response.usage.cost 结算，修正预扣减，写 usage_records
```

### 3.2 `get_llm_client()` 改造

```python
def get_llm_client() -> AsyncOpenAI:
    # 环境变量驱动（开发 = LiteLLM，生产 = OpenRouter）
    client = AsyncOpenAI(
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url,
    )
    return client
```

### 3.3 新增数据模型（5 张表）

| 表 | 用途 |
|----|------|
| `user_credits` | 用户 Credit 余额 |
| `user_subscriptions` | 用户订阅套餐 |
| `ai_operation_types` | AI 操作定义 + Credit 单价 |
| `usage_records` | 每次 AI 调用的 token / cost / credit 记录 |
| `credit_transactions` | Credit 变动流水（充值/扣减/退款） |

### 3.4 改动范围

**后端改动**：

| 文件 | 改动 |
|------|------|
| `config.py` | +3 个环境变量（`LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL`） |
| `llm_client.py` | `get_llm_client()` 改为环境变量驱动 |
| `chat_loop.py` | 流结束后调 `UsageService.record_usage()` |
| `chat.py` | 请求前调 `CreditService.check_and_deduct()` |
| 新增 `credit_service.py` | 余额查询 / 预扣减 / 修正 |
| 新增 `usage_service.py` | 用量记录 + 结算 |
| 新增 `models/credit.py` + migration | 5 张表 |
| 新增 `api/v1/credits.py` | Credit 查询 / 套餐 API |

**前端改动**：

| 改动 |
|------|
| 隐藏 Provider 设置页 |
| 新增 Credit 余额显示（StatusBar / ChatDrawer） |
| 新增套餐/充值页 |

**不变的部分**：前端 Chat UI、SSE 协议、ContextAssembly、PromptBuilder、SessionManager、ChatLoop 核心流程。

---

## 四、实施路径

### Phase A — 统一 LLM 入口（spec-012，立即可做）

- `config.py` 新增 `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL`
- `get_llm_client()` 改为环境变量驱动
- 本地 LiteLLM 代理 Copilot 验证端到端流程
- **零风险**：对现有功能无影响，只是 Key 来源从用户 DB 改为环境变量
- **收益**：所有后续 AI spec 可免费端到端测试

### Phase B — Credit 系统（在 L2-L3 开发前）

- 5 张表 + Alembic 迁移
- CreditService + UsageService
- Chat 端点增加配额检查
- 用量记录（读 OpenRouter `response.usage`）

### Phase C — 商业化完善（上线前）

- 套餐/充值 UI + Stripe 支付
- 用量仪表盘

### 远期：LiteLLM Proxy 替代自建 Credit

当用户规模增长，需要 per-user 预算控制时，可部署 LiteLLM Proxy 作为 gateway：
- Virtual Key 的 `max_budget` 替代自建的 Credit 余额逻辑
- 内置 Spend Tracking 替代自建的 `usage_records`
- Admin Dashboard 替代自建的运营后台
- 我们的 Credit 系统精简为一层 "Credit ↔ USD" 换算

---

## 五、环境配置参考

```bash
# .env（本地开发）
LLM_BASE_URL=http://localhost:4100
LLM_API_KEY=sk-anything
LLM_MODEL=gpt-4o

# .env.production（生产）
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=sk-or-v1-production-key
LLM_MODEL=deepseek/deepseek-chat-v3-0324
```

```bash
# 本地启动 LiteLLM（代理 Copilot 免费模型）
pip install litellm
litellm --model github/gpt-4o --port 4000
```

OpenRouter 平台 Key：在 [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys) 创建，可设 Credit Limit 防失控。开发阶段充值 $10 可用数月。

### 模型成本参考（OpenRouter 2026-03）

| 模型 | 典型单次对话成本 |
|------|----------------|
| DeepSeek V3 | ~$0.001-0.005 |
| Gemini 2.5 Flash | ~$0.001-0.003 |
| GPT-4o | ~$0.01-0.03 |
| Claude Sonnet 4 | ~$0.02-0.05 |

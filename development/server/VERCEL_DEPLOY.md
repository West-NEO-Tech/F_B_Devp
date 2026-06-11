# 部署到 Vercel

把 FastAPI 后端作为 Vercel Serverless Function 部署。

## 文件结构

```
server/
├── api/index.py        # Vercel 入口，导出 FastAPI app
├── vercel.json         # Vercel 配置 (Python runtime + rewrites)
├── requirements.txt    # 已精简，移除 uvloop/httptools/watchfiles/websockets/redis
└── app/                # FastAPI 应用代码
```

## 部署步骤

### 1. 创建独立的 Vercel 项目

不要复用前端的 Vercel 项目。在 Vercel Dashboard 新建项目：

- **Root Directory**: `development/server`
- **Framework Preset**: Other
- **Build Command**: 留空（Vercel 自动识别 Python）
- **Output Directory**: 留空

### 2. 配置环境变量

在 Vercel 项目的 Settings → Environment Variables 添加：

| 变量名 | 值 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | Neon/Supabase 的 `postgresql://...` 连接串 | 用 **pooler/transaction mode** 端点（Serverless 不能持有连接）|
| `LLM_BASE_URL` | `https://openrouter.ai/api/v1` | OpenRouter / 其他 OpenAI 兼容入口 |
| `LLM_API_KEY` | `sk-or-...` | 对应的 API Key |
| `LLM_MODEL` | `openai/gpt-4o-mini` | 模型名 |
| `CORS_ORIGINS` | `["https://你的前端.vercel.app"]` | JSON 数组字符串 |
| `SKIP_SEED` | `true` | Serverless 冷启动跳过 seed（**迁移仍会自动执行**） |
| `LOG_LEVEL` | `INFO` | 可选 |

⚠️ **Neon 连接串注意**: 使用 `*-pooler.*.neon.tech` 的 host，并在末尾加 `?sslmode=require`。
代码 (`app/config.py`) 会自动把 `postgresql://` 转成 `postgresql+asyncpg://`。

### 3. 数据库迁移

**默认行为（推荐）**：

1. **部署时**：`vercel.json` 的 `buildCommand` 会执行 `python -m app.migrate`（需 Vercel 环境变量里已配置 `DATABASE_URL`）。
2. **运行时**：每个 Serverless 实例在**首个 API 请求**时也会再跑一次 `alembic upgrade head`（防止 lifespan 未触发）。

部署新代码后，Generate Pre-Simulation Display 不应再因 `agent_depth` / `custom` 报迁移错误。

若仍报 schema 相关 503，可在本地对**生产库**手动执行一次：

```bash
cd development/server
export DATABASE_URL='你的生产连接串（与 Vercel 环境变量相同）'
uv run alembic upgrade head
```

Agent templates seed 为可选（通常仅首次需要），见 `seed/agent_templates.py`。

### 4. 部署

```bash
cd development/server
vercel --prod
```

或直接 push 到 Vercel 关联的 git 分支。

### 5. 更新前端 rewrites

部署成功后拿到后端域名（例如 `bizsim-api.vercel.app`），把 `development/vercel.json` 里的 `/api/:path*` rewrite 改成新域名：

```json
{
  "source": "/api/:path*",
  "destination": "https://bizsim-api.vercel.app/api/:path*"
}
```

## 已知限制

1. **冷启动**: 每个新实例首次请求会慢 2-5 秒（加载 Python + asyncpg）
2. **数据库连接**: 必须用 connection pooler，否则会很快耗尽 DB 连接数
3. **超时 60s**: `vercel.json` 已设 `maxDuration: 60`（Pro 计划上限）。Hobby 计划是 10s，需要降级或升级
4. **Redis**: 已从依赖移除。如果以后要加缓存，用 **Upstash Redis**（HTTP-based）
5. **Lifespan seed**: 已通过 `SKIP_SEED=true` 关闭，改成手动跑

## 本地开发

本地仍按原方式：
```bash
uv run uvicorn app.main:app --reload --port 8100
```

`SKIP_SEED` 不设置时（默认 `false`），lifespan 仍会做 seed。

## 回滚

如果 Vercel 部署有问题，前端的 `development/vercel.json` 还指向 Render 的 `https://f-b-devp.onrender.com`，不切换前端的 rewrite 就不影响生产。

# BizSim — 商业验证模拟平台

基于多 Agent 模拟的商业验证平台。用户描述商业想法，AI Agent 模拟消费者、投资人、竞品等角色对话验证，输出结构化分析报告。当前为 **MVP / POC 阶段**。

---

## 技术栈

| 层 | 选型 |
|----|------|
| 前端 | React 18 · TypeScript · Vite 5 · Tailwind · shadcn/ui · TanStack Query · wouter |
| 后端 | FastAPI · async SQLAlchemy 2.0 · Pydantic v2 · PostgreSQL 16 · Alembic |
| LLM | AsyncOpenAI SDK → 本地 LiteLLM（代理 GitHub Copilot，$0）/ 生产 OpenRouter |
| 测试 | pytest（后端 48 个测试）· TypeScript 编译检查 |
| 包管理 | pnpm（前端）· uv（后端） |
| 容器 | Docker Compose（PostgreSQL + Redis） |

---

## 首次搭建

> 本仓库根目录为 `BizSim/`，包含 `business/`（商业文档）和 `development/`（产品代码）两个子目录。
> 前端命令在 `development/` 目录下，后端命令在 `development/server/` 目录下。

### 前置条件

| 工具 | 最低版本 | 安装 |
|------|---------|------|
| Docker Desktop | 24.0 | [docker.com](https://www.docker.com/products/docker-desktop/) |
| Node.js | 18 | [nodejs.org](https://nodejs.org/) |
| pnpm | 9 | `npm install -g pnpm` |
| Python | 3.13 | [python.org](https://www.python.org/) |
| uv | — | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |

### 1. 基础设施 + 后端

```bash
cd server
docker compose up -d db redis          # PostgreSQL :5434 + Redis :6379
cp .env.example .env                   # 默认值可直接用，无需修改
uv sync --dev --no-install-project     # 安装 Python 依赖
uv run alembic upgrade head            # 初始化数据库
uv run uvicorn app.main:app --reload --port 8100
```

验证：http://localhost:8100/docs （Swagger）、http://localhost:8100/api/health

### 2. 前端

另开终端，回到 `development/` 目录：

```bash
pnpm install && pnpm dev
```

打开 http://localhost:5173 。Vite 自动代理 `/api` → `localhost:8100`。

### 3. API 类型同步（可选）

后端 schema 变更后，保持后端运行，执行：

```bash
pnpm generate:types
```

---

## 日常开发

```bash
# 终端 1 — 基础设施（已在运行则跳过）
cd server && docker compose up -d db redis

# 终端 2 — 后端
cd server && uv run uvicorn app.main:app --reload --port 8100

# 终端 3 — 前端
pnpm dev

# 终端 4 — LLM 代理（可选，AI 补全功能需要）
./server/scripts/start-litellm.sh
```

---

## LLM 配置

通过环境变量切换 LLM 后端，应用代码无需改动：

| 环境 | `LLM_BASE_URL` | `LLM_API_KEY` | `LLM_MODEL` | 成本 |
|------|----------------|---------------|-------------|------|
| 本地 | `http://localhost:4100/v1` | 任意值 | `gpt-4o-mini` | $0 |
| 生产 | `https://openrouter.ai/api/v1` | OpenRouter Key | `deepseek/deepseek-chat-v3-0324` | 按量 |
| CI | 不设置 | — | — | $0（mock） |

### 本地 LLM（GitHub Copilot）

通过 [LiteLLM Proxy](https://docs.litellm.ai/docs/providers/github_copilot) 调用 GitHub Copilot，需要 Copilot 订阅，**无需 API key**。

启动方式（使用隔离 venv，不影响项目依赖）：

```bash
./server/scripts/start-litellm.sh
```

**首次运行**会自动创建 `~/.litellm-env/` 虚拟环境（约 30 秒），然后在终端打印验证码和链接：

```
First, copy your one-time code: XXXX-XXXX
Then visit: https://github.com/login/device
```

在浏览器打开链接，输入验证码，登录 GitHub 授权一次。凭证本地缓存，后续直接启动。

`.env` 中的默认值已可直接用：

```env
LLM_BASE_URL=http://localhost:4100/v1
LLM_API_KEY=sk-anything
LLM_MODEL=gpt-4o-mini
```

> 不配置 LLM 时 AI 补全端点返回 503，其他功能不受影响。

---

## 环境变量

`server/.env`（从 `.env.example` 复制）：

| 变量 | 默认值 | 说明 | 需填写？ |
|------|--------|------|---------|
| `DATABASE_URL` | `postgresql+asyncpg://...localhost:5434/bizsim` | PostgreSQL 连接串 | 否 |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis 连接串 | 否 |
| `LLM_BASE_URL` | 空 | LLM API 地址，空 = AI 补全 503 | **是**（如需 AI） |
| `LLM_API_KEY` | `sk-no-key` | LLM 密钥，本地填任意值 | **是**（如需 AI） |
| `LLM_MODEL` | `gpt-4o-mini` | 模型名称 | 否 |
| `LLM_TIMEOUT` | `60` | 请求超时（秒） | 否 |
| `LLM_MAX_TOKENS` | `2000` | 最大生成 token | 否 |
| `LLM_TEMPERATURE` | `0.7` | 采样温度 | 否 |
| `LOG_LEVEL` | `INFO` | 日志级别 | 否 |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | 前端跨域来源 | 否 |

---

## Docker Compose

| 服务 | 镜像 | 端口 | 说明 |
|------|------|------|------|
| `db` | `postgres:16-alpine` | 5434→5432 | PostgreSQL，数据持久化到 volume |
| `redis` | `redis:7-alpine` | 6379 | Redis 缓存 |
| `api` | 本地构建 | 8100 | FastAPI（日常建议用 `uv run` 直接跑，热重载更快） |

```bash
# 以下命令在 server/ 目录下
docker compose up -d db redis        # 推荐日常用法
docker compose down                  # 停止
docker compose down -v               # 停止并清空数据（慎用）
docker compose logs db               # 查看日志
```

---

## 常用命令速查

### 前端（`development/` 目录）

```bash
pnpm dev                             # 开发服务器
pnpm build                           # 生产构建
pnpm tsc --noEmit                    # 类型检查
pnpm generate:types                  # 同步 API 类型
```

### 后端（`server/` 目录）

```bash
uv run uvicorn app.main:app --reload --port 8100   # API 服务
uv run python -m pytest tests/ -v                  # 全部测试
uv run python -m pytest tests/test_projects.py -v  # 单文件测试
uv run ruff check app/ tests/ seed/                # Lint
uv run alembic upgrade head                        # 迁移
uv run alembic downgrade -1                        # 回滚
uv run alembic revision --autogenerate -m "描述"    # 新迁移
```

### 数据库

```bash
# 在 server/ 目录下
docker compose exec db psql -U bizsim              # PostgreSQL 控制台
docker compose down -v && uv run alembic upgrade head  # 重置数据库
```

---

## API 端点

完整交互式文档：http://localhost:8100/docs

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST/GET/PATCH/DELETE | `/api/projects[/{id}]` | 项目 CRUD（分页 + 筛选 + 软删除） |
| POST | `/api/projects/{id}/ai-complete` | AI 辅助字段补全 |
| POST/GET | `/api/projects/{id}/scenarios` | 场景 CRUD |
| GET/PATCH/DELETE | `/api/scenarios/{id}` | 场景详情 |
| POST/GET | `/api/scenarios/{id}/runs` | 运行 CRUD |
| GET/PATCH | `/api/runs/{id}` | 运行详情 |
| POST/GET/PATCH/DELETE | `/api/agent-templates[/{id}]` | Agent 模板（角色筛选） |

---

## 项目结构

```
business-validation-demo/           # 仓库根目录
├── business/                       # 商业文档（BP、竞品分析、产品定义等）
└── development/                    # 产品代码
    ├── src/                        # React 前端
    │   ├── pages/                  # 页面（列表、Wizard、详情）
    │   ├── components/ui/          # shadcn/ui 基础组件
    │   ├── hooks/                  # use-project 等自定义 hooks
    │   ├── lib/                    # API 客户端 + Query 配置
    │   └── types/                  # openapi-typescript 生成的类型
    ├── server/                     # FastAPI 后端
    │   ├── app/
    │   │   ├── models/             # SQLAlchemy ORM
    │   │   ├── schemas/            # Pydantic 请求/响应
    │   │   ├── routers/            # API 路由
    │   │   ├── services/           # 业务逻辑
    │   │   └── llm/                # LLM 客户端 + Prompts
    │   ├── alembic/                # 数据库迁移
    │   ├── scripts/                # 工具脚本（start-litellm.sh）
    │   ├── seed/                   # Agent 模板种子数据
    │   ├── tests/                  # pytest 测试（48 个）
    │   └── docker-compose.yml      # PostgreSQL + Redis + API
    └── docs/                       # 开发文档 + 路线图
```

---

## 已实现功能

| # | 功能 | 说明 |
|---|------|------|
| 001 | Backend Scaffold ✅ | FastAPI 骨架 + 4 实体 CRUD + 迁移 + 种子数据 |
| 002 | API Integration ✅ | 前端 mock → 真实 API 调用 |
| 003 | Project Wizard ✅ | 4 步创建引导 + AI 补全 + 项目详情 |
| 004 | LLM Integration ✅ | stub → 真实 LLM 调用（AsyncOpenAI + LiteLLM） |

详细路线图：[docs/开发路线图.md](docs/开发路线图.md)

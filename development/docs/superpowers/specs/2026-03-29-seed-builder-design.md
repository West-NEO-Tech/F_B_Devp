# Design: 005 Seed Builder

> Date: 2026-03-29
> Status: Draft
> Phase: P1 — 用户输入 → 种子材料生成

---

## 目标

实现 Phase 1 的最后一环：用户在项目详情页选择模拟深度、调整 Agent 分布，然后触发 LLM 生成种子材料（市场分析、竞品画像、消费者画像、讨论话题）。生成结果以摘要卡片展示，其中竞品和话题支持轻度编辑（增删）。

**不在范围内**：Agent 人设生成（Phase 2）、模拟运行（Phase 2）、报告生成（Phase 3）、WebSocket 实时推送。

---

## 设计决策摘要

| 决策 | 结论 |
|------|------|
| 侧边栏结构 | 极简 4 项：Dashboard / Projects / Agent Templates / Settings |
| 项目详情布局 | 纵向卡片式 journey，逐步解锁 |
| 页内导航 | 悬浮目录（类飞书/Jira），无边框，浮在内容区左侧 |
| 场景模型 | 单场景 UI + 模板起点 + Agent 分布可调 + 运行历史保留（不覆盖） |
| 种子材料展示 | 摘要式（市场数据 + tag 列表），可展开详情 |
| 种子材料编辑 | 竞品和讨论话题支持增删，其余只读 |
| Run History | 位于页面底部 |

---

## 一、侧边栏重构

### 现状问题

当前 `app-sidebar.tsx` 有 4 组 11 项导航，其中 Simulations / Validation / Viability / Reports 都依赖项目上下文，放在顶层侧边栏不合理。

### 目标结构

```
Navigation
  ├─ Dashboard        → /
  ├─ Projects         → /projects
  └─ Agent Templates  → /agents
System
  └─ Settings         → /admin
```

共 4 项。原来的 Simulations / Validation / Viability / Reports 功能全部内嵌到项目详情页（纵向 journey 卡片）。

### 路由清理

移除不再需要的顶层路由页面（或保留路由但 redirect 到 `/projects`）：

| 路由 | 处理 |
|------|------|
| `/simulations` | 移除或 redirect `/projects` |
| `/simulations/live` | 移除（Phase 2 再恢复为 `/projects/:id/simulation`） |
| `/validation` | 移除 |
| `/viability` | 移除 |
| `/reports` | 移除 |

保留的路由：`/`, `/projects`, `/projects/new`, `/projects/:id`, `/agents`, `/admin`。

---

## 二、项目详情页重构

### 整体布局

```
┌─────────────────────────────────────────────────┐
│  Floating TOC          Main Content (max ~780px) │
│  (sticky, no frame)                              │
│                                                  │
│  ○ Project Info     ┌──────────────────────────┐ │
│  ● Sim Config       │ Breadcrumb               │ │
│  ○ Seed Materials   │ Page Header + Badge      │ │
│  ○ Simulation 🔒    │                          │ │
│  ○ Report 🔒        │ [Card: Project Info]     │ │
│                     │ [Card: Sim Config]       │ │
│                     │ [Card: Seed Materials]   │ │
│                     │ [Card: Simulation] 🔒    │ │
│                     │ [Card: Report] 🔒        │ │
│                     │                          │ │
│                     │ ── Run History ──        │ │
│                     └──────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 悬浮目录（Floating TOC）

- 类似飞书文档的浮动大纲，`position: sticky; top: 24px`
- **无边框、无背景**（与页面底色一致）
- 每个步骤用小圆点标记状态：
  - 绿色实心 = 已完成
  - 蓝色实心 + 光晕 = 当前步骤（左侧 2px 蓝色竖线）
  - 灰色 + 降低不透明度 = 锁定
- 点击可平滑滚动到对应 section
- 实现方式：独立的 `ProjectStepNav` 组件，接收当前步骤状态

### 卡片 Journey

5 张卡片纵向排列，使用现有 shadcn `Card` / `CardHeader` / `CardContent`：

1. **Project Info** — 已完成时折叠为摘要行（product_type + market + audience + pricing），可展开查看/编辑完整信息
2. **Simulation Config** — 当前活跃步骤（本 spec 重点）
3. **Seed Materials** — 生成后显示摘要，部分可编辑
4. **Simulation** — 锁定，`opacity: 0.4; pointer-events: none`，显示 Phase 2 提示
5. **Report** — 锁定，Phase 3 提示

### 步骤解锁逻辑

```
Project Info (always unlocked, completed when project has name + product_type)
  → Simulation Config (unlocked when project info completed)
    → Seed Materials (unlocked after config saved; content appears after generation)
      → Simulation (locked, Phase 2)
        → Report (locked, Phase 3)
```

前端判断逻辑：读取 project 和 scenario 数据，计算每个步骤的状态（completed / active / locked）。

---

## 三、Simulation Config 卡片

### UI 结构

#### 深度选择器

三列卡片（Quick / Standard / Deep），选中态用 `border-color: primary` + `bg: accent`：

| 深度 | Agent 数 | 预估时间 | 说明 |
|------|---------|---------|------|
| Quick ⚡ | 20 | ~2 min | 快速验证核心假设 |
| Standard 🔬 | 100 | ~10 min | 完整市场反馈（推荐） |
| Deep 🔭 | 200 | ~30 min | 深度竞争分析 |

选择深度后，自动按模板分配 Agent 数量。

#### Agent 分布

8 个角色的数量输入（4×2 grid），每个角色一个 `<input type="number">`：

| 深度 | Consumer | Enterprise | Competitor | Investor | Supplier | Regulator | Expert | Mentor |
|------|----------|-----------|------------|----------|----------|-----------|--------|--------|
| Quick | 10 | 3 | 2 | 1 | 1 | 1 | 1 | 1 |
| Standard | 50 | 15 | 5 | 3 | 3 | 2 | 2 | 1 |
| Deep | 150 | 40 | 10 | 5 | 8 | 3 | 3 | 2 |

用户可手动修改数量。下方显示颜色比例条 + 总数汇总。

#### 操作按钮

- "Reset to Template" — 重置为当前深度的默认分布
- "Generate Seed Materials" — 保存配置 + 触发生成

### 数据流

1. 用户选择深度 → 前端计算默认 Agent 分布（纯前端模板）
2. 用户可选调整各角色数量
3. 点击 "Generate Seed Materials"：
   - 前端调用 `PATCH /api/scenarios/{id}`（保存 agent_depth, agent_count, market_config 含 agent_distribution）
   - 然后调用 `POST /api/scenarios/{id}/seed-materials`（触发生成）
4. 前端进入 loading 态，轮询或等待响应

### Scenario 创建时机

进入项目详情页时，前端调用 `GET /api/projects/{id}/scenarios`，取第一个；如果列表为空，自动调用 `POST` 创建默认 scenario（name="Default Simulation", agent_depth="standard"）。如果因早期 API 测试存在多个 scenario，始终以 `created_at` 最早的为准，忽略其余。这实现了"单场景 UI"的设计决策——用户不需要手动创建/管理场景。

---

## 四、Seed Materials 生成

### 新增后端模型：SeedMaterial

```python
class SeedMaterial(Base, BaseMixin):
    __tablename__ = "seed_materials"

    scenario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("simulation_scenarios.id"))
    version: Mapped[int] = mapped_column(default=1)  # 后端 POST 时查询 max(version)+1
    status: Mapped[str]  # 'generating' | 'completed' | 'failed'
    market_context: Mapped[dict | None]   # JSON: {market_size, growth_rate, key_stats, ...}
    competitors: Mapped[list | None]      # JSON: [{name, positioning, strengths, weaknesses}]
    consumer_personas: Mapped[list | None] # JSON: [{name, age_range, description, pain_points}]
    discussion_topics: Mapped[list | None] # JSON: [{topic, description, relevance}]
    raw_response: Mapped[dict | None]      # 原始 LLM 响应（调试用）
    error_message: Mapped[str | None]      # 失败时的错误信息
```

**关系**：`scenario` → `seed_materials`（一对多，支持运行历史）。

### 新增 API 端点

| Method | Path | 功能 |
|--------|------|------|
| POST | `/api/scenarios/{id}/seed-materials` | 触发种子材料生成 |
| GET | `/api/scenarios/{id}/seed-materials` | 获取该场景的种子材料列表（按 version desc） |
| GET | `/api/seed-materials/{id}` | 获取单个种子材料详情 |
| PATCH | `/api/seed-materials/{id}` | 更新种子材料（编辑竞品/话题） |

### 生成流程（同步 MVP）

MVP 阶段采用同步 LLM 调用（与 ai-complete 保持一致）：

1. `POST /api/scenarios/{id}/seed-materials` →
2. 后端创建 `SeedMaterial(status='generating')` 并 commit
3. 调用 LLM（`seed_builder_service.generate_seed_materials(scenario, project)`）
4. 成功 → 更新 `status='completed'`，填充 market_context / competitors / consumer_personas / discussion_topics
5. 失败 → 更新 `status='failed'`，填充 error_message
6. 返回 `SeedMaterialRead`

### LLM Prompt 设计

输入：项目信息（name, description, product_type, target_market, target_audience, pricing_model, competitors）+ 场景配置（agent_depth, agent_distribution）。

输出 JSON schema：

```json
{
  "market_context": {
    "market_size": "A$85M",
    "growth_rate": "+12%",
    "key_stats": [{"label": "Pet Households", "value": "3.2M"}],
    "summary": "..."
  },
  "competitors": [
    {"name": "Mad Paws", "positioning": "Market leader", "strengths": [...], "weaknesses": [...]}
  ],
  "consumer_personas": [
    {"name": "Urban Professional", "emoji": "🏙️", "age_range": "25-35", "description": "...", "pain_points": [...]}
  ],
  "discussion_topics": [
    {"topic": "Trust & Safety", "description": "...", "relevance": "high"}
  ]
}
```

使用 `response_format={"type": "json_object"}` 强制 JSON 输出，Pydantic 验证结果结构。

### 编辑支持

`PATCH /api/seed-materials/{id}` 接受 partial update：

```python
class SeedMaterialUpdate(CamelModel):
    competitors: list[dict] | None = None
    discussion_topics: list[dict] | None = None
```

仅允许这两个字段被编辑（其余需要 regenerate）。

---

## 五、Seed Materials 展示

### 摘要模式

4 个折叠区块（使用现有 `Card` 内的嵌套 section）：

1. **Market Context** — 3 个大数字（Market Size / Growth / Key Stat）+ "Details →" 展开
2. **Competitors** — tag 列表，每个 tag 可删除，底部 "+ Add" 按钮，标注 "· Can edit"
3. **Consumer Personas** — tag 列表（emoji + name），只读
4. **Discussion Topics** — tag 列表，可删除 + 添加，标注 "· Can edit"

### 详情展开

点击 section 或 "Details →" 展开完整内容：
- Market Context → 完整描述文本
- Competitors → 每个竞品的 strengths / weaknesses
- Consumer Personas → 完整描述 + pain points
- Discussion Topics → 描述 + relevance 标签

### 操作

- **Regenerate** 按钮（Card header 右侧）→ 重新调用 `POST /api/scenarios/{id}/seed-materials`，创建新 version
- 编辑操作实时调用 `PATCH /api/seed-materials/{id}`（debounced）

---

## 六、Run History

位于页面底部所有卡片之后，作为独立区域：

- 标题："Run History" + 时钟图标
- 空状态：虚线边框 + 引导文案 "No simulation runs yet."
- 有数据时：表格或卡片列表显示历史运行（version, status, created_at, summary excerpt）
- 005 阶段仅显示种子材料生成的历史（seed material versions），不涉及模拟运行

---

## 七、前端组件拆分

```
src/pages/project-detail.tsx        — 页面壳，编排以下组件
src/components/project/
  ├─ project-step-nav.tsx           — 悬浮目录（Floating TOC）
  ├─ project-info-card.tsx          — 已有，增加折叠/展开模式
  ├─ simulation-config-card.tsx     — 深度选择器 + Agent 分布
  ├─ seed-materials-card.tsx        — 种子材料摘要 + 编辑
  ├─ locked-step-card.tsx           — 锁定步骤通用占位
  └─ run-history-section.tsx        — 底部运行历史
src/hooks/
  ├─ use-scenario.ts                — useScenario(projectId), useUpdateScenario
  └─ use-seed-materials.ts          — useSeedMaterials, useGenerateSeedMaterials, useUpdateSeedMaterial
src/lib/
  └─ agent-templates.ts             — 深度 → Agent 分布的前端常量映射
```

### 新增 Hooks

```typescript
// use-scenario.ts
useProjectScenario(projectId: string)
  // GET /api/projects/{projectId}/scenarios → 取第一个，不存在则自动 POST 创建
useUpdateScenario(scenarioId: string)
  // PATCH /api/scenarios/{scenarioId}

// use-seed-materials.ts
useSeedMaterials(scenarioId: string)
  // GET /api/scenarios/{scenarioId}/seed-materials → latest version
useGenerateSeedMaterials(scenarioId: string)
  // POST /api/scenarios/{scenarioId}/seed-materials
useUpdateSeedMaterial(seedMaterialId: string)
  // PATCH /api/seed-materials/{seedMaterialId}
```

---

## 八、后端文件变更一览

| 文件 | 变更 |
|------|------|
| `app/models/seed_material.py` | 新增 SeedMaterial 模型 |
| `app/models/__init__.py` | 注册新模型 |
| `app/schemas/seed_material.py` | 新增 SeedMaterialRead / SeedMaterialUpdate |
| `app/services/seed_builder_service.py` | 新增 LLM 种子材料生成逻辑 |
| `app/routers/seed_materials.py` | 新增 4 个端点 |
| `app/routers/__init__.py` | 注册新路由 |
| `alembic/versions/xxx_add_seed_materials.py` | 数据库迁移 |
| `tests/test_seed_materials.py` | 新增测试 |
| `seed/seed_data.py` | 可选：添加示例种子材料数据 |

---

## 九、测试策略

### 后端

- `test_seed_materials.py`：
  - 创建场景 → POST 生成种子材料 → 验证 status='completed' + 字段非空
  - GET 种子材料列表 → 验证分页和排序
  - PATCH 编辑竞品/话题 → 验证只有允许的字段被更新
  - 重复 POST → 验证 version 递增
  - LLM 失败 → 验证 status='failed' + error_message

### 前端

- 手动 smoke test：走完 "选择深度 → 调整分布 → 生成 → 查看结果 → 编辑话题" 完整流程
- 验证步骤解锁逻辑、折叠/展开、loading 态

---

## 十、Alembic 迁移

新增 `seed_materials` 表：

| 列 | 类型 | 约束 |
|----|------|------|
| id | UUID | PK |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |
| deleted_at | TIMESTAMP | NULL |
| scenario_id | UUID | FK → simulation_scenarios.id, NOT NULL |
| version | INTEGER | NOT NULL, DEFAULT 1 |
| status | VARCHAR | CHECK ('generating', 'completed', 'failed'), NOT NULL |
| market_context | JSON | NULL |
| competitors | JSON | NULL |
| consumer_personas | JSON | NULL |
| discussion_topics | JSON | NULL |
| raw_response | JSON | NULL |
| error_message | TEXT | NULL |

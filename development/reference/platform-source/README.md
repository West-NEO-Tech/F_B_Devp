# Replit 原型源码分析

> **结论：这是一个纯 UI 演示原型，没有任何真实的 Agent 模拟逻辑。所有"模拟数据"都是硬编码或随机数生成。**

---

## 1. 架构总览

```
React (shadcn/ui) → Express CRUD API → PostgreSQL (预置数据)
```

| 层 | 技术 | 实际作用 |
|---|---|---|
| 前端 | React 18 + Tailwind + shadcn/ui + Recharts | 14 个页面的数据展示 UI |
| 后端 | Express 5 (TypeScript) | 纯 CRUD，无业务逻辑 |
| 数据库 | PostgreSQL + Drizzle ORM | 存储预置的 seed 数据 |
| AI/LLM | **无** | package.json 中没有任何 AI/LLM 依赖 |

**关键缺失：** 没有 OpenAI SDK、没有 langchain、没有 OASIS、没有任何模拟引擎。

---

## 2. "486-487 次 Agent 交互" 的真相

### 来源：`server/seed.ts` 第 ~202 行

```sql
INSERT INTO simulation_runs (..., summary, aggregate_outputs) VALUES
  (..., 'Simulation completed with 487 agent interactions across 6 segments.',
   '{"total_interactions":487,"adoption_rate":72.5,...}'::jsonb)
```

**这是一个硬编码字符串。**

"487 次交互"不是任何模拟引擎的输出，而是 seed 脚本中手写的一行文本。同理，72.5% 的 adoption_rate、76.3 的 avg_sentiment 等数据全部是手写的字面量。

seed.ts 一共预置了 3 次"已完成的模拟运行"：

| 项目 | 预置交互数 | 预置 adoption_rate |
|---|---|---|
| AI Nutrition Platform | 487 | 72.5% |
| Manufacturing Defect Detection | 198 | 58.2% |
| SME Supply Chain | 312 | 45.8% |

---

## 3. "运行模拟" 按钮的真实逻辑

### 来源：`server/storage.ts` → `runSimulation()`

完整流程：

```typescript
async runSimulation(scenarioId: string) {
  // 1. 创建一条 status='running' 的记录
  const run = await this.queryOne(
    `INSERT INTO simulation_runs (..., status) VALUES (..., 'running') RETURNING *`
  );

  // 2. 等 3 秒（setTimeout 3000ms），然后用 Math.random() 生成随机数
  setTimeout(async () => {
    const adoptionScore = 40 + Math.random() * 40;       // 随机 40-80
    const wtpScore = 35 + Math.random() * 45;            // 随机 35-80
    const retentionScore = 50 + Math.random() * 35;      // 随机 50-85
    const sentimentScore = 45 + Math.random() * 40;      // 随机 45-85
    const conversionRate = 5 + Math.random() * 25;       // 随机 5-30
    const churnRisk = 10 + Math.random() * 30;           // 随机 10-40

    // summary 也是拼接的随机数
    const summary = "Simulation completed successfully with "
      + Math.floor(100 + Math.random() * 900)  // 随机 100-999 次"交互"
      + " agent interactions across all segments.";

    // 3. UPDATE 为 completed，写入随机数
    await pool.query(`UPDATE simulation_runs SET status='completed', ...`);

    // 4. 插入随机的 market_validation_results
    // 5. 插入随机的 business_viability_results
    // 6. 插入一条 activity_log
  }, 3000);

  return run;  // 立即返回 running 状态
}
```

**翻译成人话：**
1. 点击 "Run Simulation" 按钮
2. 前端发 `POST /api/simulations/run`
3. 后端立即创建一条 `status=running` 的记录并返回
4. 3 秒后，后端用 `Math.random()` 生成所有指标，标记为 completed
5. 前端刷新后看到"模拟完成"和一堆数字

**没有 Agent、没有 LLM、没有模拟引擎、没有任何真实计算。**

---

## 4. 预置数据清单 (seed.ts)

seed.ts 通过 SQL INSERT 预置了整个演示数据集：

| 数据类型 | 数量 | 说明 |
|---|---|---|
| 用户 (users) | 5 | Dr. Sarah Chen 等虚构人物 |
| 项目 (projects) | 3 | AI营养、制造缺陷检测、SME供应链 |
| 创意 (ideas) | 6 | 每项目 2 个 |
| 评估 (evaluations) | 7 | 分数全部硬编码 |
| 原型 (prototypes) | 3 | 状态和功能列表硬编码 |
| Agent 模板 (agent_templates) | 8 | 8 种角色定义（仅 JSON 描述） |
| Agent 群体 (agent_populations) | 3 | 数量分布硬编码（如 500 个 agent） |
| 模拟场景 (simulation_scenarios) | 3 | 市场条件/定价/竞争配置 |
| 模拟运行 (simulation_runs) | 3 | 结果全部硬编码 |
| 市场验证结果 | 3 | 分数硬编码 |
| 商业可行性结果 | 3 | 收入/成本/利润硬编码 |
| 投资人 (investors) | 5 | 虚构 VC/天使 |
| 投资匹配 (investor_matches) | 5 | 匹配分数硬编码 |
| 报告 (reports) | 3 | 摘要文本硬编码 |
| 知识图谱实体 (graph_entities) | 14 | 技术/问题/市场/人物 |
| 知识图谱边 (graph_edges) | 13 | 关系和权重硬编码 |
| 活动日志 (activity_logs) | 12 | 操作记录 |

**合计：约 90+ 条预置记录**，涵盖平台所有 14 个模块的展示需求。

---

## 5. 后端 API 分析 (routes.ts)

所有 API 端点都是纯 CRUD（读取/写入数据库），无任何业务逻辑：

```
GET  /api/overview/stats        → 聚合查询 COUNT/AVG
GET  /api/overview/activities    → SELECT * FROM activity_logs
GET  /api/projects               → SELECT * FROM projects
POST /api/projects               → INSERT INTO projects
GET  /api/ideas                  → SELECT * FROM ideas
POST /api/ideas                  → INSERT INTO ideas
GET  /api/evaluations            → SELECT * FROM evaluations
GET  /api/prototypes             → SELECT * FROM prototypes
GET  /api/agent-templates        → SELECT * FROM agent_templates
GET  /api/populations            → SELECT * FROM agent_populations
GET  /api/scenarios              → SELECT * FROM simulation_scenarios
GET  /api/simulations            → SELECT * FROM simulation_runs
POST /api/simulations/run        → 上面分析的 setTimeout + Math.random()
GET  /api/validation             → SELECT * FROM market_validation_results
GET  /api/viability              → SELECT * FROM business_viability_results
GET  /api/investors              → SELECT * FROM investors
GET  /api/matches                → SELECT * JOIN investors
GET  /api/reports                → SELECT * FROM reports
GET  /api/graph/entities         → SELECT * FROM graph_entities
GET  /api/graph/edges            → SELECT * JOIN graph_entities
GET  /api/admin/users            → SELECT * FROM users
```

没有一个端点调用 LLM、没有一个端点执行任何"模拟"计算。

---

## 6. 前端分析

14 个页面文件（`client/src/pages/`）全部是标准的数据展示组件：

- 用 `@tanstack/react-query` 调 API 获取数据
- 用 `shadcn/ui` 组件（Card, Table, Badge 等）展示
- 用 `recharts` 画图表
- "Run Simulation" 按钮调 `POST /api/simulations/run`，然后轮询状态

前端没有任何模拟逻辑、没有 WebSocket 实时推送模拟进度、没有 Agent 状态可视化。

---

## 7. 最终判定

| 维度 | Replit 原型实际情况 |
|---|---|
| Agent 模拟 | ❌ 不存在。seed 数据 + `Math.random()` |
| LLM 集成 | ❌ 不存在。无任何 AI SDK 依赖 |
| "486 次交互" | ❌ 硬编码字符串 `"487"` |
| "25-45 分钟运行" | ❌ 预置数据标记了时间间隔；新运行 3 秒完成 |
| Agent 角色系统 | ⚠️ 有 8 个 agent_template 定义，但仅是 JSON 描述，从未被任何代码消费 |
| 知识图谱 | ⚠️ 有 graph_entities/edges 表，但仅是预置的静态关系 |
| 数据库 schema | ✅ 设计合理，覆盖完整业务流程 |
| UI 完整度 | ✅ 14 个模块的展示界面齐全 |

### 这个原型的实际价值

它是一个**高保真 UI 原型 / 可交互 mockup**，用于：
- 展示平台的信息架构和用户流程
- 演示各模块的数据模型和界面效果
- 验证产品设计方向

它**不是**：
- 一个能运行真实 Agent 模拟的系统
- 一个集成了 LLM 的 AI 平台
- 一个产生过真实模拟数据的引擎

### 对文档的影响

`技术方案与实施指南.md` §5.6 中引用的 "Replit 原型已验证的关键数据点：单次模拟产生 486-487 次 Agent 交互" **不准确**。该数据是 seed 脚本中的硬编码值，不是任何模拟引擎的输出。在引用时应明确标注为"UI 原型预置的演示数据"而非"已验证的数据点"。

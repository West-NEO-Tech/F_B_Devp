# Simulation 接入：如何获取用户 Project 的全部信息

---

## 1.0 按 Project ID 获取 Simulation Query

若只需 **自然语言模拟查询**（Pre-Simulation Display 生成时由 LLM 合成），无需 `scenario_id` 或 `run_id`：

```http
GET /api/projects/{project_id}/simulation-query
```

### 响应示例

```json
{
  "projectId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "scenarioId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "seedMaterialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "seedStatus": "completed",
  "simulationQuery": "Simulate how mid-market ops managers would respond to..."
}
```

### 解析规则

- 校验 `project_id` 对应项目存在且未删除。
- 取该项目下 **最新创建的 scenario**（与前端 `useProjectScenario` 一致：`GET /api/projects/{id}/scenarios` 列表第一项）。
- 取该 scenario 下 **version 最大** 的 seed material。
- 若尚无 scenario、尚未 Generate Pre-Simulation Display、或旧记录无 `simulation_query` 字段，返回 **404**。

---

## 1.0b 模拟端上传 Pre-Simulation 展示数据

模拟端将要在 Pre-Simulation 界面展示的内容以 JSON 上传（字段后续可扩展，当前仅 `content` 字典）：

```http
POST /api/projects/{project_id}/pre-simulation-display
Content-Type: application/json

{
  "content": {
    "summary": "Optional preview text",
    "sections": { "agents": 120 }
  }
}
```

### 响应示例

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "projectId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "content": {
    "summary": "Optional preview text",
    "sections": { "agents": 120 }
  },
  "createdAt": "2026-06-12T10:00:00Z",
  "updatedAt": "2026-06-12T10:00:00Z"
}
```

- 同一 `project_id` 重复 POST 会 **覆盖** 已有 `content`（upsert）。
- 前端 Pre-Simulation Display 页通过 `GET /api/projects/{project_id}/pre-simulation-display` 读取并展示。

---

## 1.0c 模拟端上传 Agent Distribution（agent 种类）

模拟端上传 Pre-Simulation Display 页面 **Agent Distribution** 模块中要展示的 agent 种类与数量：

```http
POST /api/projects/{project_id}/pre-simulation-display/agent-distribution
Content-Type: application/json

{
  "agents": {
    "consumer": 50,
    "enterprise_buyer": 15,
    "competitor": 5
  }
}
```

### 响应示例

```json
{
  "projectId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "agents": {
    "consumer": 50,
    "enterprise_buyer": 15,
    "competitor": 5
  },
  "agentKinds": [
    { "key": "consumer", "label": "Consumer", "count": 50 },
    { "key": "enterprise_buyer", "label": "Enterprise Buyer", "count": 15 },
    { "key": "competitor", "label": "Competitor", "count": 5 }
  ],
  "total": 70
}
```

- `agents`：角色 key → 数量（字段后续可扩展为对象结构）。
- `agentKinds`：供前端直接渲染的种类列表（含展示用 `label`）。
- 重复 POST 会覆盖已有分配；与 `content` 上传互不影响。
- 前端读取：`GET /api/projects/{project_id}/pre-simulation-display/agent-distribution`；若未上传则回退到 Sim Config 生成的分配。

---

## 1.1 推荐路径：一次请求拿齐「模拟输入」

用户在 **Pre-Simulation Display** 页点击 **Simulation** 后，浏览器地址会出现 `?runid=<uuid>`。用该 `run_id` 调用：

```http
GET /api/runs/{run_id}/agents
```

即可得到**本次 run 对应的、已聚合好的模拟输入**



### 1.2 响应示例

```json
{
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "scenarioId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "seedMaterialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "ready",
  "message": null,
  "description": "AI workflow tool for ops teams.",
  "productType": "SaaS",
  "consumerPersonas": ["Urban Pro", "Ops Lead"],
  "discussionTopics": ["Pricing", "Trust"],
  "additionalInformation": [
    { "question": "Who is your target buyer?", "answer": "Mid-market ops managers..." }
  ],
  "simConfigType": "quick"
}
```

### 1.3 字段与产品界面的对应关系

| 响应字段 | 来源 | 说明 |
|----------|------|------|
| `userId` | 启动模拟时传入 | 当前实现为 **Project ID**，非登录用户 ID |
| `scenarioId` | `SimulationRun.scenario_id` | 关联的模拟场景 |
| `seedMaterialId` | 启动时传入 | 本次使用的 Pre-Simulation Display 记录 |
| `status` | 固定逻辑 | 目前为 `"ready"`（预留 `"generating"`） |
| `description` | Project `description` | **仅基础描述**，已去掉 `### Market Info (Q&A)` 附录 |
| `productType` | Project `product_type` | Project Info → Project overview |
| `additionalInformation` | Project `description` 内 Q&A 块 | Project Info → Additional information（向导 Market Info 问答） |
| `consumerPersonas` | Seed `consumer_personas` | **仅 persona 名称** 字符串数组 |
| `discussionTopics` | Seed `discussion_topics` | **仅 topic 标题** 字符串数组 |
| `simConfigType` | Scenario `agent_depth` | Sim Config 深度：`quick` / `standard` / `deep` / `custom` |
| `simulationQuery` | Seed `simulation_query` | 点击 Generate Pre-Simulation Display 时由 LLM 合成的自然语言模拟查询（含背景、约束、商业目的与 agent 互动问题） |

### 1.4 `description` 与 `additionalInformation` 的拆分规则

后端与前端共用同一约定（见 `app/services/market_qa_parse.py`）：

- 用户在向导 **Market Info** 填写的问答会追加到 `project.description` 末尾，以标记行开头：

  ```text
  ### Market Info (Q&A)

  - Q: <问题全文>
    A: <用户答案>
  ```

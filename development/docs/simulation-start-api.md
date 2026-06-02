# Simulation 接入：如何获取用户 Project 的全部信息

---

## 1. 推荐路径：一次请求拿齐「模拟输入」

用户在 Seed Materials 页点击 **Simulation** 后，浏览器地址会出现 `?runid=<uuid>`。用该 `run_id` 调用：

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
| `seedMaterialId` | 启动时传入 | 本次使用的 Seed Materials 记录 |
| `status` | 固定逻辑 | 目前为 `"ready"`（预留 `"generating"`） |
| `description` | Project `description` | **仅基础描述**，已去掉 `### Market Info (Q&A)` 附录 |
| `productType` | Project `product_type` | Project Info → Project overview |
| `additionalInformation` | Project `description` 内 Q&A 块 | Project Info → Additional information（向导 Market Info 问答） |
| `consumerPersonas` | Seed `consumer_personas` | **仅 persona 名称** 字符串数组 |
| `discussionTopics` | Seed `discussion_topics` | **仅 topic 标题** 字符串数组 |
| `simConfigType` | Scenario `agent_depth` | Sim Config 深度：`quick` / `standard` / `deep` |

### 1.4 `description` 与 `additionalInformation` 的拆分规则

后端与前端共用同一约定（见 `app/services/market_qa_parse.py`）：

- 用户在向导 **Market Info** 填写的问答会追加到 `project.description` 末尾，以标记行开头：

  ```text
  ### Market Info (Q&A)

  - Q: <问题全文>
    A: <用户答案>
  ```

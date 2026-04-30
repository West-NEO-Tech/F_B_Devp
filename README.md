# BizSim — 商业验证模拟平台

基于多 Agent 模拟的商业验证工具。用户描述商业想法，AI Agent 扮演消费者、投资人、竞品等角色进行对话验证，输出结构化分析报告。当前为 **MVP / POC 阶段**。

---

## 仓库结构

```
BizSim/
├── business/          # 商业文档（BP、竞品分析、产品定义、商业模式）
└── development/       # 产品代码（前端 + 后端 + 文档）
```

前端：React 18 + TypeScript + Vite + Tailwind + shadcn/ui
后端：FastAPI + async SQLAlchemy + PostgreSQL + LiteLLM

开发文档见 [`development/README.md`](development/README.md)。

---

## Demo 指导例子

为便于当前阶段快速展示，仓库中提供两份**指导例子**，用于串联 Demo 故事线（不强调功能实现细节，重点是输入、角色互动和模拟叙事）：

1. **商业选址（单次模拟）**  
	文档：[`reference/Demo 案例 1 - 商业选址（华人超市）.md`](reference/Demo%20案例%201%20-%20商业选址（华人超市）.md)

2. **澳洲房地产情景推演（多次模拟）**  
	文档：[`reference/Demo 案例 2 - 澳洲房地产情景推演.md`](reference/Demo%20案例%202%20-%20澳洲房地产情景推演.md)

这两个案例分别对应：

- 单次模拟能提供的信息（选址判断）
- 多次情景模拟能提供的根因分析（变量变化 → 结果变化）

---

## 已完成功能

| # | 功能 | 状态 |
|---|------|------|
| 001 | Backend Scaffold | ✅ FastAPI 骨架 + 4 实体 CRUD + 迁移 + 种子数据 |
| 002 | API Integration | ✅ 前端 mock → 真实 API |
| 003 | Project Wizard | ✅ 4 步创建引导 + AI 字段补全 + 项目详情 |
| 004 | LLM Integration | ✅ AsyncOpenAI + LiteLLM（本地免费 / 生产 OpenRouter） |

---

## 下一阶段任务分工

详细架构图与分工说明见 [`development/docs/系统架构与数据流转示意图-旅程版.md`](development/docs/系统架构与数据流转示意图-旅程版.md)。

| 成员 | 职责方向 | 重点查看 |
|------|---------|---------|
| **Chris** | 引擎基础设施（状态机、WebSocket、Agent 协议） | `development/docs/` 架构文档、`development/server/` |
| **Qu Liang** | 仿真拓扑（Agent 组织结构、关系图谱） | `development/docs/` 架构文档、Agent 模板种子数据 |
| **Weiyou** | 商业语义（场景设计、角色定义、输出标准） | `business/` 产品文档、`development/docs/` 架构文档 |
| **Zhidong** | 报告前端（结果可视化、报告页面） | `development/src/pages/`、与 Weiyou 对齐输出结构 |

# BizSim

## 项目简介

BizSim 是一个多智能体商业验证模拟平台。

- 前端：React 18 + TypeScript + Vite + Tailwind + shadcn/ui
- 后端：FastAPI + async SQLAlchemy + PostgreSQL + LiteLLM

## 部署与基础设施

### 后端数据库平台

- 平台：Neon
- 特点：0.5GB 免费额度

### 后端 API 平台

- 平台：Render
- 特点：
  - 免费方案可用
  - 服务在低频访问时会休眠
  - 冷启动（第一次访问）大约需要 40 秒
  - 如果未预热，API 请求可能需要约 1 分钟返回

建议在正式调用 API 前，先访问一次文档页进行预热：

- [https://f-b-devp.onrender.com/docs](https://f-b-devp.onrender.com/docs)

## API 接口文档

- 在线文档：[https://f-b-devp.onrender.com/docs](https://f-b-devp.onrender.com/docs)

## 已完成功能

| # | 功能 | 状态 |
|---|------|------|
| 001 | Backend Scaffold | ✅ FastAPI 骨架 + 4 实体 CRUD + 迁移 + 种子数据 |
| 002 | API Integration | ✅ 前端 mock → 真实 API |
| 003 | Project Wizard | ✅ 4 步创建引导 + AI 字段补全 + 项目详情 |
| 004 | LLM Integration | ✅ AsyncOpenAI + LiteLLM（本地免费 / 生产 OpenRouter） |
| 005 | API 部署 | ✅ 已部署到 Render |

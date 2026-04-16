# Design: 002 api-integration-layer

> Date: 2026-03-28
> Status: Approved
> Phase: P1 — 用户输入 → 种子材料生成

---

## 目标

将前端从全量 mock 切换到真实 FastAPI 后端，同时裁剪非核心页面，为 Phase 1 后续 spec（project-wizard、seed-builder）打好基础。

**不在范围内**：Simulations / Validation / Viability / Reports 页面的真实对接（Phase 2/3）；新增 UI 组件；任何业务逻辑。

---

## 架构变更

### 1. queryClient.ts 重写

**现状**：`mockDataMap` + `mockQueryFn`（200ms 假延迟）+ 假 `apiRequest`（只打 log）

**目标**：真实 `fetch`，统一错误处理

```
src/lib/
  queryClient.ts    ← 重写：移除所有 mock，配置全局 onError → toast
  api.ts            ← 新增：apiRequest 封装
```

**`api.ts`** 职责：
- 所有请求 `fetch('/api/...')`（由 Vite proxy 透传到 localhost:8100）
- 网络错误 / HTTP 5xx → `throw Error` → React Query `onError` → `toast.error('服务器异常，请稍后重试')`
- HTTP 4xx → `throw Error` with `message` from response body → 调用方用 `isError` 处理
- 导出 `apiRequest(method, url, data?)` 供 mutation 使用

**`queryClient.ts`** 变更：
- 移除所有 mock import 和 `mockDataMap`
- `defaultQueryFn`: `async ({ queryKey }) => apiRequest('GET', queryKey[0] as string).then(r => r.json())`
- `defaultOptions.queries.retry: 1`
- `defaultOptions.queries.staleTime: 30_000`

### 2. Vite proxy

`vite.config.ts` 新增：
```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8100',
      changeOrigin: true,
    }
  }
}
```

### 3. 类型生成（openapi-typescript）

新增 devDependency：`openapi-typescript`

`package.json` 新增 script：
```json
"generate:types": "openapi-typescript http://localhost:8100/openapi.json -o src/types/api.ts"
```

- 运行一次，生成 `src/types/api.ts` 并提交
- Projects 和 AgentTemplates 组件改用生成类型（`components['schemas']['ProjectRead']` 等）
- 后续 schema 变化时手动重跑

### 4. 页面裁剪（删除 5 个文件）

**删除**：
```
src/pages/ideas.tsx
src/pages/evaluation.tsx
src/pages/prototypes.tsx
src/pages/investments.tsx
src/pages/graph.tsx
src/data/mock-data.ts          ← 同步删除 mock 数据文件
```

**`App.tsx`** 修改：
- 删除 5 个页面的 import
- 删除对应 `<Route>` 声明

**`app-sidebar.tsx`** 修改：
- 删除整个 `discoveryItems` 数组（Idea Discovery / Evaluation / Prototypes）
- 删除 `outputItems` 中的 Investment Matching 和 Knowledge Graph
- 删除对应 NavGroup 调用
- 品牌名："Innovation Testbed" / "AI-Agent Platform" → "BizSim" / "Business Validator"

### 5. Projects 页面真实对接

**数据层**：
- `useQuery({ queryKey: ['/api/projects'] })` — 列表读取
- `useMutation` POST `/api/projects` — 新建项目，成功后 `invalidateQueries`
- Loading state: `Skeleton` 占位（复用已有 shadcn/ui 组件）
- Empty state: "还没有项目，点击新建开始"
- Error state: React Query `isError` → inline error message（具体 4xx 错误）

**类型**：使用生成的 `ProjectRead`、`ProjectCreate` schema 类型

**不改变**：现有 ProjectsPage 的 UI 布局和卡片设计，只换数据源

### 6. AgentTemplates 页面真实对接

**数据层**：
- `useQuery({ queryKey: ['/api/agent-templates'] })` — 8 条模板
- Loading / Error 同上
- 现有卡片 UI 可直接复用，字段名与后端 `AgentTemplateRead` 对齐

---

## 文件变更摘要

| 操作 | 文件 |
|------|------|
| 新增 | `src/lib/api.ts` |
| 新增 | `src/types/api.ts`（生成） |
| 重写 | `src/lib/queryClient.ts` |
| 修改 | `vite.config.ts` |
| 修改 | `src/App.tsx` |
| 修改 | `src/components/app-sidebar.tsx` |
| 修改 | `src/pages/projects.tsx` |
| 修改 | `src/pages/agents.tsx` |
| 删除 | `src/pages/ideas.tsx` |
| 删除 | `src/pages/evaluation.tsx` |
| 删除 | `src/pages/prototypes.tsx` |
| 删除 | `src/pages/investments.tsx` |
| 删除 | `src/pages/graph.tsx` |
| 删除 | `src/data/mock-data.ts` |

---

## 成功标准

1. `pnpm dev` 启动后，Projects 页面显示真实数据库中的项目（后端运行时）
2. Agent Templates 页面显示 8 条真实模板
3. 侧边栏不再出现 Ideas / Evaluation / Prototypes / Investment Matching / Knowledge Graph
4. `pnpm tsc --noEmit` 零错误
5. 新建项目后刷新页面数据持久化（POST 真实写入 DB）
6. 后端不可用时显示 toast 错误提示，不 crash

---

## 风险

| 风险 | 缓解 |
|------|------|
| AgentsPage mock 字段名与后端不一致 | 运行 generate:types 后逐字段 diff |
| ProjectsPage 删除 mock 后现有筛选/排序逻辑失效 | 先对接列表，筛选留 TODO |
| mock-data.ts 被其他文件引用 | 删前全局 grep，确认清零 |

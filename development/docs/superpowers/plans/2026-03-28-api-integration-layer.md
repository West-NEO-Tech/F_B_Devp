# 002 api-integration-layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将前端从全量 mock 切换到真实 FastAPI 后端，裁剪非核心页面，为 Phase 1 后续开发打好基础。

**Architecture:** 删除 `mock-data.ts` 和 `queryClient.ts` 中的全部 mock 逻辑，新增 `src/lib/api.ts` 作为真实 fetch 封装层；Vite proxy 转发 `/api/*` 到 `localhost:8100`；页面级类型迁移到 `src/types/api.ts`（openapi-typescript 生成）。

**Tech Stack:** React 18 + TanStack Query v5 + Vite proxy + openapi-typescript + shadcn/ui Skeleton/Toast

---

## File Map

| 操作 | 路径 | 职责 |
|------|------|------|
| 新增 | `src/lib/api.ts` | fetch 封装：错误解析、5xx toast、4xx throw |
| 重写 | `src/lib/queryClient.ts` | 移除 mock，配置真实 defaultQueryFn |
| 新增 | `src/types/api.ts` | openapi-typescript 生成的后端类型 |
| 修改 | `vite.config.ts` | 新增 server.proxy |
| 修改 | `src/App.tsx` | 删除 5 个页面的 import + Route |
| 修改 | `src/components/app-sidebar.tsx` | 删除非核心菜单项，更新品牌名 |
| 修改 | `src/pages/projects.tsx` | 类型从 mock-data → api.ts |
| 修改 | `src/pages/agents.tsx` | 类型迁移 + 隐藏 Populations tab |
| 修改 | `src/pages/overview.tsx` | 类型迁移（仍 mock 数据，但类型干净） |
| 修改 | `src/pages/simulations.tsx` | 类型迁移 |
| 修改 | `src/pages/simulation-live.tsx` | 类型迁移 + 内联 mock 数据（不依赖 mock-data.ts） |
| 修改 | `src/pages/validation.tsx` | 类型迁移 |
| 修改 | `src/pages/viability.tsx` | 类型迁移 |
| 修改 | `src/pages/reports.tsx` | 类型迁移 |
| 修改 | `src/pages/admin.tsx` | 类型迁移 |
| 删除 | `src/pages/ideas.tsx` | 非核心流程 |
| 删除 | `src/pages/evaluation.tsx` | 由模拟替代 |
| 删除 | `src/pages/prototypes.tsx` | 非 POC 范围 |
| 删除 | `src/pages/investments.tsx` | V1.5+ |
| 删除 | `src/pages/graph.tsx` | V1.5+ |
| 删除 | `src/data/mock-data.ts` | 全部 mock 数据 |

---

## Task 1: 安装 openapi-typescript 并生成类型文件

**Files:**
- Modify: `package.json`
- Create: `src/types/api.ts` (generated)

- [x] **Step 1: 确认后端正在运行**

```bash
cd business-validation-demo/development/server
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
sleep 2
curl -s http://localhost:8100/api/health | python3 -m json.tool
```

Expected: `{"status": "ok", ...}`

- [x] **Step 2: 安装 openapi-typescript**

```bash
cd business-validation-demo/development
pnpm add -D openapi-typescript
```

Expected: 无 peer dependency 警告，`package.json` devDependencies 新增 `openapi-typescript`

- [x] **Step 3: 添加 generate:types script**

在 `package.json` 的 `"scripts"` 中添加：

```json
"generate:types": "openapi-typescript http://localhost:8100/openapi.json -o src/types/api.ts"
```

最终 scripts 块：

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "generate:types": "openapi-typescript http://localhost:8100/openapi.json -o src/types/api.ts"
}
```

- [x] **Step 4: 运行类型生成**

```bash
cd business-validation-demo/development
pnpm generate:types
```

Expected: `src/types/api.ts` 文件创建，内含 `paths`、`components` 等接口

- [x] **Step 5: 验证生成结果**

```bash
grep -c "ProjectRead\|ProjectCreate\|AgentTemplateRead" src/types/api.ts
```

Expected: 输出 ≥ 3（三个 schema 都存在）

- [x] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/types/api.ts
git commit -m "chore(002): add openapi-typescript and generate API types"
```

---

## Task 2: 新增 src/lib/api.ts（真实 fetch 封装）

**Files:**
- Create: `src/lib/api.ts`

- [x] **Step 1: 创建 api.ts**

创建 `src/lib/api.ts`，完整内容：

```typescript
import { toast } from "@/hooks/use-toast";

/**
 * Core fetch wrapper.
 * - GET: called by React Query defaultQueryFn via queryClient.ts
 * - POST/PATCH/DELETE: called directly by useMutation handlers
 *
 * Error contract:
 *   5xx / network error → toast.error + throw (React Query marks query as error)
 *   4xx → throw Error with server message (caller handles display)
 *   2xx → return parsed JSON
 */
export async function apiRequest<T = unknown>(
  method: string,
  url: string,
  data?: unknown,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : undefined,
      body: data ? JSON.stringify(data) : undefined,
    });
  } catch (_networkErr) {
    toast({
      title: "网络错误",
      description: "无法连接到服务器，请检查网络或后端服务",
      variant: "destructive",
    });
    throw new Error("Network error");
  }

  if (response.status >= 500) {
    toast({
      title: "服务器异常",
      description: `${response.status} ${response.statusText}`,
      variant: "destructive",
    });
    throw new Error(`Server error: ${response.status}`);
  }

  if (!response.ok) {
    // 4xx: parse body for message, let caller display
    let message = `Request failed: ${response.status}`;
    try {
      const body = await response.json();
      if (body?.detail) {
        message = typeof body.detail === "string"
          ? body.detail
          : JSON.stringify(body.detail);
      }
    } catch {
      // body not JSON, keep default message
    }
    throw new Error(message);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
```

- [x] **Step 2: 确认文件创建**

```bash
wc -l src/lib/api.ts
```

Expected: 約 57 行

- [x] **Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat(002): add api.ts — real fetch wrapper with error handling"
```

---

## Task 3: 重写 src/lib/queryClient.ts

**Files:**
- Modify: `src/lib/queryClient.ts`

- [x] **Step 1: 完整替换 queryClient.ts**

用以下内容完全替换 `src/lib/queryClient.ts`：

```typescript
import { QueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

const defaultQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }) => {
  const url = queryKey[0] as string;
  return apiRequest("GET", url);
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});

export { apiRequest };
```

注意：还导出 `apiRequest` 以保持现有页面中 `import { apiRequest } from "@/lib/queryClient"` 的兼容性。

- [x] **Step 2: 配置 Vite proxy**

完整替换 `vite.config.ts` 为：

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:8100",
        changeOrigin: true,
      },
    },
  },
});
```

- [x] **Step 3: TypeScript 检查**

```bash
cd business-validation-demo/development
pnpm tsc --noEmit 2>&1 | head -30
```

Expected: 有类型错误（因为页面还依赖 mock-data.ts），记录错误数量，后续 Task 会逐一修复

- [x] **Step 4: Commit**

```bash
git add src/lib/queryClient.ts vite.config.ts
git commit -m "feat(002): replace mock queryClient with real fetch + Vite proxy"
```

---

## Task 4: 删除 5 个非核心页面 + 更新路由和侧边栏

**Files:**
- Delete: `src/pages/ideas.tsx`, `src/pages/evaluation.tsx`, `src/pages/prototypes.tsx`, `src/pages/investments.tsx`, `src/pages/graph.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/app-sidebar.tsx`

- [x] **Step 1: 删除 5 个页面文件**

```bash
cd business-validation-demo/development
rm src/pages/ideas.tsx src/pages/evaluation.tsx src/pages/prototypes.tsx src/pages/investments.tsx src/pages/graph.tsx
```

- [x] **Step 2: 更新 App.tsx**

完整替换 `src/App.tsx` 为（移除 5 个页面的 import 和 Route）：

```typescript
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import NotFound from "@/pages/not-found";
import OverviewPage from "@/pages/overview";
import ProjectsPage from "@/pages/projects";
import AgentsPage from "@/pages/agents";
import SimulationsPage from "@/pages/simulations";
import ValidationPage from "@/pages/validation";
import ViabilityPage from "@/pages/viability";
import ReportsPage from "@/pages/reports";
import AdminPage from "@/pages/admin";
import SimulationLivePage from "@/pages/simulation-live";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle">
      {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </Button>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={OverviewPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/agents" component={AgentsPage} />
      <Route path="/simulations" component={SimulationsPage} />
      <Route path="/simulations/live" component={SimulationLivePage} />
      <Route path="/validation" component={ValidationPage} />
      <Route path="/viability" component={ViabilityPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

const sidebarStyle = {
  "--sidebar-width": "16rem",
  "--sidebar-width-icon": "3rem",
};

function AppLayout() {
  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-1 px-3 py-2 border-b h-12">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AppLayout />
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
```

- [x] **Step 3: 更新 app-sidebar.tsx**

完整替换 `src/components/app-sidebar.tsx` 为：

```typescript
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Play,
  TrendingUp,
  DollarSign,
  FileText,
  Settings,
  FlaskConical,
  MonitorPlay,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderKanban },
];

const simulationItems = [
  { title: "Agent Populations", url: "/agents", icon: Users },
  { title: "Simulations", url: "/simulations", icon: Play },
  { title: "Simulation Live", url: "/simulations/live", icon: MonitorPlay },
  { title: "Market Validation", url: "/validation", icon: TrendingUp },
  { title: "Business Viability", url: "/viability", icon: DollarSign },
];

const outputItems = [
  { title: "Reports", url: "/reports", icon: FileText },
];

const adminItems = [
  { title: "Admin", url: "/admin", icon: Settings },
];

function NavGroup({ label, items }: { label: string; items: typeof mainItems }) {
  const [location] = useLocation();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild data-active={isActive}>
                  <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <Link href="/" className="flex items-center gap-2" data-testid="nav-logo">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
            <FlaskConical className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">BizSim</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Business Validator</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Platform" items={mainItems} />
        <NavGroup label="Simulation" items={simulationItems} />
        <NavGroup label="Output" items={outputItems} />
        <NavGroup label="System" items={adminItems} />
      </SidebarContent>
      <SidebarFooter className="px-4 py-3">
        <div className="text-[10px] text-muted-foreground">v0.2.0 POC</div>
      </SidebarFooter>
    </Sidebar>
  );
}
```

- [x] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(002): remove 5 non-core pages, update routing and sidebar for BizSim"
```

---

## Task 5: 迁移仍保留页面的类型（从 mock-data → api.ts）

这些页面仍在使用 `import type { X } from "@/data/mock-data"`，需要把类型引用改到 `src/types/api.ts` 或内联定义。

**策略**：用 `openapi-typescript` 生成的类型替换；如果生成类型命名太复杂，则在 `src/types/api.ts` 底部添加简洁别名。

**Files:**
- Modify: `src/types/api.ts` (追加别名)
- Modify: `src/pages/projects.tsx`
- Modify: `src/pages/agents.tsx`
- Modify: `src/pages/overview.tsx`
- Modify: `src/pages/simulations.tsx`
- Modify: `src/pages/simulation-live.tsx`
- Modify: `src/pages/validation.tsx`
- Modify: `src/pages/viability.tsx`
- Modify: `src/pages/reports.tsx`
- Modify: `src/pages/admin.tsx`

- [x] **Step 1: 在 src/types/api.ts 尾部追加类型别名**

打开 `src/types/api.ts`，在文件末尾追加：

```typescript
// ─── Convenience aliases (matched to backend schemas) ────────────────────────

export type ProjectRead = components["schemas"]["ProjectRead"];
export type ProjectCreate = components["schemas"]["ProjectCreate"];
export type AgentTemplateRead = components["schemas"]["AgentTemplateRead"];

// Pages not yet connected to real API use these local types until their phase.
// Remove each when the corresponding page gets real data.
export interface OverviewStats {
  total_projects: number;
  active_simulations: number;
  total_agents: number;
  validation_rate: number;
  monthly_trend: Array<{ month: string; simulations: number; validations: number }>;
}

export interface ActivityLog {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  project_id?: string;
}

export interface SimulationScenario {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  depth: "quick" | "standard" | "deep";
  status: string;
  created_at: string;
}

export interface SimulationRun {
  id: string;
  scenario_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  total_rounds: number;
  current_round: number;
}

export interface MarketValidationResult {
  id: string;
  run_id: string;
  adoption_rate: number;
  willingness_to_pay: number;
  sentiment_score: number;
  conversion_funnel: Record<string, number>;
}

export interface BusinessViabilityResult {
  id: string;
  run_id: string;
  revenue_projection: number[];
  break_even_month: number;
  survival_probability: number;
}

export interface Report {
  id: string;
  run_id: string;
  title: string;
  summary: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export interface SimulationEvent {
  id: string;
  round: number;
  agent_id: string;
  agent_name: string;
  agent_category: string;
  action: string;
  content: string;
  sentiment: number;
  timestamp: string;
}

export interface SimulationLiveState {
  run_id: string;
  status: string;
  current_round: number;
  total_rounds: number;
  events: SimulationEvent[];
  metrics: Record<string, number>;
}
```

- [x] **Step 2: 修改 projects.tsx 类型引用**

在 `src/pages/projects.tsx` 中，将：
```typescript
import type { Project } from "@/data/mock-data";
```
替换为：
```typescript
import type { ProjectRead, ProjectCreate } from "@/types/api";
```

将文件中所有 `Project[]` 改为 `ProjectRead[]`，`Project` 改为 `ProjectRead`。

`createMutation` 的 data 类型改为 `ProjectCreate`：
```typescript
mutationFn: async (data: ProjectCreate) => {
```

同时将 `newProject` 初始状态 type 改为：
```typescript
const [newProject, setNewProject] = useState<ProjectCreate>({
  name: "",
  description: null,
  domain: null,
  target_market: null,
});
```

- [x] **Step 3: 修改 agents.tsx 类型引用**

在 `src/pages/agents.tsx` 中，将：
```typescript
import type { AgentTemplate, AgentPopulation } from "@/data/mock-data";
```
替换为：
```typescript
import type { AgentTemplateRead } from "@/types/api";
```

将 `AgentTemplate[]` 改为 `AgentTemplateRead[]`。

移除 populations 相关代码（后端 001 未实现此端点）：
- 删除 `const { data: populations, isLoading: populationsLoading } = useQuery(...)` 这一行
- 删除 `<TabsTrigger value="populations">` 及其对应的 `<TabsContent value="populations">` 整块
- 删除 `Tabs` 外层包裹，直接渲染模板列表（或保留 Tabs 但只保留 templates tab）

- [x] **Step 4: 修改其余页面类型引用**

**overview.tsx** — 将：
```typescript
import type { OverviewStats, ActivityLog, Project } from "@/data/mock-data";
```
改为：
```typescript
import type { OverviewStats, ActivityLog, ProjectRead } from "@/types/api";
```
将文件中 `Project` 改为 `ProjectRead`。

**simulations.tsx** — 将：
```typescript
import type { SimulationRun, SimulationScenario } from "@/data/mock-data";
```
改为：
```typescript
import type { SimulationRun, SimulationScenario } from "@/types/api";
```

**simulation-live.tsx** — 将：
```typescript
import type { SimulationEvent, SimulationLiveState } from "@/data/mock-data";
import { mockSimulationLiveState } from "@/data/mock-data";
```
改为：
```typescript
import type { SimulationEvent, SimulationLiveState } from "@/types/api";
```
同时需要在文件内部用内联 mock 数据替换 `mockSimulationLiveState` 的引用（保持页面可展示）：
```typescript
const MOCK_LIVE_STATE: SimulationLiveState = {
  run_id: "demo",
  status: "running",
  current_round: 3,
  total_rounds: 10,
  events: [],
  metrics: { adoption_rate: 0.45, sentiment: 0.72 },
};
```
在原来使用 `mockSimulationLiveState` 的地方改用 `MOCK_LIVE_STATE`。

**validation.tsx** — 将：
```typescript
import type { MarketValidationResult } from "@/data/mock-data";
```
改为：
```typescript
import type { MarketValidationResult } from "@/types/api";
```

**viability.tsx** — 将：
```typescript
import type { BusinessViabilityResult } from "@/data/mock-data";
```
改为：
```typescript
import type { BusinessViabilityResult } from "@/types/api";
```

**reports.tsx** — 将：
```typescript
import type { Report } from "@/data/mock-data";
```
改为：
```typescript
import type { Report } from "@/types/api";
```

**admin.tsx** — 将：
```typescript
import type { User, Project, AgentTemplate, SimulationRun } from "@/data/mock-data";
```
改为：
```typescript
import type { AdminUser, ProjectRead, AgentTemplateRead, SimulationRun } from "@/types/api";
```
将文件中 `User` 改为 `AdminUser`，`Project` 改为 `ProjectRead`，`AgentTemplate` 改为 `AgentTemplateRead`。

- [x] **Step 5: 类型检查**

```bash
cd business-validation-demo/development
pnpm tsc --noEmit 2>&1 | head -50
```

Expected: 零 TS 错误（或只剩 mock-data.ts 相关的 import 错误）

- [x] **Step 6: Commit**

```bash
git add src/types/api.ts src/pages/
git commit -m "feat(002): migrate page types from mock-data to api.ts"
```

---

## Task 6: 删除 src/data/mock-data.ts

**Files:**
- Delete: `src/data/mock-data.ts`

- [x] **Step 1: 确认没有遗漏引用**

```bash
grep -rn "from.*mock-data\|from.*data/mock" src/ --include="*.tsx" --include="*.ts"
```

Expected: 零输出

- [x] **Step 2: 删除文件**

```bash
rm src/data/mock-data.ts
```

- [x] **Step 3: 完整类型检查**

```bash
pnpm tsc --noEmit
```

Expected: 零错误

- [x] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(002): delete mock-data.ts — clean break from mock layer"
```

---

## Task 7: 验证端到端功能

**Files:** (无文件变更，只验证)

- [x] **Step 1: 确认后端运行**

```bash
curl -s http://localhost:8100/api/health
```

Expected: `{"status":"ok"}`

- [x] **Step 2: 启动前端**

```bash
cd business-validation-demo/development
pnpm dev
```

Expected: Vite 启动，无编译错误

- [x] **Step 3: 验证 Projects 页面**

浏览器打开 `http://localhost:5173/projects`

Expected:
- 页面加载，显示来自数据库的项目列表（空列表显示 "No projects found"）
- 点击新建项目，填写 name+description，提交后列表刷新出现新项目

- [x] **Step 4: 验证 Agents 页面**

浏览器打开 `http://localhost:5173/agents`

Expected: 显示 8 条真实 AgentTemplate（数据来自 001 seeded templates）

- [x] **Step 5: 验证侧边栏**

Expected:
- 侧边栏显示 BizSim / Business Validator
- 不再出现 Idea Discovery / Evaluation / Prototypes / Investment Matching / Knowledge Graph

- [x] **Step 6: 验证错误处理**

停止后端，刷新 Projects 页面：

Expected: toast 弹出 "网络错误" 提示，页面不 crash

- [x] **Step 7: 最终 TypeScript 检查**

```bash
pnpm tsc --noEmit
```

Expected: 零错误

- [x] **Step 8: 最终 Commit**

```bash
git add -A
git commit -m "feat(002): complete api-integration-layer — real API, pages pruned, types clean"
git push origin main
```

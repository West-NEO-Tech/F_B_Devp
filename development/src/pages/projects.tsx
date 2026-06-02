import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FolderKanban, Calendar, Target } from "lucide-react";
import { marketQABaseDescription } from "@/hooks/use-market-qa";
import type { PaginatedProjects } from "@/types/api";

function projectCardDescription(description: string | null | undefined): string {
  const base = marketQABaseDescription(description ?? "").trim();
  return base || "No description provided";
}

// Demo sample projects — shown when no real projects exist yet
const DEMO_PROJECTS = [
  {
    id: "demo-1",
    name: "PetMatch 宠物寄养平台",
    productType: "Marketplace · Mobile App",
    targetMarket: "澳大利亚主要城市",
    description:
      "连接宠物主人与经过验证的本地宠物看护者，提供寄养、遛狗、上门喂养等服务。双边平台，平台抽佣 15%。",
    tags: ["pet-care", "marketplace", "two-sided"],
    status: "active",
    createdAt: "2026-03-01T00:00:00Z",
  },
  {
    id: "demo-2",
    name: "CarbonTrace 个人碳足迹追踪",
    productType: "Consumer App · Subscription",
    targetMarket: "全球环保意识消费者",
    description:
      "通过连接银行账单和出行数据自动计算个人碳足迹，并推荐减碳行动方案。月费 $4.9，首月免费。",
    tags: ["sustainability", "fintech", "lifestyle"],
    status: "active",
    createdAt: "2026-03-10T00:00:00Z",
  },
  {
    id: "demo-3",
    name: "FreelanceKit 自由职业者工具套件",
    productType: "SaaS · B2C",
    targetMarket: "独立开发者 / 设计师 / 自由职业者",
    description:
      "整合发票管理、合同模板、税务计算和客户 CRM 的一站式工具，专为独立工作者设计。按年订阅 $99。",
    tags: ["SaaS", "productivity", "freelance"],
    status: "active",
    createdAt: "2026-03-15T00:00:00Z",
  },
  {
    id: "demo-4",
    name: "Silver Connect 银发社群平台",
    productType: "Social Platform · Freemium",
    targetMarket: "55岁以上退休人群 · 澳大利亚",
    description:
      "针对老龄人口孤独问题，提供兴趣圈子组建、线下活动匹配和家庭连结功能。广告 + 高级会员双收入。",
    tags: ["aging-population", "social", "healthtech"],
    status: "in_review",
    createdAt: "2026-03-20T00:00:00Z",
  },
] as const;

export default function ProjectsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<PaginatedProjects>({
    queryKey: ["/api/projects"],
  });
  const projects = data?.items ?? [];

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.productType || "").toLowerCase().includes(search.toLowerCase())
  );

  // Show demo projects when no real data exists (empty state placeholder)
  const showDemo = !isLoading && filtered.length === 0 && search === "";

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Projects"
        description="Innovation workspace management"
        actions={
          <Link href="/projects/new">
            <Button data-testid="button-create-project">
              <Plus className="w-4 h-4 mr-1" />
              New Project
            </Button>
          </Link>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search projects..."
          data-testid="input-search-projects"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : showDemo ? (
        // Demo placeholder — visible before any project is created
        <>
          <p className="text-xs text-muted-foreground/60">示例项目（仅供演示）— 创建你的第一个项目后，此处将显示真实内容</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {DEMO_PROJECTS.map((project) => (
              <Card key={project.id} className="opacity-60 cursor-default" data-testid={`demo-${project.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                        <FolderKanban className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{project.name}</h3>
                        <p className="text-xs text-muted-foreground">{project.productType}</p>
                      </div>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Target className="w-3 h-3" />
                      {project.targetMarket}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Link href={`/projects/${project.id}`} key={project.id}>
            <Card className="hover-elevate cursor-pointer" data-testid={`project-${project.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                      <FolderKanban className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{project.name}</h3>
                      <p className="text-xs text-muted-foreground">{project.productType ?? ""}</p>
                    </div>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {projectCardDescription(project.description)}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  {project.productType && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Target className="w-3 h-3" />
                      {project.productType}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No projects found</p>
            <p className="text-xs text-muted-foreground">Try a different search term</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

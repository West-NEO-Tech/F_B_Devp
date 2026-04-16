import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  User,
  Building2,
  TrendingUp,
  Swords,
  Truck,
  Scale,
  Wrench,
  GraduationCap,
} from "lucide-react";
import type { AgentTemplateRead, PaginatedAgentTemplates } from "@/types/api";

const categoryIcons: Record<string, any> = {
  consumer: User,
  enterprise_buyer: Building2,
  investor: TrendingUp,
  competitor: Swords,
  supplier: Truck,
  regulator: Scale,
  technical_expert: Wrench,
  mentor: GraduationCap,
};

const categoryColors: Record<string, string> = {
  consumer: "text-blue-500",
  enterprise_buyer: "text-violet-500",
  investor: "text-emerald-500",
  competitor: "text-red-500",
  supplier: "text-amber-500",
  regulator: "text-slate-500",
  technical_expert: "text-cyan-500",
  mentor: "text-pink-500",
};

export default function AgentsPage() {
  const { data, isLoading: templatesLoading } = useQuery<PaginatedAgentTemplates>({
    queryKey: ["/api/agent-templates"],
  });
  const templates = data?.items ?? [];

  const categoryCounts = templates.reduce(
    (acc, t) => { acc[t.role] = (acc[t.role] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Agent Populations"
        description="Manage synthetic AI agent templates and population configurations"
      />

      <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(categoryIcons).map(([cat, Icon]) => (
              <Card key={cat}>
                <CardContent className="p-3 flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${categoryColors[cat]}`} />
                  <div>
                    <div className="text-sm font-bold">{categoryCounts[cat] || 0}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">{cat.replace(/_/g, " ")}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {templatesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-28 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {templates.map((t) => {
                const Icon = categoryIcons[t.role] || User;
                const color = categoryColors[t.role] || "text-gray-500";
                return (
                  <Card key={t.id} className="hover-elevate" data-testid={`agent-template-${t.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`flex items-center justify-center w-9 h-9 rounded-md bg-muted/50`}>
                          <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold">{t.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-[10px] capitalize">{t.role.replace(/_/g, " ")}</Badge>
                            <Badge variant="outline" className="text-[10px]">{t.modelTier}</Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{t.description || "No description"}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No agent templates</p>
              </CardContent>
            </Card>
          )}
        </div>
    </div>
  );
}

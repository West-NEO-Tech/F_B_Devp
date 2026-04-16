import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { AgentTemplate, AgentPopulation } from "@shared/schema";

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
  const { data: templates, isLoading: templatesLoading } = useQuery<AgentTemplate[]>({
    queryKey: ["/api/agent-templates"],
  });

  const { data: populations, isLoading: populationsLoading } = useQuery<AgentPopulation[]>({
    queryKey: ["/api/populations"],
  });

  const categoryCounts = templates?.reduce(
    (acc, t) => { acc[t.category] = (acc[t.category] || 0) + 1; return acc; },
    {} as Record<string, number>
  ) || {};

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Agent Populations"
        description="Manage synthetic AI agent templates and population configurations"
      />

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates" data-testid="tab-templates">Templates</TabsTrigger>
          <TabsTrigger value="populations" data-testid="tab-populations">Populations</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4 space-y-4">
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
          ) : templates && templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {templates.map((t) => {
                const Icon = categoryIcons[t.category] || User;
                const color = categoryColors[t.category] || "text-gray-500";
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
                            <Badge variant="secondary" className="text-[10px] capitalize">{t.category.replace(/_/g, " ")}</Badge>
                            {t.is_active && <Badge variant="default" className="text-[10px]">Active</Badge>}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{t.description || "No description"}</p>
                      {t.target_segment && (
                        <div className="text-[10px] text-muted-foreground">Target: {t.target_segment}</div>
                      )}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {Object.keys(t.persona_attributes || {}).length > 0 && (
                          <Badge variant="outline" className="text-[10px]">Persona</Badge>
                        )}
                        {Object.keys(t.economic_attributes || {}).length > 0 && (
                          <Badge variant="outline" className="text-[10px]">Economic</Badge>
                        )}
                        {Object.keys(t.decision_parameters || {}).length > 0 && (
                          <Badge variant="outline" className="text-[10px]">Decision</Badge>
                        )}
                      </div>
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
        </TabsContent>

        <TabsContent value="populations" className="mt-4 space-y-4">
          {populationsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : populations && populations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {populations.map((pop) => (
                <Card key={pop.id} className="hover-elevate" data-testid={`population-${pop.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold">{pop.name}</h3>
                      <Badge variant="secondary" className="text-[10px]">{pop.total_agents} agents</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{pop.description || "No description"}</p>
                    {pop.distribution && typeof pop.distribution === "object" && Object.keys(pop.distribution).length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {Object.entries(pop.distribution).map(([k, v]) => (
                          <Badge key={k} variant="outline" className="text-[10px]">{k}: {String(v)}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No populations configured</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

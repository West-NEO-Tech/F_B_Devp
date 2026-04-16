import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Cpu, Package, Code, Database, ExternalLink } from "lucide-react";
import type { Prototype } from "@shared/schema";

export default function PrototypesPage() {
  const { data: prototypes, isLoading } = useQuery<Prototype[]>({
    queryKey: ["/api/prototypes"],
  });

  const statusCounts = prototypes?.reduce(
    (acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; },
    {} as Record<string, number>
  ) || {};

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Prototypes"
        description="System architecture drafts and prototype tracking"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Planned", count: statusCounts.planned || 0, color: "text-blue-500" },
          { label: "In Progress", count: statusCounts.in_progress || 0, color: "text-amber-500" },
          { label: "Generated", count: statusCounts.generated || 0, color: "text-emerald-500" },
          { label: "Deployed", count: statusCounts.deployed || 0, color: "text-violet-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <div className={`text-lg font-bold ${s.color}`}>{s.count}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}
        </div>
      ) : prototypes && prototypes.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {prototypes.map((proto) => {
            const features = Array.isArray(proto.feature_backlog) ? proto.feature_backlog : [];
            const apis = Array.isArray(proto.api_plan) ? proto.api_plan : [];
            const models = Array.isArray(proto.data_model_plan) ? proto.data_model_plan : [];
            const completedFeatures = features.filter((f: any) => f.status === "done").length;
            const featureProgress = features.length > 0 ? (completedFeatures / features.length) * 100 : 0;

            return (
              <Card key={proto.id} data-testid={`prototype-${proto.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                        <Cpu className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{proto.name}</h3>
                        <p className="text-[10px] text-muted-foreground">{proto.description || "No description"}</p>
                      </div>
                    </div>
                    <StatusBadge status={proto.status} />
                  </div>

                  {proto.architecture_summary && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{proto.architecture_summary}</p>
                  )}

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Feature Progress</span>
                      <span className="font-medium">{completedFeatures}/{features.length}</span>
                    </div>
                    <Progress value={featureProgress} className="h-1.5" />
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {features.length} features
                    </div>
                    <div className="flex items-center gap-1">
                      <Code className="w-3 h-3" />
                      {apis.length} APIs
                    </div>
                    <div className="flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      {models.length} models
                    </div>
                    {proto.deployment_url && (
                      <div className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        Live
                      </div>
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
            <Cpu className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No prototypes yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

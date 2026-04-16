import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderKanban,
  Lightbulb,
  Play,
  FileText,
  TrendingUp,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import type { OverviewStats, ActivityLog, ProjectRead, PaginatedProjects } from "@/types/api";

const validationTrendData = [
  { month: "Jan", score: 62 },
  { month: "Feb", score: 68 },
  { month: "Mar", score: 71 },
  { month: "Apr", score: 65 },
  { month: "May", score: 74 },
  { month: "Jun", score: 78 },
  { month: "Jul", score: 82 },
  { month: "Aug", score: 79 },
];

const simulationMetrics = [
  { name: "Consumer", adoption: 72, retention: 65, sentiment: 78 },
  { name: "Enterprise", adoption: 58, retention: 82, sentiment: 71 },
  { name: "Investor", adoption: 45, retention: 90, sentiment: 68 },
  { name: "Regulator", adoption: 35, retention: 75, sentiment: 55 },
];

export default function OverviewPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<OverviewStats>({
    queryKey: ["/api/overview/stats"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/overview/activities"],
  });

  const { data: projectsData, isLoading: projectsLoading } = useQuery<PaginatedProjects>({
    queryKey: ["/api/projects"],
  });
  const projects = projectsData?.items ?? [];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Platform Overview"
        description="AI-Agent Industry Innovation Testbed - Research Dashboard"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <StatCard
              title="Active Projects"
              value={stats?.activeProjects ?? 0}
              icon={FolderKanban}
              trend={{ value: 12, label: "this month" }}
              testId="stat-projects"
            />
            <StatCard
              title="Ideas in Pipeline"
              value={stats?.ideasInPipeline ?? 0}
              icon={Lightbulb}
              trend={{ value: 8, label: "this week" }}
              testId="stat-ideas"
            />
            <StatCard
              title="Running Simulations"
              value={stats?.runningSimulations ?? 0}
              icon={Play}
              subtitle="across all projects"
              testId="stat-simulations"
            />
            <StatCard
              title="Completed Reports"
              value={stats?.completedReports ?? 0}
              icon={FileText}
              trend={{ value: 25, label: "this month" }}
              testId="stat-reports"
            />
            <StatCard
              title="Avg Validation Score"
              value={stats?.avgValidationScore ? `${stats.avgValidationScore}%` : "N/A"}
              icon={TrendingUp}
              trend={{ value: 5, label: "improvement" }}
              testId="stat-validation"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Validation Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={validationTrendData}>
                  <defs>
                    <linearGradient id="validationGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "var(--muted-foreground)" }} />
                  <YAxis className="text-xs" tick={{ fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(217, 91%, 60%)"
                    fill="url(#validationGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {activitiesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))
              ) : activities && activities.length > 0 ? (
                activities.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-xs" data-testid={`activity-${a.id}`}>
                    <Clock className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground">{a.action_type}</span>
                      {a.entity_type && (
                        <span className="text-muted-foreground"> on {a.entity_type}</span>
                      )}
                      <div className="text-muted-foreground text-[10px]">
                        {new Date(a.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground text-center py-4">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Agent Simulation Metrics by Segment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={simulationMetrics}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: "var(--muted-foreground)" }} />
                  <YAxis className="text-xs" tick={{ fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="adoption" fill="hsl(217, 91%, 60%)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="retention" fill="hsl(173, 58%, 39%)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="sentiment" fill="hsl(43, 74%, 49%)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projectsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))
              ) : projects.length > 0 ? (
                projects.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 p-3 rounded-md bg-muted/30" data-testid={`project-card-${p.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.productType || "General"}</div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground text-center py-4">No projects yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

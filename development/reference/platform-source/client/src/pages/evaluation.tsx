import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Brain, Shield, Rocket, Target, Award } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { Evaluation } from "@shared/schema";

export default function EvaluationPage() {
  const { data: evaluations, isLoading } = useQuery<Evaluation[]>({
    queryKey: ["/api/evaluations"],
  });

  const avgScores = evaluations && evaluations.length > 0
    ? {
        novelty: evaluations.reduce((s, e) => s + (Number(e.novelty_score) || 0), 0) / evaluations.length,
        feasibility: evaluations.reduce((s, e) => s + (Number(e.feasibility_score) || 0), 0) / evaluations.length,
        market: evaluations.reduce((s, e) => s + (Number(e.market_potential_score) || 0), 0) / evaluations.length,
        risk: evaluations.reduce((s, e) => s + (Number(e.risk_score) || 0), 0) / evaluations.length,
        readiness: evaluations.reduce((s, e) => s + (Number(e.readiness_score) || 0), 0) / evaluations.length,
        overall: evaluations.reduce((s, e) => s + (Number(e.overall_score) || 0), 0) / evaluations.length,
      }
    : null;

  const radarData = avgScores
    ? [
        { dimension: "Novelty", score: avgScores.novelty },
        { dimension: "Feasibility", score: avgScores.feasibility },
        { dimension: "Market", score: avgScores.market },
        { dimension: "Risk Mgmt", score: 100 - avgScores.risk },
        { dimension: "Readiness", score: avgScores.readiness },
      ]
    : [];

  const evaluatorBreakdown = evaluations
    ? evaluations.reduce(
        (acc, e) => {
          const type = e.evaluator_type;
          if (!acc[type]) acc[type] = { type, count: 0, avgScore: 0, total: 0 };
          acc[type].count += 1;
          acc[type].total += Number(e.overall_score) || 0;
          acc[type].avgScore = acc[type].total / acc[type].count;
          return acc;
        },
        {} as Record<string, { type: string; count: number; avgScore: number; total: number }>
      )
    : {};

  const barData = Object.values(evaluatorBreakdown).map((e) => ({
    name: e.type,
    score: Math.round(e.avgScore * 10) / 10,
    count: e.count,
  }));

  const scoreItems = [
    { label: "Novelty", value: avgScores?.novelty, icon: Brain, color: "text-violet-500" },
    { label: "Feasibility", value: avgScores?.feasibility, icon: Rocket, color: "text-blue-500" },
    { label: "Market Potential", value: avgScores?.market, icon: Target, color: "text-emerald-500" },
    { label: "Risk Score", value: avgScores?.risk, icon: Shield, color: "text-amber-500" },
    { label: "Readiness", value: avgScores?.readiness, icon: Award, color: "text-cyan-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Evaluation Dashboard"
        description="Multi-dimensional idea scoring and assessment by AI evaluator agents"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : avgScores ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {scoreItems.map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                  <div className="text-2xl font-bold">{value?.toFixed(1)}</div>
                  <Progress value={value} className="mt-2 h-1.5" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Score Dimensions (Radar)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid className="stroke-border" />
                      <PolarAngleAxis dataKey="dimension" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <Radar name="Score" dataKey="score" stroke="hsl(217, 91%, 60%)" fill="hsl(217, 91%, 60%)" fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Score by Evaluator Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }} />
                      <Bar dataKey="score" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">All Evaluations ({evaluations?.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Evaluator</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Novelty</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Feasibility</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Market</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Risk</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Overall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluations?.map((ev) => (
                      <tr key={ev.id} className="border-b last:border-0" data-testid={`eval-row-${ev.id}`}>
                        <td className="py-2 px-3 font-medium">{ev.evaluator_name || "AI Agent"}</td>
                        <td className="py-2 px-3"><Badge variant="secondary" className="text-[10px]">{ev.evaluator_type}</Badge></td>
                        <td className="text-center py-2 px-3">{Number(ev.novelty_score)?.toFixed(1)}</td>
                        <td className="text-center py-2 px-3">{Number(ev.feasibility_score)?.toFixed(1)}</td>
                        <td className="text-center py-2 px-3">{Number(ev.market_potential_score)?.toFixed(1)}</td>
                        <td className="text-center py-2 px-3">{Number(ev.risk_score)?.toFixed(1)}</td>
                        <td className="text-center py-2 px-3 font-semibold">{Number(ev.overall_score)?.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No evaluations available</p>
            <p className="text-xs text-muted-foreground">Submit ideas to trigger AI evaluations</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

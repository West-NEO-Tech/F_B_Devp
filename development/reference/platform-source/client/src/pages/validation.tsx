import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, ThumbsUp, DollarSign, AlertTriangle, Heart, Users, BarChart } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { MarketValidationResult } from "@shared/schema";

const adoptionCurveData = [
  { month: "M1", rate: 2.1 }, { month: "M2", rate: 5.3 }, { month: "M3", rate: 9.8 },
  { month: "M4", rate: 15.2 }, { month: "M5", rate: 22.1 }, { month: "M6", rate: 28.9 },
  { month: "M7", rate: 34.5 }, { month: "M8", rate: 39.2 }, { month: "M9", rate: 43.1 },
  { month: "M10", rate: 46.2 }, { month: "M11", rate: 48.8 }, { month: "M12", rate: 51.1 },
];

const sentimentData = [
  { name: "Positive", value: 58, color: "hsl(142, 71%, 45%)" },
  { name: "Neutral", value: 27, color: "hsl(var(--muted))" },
  { name: "Negative", value: 15, color: "hsl(0, 84%, 60%)" },
];

const funnelData = [
  { stage: "Awareness", value: 10000 },
  { stage: "Interest", value: 6500 },
  { stage: "Consideration", value: 3800 },
  { stage: "Intent", value: 2200 },
  { stage: "Purchase", value: 1400 },
  { stage: "Retention", value: 980 },
];

export default function ValidationPage() {
  const { data: results, isLoading } = useQuery<MarketValidationResult[]>({
    queryKey: ["/api/validation"],
  });

  const latestResult = results && results.length > 0 ? results[0] : null;

  const scoreCards = latestResult
    ? [
        { label: "Adoption Score", value: Number(latestResult.adoption_score) || 0, icon: TrendingUp, color: "text-blue-500" },
        { label: "WTP Score", value: Number(latestResult.willingness_to_pay_score) || 0, icon: DollarSign, color: "text-emerald-500" },
        { label: "Retention", value: Number(latestResult.retention_score) || 0, icon: Heart, color: "text-pink-500" },
        { label: "Sentiment", value: Number(latestResult.sentiment_score) || 0, icon: ThumbsUp, color: "text-violet-500" },
        { label: "Conversion Rate", value: Number(latestResult.conversion_rate) || 0, icon: Users, color: "text-amber-500" },
        { label: "Churn Risk", value: Number(latestResult.churn_risk) || 0, icon: AlertTriangle, color: "text-red-500" },
      ]
    : [];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Market Validation"
        description="Synthetic market validation results from AI-agent simulations"
      />

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : latestResult ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {scoreCards.map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                  </div>
                  <div className="text-xl font-bold">{value.toFixed(1)}%</div>
                  <Progress value={value} className="mt-1.5 h-1" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Adoption Curve (12 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={adoptionCurveData}>
                      <defs>
                        <linearGradient id="adoptionGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }} />
                      <Area type="monotone" dataKey="rate" stroke="hsl(217, 91%, 60%)" fill="url(#adoptionGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sentiment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                        {sentimentData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4">
                  {sentimentData.map((s) => (
                    <div key={s.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name} ({s.value}%)
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {funnelData.map((stage, i) => {
                  const maxVal = funnelData[0].value;
                  const pct = (stage.value / maxVal) * 100;
                  return (
                    <div key={stage.stage} className="flex items-center gap-3" data-testid={`funnel-${stage.stage.toLowerCase()}`}>
                      <div className="w-24 text-xs text-muted-foreground text-right">{stage.stage}</div>
                      <div className="flex-1 relative h-7 rounded-md overflow-hidden bg-muted/30">
                        <div
                          className="absolute inset-y-0 left-0 rounded-md bg-primary/20"
                          style={{ width: `${pct}%` }}
                        />
                        <div className="absolute inset-y-0 flex items-center px-3 text-xs font-medium">
                          {stage.value.toLocaleString()}
                        </div>
                      </div>
                      <div className="w-12 text-xs text-muted-foreground text-right">{pct.toFixed(0)}%</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No validation results yet</p>
            <p className="text-xs text-muted-foreground">Run a simulation to generate market validation data</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, TrendingDown, Target, Calendar, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import type { BusinessViabilityResult } from "@/types/api";

const revenueProjection = [
  { month: "Q1", revenue: 45000, cost: 82000 },
  { month: "Q2", revenue: 120000, cost: 95000 },
  { month: "Q3", revenue: 210000, cost: 115000 },
  { month: "Q4", revenue: 340000, cost: 140000 },
  { month: "Y2Q1", revenue: 480000, cost: 160000 },
  { month: "Y2Q2", revenue: 650000, cost: 185000 },
];

const pricingScenarios = [
  { scenario: "Low ($9/mo)", revenue: 180000, margin: 22, share: 8.5 },
  { scenario: "Mid ($19/mo)", revenue: 340000, margin: 45, share: 5.2 },
  { scenario: "High ($29/mo)", revenue: 420000, margin: 58, share: 3.1 },
  { scenario: "Enterprise", revenue: 780000, margin: 62, share: 1.8 },
];

export default function ViabilityPage() {
  const { data: results, isLoading } = useQuery<BusinessViabilityResult[]>({
    queryKey: ["/api/viability"],
  });

  const latest = results && results.length > 0 ? results[0] : null;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Business Viability"
        description="Financial projections and survival probability analysis"
      />

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : latest ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Projected Revenue</span>
                </div>
                <div className="text-xl font-bold">${Number(latest.projected_revenue)?.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-muted-foreground">Projected Cost</span>
                </div>
                <div className="text-xl font-bold">${Number(latest.projected_cost)?.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Break-even Month</span>
                </div>
                <div className="text-xl font-bold">Month {latest.break_even_month || "N/A"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-violet-500" />
                  <span className="text-xs text-muted-foreground">Survival Probability</span>
                </div>
                <div className="text-xl font-bold">{Number(latest.survival_probability)?.toFixed(1)}%</div>
                <Progress value={Number(latest.survival_probability) || 0} className="mt-1.5 h-1.5" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Revenue vs Cost Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueProjection}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                      <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "12px" }} formatter={(value: number) => [`$${value.toLocaleString()}`, ""]} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="cost" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pricing Scenarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pricingScenarios}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="scenario" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                      <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "12px" }} />
                      <Bar dataKey="margin" fill="hsl(217, 91%, 60%)" name="Margin %" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="share" fill="hsl(173, 58%, 39%)" name="Market Share %" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {latest.unit_economics && Object.keys(latest.unit_economics).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Unit Economics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(latest.unit_economics).map(([key, val]) => (
                    <div key={key} className="p-3 rounded-md bg-muted/30">
                      <div className="text-[10px] text-muted-foreground capitalize">{key.replace(/_/g, " ")}</div>
                      <div className="text-sm font-bold mt-0.5">{typeof val === "number" ? `$${val.toLocaleString()}` : String(val)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No viability analysis available</p>
            <p className="text-xs text-muted-foreground">Run simulations to generate business viability data</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

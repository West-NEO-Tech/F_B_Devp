import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Handshake, Globe, DollarSign, Target, ExternalLink } from "lucide-react";
import type { Investor, InvestorMatch } from "@shared/schema";

export default function InvestmentsPage() {
  const { data: investors, isLoading: investorsLoading } = useQuery<Investor[]>({
    queryKey: ["/api/investors"],
  });

  const { data: matches, isLoading: matchesLoading } = useQuery<(InvestorMatch & { investor_name?: string })[]>({
    queryKey: ["/api/matches"],
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Investment Matching"
        description="AI-matched investor profiles and strategic partnership recommendations"
      />

      {matchesLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : matches && matches.length > 0 ? (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Matches ({matches.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {matches.map((m) => (
                  <div key={m.id} className="p-4 rounded-md bg-muted/30" data-testid={`match-${m.id}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="text-sm font-semibold">{m.investor_name || "Investor"}</h3>
                        <p className="text-xs text-muted-foreground">{m.rationale || "Strong alignment identified"}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">{Number(m.fit_score)?.toFixed(0)}%</div>
                        <div className="text-[10px] text-muted-foreground">Fit Score</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-0.5">Stage Alignment</div>
                        <Progress value={Number(m.stage_alignment_score) || 0} className="h-1.5" />
                        <div className="text-[10px] font-medium mt-0.5">{Number(m.stage_alignment_score)?.toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-0.5">Sector Alignment</div>
                        <Progress value={Number(m.sector_alignment_score) || 0} className="h-1.5" />
                        <div className="text-[10px] font-medium mt-0.5">{Number(m.sector_alignment_score)?.toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-0.5">Readiness</div>
                        <Progress value={Number(m.readiness_score) || 0} className="h-1.5" />
                        <div className="text-[10px] font-medium mt-0.5">{Number(m.readiness_score)?.toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Investor Database ({investors?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {investorsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : investors && investors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {investors.map((inv) => (
                <div key={inv.id} className="p-4 rounded-md bg-muted/30 hover-elevate" data-testid={`investor-${inv.id}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold">{inv.name}</h3>
                    {inv.investor_type && <Badge variant="secondary" className="text-[10px]">{inv.investor_type}</Badge>}
                  </div>
                  {inv.thesis && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{inv.thesis}</p>}
                  <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground">
                    {inv.stage_focus && (
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {inv.stage_focus}
                      </div>
                    )}
                    {inv.geography && (
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {inv.geography}
                      </div>
                    )}
                    {inv.typical_ticket_min && inv.typical_ticket_max && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ${Number(inv.typical_ticket_min).toLocaleString()} - ${Number(inv.typical_ticket_max).toLocaleString()}
                      </div>
                    )}
                  </div>
                  {inv.industry_focus && inv.industry_focus.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {inv.industry_focus.map((f) => (
                        <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-8">
              <Handshake className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              No investors in database
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, Eye } from "lucide-react";
import type { Report } from "@/types/api";

export default function ReportsPage() {
  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const statusCounts = reports?.reduce(
    (acc, r) => { acc[r.report_status] = (acc[r.report_status] || 0) + 1; return acc; },
    {} as Record<string, number>
  ) || {};

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Reports"
        description="Validation summaries and exportable reports"
      />

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold">{statusCounts.draft || 0}</div>
            <div className="text-[10px] text-muted-foreground">Draft</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-amber-500">{statusCounts.generated || 0}</div>
            <div className="text-[10px] text-muted-foreground">Generated</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-emerald-500">{statusCounts.published || 0}</div>
            <div className="text-[10px] text-muted-foreground">Published</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : reports && reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="hover-elevate" data-testid={`report-${report.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold">{report.title}</h3>
                        <StatusBadge status={report.report_status} />
                      </div>
                      {report.executive_summary && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{report.executive_summary}</p>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" data-testid={`button-view-report-${report.id}`}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No reports generated</p>
            <p className="text-xs text-muted-foreground">Complete simulations to generate validation reports</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

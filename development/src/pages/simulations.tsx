import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Play, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SimulationRun, SimulationScenario } from "@/types/api";

export default function SimulationsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState("");
  const { toast } = useToast();

  const { data: runs, isLoading: runsLoading } = useQuery<SimulationRun[]>({
    queryKey: ["/api/simulations"],
  });

  const { data: scenarios } = useQuery<SimulationScenario[]>({
    queryKey: ["/api/scenarios"],
  });

  const runMutation = useMutation({
    mutationFn: async (scenarioId: string) =>
      apiRequest<SimulationRun>("POST", "/api/simulations/run", { scenario_id: scenarioId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/simulations"] });
      setDialogOpen(false);
      toast({ title: "Simulation started" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const statusCounts = runs?.reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; },
    {} as Record<string, number>
  ) || {};

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Simulations"
        description="Run AI-agent market simulations and track results"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-run-simulation">
                <Play className="w-4 h-4 mr-1" />
                Run Simulation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start Simulation Run</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label>Select Scenario</Label>
                  <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                    <SelectTrigger data-testid="select-scenario">
                      <SelectValue placeholder="Choose scenario..." />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarios?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  data-testid="button-start-run"
                  onClick={() => runMutation.mutate(selectedScenario)}
                  disabled={!selectedScenario || runMutation.isPending}
                >
                  {runMutation.isPending ? "Starting..." : "Start Simulation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <div className="text-lg font-bold">{statusCounts.queued || 0}</div>
            <div className="text-[10px] text-muted-foreground">Queued</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Loader2 className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <div className="text-lg font-bold">{statusCounts.running || 0}</div>
            <div className="text-[10px] text-muted-foreground">Running</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
            <div className="text-lg font-bold">{statusCounts.completed || 0}</div>
            <div className="text-[10px] text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <XCircle className="w-5 h-5 mx-auto mb-1 text-red-500" />
            <div className="text-lg font-bold">{statusCounts.failed || 0}</div>
            <div className="text-[10px] text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          {scenarios && scenarios.length > 0 ? (
            <div className="space-y-2">
              {scenarios.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30" data-testid={`scenario-${s.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{s.description || "No description"}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No scenarios configured</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Simulation Runs ({runs?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {runsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : runs && runs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">ID</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Started</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Completed</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b last:border-0" data-testid={`run-${run.id}`}>
                      <td className="py-2 px-3 font-mono text-[10px]">{run.id.slice(0, 8)}</td>
                      <td className="py-2 px-3"><StatusBadge status={run.status} /></td>
                      <td className="py-2 px-3">{run.started_at ? new Date(run.started_at).toLocaleString() : "-"}</td>
                      <td className="py-2 px-3">{run.completed_at ? new Date(run.completed_at).toLocaleString() : "-"}</td>
                      <td className="py-2 px-3 truncate max-w-[200px]">{run.summary || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No simulation runs</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

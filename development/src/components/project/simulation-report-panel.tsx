import { Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { RunRead } from "@/hooks/use-simulation";

function getExpectedMinutes(run: RunRead | undefined): number | null {
  const raw = run?.resultSummary?.expected_minutes;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function SimulationReportPanel({
  run,
  isLoading,
  isError,
}: {
  run: RunRead | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading && !run) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Running simulation…</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-destructive">
          Failed to load simulation status.
        </CardContent>
      </Card>
    );
  }

  const expected = getExpectedMinutes(run) ?? 6;
  const status = run?.status ?? "running";

  if (status !== "completed") {
    return (
      <Card>
        <CardHeader className="text-sm font-semibold">Report</CardHeader>
        <CardContent className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">Simulation in progress</p>
          <p className="text-xs text-muted-foreground">
            Estimated time: ~{expected} minutes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-sm font-semibold">Report</CardHeader>
      <CardContent className="flex flex-col items-center gap-3 py-16">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
        <p className="text-sm font-medium text-foreground">Simulation complete</p>
        <p className="text-xs text-muted-foreground">
          Output fields are not finalized yet. Showing a placeholder completion screen for now.
        </p>
      </CardContent>
    </Card>
  );
}


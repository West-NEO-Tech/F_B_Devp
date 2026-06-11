import { Clock } from "lucide-react";
import type { SeedMaterialRead } from "@/hooks/use-seed-materials";

interface RunHistorySectionProps {
  seedMaterials: SeedMaterialRead[];
}

export function RunHistorySection({ seedMaterials }: RunHistorySectionProps) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-3">
        <Clock className="h-3.5 w-3.5" />
        Run History
      </div>
      {seedMaterials.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <div className="text-2xl opacity-40 mb-2">📭</div>
          <div className="text-xs text-muted-foreground/60">
            No simulation runs yet. Configure and generate pre-simulation display to start.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {seedMaterials.map((sm) => (
            <div
              key={sm.id}
              className="flex items-center justify-between rounded-lg bg-card border border-border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground">
                  v{sm.version}
                </span>
                <span
                  className={`text-xs font-medium ${
                    sm.status === "completed"
                      ? "text-green-500"
                      : sm.status === "failed"
                        ? "text-destructive"
                        : "text-yellow-500"
                  }`}
                >
                  {sm.status}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground/60">
                {new Date(sm.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

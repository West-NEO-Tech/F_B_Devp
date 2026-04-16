import { Check, Lock, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectStep } from "./project-step-nav";

interface ProjectTabBarProps {
  steps: ProjectStep[];
  activeStep: string;
  onStepClick: (id: string) => void;
  historyCount?: number;
  onHistoryOpen?: () => void;
  historyOpen?: boolean;
}

export function ProjectTabBar({
  steps,
  activeStep,
  onStepClick,
  historyCount = 0,
  onHistoryOpen,
  historyOpen = false,
}: ProjectTabBarProps) {
  return (
    <div className="sticky top-0 z-10 flex items-stretch border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Step tabs */}
      <div className="flex items-stretch flex-1 min-w-0 overflow-x-auto px-6">
        {steps.map((step, i) => {
          const isActive = step.id === activeStep;
          const prevCompleted = i > 0 && steps[i - 1].status === "completed";

          return (
            <div key={step.id} className="flex items-stretch shrink-0">
              {/* Sequential connector between tabs */}
              {i > 0 && (
                <div className="flex items-center px-1">
                  <div
                    className={cn(
                      "h-px w-4 transition-colors",
                      prevCompleted ? "bg-green-500/25" : "bg-border/40"
                    )}
                  />
                </div>
              )}

              <button
                onClick={() => step.status !== "locked" && onStepClick(step.id)}
                disabled={step.status === "locked"}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium",
                  "whitespace-nowrap select-none transition-colors",
                  // Bottom-border active indicator
                  "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5",
                  "after:rounded-t-full after:transition-colors after:duration-200",
                  // Active: full opacity + primary underline
                  isActive && "text-foreground after:bg-primary",
                  // Completed but not active: muted, hoverable
                  !isActive && step.status === "completed" &&
                    "text-muted-foreground hover:text-foreground cursor-pointer after:bg-transparent",
                  // Current-progress step, not currently viewed
                  !isActive && step.status === "active" &&
                    "text-muted-foreground hover:text-foreground cursor-pointer after:bg-transparent",
                  // Locked: severely dimmed, not interactive
                  step.status === "locked" && "text-muted-foreground/30 cursor-not-allowed"
                )}
              >
                {/* Status indicator */}
                {step.status === "completed" && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500/10 text-green-500 shrink-0">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                )}
                {step.status === "active" && (
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0 transition-colors",
                      isActive ? "bg-primary" : "bg-muted-foreground/35"
                    )}
                  />
                )}
                {step.status === "locked" && (
                  <Lock className="h-3 w-3 shrink-0" />
                )}

                {step.label}
              </button>
            </div>
          );
        })}
      </div>

      {/* History button — right-aligned, separated by a divider */}
      <div className="flex items-stretch shrink-0 border-l border-border">
        <button
          onClick={onHistoryOpen}
          className={cn(
            "flex items-center gap-1.5 px-4 text-sm font-medium transition-colors",
            historyOpen
              ? "text-foreground bg-muted/40"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>History</span>
          {historyCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-sm bg-muted px-1 text-xs font-semibold text-muted-foreground">
              {historyCount > 9 ? "9+" : historyCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

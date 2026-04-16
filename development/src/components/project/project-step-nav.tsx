import { cn } from "@/lib/utils";

export type StepStatus = "completed" | "active" | "locked";

export interface ProjectStep {
  id: string;
  label: string;
  status: StepStatus;
}

interface ProjectStepNavProps {
  steps: ProjectStep[];
  onStepClick?: (stepId: string) => void;
}

export function ProjectStepNav({ steps, onStepClick }: ProjectStepNavProps) {
  return (
    <nav className="space-y-0.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-2">
        Outline
      </div>
      {steps.map((step) => (
        <button
          key={step.id}
          onClick={() => step.status !== "locked" && onStepClick?.(step.id)}
          disabled={step.status === "locked"}
          className={cn(
            "relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
            step.status === "completed" && "text-muted-foreground hover:text-foreground",
            step.status === "active" && "text-foreground font-medium",
            step.status === "locked" && "text-muted-foreground/30 cursor-default"
          )}
        >
          {step.status === "active" && (
            <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary" />
          )}
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              step.status === "completed" && "bg-green-500",
              step.status === "active" && "bg-primary ring-2 ring-primary/20",
              step.status === "locked" && "bg-muted-foreground/30"
            )}
          />
          {step.label}
        </button>
      ))}
    </nav>
  );
}

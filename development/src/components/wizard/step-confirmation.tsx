import { Bot, ClipboardCheck, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ReviewEntryList,
  ReviewSectionCard,
} from "@/components/project/project-review-display";
import {
  buildAdditionalEntriesFromDescription,
  buildProjectOverviewEntries,
} from "@/lib/project-review-entries";

interface StepConfirmationProps {
  project: {
    name: string;
    description: string;
    productType: string;
  };
}

export function StepConfirmation({ project }: StepConfirmationProps) {
  const overviewEntries = buildProjectOverviewEntries(project);
  const additionalEntries = buildAdditionalEntriesFromDescription(project.description);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-foreground">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          <h3 className="text-base font-medium">Review & confirm</h3>
        </div>
        <p className="text-xs text-muted-foreground pl-6">
          Check your project details before creating.
        </p>
      </div>

      <ReviewSectionCard
        icon={FileText}
        title="Project overview"
        description="Basic details from earlier steps"
      >
        <ReviewEntryList entries={overviewEntries} />
      </ReviewSectionCard>

      <ReviewSectionCard
        icon={Bot}
        title="Additional information"
        description="Answers from the Market Info step"
        badge={
          additionalEntries.length > 0 ? (
            <Badge variant="outline" className="shrink-0 text-xs font-normal">
              {additionalEntries.length}{" "}
              {additionalEntries.length === 1 ? "answer" : "answers"}
            </Badge>
          ) : undefined
        }
        isEmpty={additionalEntries.length === 0}
        emptyMessage="No additional answers were provided."
      >
        <ReviewEntryList entries={additionalEntries} />
      </ReviewSectionCard>

      <p className="text-xs text-muted-foreground text-center px-2">
        Click <span className="font-medium text-foreground">Create Project</span> below to
        finalize and activate your project.
      </p>
    </div>
  );
}

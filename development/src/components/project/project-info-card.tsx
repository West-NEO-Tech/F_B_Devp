import { useState } from "react";
import {
  Pencil,
  Calendar,
  Check,
  ChevronDown,
  ArrowRight,
  FileText,
  Bot,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/status-badge";
import {
  ReviewEntryList,
  ReviewSectionCard,
  productTypeReviewBody,
} from "@/components/project/project-review-display";
import {
  buildProjectAdditionalEntries,
  buildProjectOverviewEntries,
} from "@/lib/project-review-entries";
import type { ProjectRead } from "@/types/api";

interface ProjectInfoCardProps {
  project: ProjectRead;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  onContinueToSimConfig?: () => void;
  canContinueToSimConfig?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ProjectInfoCard({
  project,
  onEdit,
  onDelete,
  isDeleting = false,
  onContinueToSimConfig,
  canContinueToSimConfig = true,
  collapsed,
  onToggleCollapse,
}: ProjectInfoCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const overviewEntries = buildProjectOverviewEntries(project);
  const additionalEntries = buildProjectAdditionalEntries(project);

  if (collapsed) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Check className="h-4 w-4 text-green-500" />
            Project Information
          </div>
          <Button variant="ghost" size="sm" className="text-xs" onClick={onToggleCollapse}>
            Expand
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {project.productType ? (
              <div className="text-sm">{productTypeReviewBody(project.productType)}</div>
            ) : null}
            {additionalEntries.length > 0 && (
              <Badge variant="outline" className="text-xs font-normal">
                {additionalEntries.length}{" "}
                {additionalEntries.length === 1 ? "answer" : "answers"}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">{project.name}</h2>
          <StatusBadge status={project.status} />
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove <span className="font-medium">{project.name}</span>{" "}
                  and all related scenarios, seed materials, and simulation runs. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete();
                  }}
                >
                  {isDeleting ? "Deleting…" : "Delete project"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" size="sm" onClick={onEdit} disabled={isDeleting}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <ReviewSectionCard
          icon={FileText}
          title="Project overview"
          description="Basic project details"
        >
          <ReviewEntryList entries={overviewEntries} />
        </ReviewSectionCard>

        <ReviewSectionCard
          icon={Bot}
          title="Additional information"
          description="Market Info Q&A and supplemental details"
          badge={
            additionalEntries.length > 0 ? (
              <Badge variant="outline" className="shrink-0 text-xs font-normal">
                {additionalEntries.length}{" "}
                {additionalEntries.length === 1 ? "answer" : "answers"}
              </Badge>
            ) : undefined
          }
          isEmpty={additionalEntries.length === 0}
          emptyMessage="No additional information provided."
        >
          <ReviewEntryList entries={additionalEntries} />
        </ReviewSectionCard>

        <Separator />

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex gap-6">
            <div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Created</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-5">
                {new Date(project.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Last updated</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-5">
                {new Date(project.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {onContinueToSimConfig && (
            <Button
              size="sm"
              onClick={onContinueToSimConfig}
              disabled={!canContinueToSimConfig}
              title={
                canContinueToSimConfig
                  ? undefined
                  : "Complete project name and product type first"
              }
            >
              <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
              Sim Config
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

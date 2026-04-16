import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label?: string }> = {
  draft: { variant: "secondary" },
  active: { variant: "default" },
  in_review: { variant: "outline", label: "In Review" },
  validated: { variant: "default" },
  archived: { variant: "secondary" },
  submitted: { variant: "outline" },
  generated: { variant: "secondary" },
  shortlisted: { variant: "default" },
  rejected: { variant: "destructive" },
  approved: { variant: "default" },
  not_started: { variant: "secondary", label: "Not Started" },
  planned: { variant: "outline" },
  in_progress: { variant: "default", label: "In Progress" },
  deployed: { variant: "default" },
  failed: { variant: "destructive" },
  queued: { variant: "outline" },
  running: { variant: "default" },
  completed: { variant: "default" },
  cancelled: { variant: "secondary" },
  pending: { variant: "outline" },
  success: { variant: "default" },
  error: { variant: "destructive" },
  published: { variant: "default" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = statusConfig[status] || { variant: "secondary" as const };
  const label = config.label || status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <Badge variant={config.variant} className={className} data-testid={`status-${status}`}>
      {label}
    </Badge>
  );
}

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getProductTypeOption } from "@/lib/product-types";

export interface ReviewEntry {
  label: string;
  body: ReactNode;
}

export function EmptyReviewValue() {
  return <span className="italic">Not specified</span>;
}

export function ReviewEntryList({ entries }: { entries: ReviewEntry[] }) {
  return (
    <ol className="space-y-0">
      {entries.map((entry, index) => (
        <li key={`${entry.label}-${index}`}>
          {index > 0 && <Separator className="my-4" />}
          <div className="flex gap-3">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary tabular-nums"
              aria-hidden
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 space-y-2 pb-0.5">
              <p className="text-sm font-medium leading-relaxed text-foreground whitespace-pre-wrap">
                {entry.label}
              </p>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap border-l-2 border-primary/25 pl-3">
                {entry.body}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ReviewSectionCard({
  icon: Icon,
  title,
  description,
  badge,
  children,
  emptyMessage,
  isEmpty,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: ReactNode;
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}) {
  return (
    <Card className="overflow-hidden shadow-none">
      <CardHeader className="pb-4 bg-muted/20 border-b border-border/60">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              {description ? (
                <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
              ) : null}
            </div>
          </div>
          {badge}
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        {isEmpty && emptyMessage ? (
          <p className="text-sm text-muted-foreground italic py-2 text-center">{emptyMessage}</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export function productTypeReviewBody(productType: string | null | undefined): ReactNode {
  const trimmed = (productType ?? "").trim();
  if (!trimmed) return <EmptyReviewValue />;

  const option = getProductTypeOption(trimmed);
  if (!option) return trimmed;

  const Icon = option.icon;
  return (
    <span className="inline-flex items-start gap-2">
      <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <span>
        <span className="text-foreground font-medium">{option.value}</span>
        <span className="text-muted-foreground"> — {option.description}</span>
      </span>
    </span>
  );
}

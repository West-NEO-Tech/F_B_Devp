import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AICompletePreviewProps {
  completions: Record<string, string | string[] | null>;
  onAccept: (field: string) => void;
  onAcceptAll: () => void;
  onReject: () => void;
  open: boolean;
}

function formatFieldName(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

function renderValue(value: string | string[] | null) {
  if (value === null) return null;
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item) => (
          <Badge key={item} variant="secondary">{item}</Badge>
        ))}
      </div>
    );
  }
  return <p className="text-sm text-foreground">{value}</p>;
}

export function AICompletePreview({
  completions,
  onAccept,
  onAcceptAll,
  onReject,
  open,
}: AICompletePreviewProps) {
  const fields = Object.entries(completions).filter(([, v]) => v !== null);

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onReject(); }}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>AI Suggestions</SheetTitle>
          <SheetDescription>
            Review the AI-generated completions below. Accept individual fields or all at once.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto py-4 space-y-4">
          {fields.map(([key, value], i) => (
            <div key={key}>
              {i > 0 && <Separator className="mb-4" />}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">{formatFieldName(key)}</p>
                  {renderValue(value)}
                </div>
                <Button variant="outline" size="sm" onClick={() => onAccept(key)} className="shrink-0">
                  Accept
                </Button>
              </div>
            </div>
          ))}
          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">No suggestions available.</p>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={onReject}>Dismiss</Button>
          <Button onClick={onAcceptAll} disabled={fields.length === 0}>Accept All</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

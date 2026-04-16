import { Lock } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";

interface LockedStepCardProps {
  title: string;
  phaseLabel: string;
}

export function LockedStepCard({ title, phaseLabel }: LockedStepCardProps) {
  return (
    <Card className="opacity-40">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          {title}
        </div>
        <span className="text-[11px] text-muted-foreground/60">{phaseLabel}</span>
      </CardHeader>
    </Card>
  );
}

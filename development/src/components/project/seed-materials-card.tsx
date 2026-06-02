import { useState } from "react";
import {
  Check,
  TrendingUp,
  Users,
  MessageCircle,
  ChevronRight,
  X,
  Plus,
  RefreshCw,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { SeedMaterialRead } from "@/hooks/use-seed-materials";

interface SeedMaterialsCardProps {
  seedMaterial: SeedMaterialRead;
  onRegenerate: () => void;
  onUpdateConsumerPersonas: (personas: Record<string, unknown>[]) => void;
  onUpdateTopics: (topics: Record<string, unknown>[]) => void;
  isRegenerating: boolean;
  onStartSimulation?: () => void;
  isStartingSimulation?: boolean;
}

export function SeedMaterialsCard({
  seedMaterial,
  onRegenerate,
  onUpdateConsumerPersonas,
  onUpdateTopics,
  isRegenerating,
  onStartSimulation,
  isStartingSimulation,
}: SeedMaterialsCardProps) {
  const [marketContextOpen, setMarketContextOpen] = useState(true);

  if (seedMaterial.status === "failed") {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="h-4 w-4 text-destructive" />
            Seed Materials
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={onRegenerate}
            disabled={isRegenerating}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Retry
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            {seedMaterial.errorMessage || "Generation failed."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Check className="h-4 w-4 text-green-500" />
          Seed Materials
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={onRegenerate}
          disabled={isRegenerating}
        >
          {isRegenerating ? "Regenerating..." : "Regenerate"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Market Context */}
        {seedMaterial.marketContext && (
          <MarketContextSection
            data={seedMaterial.marketContext}
            open={marketContextOpen}
            onToggle={() => setMarketContextOpen((v) => !v)}
          />
        )}

        {/* Consumer Personas (editable) */}
        {seedMaterial.consumerPersonas && (
          <EditableTagSection
            icon={<Users className="h-3.5 w-3.5" />}
            title="Consumer Personas"
            items={seedMaterial.consumerPersonas.map((p) => p.name)}
            onUpdate={(names) => {
              const updated = names.map((name) => {
                const existing = seedMaterial.consumerPersonas?.find((p) => p.name === name);
                return existing || { name };
              });
              onUpdateConsumerPersonas(updated);
            }}
            colorClass="text-chart-4"
          />
        )}

        {/* Discussion Topics (editable) */}
        {seedMaterial.discussionTopics && (
          <EditableTagSection
            icon={<MessageCircle className="h-3.5 w-3.5" />}
            title="Discussion Topics"
            items={seedMaterial.discussionTopics.map((t) => t.topic)}
            onUpdate={(topics) => {
              const updated = topics.map((topic) => {
                const existing = seedMaterial.discussionTopics?.find(
                  (t) => t.topic === topic
                );
                return existing || { topic };
              });
              onUpdateTopics(updated);
            }}
            colorClass="text-chart-2"
            tagBg="bg-chart-2/10"
          />
        )}

        {onStartSimulation && seedMaterial.status === "completed" && (
          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              onClick={onStartSimulation}
              disabled={isStartingSimulation}
            >
              {isStartingSimulation ? (
                <>
                  <div className="h-3.5 w-3.5 mr-1.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Starting...
                </>
              ) : (
                <>
                  <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                  Simulation
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MarketContextSection({
  data,
  open,
  onToggle,
}: {
  data: NonNullable<SeedMaterialRead["marketContext"]>;
  open: boolean;
  onToggle: () => void;
}) {
  const hasStats = data.marketSize || data.growthRate || (data.keyStats?.length ?? 0) > 0;

  return (
    <div className="rounded-lg bg-muted/80 border border-border/50 overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onToggle();
        }}
        className="flex items-center justify-between gap-2 p-3 cursor-pointer hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-1.5 text-xs font-medium text-chart-3">
          <TrendingUp className="h-3.5 w-3.5" />
          Market Context
        </div>
        <ChevronRight
          className={[
            "h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform",
            open ? "rotate-90" : "",
          ].join(" ")}
        />
      </div>

      <div className="px-3 pb-3 space-y-3 border-t border-border/40">
        {hasStats && (
          <div className="flex flex-wrap gap-6 pt-3">
            {data.marketSize && (
              <div>
                <div className="text-lg font-semibold leading-tight">{data.marketSize}</div>
                <div className="text-[10px] text-muted-foreground">Market Size</div>
              </div>
            )}
            {data.growthRate && (
              <div>
                <div className="text-lg font-semibold leading-tight text-green-600">
                  {data.growthRate}
                </div>
                <div className="text-[10px] text-muted-foreground">Annual Growth</div>
              </div>
            )}
            {!open &&
              data.keyStats?.slice(0, 1).map((s, i) => (
                <div key={i}>
                  <div className="text-lg font-semibold leading-tight">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground">{s.label}</div>
                </div>
              ))}
          </div>
        )}

        {open && data.summary && (
          <p className="text-sm leading-relaxed text-foreground/90">{data.summary}</p>
        )}

        {open && data.keyStats && data.keyStats.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {data.keyStats.map((s, i) => (
              <div
                key={i}
                className="rounded-md border border-border/50 bg-background/50 px-3 py-2"
              >
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-sm font-semibold">{s.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TagSection({
  icon,
  title,
  items,
  colorClass,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  colorClass: string;
}) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <div className={`flex items-center gap-1.5 text-xs font-medium ${colorClass}`}>
        {icon}
        {title}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {items.map((item) => (
          <Badge key={item} variant="secondary" className="text-[11px]">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function EditableTagSection({
  icon,
  title,
  items,
  onUpdate,
  colorClass,
  tagBg,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  onUpdate: (items: string[]) => void;
  colorClass: string;
  tagBg?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState("");

  function handleRemove(item: string) {
    onUpdate(items.filter((i) => i !== item));
  }

  function handleAdd() {
    const trimmed = newValue.trim();
    if (trimmed && !items.includes(trimmed)) {
      onUpdate([...items, trimmed]);
    }
    setNewValue("");
    setAdding(false);
  }

  return (
    <div className="rounded-lg bg-muted p-3">
      <div className={`flex items-center gap-1.5 text-xs font-medium ${colorClass}`}>
        {icon}
        {title}
        <span className="text-[10px] text-muted-foreground/60 font-normal ml-1">
          · Can edit
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {items.map((item) => (
          <Badge key={item} variant="secondary" className={`text-[11px] ${tagBg || ""}`}>
            {item}
            <button
              onClick={() => handleRemove(item)}
              className="ml-1 text-muted-foreground/40 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {adding ? (
          <Input
            autoFocus
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onBlur={handleAdd}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="h-6 w-32 text-[11px]"
            placeholder={`Add ${title.toLowerCase().replace(/s$/, "")}`}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-muted-foreground/20 px-2.5 py-0.5 text-[11px] text-muted-foreground/40 hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  Check,
  Users,
  MessageCircle,
  ChevronRight,
  X,
  Plus,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  ScrollText,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AgentDistributionDisplay } from "@/components/project/agent-distribution-display";
import type { SeedMaterialRead } from "@/hooks/use-seed-materials";
import type { AgentKindItem } from "@/hooks/use-pre-simulation-display";
import type { AgentRole } from "@/lib/agent-templates";

interface SeedMaterialsCardProps {
  seedMaterial: SeedMaterialRead;
  distribution: Record<AgentRole, number>;
  agentKinds?: AgentKindItem[] | null;
  uploadedDisplay?: Record<string, unknown> | null;
  onRegenerate: () => void;
  onUpdateConsumerPersonas: (personas: Record<string, unknown>[]) => void;
  onUpdateTopics: (topics: Record<string, unknown>[]) => void;
  isRegenerating: boolean;
  onStartSimulation?: () => void;
  isStartingSimulation?: boolean;
}

export function SeedMaterialsCard({
  seedMaterial,
  distribution,
  agentKinds,
  uploadedDisplay,
  onRegenerate,
  onUpdateConsumerPersonas,
  onUpdateTopics,
  isRegenerating,
  onStartSimulation,
  isStartingSimulation,
}: SeedMaterialsCardProps) {
  const [simulationQueryOpen, setSimulationQueryOpen] = useState(true);

  if (seedMaterial.status === "failed") {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="h-4 w-4 text-destructive" />
            Pre-Simulation Display
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
          Pre-Simulation Display
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
        {uploadedDisplay && Object.keys(uploadedDisplay).length > 0 && (
          <UploadedDisplaySection content={uploadedDisplay} />
        )}

        {seedMaterial.simulationQuery && (
          <SimulationQuerySection
            query={seedMaterial.simulationQuery}
            open={simulationQueryOpen}
            onToggle={() => setSimulationQueryOpen((v) => !v)}
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

        <AgentDistributionDisplay distribution={distribution} agentKinds={agentKinds} />

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

function UploadedDisplaySection({ content }: { content: Record<string, unknown> }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border border-chart-3/25 bg-chart-3/5 overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen((v) => !v);
        }}
        className="flex items-center justify-between gap-2 p-3 cursor-pointer hover:bg-chart-3/10 transition-colors"
      >
        <div className="flex items-center gap-1.5 text-xs font-medium text-chart-3">
          <ScrollText className="h-3.5 w-3.5" />
          Simulation Upload
        </div>
        <ChevronRight
          className={[
            "h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform",
            open ? "rotate-90" : "",
          ].join(" ")}
        />
      </div>
      {open && (
        <div className="px-3 pb-3 border-t border-chart-3/15">
          <pre className="text-xs leading-relaxed text-foreground/90 pt-3 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(content, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function SimulationQuerySection({
  query,
  open,
  onToggle,
}: {
  query: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-lg border border-primary/25 bg-primary/5 overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onToggle();
        }}
        className="flex items-center justify-between gap-2 p-3 cursor-pointer hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <ScrollText className="h-3.5 w-3.5" />
          Simulation Query
        </div>
        <ChevronRight
          className={[
            "h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform",
            open ? "rotate-90" : "",
          ].join(" ")}
        />
      </div>
      {open && (
        <div className="px-3 pb-3 border-t border-primary/15">
          <p className="text-sm leading-relaxed text-foreground/90 pt-3 whitespace-pre-wrap">
            {query}
          </p>
        </div>
      )}
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

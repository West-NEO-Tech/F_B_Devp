import { useMemo } from "react";
import { Settings, RotateCcw, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  DEPTH_CONFIGS,
  AGENT_ROLES,
  AGENT_ROLE_LABELS,
  AGENT_ROLE_COLORS,
  type SimulationDepth,
  type AgentRole,
} from "@/lib/agent-templates";

interface SimulationConfigCardProps {
  depth: SimulationDepth;
  distribution: Record<AgentRole, number>;
  onDepthChange: (depth: SimulationDepth) => void;
  onDistributionChange: (dist: Record<AgentRole, number>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function SimulationConfigCard({
  depth,
  distribution,
  onDepthChange,
  onDistributionChange,
  onGenerate,
  isGenerating,
}: SimulationConfigCardProps) {
  const total = useMemo(
    () => Object.values(distribution).reduce((a, b) => a + b, 0),
    [distribution]
  );

  function handleDepthSelect(newDepth: SimulationDepth) {
    onDepthChange(newDepth);
    onDistributionChange({ ...DEPTH_CONFIGS[newDepth].distribution });
  }

  function handleCountChange(role: AgentRole, value: string) {
    const num = Math.max(0, parseInt(value) || 0);
    onDistributionChange({ ...distribution, [role]: num });
  }

  function handleReset() {
    onDistributionChange({ ...DEPTH_CONFIGS[depth].distribution });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Settings className="h-4 w-4 text-primary" />
          Simulation Config
        </div>
        <Badge variant="outline" className="text-[10px] text-primary border-primary/20 bg-primary/5">
          Current Step
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Depth Selector */}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2.5">
            Simulation Depth
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {(["quick", "standard", "deep"] as const).map((d) => {
              const config = DEPTH_CONFIGS[d];
              const selected = depth === d;
              return (
                <button
                  key={d}
                  onClick={() => handleDepthSelect(d)}
                  className={cn(
                    "rounded-lg border-2 p-3 text-center transition-colors",
                    selected
                      ? "border-primary bg-accent"
                      : "border-transparent bg-muted hover:border-muted-foreground/20"
                  )}
                >
                  <div
                    className={cn(
                      "text-sm font-semibold",
                      selected ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {config.label}
                  </div>
                  <div className="text-xl my-1">{config.emoji}</div>
                  <div
                    className={cn(
                      "text-xs",
                      selected ? "text-chart-1" : "text-muted-foreground"
                    )}
                  >
                    {config.agentCount} Agents · {config.estimatedTime}
                  </div>
                  <div className="text-xxs text-muted-foreground/60 mt-1">
                    {config.description}
                  </div>
                  {d === "standard" && (
                    <div className="text-xxs text-primary font-medium mt-0.5">
                      ✓ Recommended
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Agent Distribution */}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2.5">
            Agent Distribution
          </div>
          <div className="grid grid-cols-4 gap-2">
            {AGENT_ROLES.map((role) => (
              <div key={role} className="text-center">
                <div className="text-xs text-muted-foreground mb-1">
                  {AGENT_ROLE_LABELS[role]}
                </div>
                <Input
                  type="number"
                  min={0}
                  value={distribution[role]}
                  onChange={(e) => handleCountChange(role, e.target.value)}
                  ref={(el) => {
                    if (el && !el.dataset.wheelBound) {
                      el.dataset.wheelBound = "1";
                      el.addEventListener(
                        "wheel",
                        (ev) => {
                          if (document.activeElement === el) {
                            ev.preventDefault();
                          }
                        },
                        { passive: false },
                      );
                    }
                  }}
                  onWheel={(e) => {
                    if (document.activeElement !== e.currentTarget) return;
                    const delta = e.deltaY < 0 ? 1 : -1;
                    const cur = parseInt(e.currentTarget.value) || 0;
                    handleCountChange(role, String(Math.max(0, cur + delta)));
                  }}
                  className="h-8 text-center text-sm font-semibold"
                />
              </div>
            ))}
          </div>
          {/* Color bar */}
          <div className="flex h-1.5 rounded-full overflow-hidden gap-px mt-2.5">
            {AGENT_ROLES.map((role) =>
              distribution[role] > 0 ? (
                <div
                  key={role}
                  style={{
                    flex: distribution[role],
                    backgroundColor: AGENT_ROLE_COLORS[role],
                  }}
                  className="rounded-sm"
                />
              ) : null
            )}
          </div>
          <div className="text-right text-xs text-muted-foreground mt-1">
            Total: <span className="font-semibold text-foreground">{total}</span> Agents
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset to Template
          </Button>
          <Button size="sm" onClick={onGenerate} disabled={isGenerating || total === 0}>
            {isGenerating ? (
              <>
                <div className="h-3.5 w-3.5 mr-1.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                Generate Seed Materials
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

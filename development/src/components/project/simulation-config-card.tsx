import { useMemo } from "react";
import { Settings, RotateCcw, ArrowRight, Minus, Plus, Users } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

import {
  DEPTH_CONFIGS,
  SIMULATION_DEPTHS,
  scaleDistribution,
  estimateTimeForAgentCount,
  DISTRIBUTION_TEMPLATE,
  CUSTOM_AGENT_COUNT_MIN,
  CUSTOM_AGENT_COUNT_MAX,
  type SimulationDepth,
  type AgentRole,
} from "@/lib/agent-templates";

interface SimulationConfigCardProps {
  depth: SimulationDepth;
  distribution: Record<AgentRole, number>;
  customAgentCount: number;
  onDepthChange: (depth: SimulationDepth) => void;
  onDistributionChange: (dist: Record<AgentRole, number>) => void;
  onCustomAgentCountChange: (count: number) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function SimulationConfigCard({
  depth,
  distribution,
  customAgentCount,
  onDepthChange,
  onDistributionChange,
  onCustomAgentCountChange,
  onGenerate,
  isGenerating,
}: SimulationConfigCardProps) {
  const total = useMemo(
    () => Object.values(distribution).reduce((a, b) => a + b, 0),
    [distribution]
  );

  function handleDepthSelect(newDepth: SimulationDepth) {
    onDepthChange(newDepth);
    if (newDepth === "custom") {
      const count = Math.min(
        CUSTOM_AGENT_COUNT_MAX,
        Math.max(CUSTOM_AGENT_COUNT_MIN, customAgentCount || DEPTH_CONFIGS.custom.agentCount)
      );
      onCustomAgentCountChange(count);
      onDistributionChange(scaleDistribution(DISTRIBUTION_TEMPLATE, count));
    } else {
      onDistributionChange({ ...DEPTH_CONFIGS[newDepth].distribution });
    }
  }

  function applyCustomCount(raw: number) {
    const num = Math.min(
      CUSTOM_AGENT_COUNT_MAX,
      Math.max(CUSTOM_AGENT_COUNT_MIN, raw)
    );
    onCustomAgentCountChange(num);
    onDistributionChange(scaleDistribution(DISTRIBUTION_TEMPLATE, num));
  }

  function handleCustomCountChange(value: string) {
    applyCustomCount(parseInt(value, 10) || CUSTOM_AGENT_COUNT_MIN);
  }

  function nudgeCustomCount(delta: number) {
    applyCustomCount(customAgentCount + delta);
  }

  function handleReset() {
    if (depth === "custom") {
      const count = DEPTH_CONFIGS.custom.agentCount;
      onCustomAgentCountChange(count);
      onDistributionChange(scaleDistribution(DISTRIBUTION_TEMPLATE, count));
    } else {
      onDistributionChange({ ...DEPTH_CONFIGS[depth].distribution });
    }
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {SIMULATION_DEPTHS.map((d) => {
              const config = DEPTH_CONFIGS[d];
              const selected = depth === d;
              const displayCount = d === "custom" ? customAgentCount : config.agentCount;
              const displayTime =
                d === "custom"
                  ? estimateTimeForAgentCount(customAgentCount)
                  : config.estimatedTime;

              return (
                <button
                  key={d}
                  type="button"
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
                    {displayCount} Agents · {displayTime}
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

          {depth === "custom" && (
            <CustomAgentCountPanel
              count={customAgentCount}
              estimatedTime={estimateTimeForAgentCount(customAgentCount)}
              onCountChange={applyCustomCount}
              onInputChange={handleCustomCountChange}
              onNudge={nudgeCustomCount}
            />
          )}
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
                Generate Pre-Simulation Display
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const CUSTOM_COUNT_PRESETS = [
  { label: "Quick", value: DEPTH_CONFIGS.quick.agentCount },
  { label: "Standard", value: DEPTH_CONFIGS.standard.agentCount },
  { label: "Deep", value: DEPTH_CONFIGS.deep.agentCount },
] as const;

function CustomAgentCountPanel({
  count,
  estimatedTime,
  onCountChange,
  onInputChange,
  onNudge,
}: {
  count: number;
  estimatedTime: string;
  onCountChange: (n: number) => void;
  onInputChange: (value: string) => void;
  onNudge: (delta: number) => void;
}) {
  return (
    <div className="mt-4 rounded-xl border-2 border-primary/40 bg-primary/5 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Set agent count</p>
          <p className="text-xs text-muted-foreground">
            Drag the slider or type a number · {CUSTOM_AGENT_COUNT_MIN}–{CUSTOM_AGENT_COUNT_MAX}
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto shrink-0 text-xs font-normal">
          Est. {estimatedTime}
        </Badge>
      </div>

      <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        Agents
      </p>
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full border-2 border-primary/30 hover:bg-primary/10"
          onClick={() => onNudge(-10)}
          disabled={count <= CUSTOM_AGENT_COUNT_MIN}
          aria-label="Decrease by 10"
        >
          <Minus className="h-5 w-5" />
        </Button>

        <Input
          id="custom-agent-count"
          type="number"
          min={CUSTOM_AGENT_COUNT_MIN}
          max={CUSTOM_AGENT_COUNT_MAX}
          value={count}
          onChange={(e) => onInputChange(e.target.value)}
          className={cn(
            "h-11 w-24 sm:w-28 shrink-0 border-2 border-primary/50 bg-background text-center",
            "text-xl sm:text-2xl font-semibold tabular-nums text-primary",
            "focus-visible:ring-primary"
          )}
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full border-2 border-primary/30 hover:bg-primary/10"
          onClick={() => onNudge(10)}
          disabled={count >= CUSTOM_AGENT_COUNT_MAX}
          aria-label="Increase by 10"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <div className="mt-5 px-1">
        <Slider
          value={[count]}
          min={CUSTOM_AGENT_COUNT_MIN}
          max={CUSTOM_AGENT_COUNT_MAX}
          step={1}
          onValueChange={([v]) => onCountChange(v)}
          className="py-2"
          aria-label="Agent count slider"
        />
        <div className="flex justify-between text-sm font-semibold text-foreground/80 mt-2 px-0.5 tabular-nums">
          <span>{CUSTOM_AGENT_COUNT_MIN}</span>
          <span>{CUSTOM_AGENT_COUNT_MAX}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Quick pick:</span>
        {CUSTOM_COUNT_PRESETS.map(({ label, value }) => (
          <Button
            key={label}
            type="button"
            variant={count === value ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => onCountChange(value)}
          >
            {label} ({value})
          </Button>
        ))}
      </div>
    </div>
  );
}

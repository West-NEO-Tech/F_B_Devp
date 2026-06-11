import { useMemo } from "react";
import type { AgentKindItem } from "@/hooks/use-pre-simulation-display";
import {
  AGENT_ROLES,
  AGENT_ROLE_LABELS,
  AGENT_ROLE_COLORS,
  type AgentRole,
} from "@/lib/agent-templates";

interface AgentDistributionDisplayProps {
  distribution: Record<AgentRole, number>;
  agentKinds?: AgentKindItem[] | null;
}

const FALLBACK_COLOR = "hsl(215 16% 65%)";

export function AgentDistributionDisplay({
  distribution,
  agentKinds,
}: AgentDistributionDisplayProps) {
  const items = useMemo(() => {
    if (agentKinds && agentKinds.length > 0) {
      return agentKinds.map((kind) => ({
        key: kind.key,
        label: kind.label,
        count: kind.count,
        color:
          kind.key in AGENT_ROLE_COLORS
            ? AGENT_ROLE_COLORS[kind.key as AgentRole]
            : FALLBACK_COLOR,
      }));
    }
    return AGENT_ROLES.map((role) => ({
      key: role,
      label: AGENT_ROLE_LABELS[role],
      count: distribution[role],
      color: AGENT_ROLE_COLORS[role],
    }));
  }, [agentKinds, distribution]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.count, 0),
    [items]
  );

  return (
    <div className="rounded-lg bg-muted p-3">
      <div className="text-sm font-medium text-muted-foreground mb-2.5">
        Agent Distribution
      </div>
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <div key={item.key} className="text-center">
            <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
            <div
              className="flex h-8 items-center justify-center rounded-md border border-input bg-background/80 text-sm font-semibold text-foreground"
              aria-readonly
            >
              {item.count}
            </div>
          </div>
        ))}
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px mt-2.5">
        {items.map((item) =>
          item.count > 0 ? (
            <div
              key={item.key}
              style={{
                flex: item.count,
                backgroundColor: item.color,
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
  );
}

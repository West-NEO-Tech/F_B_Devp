export const AGENT_ROLES = [
  "consumer",
  "enterprise_buyer",
  "competitor",
  "investor",
  "supplier",
  "regulator",
  "technical_expert",
  "mentor",
] as const;

export type AgentRole = (typeof AGENT_ROLES)[number];

export const AGENT_ROLE_LABELS: Record<AgentRole, string> = {
  consumer: "Consumer",
  enterprise_buyer: "Enterprise Buyer",
  competitor: "Competitor",
  investor: "Investor",
  supplier: "Supplier",
  regulator: "Regulator",
  technical_expert: "Technical Expert",
  mentor: "Mentor",
};

export const AGENT_ROLE_COLORS: Record<AgentRole, string> = {
  consumer: "hsl(145 55% 45%)",
  enterprise_buyer: "hsl(217 91% 70%)",
  competitor: "hsl(0 70% 55%)",
  investor: "hsl(43 74% 65%)",
  supplier: "hsl(197 37% 70%)",
  regulator: "hsl(280 50% 55%)",
  technical_expert: "hsl(173 58% 65%)",
  mentor: "hsl(320 50% 55%)",
};

export type SimulationDepth = "quick" | "standard" | "deep" | "custom";

export const SIMULATION_DEPTHS = ["quick", "standard", "deep", "custom"] as const;

export interface DepthConfig {
  label: string;
  emoji: string;
  agentCount: number;
  estimatedTime: string;
  description: string;
  distribution: Record<AgentRole, number>;
}

export const DEPTH_CONFIGS: Record<SimulationDepth, DepthConfig> = {
  quick: {
    label: "Quick",
    emoji: "⚡",
    agentCount: 20,
    estimatedTime: "~2 min",
    description: "Validate core hypothesis",
    distribution: {
      consumer: 10,
      enterprise_buyer: 3,
      competitor: 2,
      investor: 1,
      supplier: 1,
      regulator: 1,
      technical_expert: 1,
      mentor: 1,
    },
  },
  standard: {
    label: "Standard",
    emoji: "🔬",
    agentCount: 81,
    estimatedTime: "~10 min",
    description: "Full market feedback",
    distribution: {
      consumer: 50,
      enterprise_buyer: 15,
      competitor: 5,
      investor: 3,
      supplier: 3,
      regulator: 2,
      technical_expert: 2,
      mentor: 1,
    },
  },
  deep: {
    label: "Deep",
    emoji: "🔭",
    agentCount: 221,
    estimatedTime: "~30 min",
    description: "Competition deep-dive",
    distribution: {
      consumer: 150,
      enterprise_buyer: 40,
      competitor: 10,
      investor: 5,
      supplier: 8,
      regulator: 3,
      technical_expert: 3,
      mentor: 2,
    },
  },
  custom: {
    label: "Custom",
    emoji: "✏️",
    agentCount: 81,
    estimatedTime: "Varies",
    description: "Set your own agent count",
    distribution: {
      consumer: 50,
      enterprise_buyer: 15,
      competitor: 5,
      investor: 3,
      supplier: 3,
      regulator: 2,
      technical_expert: 2,
      mentor: 1,
    },
  },
};

/** Standard ratios — used to scale custom agent totals. */
export const DISTRIBUTION_TEMPLATE = DEPTH_CONFIGS.standard.distribution;

export function scaleDistribution(
  template: Record<AgentRole, number>,
  targetTotal: number
): Record<AgentRole, number> {
  if (targetTotal <= 0) {
    return Object.fromEntries(AGENT_ROLES.map((r) => [r, 0])) as Record<AgentRole, number>;
  }

  const templateTotal = Object.values(template).reduce((a, b) => a + b, 0);
  if (templateTotal === 0) {
    return Object.fromEntries(AGENT_ROLES.map((r) => [r, 0])) as Record<AgentRole, number>;
  }

  const scaled = AGENT_ROLES.map((role) => ({
    role,
    exact: (template[role] / templateTotal) * targetTotal,
  }));

  const result = Object.fromEntries(
    scaled.map(({ role, exact }) => [role, Math.floor(exact)])
  ) as Record<AgentRole, number>;

  let remainder = targetTotal - Object.values(result).reduce((a, b) => a + b, 0);
  const byFraction = [...scaled]
    .map(({ role, exact }) => ({ role, frac: exact - Math.floor(exact) }))
    .sort((a, b) => b.frac - a.frac);

  for (let i = 0; remainder > 0; i++) {
    result[byFraction[i % byFraction.length].role]++;
    remainder--;
  }

  return result;
}

export function estimateTimeForAgentCount(count: number): string {
  if (count <= 20) return "~2 min";
  if (count <= 81) return "~10 min";
  if (count <= 221) return "~30 min";
  return `~${Math.max(5, Math.round(count / 7))} min`;
}

export const CUSTOM_AGENT_COUNT_MIN = 1;
export const CUSTOM_AGENT_COUNT_MAX = 500;

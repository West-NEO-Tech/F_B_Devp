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

export type SimulationDepth = "quick" | "standard" | "deep";

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
};

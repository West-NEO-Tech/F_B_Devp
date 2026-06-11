import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface PreSimulationDisplayRead {
  id: string;
  projectId: string;
  content: Record<string, unknown>;
  agentDistribution?: Record<string, number> | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentKindItem {
  key: string;
  label: string;
  count: number;
}

export interface AgentDistributionRead {
  projectId: string;
  agents: Record<string, number>;
  agentKinds: AgentKindItem[];
  total: number;
}

export function usePreSimulationDisplay(projectId: string | undefined) {
  return useQuery<PreSimulationDisplayRead | null>({
    queryKey: [`/api/projects/${projectId}/pre-simulation-display`],
    enabled: !!projectId,
    retry: false,
    queryFn: async () => {
      try {
        return await apiRequest<PreSimulationDisplayRead>(
          "GET",
          `/api/projects/${projectId}/pre-simulation-display`
        );
      } catch {
        return null;
      }
    },
  });
}

export function useAgentDistribution(projectId: string | undefined) {
  return useQuery<AgentDistributionRead | null>({
    queryKey: [`/api/projects/${projectId}/pre-simulation-display/agent-distribution`],
    enabled: !!projectId,
    retry: false,
    queryFn: async () => {
      try {
        return await apiRequest<AgentDistributionRead>(
          "GET",
          `/api/projects/${projectId}/pre-simulation-display/agent-distribution`
        );
      } catch {
        return null;
      }
    },
  });
}

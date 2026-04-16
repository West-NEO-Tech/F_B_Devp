import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ScenarioRead {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  agentCount: number;
  agentDepth: "quick" | "standard" | "deep";
  marketConfig: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface ScenarioUpdate {
  name?: string;
  description?: string | null;
  agentCount?: number;
  agentDepth?: "quick" | "standard" | "deep";
  marketConfig?: Record<string, unknown>;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function useProjectScenario(projectId: string | undefined) {
  return useQuery<ScenarioRead | null>({
    queryKey: [`/api/projects/${projectId}/scenarios`, "first"],
    enabled: !!projectId,
    queryFn: async () => {
      const resp = await apiRequest<PaginatedResponse<ScenarioRead>>(
        "GET",
        `/api/projects/${projectId}/scenarios`
      );
      if (resp.items.length > 0) {
        return resp.items[0];
      }
      const created = await apiRequest<ScenarioRead>(
        "POST",
        `/api/projects/${projectId}/scenarios`,
        { name: "Default Simulation", agentDepth: "standard" }
      );
      return created;
    },
  });
}

export function useUpdateScenario(scenarioId: string | undefined) {
  return useMutation({
    mutationFn: (data: ScenarioUpdate) =>
      apiRequest<ScenarioRead>("PATCH", `/api/scenarios/${scenarioId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/scenarios/${scenarioId}`] });
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].includes("/scenarios"),
      });
    },
  });
}

export type { ScenarioRead, ScenarioUpdate };

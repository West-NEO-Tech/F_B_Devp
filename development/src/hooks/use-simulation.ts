import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

export interface SimulationStartResponse {
  runId: string;
  scenarioId: string;
  status: string;
  agentsStatus: "generating" | "ready";
}

export interface MarketInfoQAItem {
  question: string;
  answer: string;
}

export type SimConfigType = "quick" | "standard" | "deep";

/** Simulation run input for external clients (GET /api/runs/{runId}/agents). */
export interface SimulationAgentsResponse {
  userId: string;
  scenarioId: string;
  seedMaterialId: string;
  status: "generating" | "ready";
  message?: string | null;
  description: string;
  productType?: string | null;
  consumerPersonas: string[];
  discussionTopics: string[];
  additionalInformation: MarketInfoQAItem[];
  simConfigType: SimConfigType;
}

export interface SimulationStartInput {
  scenarioId: string;
  userId: string;
  seedMaterialId: string;
}

export function useStartSimulation() {
  return useMutation({
    mutationFn: ({ scenarioId, userId, seedMaterialId }: SimulationStartInput) =>
      apiRequest<SimulationStartResponse>(
        "POST",
        `/api/scenarios/${scenarioId}/simulation/start`,
        { userId, seedMaterialId }
      ),
  });
}

export function useSimulationAgents(runId: string | undefined) {
  return useQuery<SimulationAgentsResponse>({
    queryKey: [`/api/runs/${runId}/agents`],
    enabled: !!runId,
    queryFn: () => apiRequest<SimulationAgentsResponse>("GET", `/api/runs/${runId}/agents`),
    refetchInterval: (query) =>
      query.state.data?.status === "generating" ? 1500 : false,
  });
}

export interface RunRead {
  id: string;
  scenarioId: string;
  status: "pending" | "running" | "completed" | "failed" | string;
  startedAt: string | null;
  completedAt: string | null;
  resultSummary: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export function useRunStatus(runId: string | undefined) {
  return useQuery<RunRead>({
    queryKey: [`/api/runs/${runId}`],
    enabled: !!runId,
    queryFn: () => apiRequest<RunRead>("GET", `/api/runs/${runId}`),
    refetchInterval: (query) =>
      query.state.data?.status === "completed" ||
      query.state.data?.status === "failed"
        ? false
        : 2000,
  });
}

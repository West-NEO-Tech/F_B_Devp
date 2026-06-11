import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export interface SeedMaterialRead {
  id: string;
  scenarioId: string;
  version: number;
  status: "generating" | "completed" | "failed";
  marketContext: {
    marketSize?: string;
    growthRate?: string;
    keyStats?: { label: string; value: string }[];
    summary?: string;
  } | null;
  competitors: {
    name: string;
    positioning?: string;
    strengths?: string[];
    weaknesses?: string[];
  }[] | null;
  consumerPersonas: {
    name: string;
    emoji?: string;
    ageRange?: string;
    description?: string;
    painPoints?: string[];
  }[] | null;
  discussionTopics: {
    topic: string;
    description?: string;
    relevance?: string;
  }[] | null;
  simulationQuery: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SeedMaterialUpdate {
  competitors?: Record<string, unknown>[];
  consumerPersonas?: Record<string, unknown>[];
  discussionTopics?: Record<string, unknown>[];
}

export function useSeedMaterials(scenarioId: string | undefined) {
  return useQuery<SeedMaterialRead[]>({
    queryKey: [`/api/scenarios/${scenarioId}/seed-materials`],
    enabled: !!scenarioId,
  });
}

export function useLatestSeedMaterial(scenarioId: string | undefined) {
  const query = useSeedMaterials(scenarioId);
  const latest = query.data?.[0] ?? null;
  return { ...query, data: latest };
}

export interface SeedMaterialGenerateInput {
  agentDepth: "quick" | "standard" | "deep" | "custom";
  agentCount: number;
  marketConfig: { agent_distribution: Record<string, number> };
}

export function useGenerateSeedMaterials(scenarioId: string | undefined) {
  return useMutation({
    mutationFn: (config: SeedMaterialGenerateInput) =>
      apiRequest<SeedMaterialRead>(
        "POST",
        `/api/scenarios/${scenarioId}/seed-materials`,
        config
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/scenarios/${scenarioId}/seed-materials`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/scenarios/${scenarioId}`],
      });
    },
  });
}

export function useUpdateSeedMaterial(seedMaterialId: string | undefined) {
  return useMutation({
    mutationFn: (data: SeedMaterialUpdate) =>
      apiRequest<SeedMaterialRead>(
        "PATCH",
        `/api/seed-materials/${seedMaterialId}`,
        data
      ),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/scenarios/${result.scenarioId}/seed-materials`],
      });
    },
  });
}

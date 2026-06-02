import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ProjectRead, ProjectCreate, ProjectUpdate, AICompleteResponse } from "@/types/api";

export function useProject(id: string | undefined) {
  return useQuery<ProjectRead>({
    queryKey: [`/api/projects/${id}`],
    enabled: !!id,
  });
}

export function useCreateProject() {
  return useMutation({
    mutationFn: (data: ProjectCreate) =>
      apiRequest<ProjectRead>("POST", "/api/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });
}

export function useUpdateProject(id: string) {
  return useMutation({
    mutationFn: (data: ProjectUpdate) =>
      apiRequest<ProjectRead>("PATCH", `/api/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
    },
  });
}

export function useDeleteProject(id: string) {
  return useMutation({
    mutationFn: () => apiRequest<void>("DELETE", `/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.removeQueries({ queryKey: [`/api/projects/${id}`] });
    },
  });
}

export function useAIComplete(id: string) {
  return useMutation({
    mutationFn: () =>
      apiRequest<AICompleteResponse>("POST", `/api/projects/${id}/ai-complete`),
  });
}

import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useProject, useUpdateProject, useDeleteProject } from "@/hooks/use-project";
import { useProjectScenario, useEnsureScenario } from "@/hooks/use-scenario";
import {
  useLatestSeedMaterial,
  useSeedMaterials,
  useGenerateSeedMaterials,
  useUpdateSeedMaterial,
} from "@/hooks/use-seed-materials";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ProjectInfoCard } from "@/components/project/project-info-card";
import { ProjectEditForm } from "@/components/project/project-edit-form";
import { ProjectTabBar } from "@/components/project/project-tab-bar";
import type { ProjectStep } from "@/components/project/project-step-nav";
import { SimulationConfigCard } from "@/components/project/simulation-config-card";
import { SeedMaterialsCard } from "@/components/project/seed-materials-card";
import { LockedStepCard } from "@/components/project/locked-step-card";
import { RunHistorySection } from "@/components/project/run-history-section";
import { SimulationReportPanel } from "@/components/project/simulation-report-panel";
import { useStartSimulation, useRunStatus } from "@/hooks/use-simulation";
import { DEPTH_CONFIGS, type SimulationDepth, type AgentRole } from "@/lib/agent-templates";
import type { ProjectUpdate } from "@/types/api";

function isProjectInfoComplete(project: { name: string; productType?: string | null }): boolean {
  return !!project.name && !!project.productType;
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [, setLocation] = useLocation();

  const { data: project, isLoading: projectLoading, error: projectError } = useProject(id);
  const { data: scenario, isLoading: scenarioLoading } = useProjectScenario(id);
  const ensureScenario = useEnsureScenario(id);

  // Auto-create scenario if project has none
  useEffect(() => {
    if (!scenarioLoading && scenario === null && id) {
      ensureScenario.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioLoading, scenario, id]);
  const { data: latestSeed } = useLatestSeedMaterial(scenario?.id);
  const { data: allSeeds } = useSeedMaterials(scenario?.id);

  const updateProject = useUpdateProject(id!);
  const deleteProject = useDeleteProject(id!);
  const generateSeed = useGenerateSeedMaterials(scenario?.id);
  const updateSeed = useUpdateSeedMaterial(latestSeed?.id);

  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [showHistory, setShowHistory] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | undefined>();

  const startSimulation = useStartSimulation();
  const { data: runData, isLoading: runLoading, isError: runError } =
    useRunStatus(activeRunId);

  // Allow deep-linking to report via ?runid=<uuid>
  useEffect(() => {
    const runid = new URLSearchParams(window.location.search).get("runid");
    if (runid) {
      setActiveRunId(runid);
      setActiveTab("report");
    }
  }, [id]);

  // Local simulation config state — initialised lazily; synced when scenario loads
  const [depth, setDepth] = useState<SimulationDepth>("standard");
  const [distribution, setDistribution] = useState<Record<AgentRole, number>>(
    () => ({ ...DEPTH_CONFIGS["standard"].distribution })
  );

  // Sync local state once the async scenario data arrives (or changes)
  useEffect(() => {
    if (!scenario) return;
    if (scenario.agentDepth) setDepth(scenario.agentDepth as SimulationDepth);
    const dist = (scenario.marketConfig as Record<string, unknown>)?.agent_distribution;
    if (dist && typeof dist === "object") {
      setDistribution(dist as Record<AgentRole, number>);
    }
  }, [scenario?.id]);

  // Compute step statuses
  const infoComplete = project ? isProjectInfoComplete(project) : false;
  const hasSeed = latestSeed?.status === "completed";

  const steps: ProjectStep[] = [
    { id: "info", label: "Project Info", status: infoComplete ? "completed" : "active" },
    {
      id: "config",
      label: "Sim Config",
      status: infoComplete ? (hasSeed ? "completed" : "active") : "locked",
    },
    {
      id: "seed",
      label: "Seed Materials",
      status: hasSeed ? "completed" : infoComplete ? "active" : "locked",
    },
    {
      id: "report",
      label: "Report",
      status: hasSeed ? (activeRunId ? "active" : "locked") : "locked",
    },
  ];

  function handleSave(data: ProjectUpdate) {
    updateProject.mutate(data, {
      onSuccess: () => {
        setIsEditing(false);
        toast({ title: "Project updated" });
      },
      onError: () => {
        toast({ title: "Update failed", variant: "destructive" });
      },
    });
  }

  function handleDeleteProject() {
    deleteProject.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Project deleted" });
        setLocation("/projects");
      },
      onError: (err) => {
        toast({
          title: "Delete failed",
          description: err instanceof Error ? err.message : "Could not delete project",
          variant: "destructive",
        });
      },
    });
  }

  function handleStartSimulation() {
    if (!scenario?.id || !latestSeed?.id || !project?.id) return;
    startSimulation.mutate(
      {
        scenarioId: scenario.id,
        userId: project.id,
        seedMaterialId: latestSeed.id,
      },
      {
        onSuccess: (result) => {
          setActiveRunId(result.runId);
          setActiveTab("report");
          setLocation(`/projects/${id}?runid=${result.runId}`);
          toast({ title: "Simulation started" });
        },
        onError: (err) => {
          const message = err instanceof Error ? err.message : "Failed to start simulation";
          toast({
            title: "Could not start simulation",
            description: message,
            variant: "destructive",
          });
        },
      }
    );
  }

  function handleGenerate() {
    const config = {
      agentDepth: depth,
      agentCount: Object.values(distribution).reduce((a, b) => a + b, 0),
      marketConfig: { agent_distribution: distribution },
    };
    setActiveTab("seed");
    generateSeed.mutate(config, {
      onSuccess: () => {
        toast({ title: "Seed materials generated" });
      },
      onError: (err) => {
        const message =
          err instanceof Error ? err.message : "Generation failed";
        toast({
          title: "Generation failed",
          description: message,
          variant: "destructive",
        });
      },
    });
  }

  if (projectLoading || scenarioLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-sm text-muted-foreground">
              {projectError ? "Failed to load project." : "Project not found."}
            </p>
            <Link href="/projects">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 space-y-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/projects">Projects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">{project.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {[project.productType, project.targetMarket, project.pricingModel]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5">
            {project.status}
          </Badge>
        </div>
      </div>

      {/* Tab bar */}
      <ProjectTabBar
        steps={steps}
        activeStep={activeTab}
        onStepClick={setActiveTab}
        historyCount={allSeeds?.length ?? 0}
        onHistoryOpen={() => setShowHistory((v) => !v)}
        historyOpen={showHistory}
      />

      {/* Tab content */}
      <div className="px-8 py-6 space-y-3">
        {/* History panel (toggled by history button) */}
        {showHistory && (
          <RunHistorySection seedMaterials={allSeeds || []} />
        )}

        {/* Info tab */}
        {activeTab === "info" && (
          isEditing ? (
            <ProjectEditForm
              project={project}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
              isSaving={updateProject.isPending}
            />
          ) : (
            <ProjectInfoCard
              project={project}
              onEdit={() => setIsEditing(true)}
              onDelete={handleDeleteProject}
              isDeleting={deleteProject.isPending}
              onContinueToSimConfig={() => setActiveTab("config")}
              canContinueToSimConfig={infoComplete}
            />
          )
        )}

        {/* Config tab */}
        {activeTab === "config" && (
          infoComplete ? (
            <SimulationConfigCard
              depth={depth}
              distribution={distribution}
              onDepthChange={setDepth}
              onDistributionChange={setDistribution}
              onGenerate={handleGenerate}
              isGenerating={generateSeed.isPending}
            />
          ) : (
            <LockedStepCard title="Simulation Config" phaseLabel="Complete project info first" />
          )
        )}

        {/* Seed Materials tab */}
        {activeTab === "seed" && (
          latestSeed ? (
            <SeedMaterialsCard
              seedMaterial={latestSeed}
              onRegenerate={handleGenerate}
              onUpdateConsumerPersonas={(consumerPersonas) =>
                updateSeed.mutate({ consumerPersonas })
              }
              onUpdateTopics={(topics) =>
                updateSeed.mutate({ discussionTopics: topics })
              }
              isRegenerating={generateSeed.isPending}
              onStartSimulation={handleStartSimulation}
              isStartingSimulation={startSimulation.isPending}
            />
          ) : generateSeed.isPending ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <div className="h-6 w-6 animate-pulse rounded-full bg-primary/20" />
                <p className="text-sm text-muted-foreground">
                  Analyzing market and generating seed materials...
                </p>
              </CardContent>
            </Card>
          ) : (
            <LockedStepCard title="Seed Materials" phaseLabel="Generate from Sim Config first" />
          )
        )}

        {/* Report tab */}
        {activeTab === "report" && (
          hasSeed ? (
            activeRunId ? (
              <SimulationReportPanel run={runData} isLoading={runLoading} isError={runError} />
            ) : (
              <LockedStepCard title="Report" phaseLabel="Start from Seed Materials tab" />
            )
          ) : (
            <LockedStepCard title="Report" phaseLabel="Complete seed materials first" />
          )
        )}
      </div>
    </div>
  );
}

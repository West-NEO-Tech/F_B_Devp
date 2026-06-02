import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useProject, useUpdateProject } from "@/hooks/use-project";
import { useProjectScenario, useUpdateScenario, useEnsureScenario } from "@/hooks/use-scenario";
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
import { DEPTH_CONFIGS, type SimulationDepth, type AgentRole } from "@/lib/agent-templates";
import type { ProjectUpdate } from "@/types/api";

function isProjectInfoComplete(project: { name: string; productType?: string | null }): boolean {
  return !!project.name && !!project.productType;
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

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
  const updateScenario = useUpdateScenario(scenario?.id);
  const generateSeed = useGenerateSeedMaterials(scenario?.id);
  const updateSeed = useUpdateSeedMaterial(latestSeed?.id);

  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [showHistory, setShowHistory] = useState(false);

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
    { id: "sim", label: "Simulation", status: "locked" },
    { id: "report", label: "Report", status: "locked" },
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

  function handleGenerate() {
    // Save scenario config first
    updateScenario.mutate(
      {
        agentDepth: depth,
        agentCount: Object.values(distribution).reduce((a, b) => a + b, 0),
        marketConfig: { agent_distribution: distribution },
      },
      {
        onSuccess: () => {
          generateSeed.mutate(undefined, {
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
        },
      }
    );
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
              onUpdateCompetitors={(competitors) =>
                updateSeed.mutate({ competitors })
              }
              onUpdateTopics={(topics) =>
                updateSeed.mutate({ discussionTopics: topics })
              }
              isRegenerating={generateSeed.isPending}
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

        {/* Simulation tab */}
        {activeTab === "sim" && (
          <LockedStepCard title="Simulation" phaseLabel="Phase 2" />
        )}

        {/* Report tab */}
        {activeTab === "report" && (
          <LockedStepCard title="Report" phaseLabel="Phase 3" />
        )}
      </div>
    </div>
  );
}

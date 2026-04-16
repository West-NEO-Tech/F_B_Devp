import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useCreateProject, useUpdateProject, useAIComplete } from "@/hooks/use-project";
import { WizardLayout } from "@/components/wizard/wizard-layout";
import { StepBasicInfo } from "@/components/wizard/step-basic-info";
import { StepProductType } from "@/components/wizard/step-product-type";
import { StepMarketInfo } from "@/components/wizard/step-market-info";
import { StepConfirmation } from "@/components/wizard/step-confirmation";
import { AICompletePreview } from "@/components/wizard/ai-complete-preview";

const STEP_LABELS = ["Basic Info", "Product Type", "Market Info", "Confirmation"];

export default function ProjectWizardPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    productType: "",
    targetMarket: "",
    targetAudience: "",
    pricingModel: "",
    competitors: [] as string[],
  });
  const [showAIPreview, setShowAIPreview] = useState(false);
  const [aiCompletions, setAiCompletions] = useState<Record<string, string | string[] | null>>({});

  const createProject = useCreateProject();
  const updateProject = useUpdateProject(projectId ?? "");
  const aiComplete = useAIComplete(projectId ?? "");

  function updateField(field: string, value: string | string[]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleNext() {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        toast({ title: "Project name is required", variant: "destructive" });
        return;
      }
      createProject.mutate(
        { name: formData.name.trim(), description: formData.description || undefined, status: "draft" },
        {
          onSuccess: (project) => {
            setProjectId(project.id);
            setCurrentStep(2);
          },
          onError: (err: Error) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
          },
        },
      );
      return;
    }

    if (currentStep === 2) {
      if (!projectId) return;
      updateProject.mutate(
        { productType: formData.productType || undefined },
        {
          onSuccess: () => setCurrentStep(3),
          onError: (err: Error) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
          },
        },
      );
      return;
    }

    if (currentStep === 3) {
      setCurrentStep(4);
      return;
    }

    if (currentStep === 4) {
      if (!projectId) return;
      updateProject.mutate(
        {
          targetMarket: formData.targetMarket || undefined,
          targetAudience: formData.targetAudience || undefined,
          pricingModel: formData.pricingModel || undefined,
          competitors: formData.competitors.length > 0 ? formData.competitors : undefined,
          status: "active",
        },
        {
          onSuccess: () => navigate(`/projects/${projectId}`),
          onError: (err: Error) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
          },
        },
      );
    }
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(1, s - 1));
  }

  function handleAIComplete() {
    if (!projectId) return;
    aiComplete.mutate(undefined, {
      onSuccess: (data) => {
        setAiCompletions(data.completions as Record<string, string | string[] | null>);
        setShowAIPreview(true);
      },
      onError: (err: Error) => {
        toast({ title: "AI Complete failed", description: err.message, variant: "destructive" });
      },
    });
  }

  function handleAcceptField(field: string) {
    const value = aiCompletions[field];
    if (value !== null && value !== undefined) {
      updateField(field, value);
    }
    setAiCompletions((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleAcceptAll() {
    for (const [field, value] of Object.entries(aiCompletions)) {
      if (value !== null && value !== undefined) {
        updateField(field, value);
      }
    }
    setAiCompletions({});
    setShowAIPreview(false);
  }

  const isSubmitting = createProject.isPending || updateProject.isPending;
  const isNextDisabled =
    (currentStep === 1 && !formData.name.trim()) || isSubmitting;

  return (
    <>
      <WizardLayout
        currentStep={currentStep}
        totalSteps={4}
        stepLabels={STEP_LABELS}
        onNext={handleNext}
        onBack={handleBack}
        isNextDisabled={isNextDisabled}
        isSubmitting={isSubmitting}
        nextLabel={currentStep === 4 ? "Create Project" : "Next"}
      >
        {currentStep === 1 && (
          <StepBasicInfo
            name={formData.name}
            description={formData.description}
            onChange={updateField}
          />
        )}
        {currentStep === 2 && (
          <StepProductType
            productType={formData.productType}
            onChange={(v) => updateField("productType", v)}
          />
        )}
        {currentStep === 3 && (
          <StepMarketInfo
            formData={{
              targetMarket: formData.targetMarket,
              targetAudience: formData.targetAudience,
              pricingModel: formData.pricingModel,
              competitors: formData.competitors,
            }}
            onChange={updateField}
            onAIComplete={handleAIComplete}
            isAICompleting={aiComplete.isPending}
          />
        )}
        {currentStep === 4 && <StepConfirmation project={formData} />}
      </WizardLayout>

      <AICompletePreview
        completions={aiCompletions}
        onAccept={handleAcceptField}
        onAcceptAll={handleAcceptAll}
        onReject={() => setShowAIPreview(false)}
        open={showAIPreview}
      />
    </>
  );
}

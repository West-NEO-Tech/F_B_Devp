import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface WizardLayoutProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  children: ReactNode;
  onNext: () => void;
  onBack: () => void;
  isNextDisabled?: boolean;
  isSubmitting?: boolean;
  nextLabel?: string;
}

export function WizardLayout({
  currentStep,
  totalSteps,
  stepLabels,
  children,
  onNext,
  onBack,
  isNextDisabled,
  isSubmitting,
  nextLabel = "Next",
}: WizardLayoutProps) {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>New Project</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Step indicator */}
          <div className="mb-10">
            <div className="flex items-center justify-between">
              {stepLabels.map((label, index) => {
                const step = index + 1;
                const isCompleted = step < currentStep;
                const isCurrent = step === currentStep;
                return (
                  <div key={step} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors",
                          isCompleted && "bg-primary text-primary-foreground",
                          isCurrent && "bg-primary text-primary-foreground",
                          !isCompleted && !isCurrent && "border border-border text-muted-foreground",
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          step
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs whitespace-nowrap",
                          isCurrent ? "text-foreground font-medium" : "text-muted-foreground",
                        )}
                      >
                        {label}
                      </span>
                    </div>
                    {step < totalSteps && (
                      <div
                        className={cn(
                          "flex-1 h-px mx-3 mb-6",
                          step < currentStep ? "bg-primary" : "bg-border",
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 border-t border-border bg-background">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          {currentStep > 1 ? (
            <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
              Back
            </Button>
          ) : (
            <div />
          )}
          <Button onClick={onNext} disabled={isNextDisabled || isSubmitting}>
            {isSubmitting ? "Creating..." : nextLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

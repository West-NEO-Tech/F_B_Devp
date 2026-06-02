import type { ReviewEntry } from "@/components/project/project-review-display";
import {
  EmptyReviewValue,
  productTypeReviewBody,
} from "@/components/project/project-review-display";
import {
  marketQABaseDescription,
  parseMarketQAFromDescription,
} from "@/hooks/use-market-qa";
import type { ProjectRead } from "@/types/api";

export function buildProjectOverviewEntries(project: {
  name: string;
  description?: string | null;
  productType?: string | null;
}): ReviewEntry[] {
  const baseDescription = marketQABaseDescription(project.description ?? "");

  return [
    {
      label: "Project name",
      body: project.name.trim() ? project.name : <EmptyReviewValue />,
    },
    {
      label: "Product type",
      body: productTypeReviewBody(project.productType),
    },
    {
      label: "Description",
      body: baseDescription ? baseDescription : <EmptyReviewValue />,
    },
  ];
}

export function buildAdditionalEntriesFromDescription(description: string): ReviewEntry[] {
  return parseMarketQAFromDescription(description).map((entry) => ({
    label: entry.question,
    body: entry.answer,
  }));
}

export function buildProjectAdditionalEntries(project: ProjectRead): ReviewEntry[] {
  const fromDescription = buildAdditionalEntriesFromDescription(project.description ?? "");
  if (fromDescription.length > 0) return fromDescription;

  const legacy: ReviewEntry[] = [];
  if (project.targetMarket?.trim()) {
    legacy.push({ label: "Target Market", body: project.targetMarket });
  }
  if (project.targetAudience?.trim()) {
    legacy.push({ label: "Target Audience", body: project.targetAudience });
  }
  if (project.pricingModel?.trim()) {
    legacy.push({ label: "Pricing Model", body: project.pricingModel });
  }
  if (project.competitors.length > 0) {
    legacy.push({
      label: "Competitors",
      body: project.competitors.join(", "),
    });
  }
  return legacy;
}

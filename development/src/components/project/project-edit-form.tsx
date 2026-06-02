import { useState } from "react";
import { Bot, FileText, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ReviewSectionCard } from "@/components/project/project-review-display";
import { StepProductType } from "@/components/wizard/step-product-type";
import {
  buildProjectDescription,
  marketQABaseDescription,
  parseMarketQAFromDescription,
  type MarketQAEntry,
} from "@/hooks/use-market-qa";
import type { ProjectRead, ProjectUpdate } from "@/types/api";

interface ProjectEditFormProps {
  project: ProjectRead;
  onSave: (data: ProjectUpdate) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function ProjectEditForm({ project, onSave, onCancel, isSaving }: ProjectEditFormProps) {
  const initialQa = parseMarketQAFromDescription(project.description ?? "");
  const useLegacyAdditional = initialQa.length === 0;

  const [name, setName] = useState(project.name);
  const [baseDescription, setBaseDescription] = useState(
    marketQABaseDescription(project.description ?? "")
  );
  const [productType, setProductType] = useState(project.productType ?? "");
  const [qaEntries, setQaEntries] = useState<MarketQAEntry[]>(initialQa);

  const [targetMarket, setTargetMarket] = useState(project.targetMarket ?? "");
  const [targetAudience, setTargetAudience] = useState(project.targetAudience ?? "");
  const [pricingModel, setPricingModel] = useState(project.pricingModel ?? "");
  const [competitors, setCompetitors] = useState<string[]>(project.competitors);
  const [competitorInput, setCompetitorInput] = useState("");

  function addCompetitor() {
    const trimmed = competitorInput.trim();
    if (trimmed && !competitors.includes(trimmed)) {
      setCompetitors([...competitors, trimmed]);
      setCompetitorInput("");
    }
  }

  function removeCompetitor(competitor: string) {
    setCompetitors(competitors.filter((c) => c !== competitor));
  }

  function handleCompetitorKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCompetitor();
    }
  }

  function updateQaAnswer(index: number, answer: string) {
    setQaEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, answer } : entry))
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const description = useLegacyAdditional
      ? baseDescription.trim() || null
      : buildProjectDescription(baseDescription, qaEntries) || null;

    onSave({
      name: trimmedName || undefined,
      description,
      productType: productType.trim() || null,
      ...(useLegacyAdditional
        ? {
            targetMarket: targetMarket.trim() || null,
            targetAudience: targetAudience.trim() || null,
            pricingModel: pricingModel.trim() || null,
            competitors,
          }
        : {}),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Edit project</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <ReviewSectionCard
            icon={FileText}
            title="Project overview"
            description="Basic project details"
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Project name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., PetMatch, FoodieConnect"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Product type</Label>
                <StepProductType productType={productType} onChange={setProductType} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={baseDescription}
                  onChange={(e) => setBaseDescription(e.target.value)}
                  placeholder="Briefly describe your product idea..."
                  rows={4}
                />
              </div>
            </div>
          </ReviewSectionCard>

          <ReviewSectionCard
            icon={Bot}
            title="Additional information"
            description={
              useLegacyAdditional
                ? "Legacy market fields (no Market Info Q&A on this project)"
                : "Market Info Q&A and supplemental details"
            }
            badge={
              !useLegacyAdditional && qaEntries.length > 0 ? (
                <Badge variant="outline" className="shrink-0 text-xs font-normal">
                  {qaEntries.length} {qaEntries.length === 1 ? "answer" : "answers"}
                </Badge>
              ) : undefined
            }
            isEmpty={!useLegacyAdditional && qaEntries.length === 0}
            emptyMessage="No additional information to edit."
          >
            {useLegacyAdditional ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-target-market">Target Market</Label>
                  <Input
                    id="edit-target-market"
                    value={targetMarket}
                    onChange={(e) => setTargetMarket(e.target.value)}
                    placeholder="e.g., Australian urban residents aged 25-45"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-target-audience">Target Audience</Label>
                  <Input
                    id="edit-target-audience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g., Tech-savvy young professionals"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-pricing-model">Pricing Model</Label>
                  <Input
                    id="edit-pricing-model"
                    value={pricingModel}
                    onChange={(e) => setPricingModel(e.target.value)}
                    placeholder="e.g., Freemium with premium tier at $19/month"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-competitors">Competitors</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-competitors"
                      value={competitorInput}
                      onChange={(e) => setCompetitorInput(e.target.value)}
                      onKeyDown={handleCompetitorKeyDown}
                      placeholder="Type a competitor name and press Enter"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCompetitor}
                      className="shrink-0"
                    >
                      Add
                    </Button>
                  </div>
                  {competitors.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {competitors.map((c) => (
                        <Badge key={c} variant="secondary" className="gap-1 pr-1">
                          {c}
                          <button
                            type="button"
                            onClick={() => removeCompetitor(c)}
                            className="ml-1 rounded-sm hover:bg-muted p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <ol className="space-y-5">
                {qaEntries.map((entry, index) => (
                  <li key={`${entry.question}-${index}`} className="space-y-2">
                    <p className="text-sm font-medium leading-relaxed text-foreground whitespace-pre-wrap">
                      {entry.question}
                    </p>
                    <Textarea
                      value={entry.answer}
                      onChange={(e) => updateQaAnswer(index, e.target.value)}
                      rows={4}
                      className="text-sm border-l-2 border-primary/25"
                      aria-label={`Answer ${index + 1}`}
                    />
                  </li>
                ))}
              </ol>
            )}
          </ReviewSectionCard>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving || !name.trim()}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

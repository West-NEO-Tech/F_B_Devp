import { useState } from "react";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { ProjectRead, ProjectUpdate } from "@/types/api";

interface ProjectEditFormProps {
  project: ProjectRead;
  onSave: (data: ProjectUpdate) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function ProjectEditForm({ project, onSave, onCancel, isSaving }: ProjectEditFormProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [productType, setProductType] = useState(project.productType ?? "");
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

  function removeCompetitor(name: string) {
    setCompetitors(competitors.filter((c) => c !== name));
  }

  function handleCompetitorKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCompetitor();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name: name.trim() || undefined,
      description: description.trim() || null,
      productType: productType.trim() || null,
      targetMarket: targetMarket.trim() || null,
      targetAudience: targetAudience.trim() || null,
      pricingModel: pricingModel.trim() || null,
      competitors,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Edit Project</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-product-type">Product Type</Label>
            <Input
              id="edit-product-type"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              placeholder="e.g., SaaS, Mobile App"
            />
          </div>

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
              <Button type="button" variant="outline" size="sm" onClick={addCompetitor} className="shrink-0">
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

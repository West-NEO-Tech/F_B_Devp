import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StepMarketInfoProps {
  formData: {
    targetMarket: string;
    targetAudience: string;
    pricingModel: string;
    competitors: string[];
  };
  onChange: (field: string, value: string | string[]) => void;
  onAIComplete: () => void;
  isAICompleting?: boolean;
}

export function StepMarketInfo({ formData, onChange, onAIComplete, isAICompleting }: StepMarketInfoProps) {
  const [competitorInput, setCompetitorInput] = useState("");

  function addCompetitor() {
    const trimmed = competitorInput.trim();
    if (trimmed && !formData.competitors.includes(trimmed)) {
      onChange("competitors", [...formData.competitors, trimmed]);
      setCompetitorInput("");
    }
  }

  function removeCompetitor(name: string) {
    onChange("competitors", formData.competitors.filter((c) => c !== name));
  }

  function handleCompetitorKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCompetitor();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-foreground">Market Information</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onAIComplete}
          disabled={isAICompleting}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isAICompleting ? "Generating..." : "AI Complete"}
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="target-market">Target Market</Label>
        <Input
          id="target-market"
          value={formData.targetMarket}
          onChange={(e) => onChange("targetMarket", e.target.value)}
          placeholder="e.g., Australian urban residents aged 25-45"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="target-audience">Target Audience</Label>
        <Input
          id="target-audience"
          value={formData.targetAudience}
          onChange={(e) => onChange("targetAudience", e.target.value)}
          placeholder="e.g., Tech-savvy young professionals"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pricing-model">Pricing Model</Label>
        <Input
          id="pricing-model"
          value={formData.pricingModel}
          onChange={(e) => onChange("pricingModel", e.target.value)}
          placeholder="e.g., Freemium with premium tier at $19/month"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="competitors">Competitors</Label>
        <div className="flex gap-2">
          <Input
            id="competitors"
            value={competitorInput}
            onChange={(e) => setCompetitorInput(e.target.value)}
            onKeyDown={handleCompetitorKeyDown}
            placeholder="Type a competitor name and press Enter"
          />
          <Button variant="outline" size="sm" onClick={addCompetitor} className="shrink-0">
            Add
          </Button>
        </div>
        {formData.competitors.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {formData.competitors.map((name) => (
              <Badge key={name} variant="secondary" className="gap-1 pr-1">
                {name}
                <button
                  type="button"
                  onClick={() => removeCompetitor(name)}
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
  );
}

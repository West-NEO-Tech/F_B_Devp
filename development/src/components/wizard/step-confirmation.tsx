import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StepConfirmationProps {
  project: {
    name: string;
    description: string;
    productType: string;
    targetMarket: string;
    targetAudience: string;
    pricingModel: string;
    competitors: string[];
  };
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {value ? (
        <p className="text-sm text-foreground">{value}</p>
      ) : (
        <p className="text-sm text-muted-foreground">Not specified</p>
      )}
    </div>
  );
}

export function StepConfirmation({ project }: StepConfirmationProps) {
  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-5">
          <Field label="Project Name" value={project.name} />
          <Field label="Description" value={project.description} />
          <Field label="Product Type" value={project.productType} />
          <Field label="Target Market" value={project.targetMarket} />
          <Field label="Target Audience" value={project.targetAudience} />
          <Field label="Pricing Model" value={project.pricingModel} />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Competitors</p>
            {project.competitors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {project.competitors.map((c) => (
                  <Badge key={c} variant="secondary">{c}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not specified</p>
            )}
          </div>
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground text-center">
        Click &ldquo;Create Project&rdquo; to finalize and activate your project.
      </p>
    </div>
  );
}

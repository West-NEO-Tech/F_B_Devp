import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface StepBasicInfoProps {
  name: string;
  description: string;
  onChange: (field: "name" | "description", value: string) => void;
}

export function StepBasicInfo({ name, description, onChange }: StepBasicInfoProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="project-name">
          Project Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="project-name"
          value={name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g., PetMatch, FoodieConnect"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-description">Description</Label>
        <Textarea
          id="project-description"
          value={description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Briefly describe your product idea..."
          rows={4}
        />
      </div>
    </div>
  );
}

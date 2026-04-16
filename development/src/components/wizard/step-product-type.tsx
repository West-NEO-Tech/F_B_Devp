import { Monitor, Smartphone, Store, Cpu, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProductTypeProps {
  productType: string;
  onChange: (value: string) => void;
}

const productTypes = [
  { value: "SaaS", icon: Monitor, description: "Cloud-based software service" },
  { value: "Mobile App", icon: Smartphone, description: "iOS/Android application" },
  { value: "Marketplace", icon: Store, description: "Two-sided platform connecting buyers and sellers" },
  { value: "Hardware", icon: Cpu, description: "Physical product with potential IoT integration" },
  { value: "Other", icon: Layers, description: "Custom product category" },
] as const;

export function StepProductType({ productType, onChange }: StepProductTypeProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {productTypes.map(({ value, icon: Icon, description }) => {
        const selected = productType === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={cn(
              "flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-colors",
              selected
                ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                : "border-border hover:border-primary/50",
            )}
          >
            <Icon className={cn("h-5 w-5", selected ? "text-primary" : "text-muted-foreground")} />
            <div>
              <div className={cn("text-sm font-medium", selected ? "text-foreground" : "text-foreground")}>
                {value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

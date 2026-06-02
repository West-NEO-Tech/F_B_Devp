import { cn } from "@/lib/utils";
import { PRODUCT_TYPES } from "@/lib/product-types";

interface StepProductTypeProps {
  productType: string;
  onChange: (value: string) => void;
}

export function StepProductType({ productType, onChange }: StepProductTypeProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {PRODUCT_TYPES.map(({ value, icon: Icon, description }) => {
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
                : "border-border hover:border-primary/50"
            )}
          >
            <Icon className={cn("h-5 w-5", selected ? "text-primary" : "text-muted-foreground")} />
            <div>
              <div className="text-sm font-medium text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

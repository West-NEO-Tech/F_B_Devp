import { Cpu, Layers, Monitor, Smartphone, Store, type LucideIcon } from "lucide-react";

export interface ProductTypeOption {
  value: string;
  icon: LucideIcon;
  description: string;
}

export const PRODUCT_TYPES: ProductTypeOption[] = [
  { value: "SaaS", icon: Monitor, description: "Cloud-based software service" },
  { value: "Mobile App", icon: Smartphone, description: "iOS/Android application" },
  {
    value: "Marketplace",
    icon: Store,
    description: "Two-sided platform connecting buyers and sellers",
  },
  { value: "Hardware", icon: Cpu, description: "Physical product with potential IoT integration" },
  { value: "Other", icon: Layers, description: "Custom product category" },
];

export function getProductTypeOption(value: string): ProductTypeOption | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return PRODUCT_TYPES.find((p) => p.value === trimmed);
}

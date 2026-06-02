import {
  Pencil,
  Target,
  Users,
  DollarSign,
  Calendar,
  Check,
  ChevronDown,
  Briefcase,
  Globe,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import type { ProjectRead } from "@/types/api";

interface ProjectInfoCardProps {
  project: ProjectRead;
  onEdit: () => void;
  onContinueToSimConfig?: () => void;
  canContinueToSimConfig?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ProjectInfoCard({
  project,
  onEdit,
  onContinueToSimConfig,
  canContinueToSimConfig = true,
  collapsed,
  onToggleCollapse,
}: ProjectInfoCardProps) {
  if (collapsed) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Check className="h-4 w-4 text-green-500" />
            Project Information
          </div>
          <Button variant="ghost" size="sm" className="text-xs" onClick={onToggleCollapse}>
            Expand
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {project.productType && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5 opacity-50" />
                <span className="font-medium text-foreground">{project.productType}</span>
              </div>
            )}
            {project.targetMarket && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Globe className="h-3.5 w-3.5 opacity-50" />
                <span className="font-medium text-foreground">{project.targetMarket}</span>
              </div>
            )}
            {project.targetAudience && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5 opacity-50" />
                <span className="font-medium text-foreground">{project.targetAudience}</span>
              </div>
            )}
            {project.pricingModel && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5 opacity-50" />
                <span className="font-medium text-foreground">{project.pricingModel}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">{project.name}</h2>
          <StatusBadge status={project.status} />
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overview */}
        <div className="space-y-3">
          <div>
            <span className="text-sm text-muted-foreground font-medium">Description</span>
            <p className="text-sm text-foreground mt-1">
              {project.description || <span className="text-muted-foreground">Not specified</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">Product Type</span>
          </div>
          <p className="text-sm text-foreground ml-6">
            {project.productType || <span className="text-muted-foreground">Not specified</span>}
          </p>
        </div>

        <Separator />

        {/* Market Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Market Information</h3>

          <div className="grid gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">Target Market</span>
              </div>
              <p className="text-sm text-foreground mt-1 ml-6">
                {project.targetMarket || <span className="text-muted-foreground">Not specified</span>}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">Target Audience</span>
              </div>
              <p className="text-sm text-foreground mt-1 ml-6">
                {project.targetAudience || <span className="text-muted-foreground">Not specified</span>}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">Pricing Model</span>
              </div>
              <p className="text-sm text-foreground mt-1 ml-6">
                {project.pricingModel || <span className="text-muted-foreground">Not specified</span>}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Competitors */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Competitors</h3>
          {project.competitors.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {project.competitors.map((name) => (
                <Badge key={name} variant="secondary">{name}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No competitors specified</p>
          )}
        </div>

        <Separator />

        {/* Timestamps + next step */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex gap-6">
            <div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Created</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-5">
                {new Date(project.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Last updated</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-5">
                {new Date(project.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {onContinueToSimConfig && (
            <Button
              size="sm"
              onClick={onContinueToSimConfig}
              disabled={!canContinueToSimConfig}
              title={
                canContinueToSimConfig
                  ? undefined
                  : "Complete project name and product type first"
              }
            >
              <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
              Sim Config
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

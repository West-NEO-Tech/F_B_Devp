import { Loader2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { SimulationAgentsResponse } from "@/hooks/use-simulation";

interface SimulationAgentsPanelProps {
  data: SimulationAgentsResponse | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function SimulationAgentsPanel({
  data,
  isLoading,
  isError,
}: SimulationAgentsPanelProps) {
  if (isLoading && !data) {
    return (
      <Card>
        <CardContent className="py-12 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-destructive">
          Failed to load simulation input. Please try again.
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  if (data.status === "generating") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">
            {data.message || "Preparing simulation input…"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4 text-primary" />
          Simulation input
        </div>
        <Badge variant="secondary" className="text-xs capitalize">
          {data.simConfigType}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {data.productType ? (
          <p>
            <span className="font-medium text-foreground">Product type: </span>
            {data.productType}
          </p>
        ) : null}
        {data.description ? (
          <p className="text-muted-foreground whitespace-pre-wrap">{data.description}</p>
        ) : null}
        {data.consumerPersonas.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium text-foreground">Consumer personas</p>
            <ul className="space-y-1 text-muted-foreground">
              {data.consumerPersonas.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
          </div>
        )}
        {data.discussionTopics.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium text-foreground">Discussion topics</p>
            <ul className="space-y-1 text-muted-foreground">
              {data.discussionTopics.map((topic, i) => (
                <li key={i}>{topic}</li>
              ))}
            </ul>
          </div>
        )}
        {data.additionalInformation.length > 0 && (
          <ul className="space-y-3">
            {data.additionalInformation.map((item, i) => (
              <li key={i} className="space-y-1">
                <p className="font-medium text-foreground">{item.question}</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{item.answer}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

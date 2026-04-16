import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Network, Search, ArrowRight } from "lucide-react";
import { useState } from "react";

interface GraphEntity {
  id: string;
  entity_type: string;
  name: string;
  description: string | null;
  properties: Record<string, any>;
}

interface GraphEdge {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  weight: number | null;
  source_name?: string;
  target_name?: string;
}

const typeColors: Record<string, string> = {
  technology: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  problem: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  market: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  investor: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  researcher: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  startup: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
};

export default function GraphPage() {
  const [search, setSearch] = useState("");

  const { data: entities, isLoading: entitiesLoading } = useQuery<GraphEntity[]>({
    queryKey: ["/api/graph/entities"],
  });

  const { data: edges, isLoading: edgesLoading } = useQuery<GraphEdge[]>({
    queryKey: ["/api/graph/edges"],
  });

  const filteredEntities = entities?.filter(
    (e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.entity_type.toLowerCase().includes(search.toLowerCase())
  );

  const entityTypes = entities
    ? Array.from(new Set(entities.map((e) => e.entity_type)))
    : [];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Knowledge Graph"
        description="Explore entities, relationships, and technology-market mappings"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {entityTypes.map((type) => {
          const count = entities?.filter((e) => e.entity_type === type).length || 0;
          return (
            <Card key={type}>
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold">{count}</div>
                <div className="text-[10px] text-muted-foreground capitalize">{type}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search entities..." data-testid="input-search-entities" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Entities ({filteredEntities?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {entitiesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : filteredEntities && filteredEntities.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {filteredEntities.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/30" data-testid={`entity-${e.id}`}>
                    <Badge className={`text-[10px] ${typeColors[e.entity_type] || ""}`} variant="secondary">{e.entity_type}</Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{e.name}</div>
                      {e.description && <div className="text-[10px] text-muted-foreground truncate">{e.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No entities found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Relationships ({edges?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {edgesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : edges && edges.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {edges.map((edge) => (
                  <div key={edge.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/30" data-testid={`edge-${edge.id}`}>
                    <span className="text-xs font-medium truncate max-w-[100px]">{edge.source_name || edge.source_entity_id.slice(0, 8)}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <Badge variant="outline" className="text-[10px] flex-shrink-0">{edge.relationship_type}</Badge>
                    <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs font-medium truncate max-w-[100px]">{edge.target_name || edge.target_entity_id.slice(0, 8)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No relationships found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

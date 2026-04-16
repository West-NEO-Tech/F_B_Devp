import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Lightbulb, Search, Sparkles, TrendingUp, Users, Zap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Idea, Project } from "@shared/schema";

export default function IdeasPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newIdea, setNewIdea] = useState({
    project_id: "",
    title: "",
    summary: "",
    problem_statement: "",
    solution_statement: "",
    target_users: "",
    value_proposition: "",
  });
  const { toast } = useToast();

  const { data: ideas, isLoading } = useQuery<Idea[]>({ queryKey: ["/api/ideas"] });
  const { data: projects } = useQuery<Project[]>({ queryKey: ["/api/projects"] });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newIdea) => {
      const res = await apiRequest("POST", "/api/ideas", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      setDialogOpen(false);
      setNewIdea({ project_id: "", title: "", summary: "", problem_statement: "", solution_statement: "", target_users: "", value_proposition: "" });
      toast({ title: "Idea submitted successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const filtered = ideas?.filter((i) => {
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) || i.summary.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = ideas?.reduce(
    (acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Idea Discovery"
        description="Submit, discover, and evaluate business innovation ideas"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-submit-idea">
                <Plus className="w-4 h-4 mr-1" />
                Submit Idea
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Submit New Idea</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2 max-h-[70vh] overflow-y-auto pr-1">
                <div className="space-y-1">
                  <Label>Project</Label>
                  <Select value={newIdea.project_id} onValueChange={(v) => setNewIdea({ ...newIdea, project_id: v })}>
                    <SelectTrigger data-testid="select-idea-project">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input data-testid="input-idea-title" placeholder="Idea title" value={newIdea.title} onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Summary</Label>
                  <Textarea data-testid="input-idea-summary" placeholder="Brief summary..." value={newIdea.summary} onChange={(e) => setNewIdea({ ...newIdea, summary: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Problem Statement</Label>
                  <Textarea data-testid="input-idea-problem" placeholder="What problem does this solve?" value={newIdea.problem_statement} onChange={(e) => setNewIdea({ ...newIdea, problem_statement: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Solution Statement</Label>
                  <Textarea data-testid="input-idea-solution" placeholder="How does it solve it?" value={newIdea.solution_statement} onChange={(e) => setNewIdea({ ...newIdea, solution_statement: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Target Users</Label>
                    <Input data-testid="input-idea-users" placeholder="e.g., SMEs" value={newIdea.target_users} onChange={(e) => setNewIdea({ ...newIdea, target_users: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Value Proposition</Label>
                    <Input data-testid="input-idea-value" placeholder="Key value..." value={newIdea.value_proposition} onChange={(e) => setNewIdea({ ...newIdea, value_proposition: e.target.value })} />
                  </div>
                </div>
                <Button
                  className="w-full"
                  data-testid="button-create-idea"
                  onClick={() => createMutation.mutate(newIdea)}
                  disabled={!newIdea.title || !newIdea.summary || !newIdea.project_id || createMutation.isPending}
                >
                  {createMutation.isPending ? "Submitting..." : "Submit Idea"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="hover-elevate cursor-pointer" onClick={() => setStatusFilter("all")}>
          <CardContent className="p-3 text-center">
            <Lightbulb className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-lg font-bold">{ideas?.length || 0}</div>
            <div className="text-[10px] text-muted-foreground">Total Ideas</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate cursor-pointer" onClick={() => setStatusFilter("submitted")}>
          <CardContent className="p-3 text-center">
            <Sparkles className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <div className="text-lg font-bold">{statusCounts.submitted || 0}</div>
            <div className="text-[10px] text-muted-foreground">Submitted</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate cursor-pointer" onClick={() => setStatusFilter("shortlisted")}>
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
            <div className="text-lg font-bold">{statusCounts.shortlisted || 0}</div>
            <div className="text-[10px] text-muted-foreground">Shortlisted</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate cursor-pointer" onClick={() => setStatusFilter("approved")}>
          <CardContent className="p-3 text-center">
            <Zap className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <div className="text-lg font-bold">{statusCounts.approved || 0}</div>
            <div className="text-[10px] text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search ideas..." data-testid="input-search-ideas" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36" data-testid="select-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="generated">Generated</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((idea) => (
            <Card key={idea.id} className="hover-elevate" data-testid={`idea-${idea.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold">{idea.title}</h3>
                      <StatusBadge status={idea.status} />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{idea.summary}</p>
                    <div className="flex items-center gap-4 flex-wrap">
                      {idea.target_users && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {idea.target_users}
                        </div>
                      )}
                      {idea.tags && idea.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {idea.tags.map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No ideas found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

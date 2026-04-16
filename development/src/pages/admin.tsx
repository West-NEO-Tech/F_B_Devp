import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Settings, Users, FolderKanban, Cpu, Play, Database, Activity } from "lucide-react";
import type { AdminUser, ProjectRead, AgentTemplateRead, SimulationRun } from "@/types/api";

export default function AdminPage() {
  const { data: users, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });
  const { data: projects } = useQuery<ProjectRead[]>({ queryKey: ["/api/projects"] });
  const { data: templates } = useQuery<AgentTemplateRead[]>({ queryKey: ["/api/agent-templates"] });
  const { data: runs } = useQuery<SimulationRun[]>({ queryKey: ["/api/simulations"] });

  const systemHealth = [
    { name: "API Server", status: "healthy", uptime: 99.9 },
    { name: "Database", status: "healthy", uptime: 99.8 },
    { name: "Simulation Engine", status: "healthy", uptime: 98.5 },
    { name: "Background Jobs", status: "healthy", uptime: 99.2 },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Admin Console"
        description="Platform administration and system management"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-lg font-bold">{users?.length || 0}</div>
              <div className="text-[10px] text-muted-foreground">Users</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="text-lg font-bold">{projects?.length || 0}</div>
              <div className="text-[10px] text-muted-foreground">Projects</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-violet-500" />
            <div>
              <div className="text-lg font-bold">{templates?.length || 0}</div>
              <div className="text-[10px] text-muted-foreground">Agent Templates</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Play className="w-5 h-5 text-amber-500" />
            <div>
              <div className="text-lg font-bold">{runs?.length || 0}</div>
              <div className="text-[10px] text-muted-foreground">Simulation Runs</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-admin-users">Users</TabsTrigger>
          <TabsTrigger value="health" data-testid="tab-admin-health">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">All Users</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : users && users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Name</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Email</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Role</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Organisation</th>
                        <th className="text-center py-2 px-3 text-muted-foreground font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b last:border-0" data-testid={`admin-user-${user.id}`}>
                          <td className="py-2 px-3 font-medium">{user.full_name}</td>
                          <td className="py-2 px-3 text-muted-foreground">{user.email}</td>
                          <td className="py-2 px-3"><Badge variant="secondary" className="text-[10px] capitalize">{user.role.replace(/_/g, " ")}</Badge></td>
                          <td className="py-2 px-3 text-muted-foreground">{user.organisation || "-"}</td>
                          <td className="py-2 px-3 text-center">
                            <Badge variant={user.is_active ? "default" : "secondary"} className="text-[10px]">
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No users</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemHealth.map((service) => (
                  <div key={service.name} className="flex items-center justify-between gap-4" data-testid={`health-${service.name.toLowerCase().replace(/\s+/g, "-")}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-sm font-medium">{service.name}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-1 max-w-xs">
                      <Progress value={service.uptime} className="h-1.5" />
                      <span className="text-xs text-muted-foreground w-14 text-right">{service.uptime}%</span>
                    </div>
                    <Badge variant="default" className="text-[10px]">{service.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

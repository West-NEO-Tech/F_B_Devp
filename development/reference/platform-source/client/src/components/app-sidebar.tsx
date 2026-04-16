import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  FolderKanban,
  Lightbulb,
  BarChart3,
  Cpu,
  Users,
  Play,
  TrendingUp,
  DollarSign,
  Handshake,
  Network,
  FileText,
  Settings,
  Beaker,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderKanban },
];

const discoveryItems = [
  { title: "Idea Discovery", url: "/ideas", icon: Lightbulb },
  { title: "Evaluation", url: "/evaluation", icon: BarChart3 },
  { title: "Prototypes", url: "/prototypes", icon: Cpu },
];

const simulationItems = [
  { title: "Agent Populations", url: "/agents", icon: Users },
  { title: "Simulations", url: "/simulations", icon: Play },
  { title: "Market Validation", url: "/validation", icon: TrendingUp },
  { title: "Business Viability", url: "/viability", icon: DollarSign },
];

const outputItems = [
  { title: "Investment Matching", url: "/investments", icon: Handshake },
  { title: "Knowledge Graph", url: "/graph", icon: Network },
  { title: "Reports", url: "/reports", icon: FileText },
];

const adminItems = [
  { title: "Admin", url: "/admin", icon: Settings },
];

function NavGroup({ label, items }: { label: string; items: typeof mainItems }) {
  const [location] = useLocation();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild data-active={isActive}>
                  <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <Link href="/" className="flex items-center gap-2" data-testid="nav-logo">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
            <Beaker className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">Innovation Testbed</span>
            <span className="text-[10px] text-muted-foreground leading-tight">AI-Agent Platform</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Platform" items={mainItems} />
        <NavGroup label="Discovery" items={discoveryItems} />
        <NavGroup label="Simulation" items={simulationItems} />
        <NavGroup label="Output" items={outputItems} />
        <NavGroup label="System" items={adminItems} />
      </SidebarContent>
      <SidebarFooter className="px-4 py-3">
        <div className="text-[10px] text-muted-foreground">v1.0.0 Research Edition</div>
      </SidebarFooter>
    </Sidebar>
  );
}

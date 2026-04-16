import { useCallback } from "react";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
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

const prefetchMap: Record<string, () => Promise<unknown>> = {
  "/agents": () => import("@/pages/agents"),
  "/admin": () => import("@/pages/admin"),
};

const prefetched = new Set<string>();

function usePrefetch() {
  return useCallback((url: string) => {
    if (prefetched.has(url)) return;
    const loader = prefetchMap[url];
    if (loader) {
      prefetched.add(url);
      loader();
    }
  }, []);
}

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Agent Templates", url: "/agents", icon: Users },
];

const systemItems = [
  { title: "Settings", url: "/admin", icon: Settings },
];

function NavGroup({ label, items }: { label: string; items: typeof navItems }) {
  const [location] = useLocation();
  const prefetch = usePrefetch();
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
                  <Link
                    href={item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    onMouseEnter={() => prefetch(item.url)}
                  >
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
            <span className="text-sm font-semibold leading-tight">BizSim</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Business Validator</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Navigation" items={navItems} />
        <NavGroup label="System" items={systemItems} />
      </SidebarContent>
      <SidebarFooter className="px-4 py-3">
        <div className="text-[10px] text-muted-foreground">v1.0.0 Research Edition</div>
      </SidebarFooter>
    </Sidebar>
  );
}

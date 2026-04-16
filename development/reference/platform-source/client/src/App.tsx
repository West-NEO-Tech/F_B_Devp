import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import NotFound from "@/pages/not-found";
import OverviewPage from "@/pages/overview";
import ProjectsPage from "@/pages/projects";
import IdeasPage from "@/pages/ideas";
import EvaluationPage from "@/pages/evaluation";
import PrototypesPage from "@/pages/prototypes";
import AgentsPage from "@/pages/agents";
import SimulationsPage from "@/pages/simulations";
import ValidationPage from "@/pages/validation";
import ViabilityPage from "@/pages/viability";
import InvestmentsPage from "@/pages/investments";
import GraphPage from "@/pages/graph";
import ReportsPage from "@/pages/reports";
import AdminPage from "@/pages/admin";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle">
      {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </Button>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={OverviewPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/ideas" component={IdeasPage} />
      <Route path="/evaluation" component={EvaluationPage} />
      <Route path="/prototypes" component={PrototypesPage} />
      <Route path="/agents" component={AgentsPage} />
      <Route path="/simulations" component={SimulationsPage} />
      <Route path="/validation" component={ValidationPage} />
      <Route path="/viability" component={ViabilityPage} />
      <Route path="/investments" component={InvestmentsPage} />
      <Route path="/graph" component={GraphPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

const sidebarStyle = {
  "--sidebar-width": "16rem",
  "--sidebar-width-icon": "3rem",
};

function AppLayout() {
  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-1 px-3 py-2 border-b h-12">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AppLayout />
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

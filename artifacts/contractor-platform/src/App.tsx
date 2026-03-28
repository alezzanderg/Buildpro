import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@workspace/replit-auth-web";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";

// Pages
import Dashboard from "./pages/Dashboard";
import EstimatesList from "./pages/estimates/EstimatesList";
import EstimateDetail from "./pages/estimates/EstimateDetail";
import EstimatePrint from "./pages/estimates/EstimatePrint";
import InvoicesList from "./pages/invoices/InvoicesList";
import MaterialsList from "./pages/materials/MaterialsList";
import ClientsList from "./pages/clients/ClientsList";
import SuppliersList from "./pages/suppliers/SuppliersList";
import Settings from "./pages/Settings";
import ProposalsList from "./pages/proposals/ProposalsList";
import ProposalDetail from "./pages/proposals/ProposalDetail";
import ProposalPreview from "./pages/proposals/ProposalPreview";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">P</span>
          </div>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/proposals" component={ProposalsList} />
      <Route path="/proposals/:id/preview" component={ProposalPreview} />
      <Route path="/proposals/:id" component={ProposalDetail} />
      <Route path="/estimates" component={EstimatesList} />
      <Route path="/estimates/:id/print" component={EstimatePrint} />
      <Route path="/estimates/:id" component={EstimateDetail} />
      <Route path="/invoices" component={InvoicesList} />
      <Route path="/materials" component={MaterialsList} />
      <Route path="/clients" component={ClientsList} />
      <Route path="/suppliers" component={SuppliersList} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
          <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import InspectionDetail from "./pages/InspectionDetail";
import InspectionsList from "./pages/InspectionsList";
import InspectionRoom from "./pages/InspectionRoom";
import Properties from "./pages/Properties";
import Integrations from "./pages/Integrations";
import Reports from "./pages/Reports";
import RemoteSubmit from "./pages/RemoteSubmit";
import Home from "./pages/Home";
import FixxChat from "./pages/FixxChat";
import HealthyHomes from "./pages/HealthyHomes";
import Chattels from "./pages/Chattels";
import Inventory from "./pages/Inventory";
import MaintenancePlan from "./pages/MaintenancePlan";
import RentalAppraisal from "./pages/RentalAppraisal";
import PMReviewQueue from "./pages/PMReviewQueue";
import ImprovementRecommendations from "./pages/ImprovementRecommendations";
import Invoices from "./pages/Invoices";
import SmokeAlarms from "@/pages/SmokeAlarms";
import Owners from "@/pages/Owners";
import LandlordPortal from "@/pages/LandlordPortal";

function withLayout(Component: React.ComponentType<any>, props?: any) {
  return () => (
    <DashboardLayout>
      <Component {...props} />
    </DashboardLayout>
  );
}

function AppRoutes() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/submit/:token" component={RemoteSubmit} />

      {/* Dashboard */}
      <Route path="/dashboard" component={withLayout(Dashboard)} />

      {/* Inspections */}
      <Route path="/inspections" component={withLayout(InspectionsList)} />
      <Route path="/inspections/:id">
        {(params) => (
          <DashboardLayout>
            <InspectionDetail id={Number(params.id)} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/inspections/:inspectionId/rooms/:roomId">
        {(params) => (
          <DashboardLayout>
            <InspectionRoom
              inspectionId={Number(params.inspectionId)}
              roomId={Number(params.roomId)}
            />
          </DashboardLayout>
        )}
      </Route>

      {/* Properties */}
      <Route path="/properties" component={withLayout(Properties)} />

      {/* Reports */}
      <Route path="/reports" component={withLayout(Reports)} />

      {/* PM Review Queue */}
      <Route path="/review-queue" component={withLayout(PMReviewQueue)} />

      {/* Chattels Register */}
      <Route path="/chattels" component={withLayout(Chattels)} />

      {/* Inventory */}
      <Route path="/inventory" component={withLayout(Inventory)} />

      {/* Smoke Alarms */}
      <Route path="/smoke-alarms" component={withLayout(SmokeAlarms)} />
      <Route path="/owners" component={Owners} />
      <Route path="/landlord-portal" component={LandlordPortal} />
      {/* Healthy Homes */}
      <Route path="/healthy-homes" component={withLayout(HealthyHomes)} />

      {/* Maintenance Plan */}
      <Route path="/maintenance-plan" component={withLayout(MaintenancePlan)} />

      {/* Rental Appraisal */}
      <Route path="/rental-appraisal" component={withLayout(RentalAppraisal)} />

      {/* Improvement Recommendations */}
      <Route path="/improvements" component={withLayout(ImprovementRecommendations)} />

      {/* Invoices */}
      <Route path="/invoices" component={withLayout(Invoices)} />

      {/* Integrations */}
      <Route path="/integrations" component={withLayout(Integrations)} />

      {/* Fixx Chat */}
      <Route path="/fixx" component={withLayout(FixxChat)} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <AppRoutes />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

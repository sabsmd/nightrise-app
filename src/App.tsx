import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProLayout } from "./layouts/ProLayout";
import Dashboard from "./pages/pro/Dashboard";
import Events from "./pages/pro/Events";
import FloorPlan from "./pages/pro/FloorPlan";
import Client from "./pages/Client";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            {/* Authentication */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Interface CLIENT */}
            <Route path="/" element={<Client />} />
            
            {/* Interface PRO - Protégée (Admin uniquement) */}
            <Route path="/pro" element={<ProLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="events" element={<Events />} />
              <Route path="floor-plan" element={<FloorPlan />} />
              <Route path="products" element={<Dashboard />} />
              <Route path="users" element={<Dashboard />} />
              <Route path="stats" element={<Dashboard />} />
              <Route path="settings" element={<Dashboard />} />
            </Route>
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

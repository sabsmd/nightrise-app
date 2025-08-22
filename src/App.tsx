import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProLayout } from "./layouts/ProLayout";
import Dashboard from "./pages/pro/Dashboard";
import Events from "./pages/pro/Events";
import ProEventDetails from "./pages/pro/EventDetails";
import FloorPlan from "./pages/pro/FloorPlan";
import Products from "./pages/pro/Products";
import Client from "./pages/Client";
import Auth from "./pages/Auth";
import ClientAuth from "./pages/ClientAuth";
import EventDetails from "./pages/EventDetails";
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
            {/* Authentication for Clients */}
            <Route path="/auth" element={<ClientAuth />} />
            
            {/* Authentication for Pros (existing auth page) */}
            <Route path="/pro/auth" element={<Auth />} />
            
            {/* Interface CLIENT */}
            <Route path="/" element={<Client />} />
            <Route path="/event/:eventId" element={<EventDetails />} />
            
            {/* Interface PRO - Protégée (Admin uniquement) */}
            <Route path="/pro" element={<ProLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="events" element={<Events />} />
              <Route path="events/:eventId" element={<ProEventDetails />} />
              <Route path="floor-plan" element={<FloorPlan />} />
              <Route path="products" element={<Products />} />
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

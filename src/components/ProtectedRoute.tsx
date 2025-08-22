import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: "admin" | "client";
  redirectTo?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requireRole, 
  redirectTo = "/auth" 
}: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to auth
  if (!user || !profile) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If specific role required, check role
  if (requireRole && profile.role !== requireRole) {
    // Redirect admin to pro interface, client to home
    const fallbackRedirect = profile.role === "admin" ? "/pro" : "/";
    return <Navigate to={fallbackRedirect} replace />;
  }

  return <>{children}</>;
};
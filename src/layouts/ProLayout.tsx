import { Outlet, Link, useLocation } from "react-router-dom";
import { Bell, User, LogOut, Menu, Home, Calendar, MapPin, Package, Settings, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import RealtimeNotifications from "@/components/RealtimeNotifications";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ProLayout() {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const navigationItems = [
    { title: "Tableau de bord", url: "/pro", icon: Home },
    { title: "Événements", url: "/pro/events", icon: Calendar },
    { title: "Plan de salle", url: "/pro/floor-plan", icon: MapPin },
    { title: "Codes Min Spend", url: "/pro/min-spend-codes", icon: Package },
    { title: "Produits", url: "/pro/products", icon: Package },
  ];

  const isActive = (path: string) => location.pathname === path;
  
  const eventId = location.pathname.includes('/events/') 
    ? location.pathname.split('/events/')[1]?.split('/')[0]
    : undefined;

  return (
    <ProtectedRoute requireRole="admin">
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar */}
        <div className="w-64 border-r border-border bg-card/50 backdrop-blur-sm">
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Pool Party Pro</h2>
              <p className="text-sm text-muted-foreground">Interface Professionnelle</p>
            </div>
            
            <nav className="flex-1 p-4 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.url}
                  to={item.url}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.url)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.title}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
        
        <div className="flex flex-col flex-1">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Interface Professionnelle</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <RealtimeNotifications eventId={eventId} />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.nom}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile?.etablissement}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/" className="cursor-pointer">
                      Interface Client
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={signOut}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
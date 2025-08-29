import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  MapPin,
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { toast } from "sonner";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { stats: dashboardStats, loading: statsLoading } = useDashboardStats();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeEvents: 0,
    dailyRevenue: 0,
    pendingOrders: 0
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Charger les événements
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;

      // Charger les commandes récentes
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ordersError) throw ordersError;

      // Calculer les statistiques
      const today = new Date().toISOString().split('T')[0];
      
      // Revenus du jour
      const { data: dailyOrdersData, error: dailyOrdersError } = await supabase
        .from('orders')
        .select('montant_total')
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59');

      if (dailyOrdersError) throw dailyOrdersError;

      const dailyRevenue = dailyOrdersData?.reduce((sum, order) => sum + Number(order.montant_total), 0) || 0;

      // Commandes en attente
      const { data: pendingOrdersData, error: pendingOrdersError } = await supabase
        .from('orders')
        .select('id')
        .eq('statut', 'pending');

      if (pendingOrdersError) throw pendingOrdersError;


      setEvents(eventsData || []);
      setOrders(ordersData || []);
      setStats({
        activeEvents: eventsData?.length || 0,
        dailyRevenue,
        pendingOrders: pendingOrdersData?.length || 0
      });

    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const statsConfig = [
    {
      title: "Événements actifs",
      value: stats.activeEvents.toString(),
      change: "",
      icon: Calendar,
      color: "text-accent"
    },
    {
      title: "Tables réservées",
      value: statsLoading ? "..." : `${dashboardStats.reserved}/${dashboardStats.total}`,
      change: statsLoading ? "" : `${dashboardStats.percentage}%`,
      icon: MapPin,
      color: "text-primary"
    },
    {
      title: "Revenus du jour",
      value: `€${stats.dailyRevenue.toFixed(2)}`,
      change: "",
      icon: DollarSign,
      color: "text-green-400"
    },
    {
      title: "Commandes en cours",
      value: stats.pendingOrders.toString(),
      change: "Temps réel",
      icon: Clock,
      color: "text-orange-400"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-hero rounded-2xl p-8 text-primary-foreground relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Bienvenue sur ClubManager Pro</h1>
          <p className="text-primary-foreground/80 mb-6">
            Gérez vos événements, tables et commandes en temps réel
          </p>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              onClick={() => navigate('/pro/events')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvel événement
            </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat, index) => (
          <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className={`text-sm ${stat.color} flex items-center gap-1`}>
                    <TrendingUp className="w-3 h-3" />
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-secondary ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Événements à venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.length > 0 ? (
                events.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div>
                      <h3 className="font-semibold text-foreground">{event.titre}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.date).toLocaleDateString('fr-FR')}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{event.lieu}</span>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      Programmé
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Aucun événement créé</p>
                  <Button 
                    size="sm" 
                    className="bg-gradient-primary"
                    onClick={() => navigate('/pro/events')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un événement
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Commandes récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div>
                      <h3 className="font-semibold text-foreground">Commande #{order.id.slice(0, 8)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.order_items?.length || 0} article(s)
                      </p>
                      <p className="text-lg font-bold text-primary mt-1">€{Number(order.montant_total).toFixed(2)}</p>
                    </div>
                    <Badge 
                      variant={order.statut === "pending" ? "default" : "secondary"}
                      className={
                        order.statut === "pending" ? "bg-orange-500 text-white" : 
                        order.statut === "completed" ? "bg-green-500 text-white" : 
                        "bg-blue-500 text-white"
                      }
                    >
                      {order.statut === "pending" ? "En cours" : 
                       order.statut === "completed" ? "Terminé" : 
                       order.statut}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Aucune commande récente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
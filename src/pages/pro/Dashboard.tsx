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
  Plus,
  Eye
} from "lucide-react";

export default function Dashboard() {
  // Mock data
  const stats = [
    {
      title: "Événements actifs",
      value: "3",
      change: "+2",
      icon: Calendar,
      color: "text-accent"
    },
    {
      title: "Tables réservées",
      value: "24/32",
      change: "75%",
      icon: MapPin,
      color: "text-primary"
    },
    {
      title: "Revenus du jour",
      value: "€12,450",
      change: "+18%",
      icon: DollarSign,
      color: "text-green-400"
    },
    {
      title: "Commandes en cours",
      value: "8",
      change: "Temps réel",
      icon: Clock,
      color: "text-orange-400"
    }
  ];

  const upcomingEvents = [
    {
      id: 1,
      name: "Pool Party VIP",
      date: "Ce soir",
      time: "22:00",
      status: "En cours",
      guests: 120
    },
    {
      id: 2,
      name: "Latino Night",
      date: "Demain",
      time: "23:00",
      status: "Confirmé",
      guests: 85
    },
    {
      id: 3,
      name: "House Session",
      date: "Vendredi",
      time: "21:30",
      status: "Préparation",
      guests: 200
    }
  ];

  const recentOrders = [
    { id: 1, table: "VIP 1", items: "2x Dom Pérignon, 1x Shisha", total: "€580", status: "En cours" },
    { id: 2, table: "Table 5", items: "4x Cocktails Premium", total: "€120", status: "Servi" },
    { id: 3, table: "VIP 3", items: "1x Bouteille Vodka, Mixers", total: "€350", status: "Validé" }
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
            <Button variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              <Plus className="w-4 h-4 mr-2" />
              Nouvel événement
            </Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Eye className="w-4 h-4 mr-2" />
              Vue d'ensemble
            </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
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
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div>
                    <h3 className="font-semibold text-foreground">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {event.date} à {event.time}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{event.guests} invités</span>
                    </div>
                  </div>
                  <Badge 
                    variant={event.status === "En cours" ? "default" : "secondary"}
                    className={event.status === "En cours" ? "bg-accent text-accent-foreground" : ""}
                  >
                    {event.status}
                  </Badge>
                </div>
              ))}
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
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div>
                    <h3 className="font-semibold text-foreground">{order.table}</h3>
                    <p className="text-sm text-muted-foreground">{order.items}</p>
                    <p className="text-lg font-bold text-primary mt-1">{order.total}</p>
                  </div>
                  <Badge 
                    variant={order.status === "En cours" ? "default" : "secondary"}
                    className={order.status === "En cours" ? "bg-orange-500 text-white" : order.status === "Servi" ? "bg-green-500 text-white" : "bg-blue-500 text-white"}
                  >
                    {order.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
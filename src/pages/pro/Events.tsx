import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  Edit,
  Trash2,
  Search,
  Filter
} from "lucide-react";

export default function Events() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mock events data
  const events = [
    {
      id: 1,
      title: "Pool Party VIP Summer",
      description: "Soirée exclusive en piscine avec DJs internationaux",
      date: "2024-08-25",
      time: "22:00",
      location: "Terrasse VIP",
      capacity: 150,
      currentGuests: 120,
      status: "En cours",
      image: "/api/placeholder/400/200"
    },
    {
      id: 2,
      title: "Latino Night Fever",
      description: "Nuit latine avec orchestre live et danseuses",
      date: "2024-08-26",
      time: "23:00",
      location: "Salle principale",
      capacity: 200,
      currentGuests: 85,
      status: "Confirmé",
      image: "/api/placeholder/400/200"
    },
    {
      id: 3,
      title: "Electronic House Session",
      description: "Session house avec les meilleurs DJs électro de la ville",
      date: "2024-08-30",
      time: "21:30",
      location: "Club principal",
      capacity: 300,
      currentGuests: 0,
      status: "Préparation",
      image: "/api/placeholder/400/200"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "En cours": return "bg-accent text-accent-foreground";
      case "Confirmé": return "bg-primary text-primary-foreground";
      case "Préparation": return "bg-orange-500 text-white";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des événements</h1>
          <p className="text-muted-foreground">Créez et gérez vos soirées et événements spéciaux</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Nouvel événement
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Créer un nouvel événement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Titre de l'événement</label>
                <Input placeholder="Ex: Pool Party VIP Summer" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input placeholder="Description de l'événement" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Heure</label>
                  <Input type="time" className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Lieu</label>
                <Input placeholder="Ex: Terrasse VIP" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Capacité maximale</label>
                <Input type="number" placeholder="150" className="mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Annuler</Button>
                <Button className="bg-gradient-primary">Créer l'événement</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher un événement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filtres
        </Button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <Card key={event.id} className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300 group">
            <div className="relative">
              <div className="h-48 bg-gradient-secondary rounded-t-lg flex items-center justify-center">
                <Calendar className="w-16 h-16 text-primary opacity-50" />
              </div>
              <Badge className={`absolute top-3 right-3 ${getStatusColor(event.status)}`}>
                {event.status}
              </Badge>
            </div>
            
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-foreground line-clamp-1">
                {event.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {event.description}
              </p>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.date).toLocaleDateString('fr-FR')} à {event.time}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">
                    {event.currentGuests}/{event.capacity}
                  </span>
                  <span className="text-muted-foreground">invités</span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(event.currentGuests / event.capacity) * 100}%` }}
                  />
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 hover:bg-secondary">
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                  <Button variant="outline" size="sm" className="hover:bg-destructive hover:text-destructive-foreground">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Aucun événement trouvé</h3>
          <p className="text-muted-foreground mb-4">Créez votre premier événement pour commencer</p>
          <Button className="bg-gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Créer un événement
          </Button>
        </div>
      )}
    </div>
  );
}
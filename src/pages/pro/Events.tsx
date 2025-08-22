import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Events() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    titre: "",
    description: "",
    date: "",
    lieu: "",
    image: ""
  });

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    try {
      if (!newEvent.titre || !newEvent.date || !newEvent.lieu) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      const { error } = await supabase
        .from('events')
        .insert([newEvent]);

      if (error) throw error;

      toast.success('Événement créé avec succès !');
      setIsDialogOpen(false);
      setNewEvent({
        titre: "",
        description: "",
        date: "",
        lieu: "",
        image: ""
      });
      loadEvents();
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      toast.error('Erreur lors de la création de l\'événement');
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Événement supprimé avec succès !');
      loadEvents();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'événement:', error);
      toast.error('Erreur lors de la suppression de l\'événement');
    }
  };

  const filteredEvents = events.filter(event =>
    event.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.lieu.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                <label className="text-sm font-medium">Titre de l'événement *</label>
                <Input 
                  placeholder="Ex: Pool Party VIP Summer" 
                  className="mt-1"
                  value={newEvent.titre}
                  onChange={(e) => setNewEvent({...newEvent, titre: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  placeholder="Description de l'événement" 
                  className="mt-1"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Input 
                  type="date" 
                  className="mt-1"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Lieu *</label>
                <Input 
                  placeholder="Ex: Terrasse VIP" 
                  className="mt-1"
                  value={newEvent.lieu}
                  onChange={(e) => setNewEvent({...newEvent, lieu: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Image (URL)</label>
                <Input 
                  placeholder="https://..." 
                  className="mt-1"
                  value={newEvent.image}
                  onChange={(e) => setNewEvent({...newEvent, image: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button className="bg-gradient-primary" onClick={createEvent}>
                  Créer l'événement
                </Button>
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
        {filteredEvents.map((event) => (
          <Card key={event.id} className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300 group">
            <div className="relative">
              {event.image ? (
                <img 
                  src={event.image} 
                  alt={event.titre}
                  className="h-48 w-full object-cover rounded-t-lg"
                />
              ) : (
                <div className="h-48 bg-gradient-secondary rounded-t-lg flex items-center justify-center">
                  <Calendar className="w-16 h-16 text-primary opacity-50" />
                </div>
              )}
              <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                Programmé
              </Badge>
            </div>
            
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-foreground line-clamp-1">
                {event.titre}
              </CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {event.description || "Aucune description"}
              </p>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.date).toLocaleDateString('fr-FR')}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {event.lieu}
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 hover:bg-secondary">
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => deleteEvent(event.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {!loading && filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {events.length === 0 ? "Aucun événement créé" : "Aucun événement trouvé"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {events.length === 0 ? "Créez votre premier événement pour commencer" : "Essayez avec d'autres termes de recherche"}
          </p>
          {events.length === 0 && (
            <Button className="bg-gradient-primary" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer un événement
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
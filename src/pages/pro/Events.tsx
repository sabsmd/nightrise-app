import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, MapPin, Users, Edit, Trash2, Search, Filter, Upload, Music } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
export default function Events() {
  const {
    user
  } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [newEvent, setNewEvent] = useState({
    titre: "",
    description: "",
    date: "",
    lieu: "",
    image: "",
    type_evenement: "",
    artiste_dj: "",
    image_file: null as File | null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);
  const loadEvents = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('events').select('*').order('date', {
        ascending: true
      });
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier la taille (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La taille du fichier ne doit pas dépasser 5MB');
        return;
      }

      // Vérifier le format
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('Seuls les formats JPEG et PNG sont acceptés');
        return;
      }
      setNewEvent({
        ...newEvent,
        image_file: file
      });
    }
  };
  const resetForm = () => {
    setNewEvent({
      titre: "",
      description: "",
      date: "",
      lieu: "",
      image: "",
      type_evenement: "",
      artiste_dj: "",
      image_file: null
    });
    setEditingEvent(null);
  };
  const createOrUpdateEvent = async () => {
    try {
      if (!newEvent.titre || !newEvent.date || !newEvent.lieu) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      // Préparer les données à insérer/modifier
      const eventData = {
        titre: newEvent.titre,
        description: newEvent.description,
        date: newEvent.date,
        lieu: newEvent.lieu,
        image: newEvent.image,
        type_evenement: newEvent.type_evenement || null,
        artiste_dj: newEvent.artiste_dj || null
      };
      let error;
      if (editingEvent) {
        ({
          error
        } = await supabase.from('events').update(eventData).eq('id', editingEvent.id));
      } else {
        ({
          error
        } = await supabase.from('events').insert([eventData]));
      }
      if (error) throw error;
      toast.success(editingEvent ? 'Événement modifié avec succès !' : 'Événement créé avec succès !');
      setIsDialogOpen(false);
      resetForm();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      loadEvents();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'événement:', error);
      toast.error('Erreur lors de la sauvegarde de l\'événement');
    }
  };
  const startEdit = (event: any) => {
    setEditingEvent(event);
    setNewEvent({
      titre: event.titre,
      description: event.description || "",
      date: event.date,
      lieu: event.lieu,
      image: event.image || "",
      type_evenement: event.type_evenement || "",
      artiste_dj: event.artiste_dj || "",
      image_file: null
    });
    setIsDialogOpen(true);
  };
  const deleteEvent = async (eventId: string) => {
    try {
      const {
        error
      } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
      toast.success('Événement supprimé avec succès !');
      loadEvents();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'événement:', error);
      toast.error('Erreur lors de la suppression de l\'événement');
    }
  };
  const filteredEvents = events.filter(event => event.titre.toLowerCase().includes(searchQuery.toLowerCase()) || event.lieu.toLowerCase().includes(searchQuery.toLowerCase()));
  const getStatusColor = (status: string) => {
    switch (status) {
      case "En cours":
        return "bg-accent text-accent-foreground";
      case "Confirmé":
        return "bg-primary text-primary-foreground";
      case "Préparation":
        return "bg-orange-500 text-white";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };
  return <div className="max-h-screen overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des événements</h1>
          <p className="text-muted-foreground">Créez et gérez vos soirées et événements spéciaux</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={open => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Nouvel événement
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? 'Modifier l\'événement' : 'Créer un nouvel événement'}
              </DialogTitle>
              <DialogDescription>
                {editingEvent ? 'Modifiez les informations de votre événement.' : 'Ajoutez les informations essentielles de votre événement.'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Titre de l'événement *</label>
                <Input placeholder="Ex: Pool Party VIP Summer" className="mt-1" value={newEvent.titre} onChange={e => setNewEvent({
                ...newEvent,
                titre: e.target.value
              })} />
              </div>
              
              <div>
                <label className="text-sm font-medium">Type d'événement</label>
                <Select value={newEvent.type_evenement} onValueChange={value => setNewEvent({
                ...newEvent,
                type_evenement: value
              })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner le type d'événement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pool Party">🏊 Pool Party</SelectItem>
                    <SelectItem value="Boite de nuit">🕺 Boite de nuit</SelectItem>
                    <SelectItem value="Rooftop">🏢 Rooftop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Artiste / DJ</label>
                <div className="relative">
                  <Music className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input placeholder="Ex: DJ Snake, Martin Garrix..." className="mt-1 pl-10" value={newEvent.artiste_dj} onChange={e => setNewEvent({
                  ...newEvent,
                  artiste_dj: e.target.value
                })} />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea placeholder="Description de l'événement" className="mt-1" value={newEvent.description} onChange={e => setNewEvent({
                ...newEvent,
                description: e.target.value
              })} />
              </div>
              
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Input type="date" className="mt-1" value={newEvent.date} onChange={e => setNewEvent({
                ...newEvent,
                date: e.target.value
              })} />
              </div>
              
              <div>
                <label className="text-sm font-medium">Lieu *</label>
                <Input placeholder="Ex: Terrasse VIP" className="mt-1" value={newEvent.lieu} onChange={e => setNewEvent({
                ...newEvent,
                lieu: e.target.value
              })} />
              </div>

              <div>
                <label className="text-sm font-medium">Photo de l'événement</label>
                <div className="mt-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
                      <Upload className="w-4 h-4 mr-2" />
                      {newEvent.image_file ? 'Changer la photo' : 'Télécharger une photo'}
                    </Button>
                    <input type="file" ref={fileInputRef} accept="image/jpeg,image/png" onChange={handleFileChange} className="hidden" />
                  </div>
                  {newEvent.image_file && <p className="text-xs text-muted-foreground">
                      Fichier sélectionné: {newEvent.image_file.name}
                    </p>}
                  <p className="text-xs text-muted-foreground">
                    Formats acceptés: JPEG, PNG • Taille max: 5MB
                  </p>
                </div>
              </div>
              
              
              
               </div>
             </ScrollArea>
             
             <div className="flex justify-end gap-2 pt-4 border-t">
               <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                 Annuler
               </Button>
               <Button className="bg-gradient-primary" onClick={createOrUpdateEvent}>
                 {editingEvent ? 'Enregistrer les modifications' : 'Créer l\'événement'}
               </Button>
             </div>
           </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Rechercher un événement..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filtres
        </Button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map(event => <Card key={event.id} className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300 group">
            <div className="relative">
              {event.image ? <img src={event.image} alt={event.titre} className="h-48 w-full object-cover rounded-t-lg" /> : <div className="h-48 bg-gradient-secondary rounded-t-lg flex items-center justify-center">
                  <Calendar className="w-16 h-16 text-primary opacity-50" />
                </div>}
              <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                Programmé
              </Badge>
            </div>
            
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-foreground line-clamp-1">
                {event.titre}
              </CardTitle>
              {event.type_evenement && <Badge variant="outline" className="w-fit mb-2">
                  {event.type_evenement === 'Pool Party' ? '🏊' : event.type_evenement === 'Boite de nuit' ? '🕺' : '🏢'} {event.type_evenement}
                </Badge>}
              {event.artiste_dj && <div className="flex items-center gap-2 mb-2">
                  <Music className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">{event.artiste_dj}</span>
                </div>}
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
                  <Button variant="outline" size="sm" className="flex-1 hover:bg-secondary" onClick={() => startEdit(event)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                  <Button variant="outline" size="sm" className="hover:bg-destructive hover:text-destructive-foreground" onClick={() => deleteEvent(event.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>)}
      </div>

      {/* Empty State */}
      {!loading && filteredEvents.length === 0 && <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {events.length === 0 ? "Aucun événement créé" : "Aucun événement trouvé"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {events.length === 0 ? "Créez votre premier événement pour commencer" : "Essayez avec d'autres termes de recherche"}
          </p>
          {events.length === 0 && <Button className="bg-gradient-primary" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer un événement
            </Button>}
        </div>}
    </div>;
}
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Save,
  Eye,
  Settings,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function FloorPlan() {
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  useEffect(() => {
    if (selectedEvent) {
      loadTables();
    }
  }, [selectedEvent]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
      
      // Sélectionner automatiquement le premier événement s'il existe
      if (data && data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0].id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('event_id', selectedEvent);

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des tables:', error);
      toast.error('Erreur lors du chargement des tables');
    }
  };

  const addTable = async () => {
    try {
      if (!selectedEvent) {
        toast.error('Veuillez sélectionner un événement');
        return;
      }

      const newTable = {
        nom: `Table ${tables.length + 1}`,
        event_id: selectedEvent,
        position_x: 100 + (tables.length * 50),
        position_y: 100 + (tables.length * 50),
        min_spend: 100,
        etat: 'libre' as 'libre'
      };

      const { error } = await supabase
        .from('tables')
        .insert([newTable]);

      if (error) throw error;

      toast.success('Table ajoutée avec succès !');
      loadTables();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la table:', error);
      toast.error('Erreur lors de l\'ajout de la table');
    }
  };

  const deleteTable = async (tableId: string) => {
    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId);

      if (error) throw error;

      toast.success('Table supprimée avec succès !');
      loadTables();
    } catch (error) {
      console.error('Erreur lors de la suppression de la table:', error);
      toast.error('Erreur lors de la suppression de la table');
    }
  };

  const getTableColor = (etat: string) => {
    switch (etat) {
      case "occupee": return "bg-gradient-primary border-primary shadow-glow";
      case "reservee": return "bg-primary/20 border-primary border-2";
      case "libre": return "bg-secondary border-border";
      default: return "bg-muted border-border";
    }
  };

  const getStatusText = (etat: string) => {
    switch (etat) {
      case "occupee": return "Occupée";
      case "reservee": return "Réservée";
      case "libre": return "Libre";
      default: return "Libre";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Plan de salle</h1>
          <p className="text-muted-foreground">Gérez l'agencement et le statut de vos tables</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Sélectionner un événement" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.titre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant={editMode ? "default" : "outline"}
            onClick={() => setEditMode(!editMode)}
            className={editMode ? "bg-accent text-accent-foreground" : ""}
          >
            {editMode ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
            {editMode ? "Sauvegarder" : "Modifier"}
          </Button>
          
          <Button 
            className="bg-gradient-primary hover:opacity-90"
            onClick={addTable}
            disabled={!selectedEvent}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter table
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Floor Plan */}
        <div className="lg:col-span-3">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Plan interactif
                {editMode && (
                  <Badge variant="outline" className="ml-2 text-accent border-accent">
                    Mode édition
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-secondary/20 rounded-lg p-4 min-h-[500px] border-2 border-dashed border-border">
                {/* Stage/DJ Area */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-accent text-accent-foreground px-6 py-3 rounded-lg font-bold shadow-accent-glow">
                  🎵 DJ STAGE 🎵
                </div>
                
                {/* Bar Area */}
                <div className="absolute top-4 right-4 bg-muted text-muted-foreground px-4 py-2 rounded border-2 border-border">
                  BAR PRINCIPAL
                </div>
                
                {/* Tables */}
                {tables.length > 0 ? tables.map((table) => (
                  <div
                    key={table.id}
                    className={`absolute w-24 h-24 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 ${getTableColor(table.etat)}`}
                    style={{ left: table.position_x, top: table.position_y }}
                  >
                    <div className="text-center">
                      <div className="text-xs font-bold">{table.nom}</div>
                      <div className="text-xs opacity-80">€{table.min_spend}</div>
                      <div className="text-xs opacity-70">{getStatusText(table.etat)}</div>
                    </div>
                    
                    {editMode && (
                      <div className="absolute -top-2 -right-2 flex gap-1">
                        <Button size="sm" variant="outline" className="w-6 h-6 p-0">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-6 h-6 p-0 hover:bg-destructive"
                          onClick={() => deleteTable(table.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )) : (
                  // Empty state for tables
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">Aucune table configurée</h3>
                      <p className="text-muted-foreground mb-4">
                        {selectedEvent ? "Commencez par ajouter des tables à votre plan de salle" : "Sélectionnez un événement pour commencer"}
                      </p>
                      {selectedEvent && (
                        <Button onClick={addTable} className="bg-gradient-primary">
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter une table
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Entrance */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500/20 text-green-400 px-6 py-2 rounded border-2 border-green-500/30">
                  🚪 ENTRÉE
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table Details Panel */}
        <div className="space-y-4">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Statut des tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-primary rounded"></div>
                  <span className="text-sm">VIP Occupée</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-primary/20 border-2 border-primary rounded"></div>
                  <span className="text-sm">VIP Réservée</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-accent/80 rounded"></div>
                  <span className="text-sm">Standard Occupée</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-secondary border border-border rounded"></div>
                  <span className="text-sm">Libre</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Tables occupées</span>
                    <span className="font-bold">
                      {tables.filter(t => t.etat === 'occupee').length}/{tables.length}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 mt-1">
                    <div 
                      className="bg-gradient-primary h-2 rounded-full" 
                      style={{ 
                        width: tables.length > 0 ? `${(tables.filter(t => t.etat === 'occupee').length / tables.length) * 100}%` : "0%" 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Taux de remplissage</span>
                    <span className="font-bold text-primary">
                      {tables.length > 0 ? Math.round((tables.filter(t => t.etat === 'occupee').length / tables.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Min spend total</span>
                    <span className="font-bold text-accent">
                      €{tables.reduce((sum, table) => sum + Number(table.min_spend || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  Vue 3D (bientôt)
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
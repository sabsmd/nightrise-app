import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Edit,
  Save,
  Settings,
  Plus,
  Trash2,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import FloorPlanCanvas, { FloorElement } from "@/components/FloorPlanCanvas";
import ElementPalette from "@/components/ElementPalette";
import ElementConfigDialog from "@/components/ElementConfigDialog";
import ProFloorPlanReservations from "@/components/ProFloorPlanReservations";

export default function FloorPlan() {
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [elements, setElements] = useState<FloorElement[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);
  const [configDialog, setConfigDialog] = useState<{
    open: boolean;
    element: FloorElement | null;
  }>({ open: false, element: null });
  const [showReservationDialog, setShowReservationDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  useEffect(() => {
    if (selectedEvent) {
      loadElements();
      loadTables();
      loadReservations();
      
      // Subscribe to real-time reservation updates
      const channel = supabase
        .channel('pro-reservations-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'client_reservations',
            filter: `event_id=eq.${selectedEvent}`
          },
          () => {
            loadReservations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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

  const loadElements = async () => {
    try {
      const { data, error } = await supabase
        .from('floor_elements')
        .select('*')
        .eq('event_id', selectedEvent);

      if (error) throw error;
      setElements((data || []) as FloorElement[]);
    } catch (error) {
      console.error('Erreur lors du chargement des éléments:', error);
      toast.error('Erreur lors du chargement des éléments');
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

  const loadReservations = async () => {
    if (!selectedEvent) return;
    
    try {
      const { data, error } = await supabase
        .from('client_reservations')
        .select(`
          *,
          min_spend_code:min_spend_codes(
            code,
            min_spend,
            solde_restant,
            nom_client,
            prenom_client,
            telephone_client
          ),
          profiles(
            nom,
            email
          )
        `)
        .eq('event_id', selectedEvent)
        .eq('statut', 'active');

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error loading reservations:', error);
    }
  };

  const handleElementMove = async (id: string, x: number, y: number) => {
    try {
      const { error } = await supabase
        .from('floor_elements')
        .update({ position_x: x, position_y: y })
        .eq('id', id);

      if (error) throw error;

      setElements(prev => prev.map(el => 
        el.id === id ? { ...el, position_x: x, position_y: y } : el
      ));
    } catch (error) {
      console.error('Erreur lors du déplacement:', error);
      toast.error('Erreur lors du déplacement de l\'élément');
    }
  };

  const handleElementResize = async (id: string, width: number, height: number) => {
    try {
      const { error } = await supabase
        .from('floor_elements')
        .update({ width, height })
        .eq('id', id);

      if (error) throw error;

      setElements(prev => prev.map(el => 
        el.id === id ? { ...el, width, height } : el
      ));
    } catch (error) {
      console.error('Erreur lors du redimensionnement:', error);
      toast.error('Erreur lors du redimensionnement de l\'élément');
    }
  };

  const handleElementDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('floor_elements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setElements(prev => prev.filter(el => el.id !== id));
      toast.success('Élément supprimé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de l\'élément');
    }
  };

  const handleElementClick = (element: FloorElement) => {
    // Check if element is reserved and show reservation details if PRO clicks on it
    const reservation = reservations.find(r => r.floor_element_id === element.id);
    if (reservation && ['table', 'bed', 'sofa'].includes(element.type)) {
      setConfigDialog({ open: false, element });
      setShowReservationDialog(true);
    } else {
      setConfigDialog({ open: true, element });
    }
  };

  const handleCanvasDrop = async (elementType: string, x: number, y: number) => {
    try {
      if (!selectedEvent) {
        toast.error('Veuillez sélectionner un événement');
        return;
      }

      const elementNames = {
        table: 'Table',
        entree: 'Entrée',
        bar: 'Bar',
        piscine: 'Piscine',
        bed: 'Bed',
        sofa: 'Sofa',
        piste: 'Piste de danse',
        dj_set: 'DJ Set',
        scene: 'Scène'
      };

      const newElement = {
        event_id: selectedEvent,
        type: elementType,
        nom: `${elementNames[elementType as keyof typeof elementNames]} ${elements.filter(e => e.type === elementType).length + 1}`,
        position_x: x,
        position_y: y,
        width: 80,
        height: 80,
        couleur: '#3B82F6',
        config: elementType === 'table' ? { capacite: 4, min_spend: 100 } : {}
      };

      const { data, error } = await supabase
        .from('floor_elements')
        .insert([newElement])
        .select()
        .single();

      if (error) throw error;

      setElements(prev => [...prev, data as FloorElement]);
      toast.success('Élément ajouté avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      toast.error('Erreur lors de l\'ajout de l\'élément');
    }
  };

  const handleElementSave = async (element: FloorElement) => {
    try {
      const { error } = await supabase
        .from('floor_elements')
        .update({
          nom: element.nom,
          config: element.config,
          couleur: element.couleur
        })
        .eq('id', element.id);

      if (error) throw error;

      setElements(prev => prev.map(el => 
        el.id === element.id ? element : el
      ));
      
      toast.success('Élément mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour de l\'élément');
    }
  };

  const getTableStats = () => {
    const reservableElements = elements.filter(e => ['table', 'bed', 'sofa'].includes(e.type));
    const reservedElements = reservableElements.filter(e => 
      reservations.some(r => r.floor_element_id === e.id)
    );
    
    return {
      total: reservableElements.length,
      reserved: reservedElements.length,
      available: reservableElements.length - reservedElements.length,
      totalMinSpend: reservableElements.reduce((sum, el) => sum + (el.config?.min_spend || 0), 0)
    };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Plan de salle</h1>
          <p className="text-muted-foreground">Gérez l'agencement et les réservations en temps réel</p>
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
            <CardContent className="p-4">
              <FloorPlanCanvas
                elements={elements}
                selectedEvent={selectedEvent}
                editMode={editMode}
                onElementMove={handleElementMove}
                onElementResize={handleElementResize}
                onElementDelete={handleElementDelete}
                onElementClick={handleElementClick}
                onCanvasDrop={handleCanvasDrop}
                reservations={reservations}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Panel */}
        <div className="space-y-4">
          <ElementPalette editMode={editMode} />

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Statistiques en temps réel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Éléments réservables</span>
                    <span className="font-bold text-primary">
                      {getTableStats().total}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm">
                    <span>Réservés maintenant</span>
                    <span className="font-bold text-destructive">
                      {getTableStats().reserved}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm">
                    <span>Disponibles</span>
                    <span className="font-bold text-green-600">
                      {getTableStats().available}
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Min spend total</span>
                    <span className="font-bold text-accent">
                      €{getTableStats().totalMinSpend}
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
                  Vue client (bientôt)
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres du plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ElementConfigDialog
        element={configDialog.element}
        open={configDialog.open && !showReservationDialog}
        onOpenChange={(open) => setConfigDialog({ ...configDialog, open })}
        onSave={handleElementSave}
      />

      <ProFloorPlanReservations
        selectedElement={configDialog.element}
        isOpen={showReservationDialog}
        onClose={() => {
          setShowReservationDialog(false);
          setConfigDialog({ open: false, element: null });
        }}
        onReservationCancelled={() => {
          loadReservations();
          setShowReservationDialog(false);
          setConfigDialog({ open: false, element: null });
        }}
      />
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Calendar, MapPin, Mail, Phone, ExternalLink, Users, Euro, Loader2, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ClientFloorPlan from '@/components/ClientFloorPlan';

interface Event {
  id: string;
  titre: string;
  description?: string;
  image?: string;
  date: string;
  lieu: string;
  artiste_dj?: string;
  type_evenement?: string;
  created_at: string;
}

interface FloorElement {
  id: string;
  type: 'table' | 'entree' | 'bar' | 'piscine' | 'bed' | 'sofa' | 'piste' | 'dj_set' | 'scene';
  nom: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  config?: any;
  couleur?: string;
}

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [floorElements, setFloorElements] = useState<FloorElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedElement, setSelectedElement] = useState<FloorElement | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchFloorElements();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Erreur lors du chargement de l\'événement');
      navigate('/');
    }
  };

  const fetchFloorElements = async () => {
    try {
      const { data, error } = await supabase
        .from('floor_elements')
        .select('*')
        .eq('event_id', eventId);

      if (error) throw error;
      setFloorElements((data || []).map(item => ({
        ...item,
        type: item.type as FloorElement['type']
      })));
    } catch (error) {
      console.error('Error fetching floor elements:', error);
      toast.error('Erreur lors du chargement du plan');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openGoogleMaps = () => {
    if (event?.lieu) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.lieu)}`;
      window.open(mapsUrl, '_blank');
    }
  };

  const handleElementClick = (element: FloorElement) => {
    // Only show details for reservable elements
    if (['table', 'bed', 'sofa'].includes(element.type)) {
      setSelectedElement(element);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement de l'événement...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Événement non trouvé</h2>
          <Link to="/">
            <Button>Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/80">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">🎉</span>
              </div>
              <span className="font-bold text-lg gradient-text">ClubManager</span>
            </div>
          </div>
        </div>
      </header>

      {/* Event Hero */}
      <section className="relative">
        <div className="h-64 md:h-80 bg-gradient-secondary relative overflow-hidden">
          {event.image ? (
            <img 
              src={event.image} 
              alt={event.titre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
              <span className="text-6xl">🎉</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40" />
          
          <div className="absolute bottom-6 left-4 right-4">
            <div className="container mx-auto">
              <div className="flex flex-wrap gap-2 mb-4">
                {event.type_evenement && (
                  <Badge variant="secondary" className="bg-black/50 text-white">
                    {event.type_evenement}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {event.titre}
              </h1>
              {event.artiste_dj && (
                <p className="text-xl text-accent font-medium">
                  {event.artiste_dj}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Event Information */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              {event.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>À propos de l'événement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Floor Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Plan de salle</CardTitle>
                  <CardDescription>
                    Cliquez sur les tables, beds ou sofas pour voir les détails et réserver
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ClientFloorPlan 
                    elements={floorElements}
                    eventId={eventId}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Event Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations pratiques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">{formatDate(event.date)}</p>
                      <p className="text-sm text-muted-foreground">
                        À partir de {formatTime(event.date)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{event.lieu}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={openGoogleMaps}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ouvrir dans Maps
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact organisateur</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">contact@clubmanager.com</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">+33 1 23 45 67 89</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Element Details Dialog */}
      <Dialog open={!!selectedElement} onOpenChange={() => setSelectedElement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span className="text-2xl">
                {selectedElement?.type === 'table' && '🪑'}
                {selectedElement?.type === 'bed' && '🛏️'}
                {selectedElement?.type === 'sofa' && '🛋️'}
              </span>
              <span>{selectedElement?.nom}</span>
            </DialogTitle>
            <DialogDescription>
              Détails de l'emplacement
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedElement?.config?.capacite && (
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Capacité: {selectedElement.config.capacite} personnes
                </span>
              </div>
            )}
            
            {selectedElement?.config?.prix && (
              <div className="flex items-center space-x-2">
                <Euro className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Prix: {selectedElement.config.prix}€
                </span>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: selectedElement?.couleur || '#3B82F6' }}
              />
              <span className="text-sm text-muted-foreground">
                Zone colorée sur le plan
              </span>
            </div>
            
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Pour réserver cet élément, vous avez besoin d'un code minimum spend valide. Contactez l'organisateur pour obtenir votre code.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
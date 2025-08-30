import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, MapPin, ArrowLeft, Users, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ClientFloorPlan, { FloorElement } from "@/components/ClientFloorPlan";

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

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [floorElements, setFloorElements] = useState<FloorElement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      loadEventDetails();
      loadFloorElements();
    }
  }, [eventId]);

  const loadEventDetails = async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Erreur lors du chargement de l\'événement');
      navigate('/');
    }
  };

  const loadFloorElements = async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('floor_elements')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFloorElements((data || []).map(item => ({
        ...item,
        type: item.type as FloorElement['type']
      })));
    } catch (error) {
      console.error('Error loading floor elements:', error);
      toast.error('Erreur lors du chargement du plan de salle');
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
    return date.toLocaleDateString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Événement non trouvé</h1>
          <p className="text-muted-foreground mb-4">L'événement demandé n'existe pas</p>
          <Button onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
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
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">🎉</span>
                </div>
                <span className="font-bold text-lg text-foreground">TABLE</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && profile ? (
                <span className="text-muted-foreground">Bonjour, {profile.nom}</span>
              ) : (
                <Button onClick={() => navigate('/auth')} size="sm">
                  Se connecter
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative">
        <div 
          className="h-64 md:h-80 bg-gradient-secondary relative overflow-hidden"
        >
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
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-4 pb-8">
              <div className="text-white">
                {event.type_evenement && (
                  <Badge variant="secondary" className="mb-3 bg-black/50 text-white">
                    {event.type_evenement}
                  </Badge>
                )}
                <h1 className="text-3xl md:text-5xl font-bold mb-2">
                  {event.titre}
                </h1>
                {event.artiste_dj && (
                  <p className="text-xl text-white/90 flex items-center">
                    <Music className="w-5 h-5 mr-2" />
                    {event.artiste_dj}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Info */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Informations de l'événement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{formatDate(event.date)}</p>
                      <p className="text-sm text-muted-foreground">Date de l'événement</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{event.lieu}</p>
                      <p className="text-sm text-muted-foreground">Lieu de l'événement</p>
                    </div>
                  </div>
                </div>

                {event.description && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Floor Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Plan de salle - Réservations
                </CardTitle>
                <CardDescription>
                  Cliquez sur un élément vert pour le réserver. 
                  {!user && " Vous devez être connecté pour réserver."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4 flex flex-wrap gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500/20 border-2 border-green-500 border-dashed rounded"></div>
                    <span className="text-muted-foreground">Disponible</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500/20 border-2 border-red-500 rounded"></div>
                    <span className="text-muted-foreground">Réservé</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500/20 border-2 border-green-500 rounded"></div>
                    <span className="text-muted-foreground">Votre réservation</span>
                  </div>
                </div>
                
                <ClientFloorPlan 
                  elements={floorElements} 
                  eventId={eventId}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
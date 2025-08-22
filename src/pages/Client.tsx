import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Calendar, MapPin, Users, Star, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export default function Client() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    // Filter events based on search query
    const filtered = events.filter(event => 
      event.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.lieu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.artiste_dj?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.type_evenement?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEvents(filtered);
  }, [events, searchQuery]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoadingEvents(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setMobileMenuOpen(false);
      toast.success("Déconnexion réussie");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/80">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">🎉</span>
              </div>
              <span className="font-bold text-lg gradient-text">ClubManager</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {user && profile ? (
                <div className="flex items-center space-x-4">
                  <span className="text-muted-foreground">Bonjour, {profile.nom}</span>
                  <Button variant="outline" onClick={handleSignOut}>
                    Se déconnecter
                  </Button>
                </div>
              ) : (
                <Link to="/auth">
                  <Button>Se connecter</Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border py-4">
              {user && profile ? (
                <div className="space-y-3">
                  <p className="text-muted-foreground">Bonjour, {profile.nom}</p>
                  <Button variant="outline" onClick={handleSignOut} className="w-full">
                    Se déconnecter
                  </Button>
                </div>
              ) : (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Se connecter</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-hero py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Découvrez les meilleurs événements
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Explorez une sélection exclusive d'événements près de chez vous et réservez votre place
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 px-4 bg-card">
        <div className="container mx-auto">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Rechercher par ville, artiste, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-6">Événements à venir</h2>
          
          {loadingEvents ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎪</div>
              <h3 className="text-lg font-semibold mb-2">Aucun événement trouvé</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Essayez un autre terme de recherche" : "Aucun événement disponible pour le moment"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-glow transition-all duration-300 group cursor-pointer">
                  <div 
                    className="h-48 bg-gradient-secondary relative overflow-hidden"
                    onClick={() => navigate(`/event/${event.id}`)}
                  >
                    {event.image ? (
                      <img 
                        src={event.image} 
                        alt={event.titre}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                        <span className="text-4xl">🎉</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
                    <div className="absolute top-4 left-4">
                      {event.type_evenement && (
                        <Badge variant="secondary" className="bg-black/50 text-white">
                          {event.type_evenement}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {event.titre}
                    </CardTitle>
                    {event.artiste_dj && (
                      <CardDescription className="text-accent font-medium">
                        {event.artiste_dj}
                      </CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(event.date)}
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.lieu}
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => navigate(`/event/${event.id}`)}
                    >
                      Découvrir
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 px-4 mt-16">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">🎉</span>
            </div>
            <span className="font-bold gradient-text">ClubManager</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2024 ClubManager - Interface Client
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            Découvrez et réservez les meilleurs événements près de chez vous
          </p>
        </div>
      </footer>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { EventService, Event } from "@/services/eventService";
import { toast } from "sonner";

const Index = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);
  const { user, error: authError, clearError } = useAuth();

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setEventError(null);
        const eventsData = await EventService.getEvents();
        setEvents(eventsData);
      } catch (error) {
        console.error('Error loading events:', error);
        setEventError(error instanceof Error ? error.message : 'Erreur lors du chargement des événements');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Clear auth error when user dismisses it
  const handleClearAuthError = () => {
    clearError();
  };

  const formatEventDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des événements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Pool Party</h1>
              <p className="text-muted-foreground">Découvrez nos événements exceptionnels</p>
            </div>
            <div className="flex gap-2">
              {user ? (
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <Link to="/mes-reservations">Mes Réservations</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/pro">Interface Pro</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <Link to="/auth">Se connecter</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/pro/auth">Pro</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Auth Error Alert */}
        {authError && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex justify-between items-center">
              <span>{authError}</span>
              <Button variant="ghost" size="sm" onClick={handleClearAuthError}>
                Fermer
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Event Error Alert */}
        {eventError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{eventError}</AlertDescription>
          </Alert>
        )}

        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucun événement disponible</h2>
            <p className="text-muted-foreground">Revenez bientôt pour découvrir nos prochains événements!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {event.image && (
                  <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${event.image})` }}>
                    <div className="h-full bg-black bg-opacity-20"></div>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{event.titre}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {event.description || "Découvrez cet événement exceptionnel"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatEventDate(event.date)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{event.lieu}</span>
                  </div>

                  {event.artiste_dj && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Artiste: {event.artiste_dj}</span>
                    </div>
                  )}

                  {event.type_evenement && (
                    <Badge variant="outline">{event.type_evenement}</Badge>
                  )}

                  <Button asChild className="w-full">
                    <Link to={`/event/${event.id}`}>
                      Voir les détails
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
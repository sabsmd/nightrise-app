import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, MapPin, CreditCard, ArrowLeft, AlertTriangle } from "lucide-react";
import { ReservationService, type ClientReservation } from "@/services/reservationService";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function ClientReservations() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<ClientReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<ClientReservation | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      loadReservations();
    }
  }, [user, authLoading]);

  const loadReservations = async () => {
    try {
      const data = await ReservationService.getClientReservations();
      setReservations(data);
    } catch (error) {
      console.error('Error loading reservations:', error);
      toast.error('Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservation: ClientReservation) => {
    setReservationToCancel(reservation);
    setShowCancelDialog(true);
  };

  const confirmCancelReservation = async () => {
    if (!reservationToCancel) return;

    setCancellingId(reservationToCancel.id);
    try {
      await ReservationService.cancelReservation(reservationToCancel.id);
      toast.success('Réservation annulée avec succès');
      loadReservations();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast.error('Erreur lors de l\'annulation de la réservation');
    } finally {
      setCancellingId(null);
      setShowCancelDialog(false);
      setReservationToCancel(null);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getElementIcon = (type: string) => {
    const icons = {
      table: '🪑',
      bed: '🛏️',
      sofa: '🛋️'
    };
    return icons[type as keyof typeof icons] || '📦';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
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
              <span className="text-muted-foreground">Bonjour, {profile?.nom}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Mes Réservations</h1>
            <p className="text-muted-foreground">
              Gérez vos réservations d'événements
            </p>
          </div>

          {reservations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-4xl mb-4">🎭</div>
                <h3 className="text-lg font-semibold mb-2">Aucune réservation</h3>
                <p className="text-muted-foreground mb-6">
                  Vous n'avez encore aucune réservation d'événement
                </p>
                <Link to="/">
                  <Button>
                    Découvrir les événements
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {reservations.map((reservation) => (
                <Card key={reservation.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">
                          {reservation.event?.titre}
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {reservation.event?.date && formatDate(reservation.event.date)}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {reservation.event?.lieu}
                          </div>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-500">
                        Actif
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Element réservé */}
                    <div className="flex items-center space-x-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <span className="text-2xl">
                        {getElementIcon(reservation.floor_element?.type || '')}
                      </span>
                      <div>
                        <h4 className="font-semibold text-primary">
                          {reservation.floor_element?.nom}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Élément réservé
                        </p>
                      </div>
                    </div>

                    {/* Informations du code minimum spend */}
                    {reservation.min_spend_code && (
                      <div className="p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold flex items-center">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Code Minimum Spend
                          </h4>
                          <Badge variant="outline" className="font-mono text-xs">
                            {reservation.min_spend_code.code}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Minimum :</span>
                            <span className="ml-2 font-medium">
                              {formatCurrency(reservation.min_spend_code.min_spend)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Restant :</span>
                            <span className="ml-2 font-medium">
                              {formatCurrency(reservation.min_spend_code.solde_restant)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-muted-foreground">
                        Réservé le {new Date(reservation.created_at).toLocaleDateString('fr-FR')}
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelReservation(reservation)}
                        disabled={cancellingId === reservation.id}
                      >
                        {cancellingId === reservation.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Annulation...
                          </>
                        ) : (
                          'Annuler la réservation'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirmer l'annulation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible.
              {reservationToCancel && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <div className="font-medium">{reservationToCancel.event?.titre}</div>
                  <div className="text-sm text-muted-foreground">
                    {reservationToCancel.floor_element?.nom}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelReservation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmer l'annulation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
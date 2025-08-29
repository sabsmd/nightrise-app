import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Calendar, MapPin, ExternalLink, X, AlertTriangle, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ReservationService, ClientReservation } from "@/services/reservationService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ClientReservations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reservations, setReservations] = useState<ClientReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadReservations();
    }
  }, [user]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await ReservationService.getClientReservations();
      setReservations(data);
    } catch (error) {
      console.error('Error loading reservations:', error);
      toast.error('Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    try {
      setCancellingId(reservationId);
      await ReservationService.cancelReservation(reservationId);
      toast.success('Réservation annulée avec succès');
      loadReservations();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast.error('Erreur lors de l\'annulation de la réservation');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'active':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary">Active</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">Annulée</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getElementIcon = (type: string) => {
    const icons = {
      table: '🪑',
      bed: '🛏️',
      sofa: '🛋️'
    };
    return icons[type as keyof typeof icons] || '📦';
  };

  const getSpentAmount = (reservation: ClientReservation) => {
    if (!reservation.min_spend_code) return 0;
    return reservation.min_spend_code.min_spend - reservation.min_spend_code.solde_restant;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
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

        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Chargement de vos réservations...</p>
          </div>
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mes Réservations</h1>
          <p className="text-muted-foreground">
            Gérez vos réservations d'éléments et suivez vos consommations
          </p>
        </div>

        {reservations.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucune réservation</h3>
              <p className="text-muted-foreground mb-6">
                Vous n'avez pas encore effectué de réservation
              </p>
              <Button onClick={() => navigate('/')}>
                Découvrir les événements
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Vos réservations ({reservations.length})</CardTitle>
              <CardDescription>
                Historique et gestion de toutes vos réservations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[700px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Événement</TableHead>
                      <TableHead>Élément</TableHead>
                      <TableHead>Date événement</TableHead>
                      <TableHead>Réservé le</TableHead>
                      <TableHead>Consommé</TableHead>
                      <TableHead>Restant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{reservation.event?.titre}</p>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span>{reservation.event?.lieu}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">
                              {getElementIcon(reservation.floor_element?.type || '')}
                            </span>
                            <span className="font-medium">
                              {reservation.floor_element?.nom}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 mr-1 text-muted-foreground" />
                            <span>{formatDate(reservation.event?.date || '')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(reservation.created_at)}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-accent">
                            {formatCurrency(getSpentAmount(reservation))}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            (reservation.min_spend_code?.solde_restant || 0) <= 0 
                              ? "text-destructive" 
                              : "text-primary"
                          }`}>
                            {formatCurrency(reservation.min_spend_code?.solde_restant || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(reservation.statut)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/events/${reservation.event_id}`)}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Voir
                            </Button>
                            {reservation.statut === 'active' && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="hover:bg-destructive hover:text-destructive-foreground"
                                    disabled={cancellingId === reservation.id}
                                  >
                                    {cancellingId === reservation.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <X className="w-4 h-4" />
                                    )}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center space-x-2">
                                      <AlertTriangle className="w-5 h-5 text-destructive" />
                                      <span>Annuler la réservation</span>
                                    </DialogTitle>
                                    <DialogDescription>
                                      Êtes-vous sûr de vouloir annuler cette réservation ? Cette action ne peut pas être annulée.
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="bg-muted/50 p-4 rounded-lg">
                                    <div className="space-y-2">
                                      <p><strong>Événement:</strong> {reservation.event?.titre}</p>
                                      <p><strong>Élément:</strong> {getElementIcon(reservation.floor_element?.type || '')} {reservation.floor_element?.nom}</p>
                                      <p><strong>Montant restant:</strong> {formatCurrency(reservation.min_spend_code?.solde_restant || 0)}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-end space-x-2">
                                    <DialogTrigger asChild>
                                      <Button variant="outline">
                                        Garder la réservation
                                      </Button>
                                    </DialogTrigger>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleCancelReservation(reservation.id)}
                                      disabled={cancellingId === reservation.id}
                                    >
                                      {cancellingId === reservation.id ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          Annulation...
                                        </>
                                      ) : (
                                        'Confirmer l\'annulation'
                                      )}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
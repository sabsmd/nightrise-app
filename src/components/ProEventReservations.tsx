import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, User, MapPin, Phone, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReservationData {
  id: string;
  created_at: string;
  statut: string;
  floor_element_id: string;
  event_id: string;
  user_id: string;
  min_spend_code_id: string;
  updated_at: string;
  floor_element?: {
    nom: string;
    type: string;
  } | null;
  min_spend_code?: {
    code: string;
    nom_client: string;
    prenom_client: string;
    telephone_client: string;
    min_spend: number;
    solde_restant: number;
  } | null;
}

interface Props {
  eventId: string;
}

export default function ProEventReservations({ eventId }: Props) {
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      loadReservations();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('event-reservations-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'client_reservations',
            filter: `event_id=eq.${eventId}`
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
  }, [eventId]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_reservations')
        .select(`
          *,
          min_spend_code:min_spend_codes(
            code,
            nom_client,
            prenom_client,
            telephone_client,
            min_spend,
            solde_restant
          ),
          floor_element:floor_elements(
            nom,
            type
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservations((data || []) as any);
    } catch (error) {
      console.error('Error loading reservations:', error);
      toast.error('Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Actif</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'table':
        return '🪑';
      case 'bed':
        return '🛏️';
      case 'sofa':
        return '🛋️';
      default:
        return '📍';
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Chargement des réservations...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Réservations de l'événement ({reservations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune réservation pour cet événement</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Élément</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Min Spend</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getElementIcon(reservation.floor_element?.type || '')}
                        </span>
                        <div>
                          <div className="font-medium">
                            {reservation.floor_element?.nom || 'Élément supprimé'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {reservation.floor_element?.type || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {reservation.min_spend_code?.prenom_client} {reservation.min_spend_code?.nom_client}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-mono text-sm bg-secondary px-2 py-1 rounded">
                        {reservation.min_spend_code?.code || 'N/A'}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          €{reservation.min_spend_code?.min_spend || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Reste: €{reservation.min_spend_code?.solde_restant || 0}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {reservation.min_spend_code?.telephone_client || 'N/A'}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(reservation.created_at)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(reservation.statut)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
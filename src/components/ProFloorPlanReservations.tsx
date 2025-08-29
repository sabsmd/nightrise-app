import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Phone, Mail, Calendar, CreditCard, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReservationInfo {
  id: string;
  user_id: string;
  statut: string;
  created_at: string;
  min_spend_code: {
    code: string;
    min_spend: number;
    solde_restant: number;
    nom_client: string;
    prenom_client: string;
    telephone_client: string;
  };
  profiles?: {
    nom: string;
    email: string;
  };
}

interface ProFloorPlanReservationsProps {
  selectedElement: any;
  isOpen: boolean;
  onClose: () => void;
  onReservationCancelled: () => void;
}

export default function ProFloorPlanReservations({
  selectedElement,
  isOpen,
  onClose,
  onReservationCancelled
}: ProFloorPlanReservationsProps) {
  const [reservation, setReservation] = useState<ReservationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (isOpen && selectedElement) {
      loadReservation();
    }
  }, [isOpen, selectedElement]);

  const loadReservation = async () => {
    if (!selectedElement?.id) return;

    setLoading(true);
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
        .eq('floor_element_id', selectedElement.id)
        .eq('statut', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setReservation(data as any);
    } catch (error) {
      console.error('Error loading reservation:', error);
      toast.error('Erreur lors du chargement de la réservation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservation) return;

    setCancelling(true);
    try {
      const { error } = await supabase
        .from('client_reservations')
        .update({ statut: 'cancelled' })
        .eq('id', reservation.id);

      if (error) throw error;

      toast.success('Réservation annulée avec succès');
      onReservationCancelled();
      onClose();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast.error('Erreur lors de l\'annulation de la réservation');
    } finally {
      setCancelling(false);
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

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
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

  if (!selectedElement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{getElementIcon(selectedElement.type)}</span>
            Détails de la réservation
          </DialogTitle>
          <DialogDescription>
            Informations sur la réservation de {selectedElement.nom}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
          </div>
        ) : reservation ? (
          <div className="space-y-4">
            {/* Statut de réservation */}
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="font-medium text-primary">Réservé</span>
                </div>
                <Badge variant="default" className="bg-primary">
                  {reservation.statut}
                </Badge>
              </div>
            </div>

            {/* Informations client */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                Informations client
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Nom complet:</span>
                  <span className="font-medium">
                    {reservation.min_spend_code.prenom_client} {reservation.min_spend_code.nom_client}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Téléphone:</span>
                  <span className="font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {reservation.min_spend_code.telephone_client}
                  </span>
                </div>

                {reservation.profiles?.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {reservation.profiles.email}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Code minimum spend */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Code minimum spend
              </h4>
              
              <div className="p-3 bg-muted/20 rounded-lg space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Code:</span>
                  <span className="font-mono font-bold">{reservation.min_spend_code.code}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Minimum spend:</span>
                  <span className="font-medium">{formatCurrency(reservation.min_spend_code.min_spend)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Restant:</span>
                  <span className={`font-medium ${
                    reservation.min_spend_code.solde_restant <= 0 
                      ? "text-destructive" 
                      : "text-primary"
                  }`}>
                    {formatCurrency(reservation.min_spend_code.solde_restant)}
                  </span>
                </div>
              </div>
            </div>

            {/* Date de réservation */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Réservé le:
              </span>
              <span className="font-medium">{formatDateTime(reservation.created_at)}</span>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
              <Button 
                variant="destructive"
                onClick={handleCancelReservation}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Annulation...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Annuler la réservation
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="font-semibold mb-2">Aucune réservation</h3>
            <p className="text-sm text-muted-foreground">
              Cet élément n'est actuellement pas réservé
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
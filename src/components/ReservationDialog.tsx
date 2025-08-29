import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ReservationService } from "@/services/reservationService";
import { FloorElement } from './ClientFloorPlan';

interface ReservationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  element: FloorElement | null;
  eventId: string;
  onReservationSuccess: () => void;
}

export default function ReservationDialog({
  isOpen,
  onClose,
  element,
  eventId,
  onReservationSuccess
}: ReservationDialogProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleReservation = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour réserver');
      navigate('/auth');
      return;
    }

    if (!code.trim()) {
      toast.error('Veuillez entrer votre code minimum spend');
      return;
    }

    if (!element) return;

    setLoading(true);
    try {
      // Valider le code minimum spend directement depuis la table min_spend_codes
      const { data: minSpendCode, error } = await supabase
        .from('min_spend_codes')
        .select('id, floor_element_id, min_spend, solde_restant, statut, floor_element:floor_elements(nom)')
        .eq('code', code.trim().toUpperCase())
        .eq('statut', 'actif')
        .single();

      if (error || !minSpendCode) {
        toast.error('Code minimum spend incorrect ou inexistant');
        setLoading(false);
        return;
      }

      // Vérifier que le code correspond à l'élément sélectionné
      if (minSpendCode.floor_element_id !== element.id) {
        const elementName = minSpendCode.floor_element?.nom || 'un autre élément';
        toast.error(`❌ Ce code est réservé pour ${elementName}.`);
        setLoading(false);
        return;
      }

      // Créer la réservation
      await ReservationService.createReservation(
        eventId,
        element.id,
        minSpendCode.id
      );

      toast.success(`${element.nom} réservé avec succès !`);
      onReservationSuccess();
      onClose();
      setCode("");
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      if (error.message && error.message.includes('❌')) {
        // Message d'erreur spécifique du service (ex: code pas pour le bon élément)
        toast.error(error.message);
      } else if (error.code === '23505') {
        toast.error('Cet élément vient d\'être réservé par quelqu\'un d\'autre');
      } else {
        toast.error('Erreur lors de la réservation');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRequired = () => {
    onClose();
    navigate('/auth');
  };

  const getElementIcon = (type: string) => {
    const icons = {
      table: '🪑',
      bed: '🛏️',
      sofa: '🛋️'
    };
    return icons[type as keyof typeof icons] || '📦';
  };

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Connexion requise
            </DialogTitle>
            <DialogDescription>
              Vous devez être connecté pour réserver cet élément
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {element && (
              <div className="p-4 bg-muted/20 rounded-lg border">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getElementIcon(element.type)}</span>
                  <div>
                    <h3 className="font-semibold">{element.nom}</h3>
                    <p className="text-sm text-muted-foreground">
                      Élément sélectionné pour réservation
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                L'accès aux réservations est réservé aux utilisateurs connectés.
              </p>
              <Button onClick={handleLoginRequired} className="w-full">
                Se connecter pour réserver
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Réserver l'élément
          </DialogTitle>
          <DialogDescription>
            Entrez votre code minimum spend pour réserver cet élément
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {element && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getElementIcon(element.type)}</span>
                <div>
                  <h3 className="font-semibold text-primary">{element.nom}</h3>
                  <p className="text-sm text-muted-foreground">
                    Élément sélectionné pour réservation
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="reservationCode">Code minimum spend</Label>
            <Input
              id="reservationCode"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ex: LHFG91K5"
              className="font-mono"
              maxLength={8}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleReservation();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Ce code vous a été fourni et est spécifique à cet élément
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button 
              onClick={handleReservation}
              disabled={loading || !code.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Réservation...
                </>
              ) : (
                'Réserver maintenant'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
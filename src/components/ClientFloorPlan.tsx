import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ReservationService } from "@/services/reservationService";
import ReservationDialog from "./ReservationDialog";

export interface FloorElement {
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

interface ClientReservation {
  id: string;
  floor_element_id: string;
  user_id: string;
  statut: string;
  min_spend_code_id: string;
}

interface ClientFloorPlanProps {
  elements: FloorElement[];
  eventId?: string;
}

export default function ClientFloorPlan({ 
  elements, 
  eventId
}: ClientFloorPlanProps) {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<ClientReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedElement, setSelectedElement] = useState<FloorElement | null>(null);
  const [showReservationDialog, setShowReservationDialog] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadReservations();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('reservations-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reservations',
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
    if (!eventId) return;
    
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('event_id', eventId)
        .eq('statut', 'active');

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error loading reservations:', error);
    }
  };

  const handleElementClick = (element: FloorElement) => {
    // Only allow reservation of table, bed, sofa
    if (!['table', 'bed', 'sofa'].includes(element.type)) {
      return; // Non-reservable elements do nothing
    }

    // Check if element is already reserved
    const existingReservation = reservations.find(r => r.floor_element_id === element.id);
    if (existingReservation) {
      if (existingReservation.user_id === user?.id) {
        toast.info('Vous avez déjà réservé cet élément');
      } else {
        toast.error('Cet élément est déjà réservé');
      }
      return;
    }

    // Check if user already has a reservation for this event
    if (user) {
      const userReservation = reservations.find(r => r.user_id === user.id);
      if (userReservation) {
        toast.error('Vous avez déjà une réservation pour cet événement');
        return;
      }
    }

    // Open reservation dialog (will handle auth if needed)
    setSelectedElement(element);
    setShowReservationDialog(true);
  };

  const handleReservationSuccess = () => {
    loadReservations();
    setSelectedElement(null);
  };

  const getElementStyle = (element: FloorElement) => {
    const reservation = reservations.find(r => r.floor_element_id === element.id);
    const isReservedByUser = reservation?.user_id === user?.id;
    const isReserved = !!reservation;

    const baseStyles = {
      position: 'absolute' as const,
      left: `${element.position_x}px`,
      top: `${element.position_y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      cursor: loading ? 'wait' : 'pointer',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold',
      textAlign: 'center' as const,
      border: '2px solid',
      userSelect: 'none' as const,
      transition: 'transform 0.2s, box-shadow 0.2s',
      minWidth: '40px',
      minHeight: '40px',
      flexDirection: 'column' as const,
      gap: '4px'
    };

    // Reservation-based styling
    if (isReserved) {
      if (isReservedByUser) {
        return {
          ...baseStyles,
          backgroundColor: 'hsl(142 76% 36%/0.2)',
          borderColor: 'hsl(142 76% 36%)',
          color: 'hsl(142 76% 36%)',
          transform: 'scale(1.05)',
          boxShadow: '0 4px 8px hsl(142 76% 36%/0.3)'
        };
      } else {
        return {
          ...baseStyles,
          backgroundColor: 'hsl(0 84% 60%/0.2)',
          borderColor: 'hsl(0 84% 60%)',
          color: 'hsl(0 84% 60%)',
          cursor: 'not-allowed',
          opacity: 0.7
        };
      }
    }

    // Available elements styling for reservable types
    if (['table', 'bed', 'sofa'].includes(element.type)) {
      const availableStyle = {
        ...baseStyles,
        backgroundColor: element.couleur ? element.couleur + '20' : 'hsl(var(--primary)/0.1)',
        borderColor: element.couleur || 'hsl(var(--primary))',
        color: element.couleur || 'hsl(var(--primary))',
        borderStyle: 'dashed' as const
      };

      return availableStyle;
    }

    // Default styling for non-reservable elements
    if (element.couleur) {
      return {
        ...baseStyles,
        backgroundColor: element.couleur + '20',
        borderColor: element.couleur,
        color: element.couleur,
        borderStyle: element.type === 'entree' ? 'dashed' : 'solid'
      };
    }

    const typeStyles = {
      entree: {
        backgroundColor: 'hsl(142 76% 36%/0.1)',
        borderColor: 'hsl(142 76% 36%)',
        borderStyle: 'dashed',
        color: 'hsl(142 76% 36%)'
      },
      bar: {
        backgroundColor: 'hsl(var(--muted))',
        borderColor: 'hsl(var(--border))',
        color: 'hsl(var(--muted-foreground))'
      },
      piscine: {
        backgroundColor: 'hsl(200 100% 85%)',
        borderColor: 'hsl(200 100% 50%)',
        color: 'hsl(200 100% 30%)'
      },
      piste: {
        backgroundColor: 'hsl(270 100% 70%/0.2)',
        borderColor: 'hsl(270 100% 50%)',
        color: 'hsl(270 100% 30%)'
      },
      dj_set: {
        backgroundColor: 'hsl(0 0% 10%)',
        borderColor: 'hsl(0 0% 30%)',
        color: 'hsl(0 0% 90%)'
      },
      scene: {
        backgroundColor: 'hsl(45 100% 50%/0.2)',
        borderColor: 'hsl(45 100% 40%)',
        color: 'hsl(45 100% 20%)'
      }
    };

    return { ...baseStyles, ...typeStyles[element.type] };
  };

  const getElementIcon = (type: string) => {
    const icons = {
      table: '🪑',
      entree: '🚪',
      bar: '🍹',
      piscine: '🏊',
      bed: '🛏️',
      sofa: '🛋️',
      piste: '💃',
      dj_set: '🎧',
      scene: '🎭'
    };
    return icons[type as keyof typeof icons] || '📦';
  };

  const getReservationBadge = (element: FloorElement) => {
    const reservation = reservations.find(r => r.floor_element_id === element.id);
    if (!reservation) return null;

    const isReservedByUser = reservation.user_id === user?.id;

    if (isReservedByUser) {
      return (
        <Badge variant="default" className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 py-0.5">
          Réservé par vous
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="absolute -top-2 -right-2 text-xs px-1 py-0.5">
          Réservé
        </Badge>
      );
    }
  };

  return (
    <div
      className="relative bg-secondary/20 rounded-lg border-2 border-dashed border-border min-h-[600px] overflow-hidden"
      style={{
        backgroundImage: `
          linear-gradient(to right, hsl(var(--border)/0.3) 1px, transparent 1px),
          linear-gradient(to bottom, hsl(var(--border)/0.3) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px'
      }}
    >
      {elements.map((element) => (
        <div
          key={element.id}
          style={getElementStyle(element)}
          onClick={() => handleElementClick(element)}
          className="group relative hover:scale-105 hover:shadow-md transition-all"
        >
          <span className="text-lg">{getElementIcon(element.type)}</span>
          <span className="text-xs leading-tight">{element.nom}</span>
          
          {['table', 'bed', 'sofa'].includes(element.type) && getReservationBadge(element)}
        </div>
      ))}

      {elements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">🏗️</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Aucun élément</h3>
            <p className="text-muted-foreground">Le plan de salle n'a pas encore été configuré</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-card/90 backdrop-blur-sm border rounded-lg p-3">
          <p className="text-sm text-muted-foreground text-center">
            ✨ Cliquez sur une table, un bed ou un sofa pour le réserver
          </p>
        </div>
      </div>

      <ReservationDialog
        isOpen={showReservationDialog}
        onClose={() => setShowReservationDialog(false)}
        element={selectedElement}
        eventId={eventId || ""}
        onReservationSuccess={handleReservationSuccess}
      />
    </div>
  );
}
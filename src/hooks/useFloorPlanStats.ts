import { useEffect, useState } from 'react';
import { useRealtimeReservations } from './useRealtimeReservations';
import { supabase } from '@/integrations/supabase/client';

export interface FloorPlanStats {
  total: number;
  reserved: number;
  available: number;
  minSpendTotal: number;
}

export function useFloorPlanStats(eventId: string) {
  const { reservations } = useRealtimeReservations(eventId);
  const [elements, setElements] = useState<any[]>([]);
  const [stats, setStats] = useState<FloorPlanStats>({
    total: 0,
    reserved: 0,
    available: 0,
    minSpendTotal: 0
  });

  const loadElements = async () => {
    if (!eventId) return;
    
    try {
      const { data, error } = await supabase
        .from('floor_elements')
        .select('id, type, config')
        .eq('event_id', eventId)
        .in('type', ['table', 'bed', 'sofa']);

      if (error) throw error;
      setElements(data || []);
    } catch (error) {
      console.error('Error loading elements:', error);
      setElements([]);
    }
  };

  useEffect(() => {
    loadElements();
  }, [eventId]);

  useEffect(() => {
    const reservableElements = elements;
    const reservedElements = reservableElements.filter(element => 
      reservations.some(r => r.floor_element_id === element.id)
    );
    
    // Calculer le min spend total des éléments réservés
    const minSpendTotal = reservedElements.reduce((sum, element) => {
      const reservation = reservations.find(r => r.floor_element_id === element.id);
      return sum + (reservation?.min_spend_code?.min_spend || element.config?.min_spend || 0);
    }, 0);
    
    setStats({
      total: reservableElements.length,
      reserved: reservedElements.length,
      available: reservableElements.length - reservedElements.length,
      minSpendTotal
    });
  }, [elements, reservations]);

  return stats;
}
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getReservationsByEvent, subscribeToReservations, type EnrichedReservation } from '@/lib/supabaseReservations';

export interface ReservationData extends EnrichedReservation {}

export function useRealtimeReservations(event_id: string) {
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReservations = async () => {
    try {
      const data = await getReservationsByEvent(event_id);
      setReservations(data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();

    // Set up real-time subscription for this specific event
    const channel = subscribeToReservations(event_id, (payload) => {
      console.log('Reservation change detected:', payload);
      fetchReservations();
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event_id]);

  return { reservations, loading, refetch: fetchReservations };
}
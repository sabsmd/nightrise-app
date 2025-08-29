import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReservationData {
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

export function useRealtimeReservations(event_id: string) {
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReservations = async () => {
    if (!event_id) {
      setReservations([]);
      setLoading(false);
      return;
    }

    try {
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
        .eq('event_id', event_id)
        .eq('statut', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservations((data || []) as any);
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
    const channel = supabase
      .channel(`reservations-event-${event_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_reservations',
          filter: `event_id=eq.${event_id}`
        },
        (payload) => {
          console.log('Reservation change detected:', payload);
          fetchReservations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'min_spend_codes'
        },
        (payload) => {
          console.log('Min spend code change detected:', payload);
          fetchReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event_id]);

  return { reservations, loading, refetch: fetchReservations };
}
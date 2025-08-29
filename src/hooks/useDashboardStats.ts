import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  total: number;
  reserved: number;
  available: number;
  percentage: number;
  minSpendTotal: number;
  nextEventId: string | null;
  nextEventTitle: string | null;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    reserved: 0,
    available: 0,
    percentage: 0,
    minSpendTotal: 0,
    nextEventId: null,
    nextEventTitle: null
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Récupérer le prochain événement à venir
      const { data: nextEvent, error: eventError } = await supabase
        .from('events')
        .select('id, titre, date')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(1)
        .single();

      if (eventError || !nextEvent) {
        setStats({
          total: 0,
          reserved: 0,
          available: 0,
          percentage: 0,
          minSpendTotal: 0,
          nextEventId: null,
          nextEventTitle: null
        });
        setLoading(false);
        return;
      }

      // Récupérer tous les éléments réservables pour cet événement
      const { data: elements, error: elementsError } = await supabase
        .from('floor_elements')
        .select('id, type')
        .eq('event_id', nextEvent.id)
        .in('type', ['table', 'bed', 'sofa']);

      if (elementsError) throw elementsError;

      // Récupérer les réservations actives pour cet événement
      const { data: reservations, error: reservationsError } = await supabase
        .from('client_reservations')
        .select(`
          id,
          floor_element_id,
          min_spend_code_id
        `)
        .eq('event_id', nextEvent.id)
        .eq('statut', 'active');

      if (reservationsError) throw reservationsError;

      // Récupérer les codes min spend associés
      let minSpendTotal = 0;
      if (reservations && reservations.length > 0) {
        const codeIds = [...new Set(reservations.map(r => r.min_spend_code_id))];
        const { data: codes } = await supabase
          .from('min_spend_codes')
          .select('id, min_spend')
          .in('id', codeIds);

        const codesMap = new Map((codes || []).map(c => [c.id, c.min_spend]));
        minSpendTotal = reservations.reduce((sum, reservation) => {
          return sum + (codesMap.get(reservation.min_spend_code_id) || 0);
        }, 0);
      }

      const totalElements = elements?.length || 0;
      const reservedCount = reservations?.length || 0;
      const availableCount = totalElements - reservedCount;
      const percentage = totalElements > 0 ? Math.round((reservedCount / totalElements) * 100) : 0;

      setStats({
        total: totalElements,
        reserved: reservedCount,
        available: availableCount,
        percentage,
        minSpendTotal,
        nextEventId: nextEvent.id,
        nextEventTitle: nextEvent.titre
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats({
        total: 0,
        reserved: 0,
        available: 0,
        percentage: 0,
        minSpendTotal: 0,
        nextEventId: null,
        nextEventTitle: null
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up real-time subscription for reservation changes
    const channel = supabase
      .channel('dashboard-stats-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_reservations'
        },
        () => {
          console.log('Dashboard: Reservation change detected');
          fetchStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'floor_elements'
        },
        () => {
          console.log('Dashboard: Floor element change detected');
          fetchStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        () => {
          console.log('Dashboard: Event change detected');
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { stats, loading, refetch: fetchStats };
}
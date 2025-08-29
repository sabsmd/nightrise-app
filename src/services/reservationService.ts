import { supabase } from "@/integrations/supabase/client";

export interface ClientReservation {
  id: string;
  user_id: string;
  event_id: string;
  floor_element_id: string;
  min_spend_code_id: string;
  statut: 'active' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Joined data
  event?: {
    id: string;
    titre: string;
    date: string;
    lieu: string;
  };
  floor_element?: {
    id: string;
    type: string;
    nom: string;
  };
  min_spend_code?: {
    id: string;
    code: string;
    min_spend: number;
    solde_restant: number;
  };
}

export class ReservationService {
  static async createReservation(
    eventId: string,
    floorElementId: string,
    minSpendCodeId: string
  ): Promise<ClientReservation> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      const { data: reservation, error } = await supabase
        .from('client_reservations')
        .insert({
          event_id: eventId,
          floor_element_id: floorElementId,
          min_spend_code_id: minSpendCodeId,
          user_id: user.id,
          statut: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Get related data separately
      const [eventData, floorElementData, codeData] = await Promise.all([
        supabase.from('events').select('id, titre, date, lieu').eq('id', eventId).single(),
        supabase.from('floor_elements').select('id, type, nom').eq('id', floorElementId).single(),
        supabase.from('min_spend_codes').select('id, code, min_spend, solde_restant').eq('id', minSpendCodeId).single()
      ]);

      return {
        ...reservation,
        statut: reservation.statut as 'active' | 'cancelled',
        event: eventData.data || undefined,
        floor_element: floorElementData.data || undefined,
        min_spend_code: codeData.data || undefined
      } as ClientReservation;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  }

  static async getClientReservations(): Promise<ClientReservation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      const { data: reservations, error } = await supabase
        .from('client_reservations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!reservations || reservations.length === 0) return [];

      // Get related data for all reservations
      const eventIds = [...new Set(reservations.map(r => r.event_id))];
      const elementIds = [...new Set(reservations.map(r => r.floor_element_id))];
      const codeIds = [...new Set(reservations.map(r => r.min_spend_code_id))];

      const [eventsData, elementsData, codesData] = await Promise.all([
        supabase.from('events').select('id, titre, date, lieu').in('id', eventIds),
        supabase.from('floor_elements').select('id, type, nom').in('id', elementIds),
        supabase.from('min_spend_codes').select('id, code, min_spend, solde_restant').in('id', codeIds)
      ]);

      const eventsMap = new Map((eventsData.data || []).map(e => [e.id, e]));
      const elementsMap = new Map((elementsData.data || []).map(e => [e.id, e]));
      const codesMap = new Map((codesData.data || []).map(c => [c.id, c]));

      return reservations.map(reservation => ({
        ...reservation,
        statut: reservation.statut as 'active' | 'cancelled',
        event: eventsMap.get(reservation.event_id),
        floor_element: elementsMap.get(reservation.floor_element_id),
        min_spend_code: codesMap.get(reservation.min_spend_code_id)
      })) as ClientReservation[];
    } catch (error) {
      console.error('Error fetching client reservations:', error);
      throw error;
    }
  }

  static async cancelReservation(reservationId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      const { error } = await supabase
        .from('client_reservations')
        .update({ statut: 'cancelled' })
        .eq('id', reservationId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      throw error;
    }
  }

  static async getReservationByElement(eventId: string, floorElementId: string): Promise<ClientReservation | null> {
    try {
      const { data: reservation, error } = await supabase
        .from('client_reservations')
        .select('*')
        .eq('event_id', eventId)
        .eq('floor_element_id', floorElementId)
        .eq('statut', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!reservation) return null;

      // Get related data
      const [eventData, floorElementData, codeData] = await Promise.all([
        supabase.from('events').select('id, titre, date, lieu').eq('id', eventId).single(),
        supabase.from('floor_elements').select('id, type, nom').eq('id', floorElementId).single(),
        supabase.from('min_spend_codes').select('id, code, min_spend, solde_restant').eq('id', reservation.min_spend_code_id).single()
      ]);
      
      return {
        ...reservation,
        statut: reservation.statut as 'active' | 'cancelled',
        event: eventData.data || undefined,
        floor_element: floorElementData.data || undefined,
        min_spend_code: codeData.data || undefined
      } as ClientReservation;
    } catch (error) {
      console.error('Error fetching reservation by element:', error);
      return null;
    }
  }
}
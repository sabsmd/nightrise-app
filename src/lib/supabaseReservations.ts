import { supabase } from '@/integrations/supabase/client';

export interface EnrichedReservation {
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

export interface ClientReservation {
  id: string;
  user_id: string;
  event_id: string;
  floor_element_id: string;
  min_spend_code_id: string;
  statut: string;
  created_at: string;
  updated_at: string;
  event?: {
    id: string;
    titre: string;
    date: string;
    lieu: string;
    image: string;
  } | null;
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

/**
 * 🔹 Récupérer toutes les réservations d'un event (avec infos client + tables)
 */
export async function getReservationsByEvent(eventId: string): Promise<EnrichedReservation[]> {
  if (!eventId) {
    return [];
  }

  try {
    // Fetch reservations
    const { data: reservationsData, error: reservationsError } = await supabase
      .from('client_reservations')
      .select('*')
      .eq('event_id', eventId)
      .eq('statut', 'active')
      .order('created_at', { ascending: false });

    if (reservationsError) throw reservationsError;

    if (!reservationsData || reservationsData.length === 0) {
      return [];
    }

    // Get unique IDs for separate queries
    const minSpendCodeIds = [...new Set(reservationsData.map(r => r.min_spend_code_id))];
    const floorElementIds = [...new Set(reservationsData.map(r => r.floor_element_id))];

    // Fetch min spend codes
    const { data: minSpendCodes, error: minSpendError } = await supabase
      .from('min_spend_codes')
      .select('id, code, nom_client, prenom_client, telephone_client, min_spend, solde_restant')
      .in('id', minSpendCodeIds);

    if (minSpendError) throw minSpendError;

    // Fetch floor elements
    const { data: floorElements, error: floorError } = await supabase
      .from('floor_elements')
      .select('id, nom, type')
      .in('id', floorElementIds);

    if (floorError) throw floorError;

    // Map the data together
    const enrichedReservations = reservationsData.map(reservation => ({
      ...reservation,
      min_spend_code: minSpendCodes?.find(code => code.id === reservation.min_spend_code_id) || null,
      floor_element: floorElements?.find(element => element.id === reservation.floor_element_id) || null
    }));

    return enrichedReservations;
  } catch (error) {
    console.error('❌ Error loading reservations:', error);
    throw error;
  }
}

/**
 * 🔹 Vérifier si une table est réservée
 */
export async function isTableReserved(eventId: string, floorElementId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('client_reservations')
      .select('id')
      .eq('event_id', eventId)
      .eq('floor_element_id', floorElementId)
      .eq('statut', 'active')
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('❌ Error checking table:', error);
    throw error;
  }
}

/**
 * 🔹 Réserver une table (côté client)
 */
export async function reserveTable(eventId: string, floorElementId: string, minSpendCodeId: string): Promise<ClientReservation> {
  try {
    const { data, error } = await supabase
      .from('client_reservations')
      .insert([{
        event_id: eventId,
        floor_element_id: floorElementId,
        min_spend_code_id: minSpendCodeId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      }])
      .select()
      .single();

    if (error) throw error;

    // Fetch related data
    const reservation = await getReservationByIdWithRelations(data.id);
    return reservation;
  } catch (error) {
    console.error('❌ Error creating reservation:', error);
    throw error;
  }
}

/**
 * 🔹 Supprimer une réservation (côté PRO ou client annulation)
 */
export async function cancelReservation(reservationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('client_reservations')
      .update({ statut: 'cancelled' })
      .eq('id', reservationId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Error cancelling reservation:', error);
    throw error;
  }
}

/**
 * 🔹 Récupérer les réservations d'un client
 */
export async function getClientReservations(): Promise<ClientReservation[]> {
  try {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user.user) throw new Error('User not authenticated');

    // Fetch user reservations
    const { data: reservationsData, error: reservationsError } = await supabase
      .from('client_reservations')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('statut', 'active')
      .order('created_at', { ascending: false });

    if (reservationsError) throw reservationsError;

    if (!reservationsData || reservationsData.length === 0) {
      return [];
    }

    // Get unique IDs for separate queries
    const eventIds = [...new Set(reservationsData.map(r => r.event_id))];
    const minSpendCodeIds = [...new Set(reservationsData.map(r => r.min_spend_code_id))];
    const floorElementIds = [...new Set(reservationsData.map(r => r.floor_element_id))];

    // Fetch related data
    const [eventsData, minSpendCodes, floorElements] = await Promise.all([
      supabase.from('events').select('id, titre, date, lieu, image').in('id', eventIds),
      supabase.from('min_spend_codes').select('id, code, nom_client, prenom_client, telephone_client, min_spend, solde_restant').in('id', minSpendCodeIds),
      supabase.from('floor_elements').select('id, nom, type').in('id', floorElementIds)
    ]);

    if (eventsData.error) throw eventsData.error;
    if (minSpendCodes.error) throw minSpendCodes.error;
    if (floorElements.error) throw floorElements.error;

    // Map the data together
    const enrichedReservations = reservationsData.map(reservation => ({
      ...reservation,
      event: eventsData.data?.find(event => event.id === reservation.event_id) || null,
      min_spend_code: minSpendCodes.data?.find(code => code.id === reservation.min_spend_code_id) || null,
      floor_element: floorElements.data?.find(element => element.id === reservation.floor_element_id) || null
    }));

    return enrichedReservations;
  } catch (error) {
    console.error('❌ Error fetching client reservations:', error);
    throw error;
  }
}

/**
 * 🔹 Récupérer une réservation par element
 */
export async function getReservationByElement(eventId: string, floorElementId: string): Promise<ClientReservation | null> {
  try {
    const { data: reservationData, error: reservationError } = await supabase
      .from('client_reservations')
      .select('*')
      .eq('event_id', eventId)
      .eq('floor_element_id', floorElementId)
      .eq('statut', 'active')
      .maybeSingle();

    if (reservationError) throw reservationError;
    if (!reservationData) return null;

    return await getReservationByIdWithRelations(reservationData.id);
  } catch (error) {
    console.error('❌ Error fetching reservation by element:', error);
    throw error;
  }
}

/**
 * 🔹 Helper: Récupérer une réservation avec ses relations
 */
async function getReservationByIdWithRelations(reservationId: string): Promise<ClientReservation> {
  try {
    const { data: reservationData, error: reservationError } = await supabase
      .from('client_reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (reservationError) throw reservationError;

    // Fetch related data
    const [eventData, minSpendCode, floorElement] = await Promise.all([
      supabase.from('events').select('id, titre, date, lieu, image').eq('id', reservationData.event_id).single(),
      supabase.from('min_spend_codes').select('id, code, nom_client, prenom_client, telephone_client, min_spend, solde_restant').eq('id', reservationData.min_spend_code_id).single(),
      supabase.from('floor_elements').select('id, nom, type').eq('id', reservationData.floor_element_id).single()
    ]);

    return {
      ...reservationData,
      event: eventData.error ? null : eventData.data,
      min_spend_code: minSpendCode.error ? null : minSpendCode.data,
      floor_element: floorElement.error ? null : floorElement.data
    };
  } catch (error) {
    console.error('❌ Error fetching reservation with relations:', error);
    throw error;
  }
}

/**
 * 🔹 Abonnement temps réel (toutes réservations)
 */
export function subscribeToReservations(eventId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`reservations-event-${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'client_reservations',
        filter: `event_id=eq.${eventId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'min_spend_codes'
      },
      callback
    )
    .subscribe();
}
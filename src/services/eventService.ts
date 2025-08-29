import { supabase } from "@/integrations/supabase/client";

export interface Event {
  id: string;
  titre: string;
  description: string | null;
  date: string;
  lieu: string;
  image: string | null;
  image_file: string | null;
  type_evenement: string | null;
  artiste_dj: string | null;
  created_at: string;
  updated_at: string;
}

export class EventService {
  static async getEvents(): Promise<Event[]> {
    try {
      // First try with potential auth
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        // If it's a JWT error, try without auth context
        if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
          console.log("JWT issue detected, retrying event fetch");
          // Clear any bad session and retry
          const { data: retryEvents, error: retryError } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true });
          
          if (retryError) throw retryError;
          return retryEvents as Event[];
        }
        throw error;
      }

      return events as Event[];
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new Error('Erreur lors du chargement des événements');
    }
  }

  static async getEventById(id: string): Promise<Event | null> {
    try {
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Event not found
        }
        
        // Handle JWT errors
        if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
          console.log("JWT issue detected for event fetch");
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        
        throw error;
      }

      return event as Event;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  }
}
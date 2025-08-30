import { 
  reserveTable, 
  getClientReservations, 
  cancelReservation, 
  getReservationByElement,
  type ClientReservation 
} from '@/lib/supabaseReservations';

export { type ClientReservation };

export class ReservationService {
  static async createReservation(
    eventId: string,
    floorElementId: string,
    minSpendCodeId: string
  ): Promise<ClientReservation> {
    return await reserveTable(eventId, floorElementId, minSpendCodeId);
  }

  static async getClientReservations(): Promise<ClientReservation[]> {
    return await getClientReservations();
  }

  static async cancelReservation(reservationId: string): Promise<void> {
    return await cancelReservation(reservationId);
  }

  static async getReservationByElement(
    eventId: string,
    floorElementId: string
  ): Promise<ClientReservation | null> {
    return await getReservationByElement(eventId, floorElementId);
  }
}
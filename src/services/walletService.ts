import { supabase } from "@/integrations/supabase/client";

export interface WalletData {
  id: string;
  code: string;
  reservationId?: string;
  status: 'active' | 'suspended' | 'closed' | 'expired';
  currency: string;
  initialCredit: number;
  remainingCredit: number;
  progress: number;
  expiresAt?: string;
  history: WalletTransaction[];
  clientName?: string;
  clientPhone?: string;
  floorElement?: {
    id: string;
    type: string;
    nom: string;
  };
}

export interface WalletTransaction {
  id: string;
  type: 'debit' | 'credit' | 'refund' | 'adjustment';
  amount: number;
  orderId?: string;
  source: string;
  notes?: string;
  createdAt: string;
}

export interface CreateWalletData {
  code: string;
  initialCredit: number;
  currency?: string;
  expiresAt?: string;
  clientName?: string;
  clientPhone?: string;
  floorElementId?: string;
}

export class WalletService {
  static async getWallet(code: string): Promise<WalletData | null> {
    try {
      const { data, error } = await supabase.functions.invoke('wallet-get', {
        body: { code }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching wallet:', error);
      throw error;
    }
  }

  static async createWallet(walletData: CreateWalletData): Promise<WalletData> {
    try {
      const { data, error } = await supabase.functions.invoke('wallet-create', {
        body: walletData
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  static async debitWallet(
    code: string, 
    amount: number, 
    orderId?: string, 
    source: string = 'app',
    idempotencyKey?: string
  ): Promise<WalletData> {
    try {
      const { data, error } = await supabase.functions.invoke('wallet-debit', {
        body: {
          code,
          amount,
          orderId,
          source,
          idempotencyKey
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error debiting wallet:', error);
      throw error;
    }
  }

  static async creditWallet(
    code: string, 
    amount: number, 
    type: string = 'credit',
    orderId?: string, 
    source: string = 'staff',
    idempotencyKey?: string,
    notes?: string
  ): Promise<WalletData> {
    try {
      const { data, error } = await supabase.functions.invoke('wallet-credit', {
        body: {
          code,
          amount,
          type,
          orderId,
          source,
          idempotencyKey,
          notes
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error crediting wallet:', error);
      throw error;
    }
  }

  static async updateWalletStatus(
    code: string, 
    status: 'active' | 'suspended' | 'closed' | 'expired',
    expiresAt?: string
  ): Promise<WalletData> {
    try {
      const { data, error } = await supabase.functions.invoke('wallet-update', {
        body: {
          code,
          status,
          expiresAt
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating wallet:', error);
      throw error;
    }
  }

  // Migration helper: Convert old min_spend_codes to new wallet format
  static async migrateMinSpendCode(minSpendCode: any): Promise<WalletData> {
    try {
      // Check if wallet already exists
      try {
        const existing = await this.getWallet(minSpendCode.code);
        if (existing) {
          return existing;
        }
      } catch (error) {
        // Wallet doesn't exist, continue with migration
      }

      // Create new wallet from old min_spend_code
      const walletData: CreateWalletData = {
        code: minSpendCode.code,
        initialCredit: Number(minSpendCode.min_spend),
        currency: 'EUR',
        clientName: `${minSpendCode.prenom_client} ${minSpendCode.nom_client}`,
        clientPhone: minSpendCode.telephone_client,
        floorElementId: minSpendCode.floor_element_id
      };

      const wallet = await this.createWallet(walletData);

      // If remaining balance is different from initial, adjust it
      const remainingCredit = Number(minSpendCode.solde_restant);
      if (remainingCredit !== wallet.initialCredit) {
        const consumed = wallet.initialCredit - remainingCredit;
        if (consumed > 0) {
          await this.debitWallet(
            wallet.code, 
            consumed, 
            undefined, 
            'migration', 
            `migration-${minSpendCode.id}`
          );
        }
      }

      // Update status if needed
      if (minSpendCode.statut !== 'actif') {
        const statusMap: { [key: string]: 'active' | 'suspended' | 'closed' | 'expired' } = {
          'actif': 'active',
          'utilise': 'closed',
          'expire': 'expired'
        };
        
        await this.updateWalletStatus(wallet.code, statusMap[minSpendCode.statut] || 'active');
      }

      return await this.getWallet(wallet.code) || wallet;
    } catch (error) {
      console.error('Error migrating min spend code:', error);
      throw error;
    }
  }

  // Get wallets for an event by fetching min_spend_codes and migrating them
  static async getEventWallets(eventId: string): Promise<WalletData[]> {
    try {
      // Fetch existing min_spend_codes for the event
      const { data: minSpendCodes, error } = await supabase
        .from('min_spend_codes')
        .select(`
          *,
          floor_element:floor_elements(id, nom, type)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Migrate each code to wallet format
      const wallets: WalletData[] = [];
      for (const code of minSpendCodes || []) {
        try {
          const wallet = await this.migrateMinSpendCode(code);
          wallets.push(wallet);
        } catch (error) {
          console.error(`Failed to migrate code ${code.code}:`, error);
          // Continue with other codes
        }
      }

      return wallets;
    } catch (error) {
      console.error('Error fetching event wallets:', error);
      throw error;
    }
  }
}
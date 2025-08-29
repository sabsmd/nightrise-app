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
  static async getWallet(code: string, selectedElementId?: string): Promise<WalletData | null> {
    try {
      // Verify user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required to access wallet');
      }

      console.log('WalletService.getWallet called with code:', code, 'by user:', user.id);
      
      // First, try to get wallet from new system
      const { data: wallet, error: walletError } = await supabase
        .from('min_spend_wallets')
        .select(`
          *,
          transactions:min_spend_transactions(
            id,
            type,
            amount,
            order_id,
            source,
            notes,
            created_at
          )
        `)
        .eq('code', code)
        .single();

      if (wallet && !walletError) {
        const progress = wallet.initial_credit > 0 
          ? ((wallet.initial_credit - wallet.remaining_credit) / wallet.initial_credit) * 100 
          : 0;

        return {
          id: wallet.id,
          code: wallet.code,
          status: wallet.status as 'active' | 'suspended' | 'closed' | 'expired',
          currency: wallet.currency,
          initialCredit: Number(wallet.initial_credit),
          remainingCredit: Number(wallet.remaining_credit),
          progress,
          expiresAt: wallet.expires_at,
          history: wallet.transactions?.map((t: any) => ({
            id: t.id,
            type: t.type,
            amount: Number(t.amount),
            orderId: t.order_id,
            source: t.source,
            notes: t.notes,
            createdAt: t.created_at
          })) || []
        };
      }

      // If not found in wallets, try to find and migrate from old min_spend_codes
      const { data: minSpendCode, error: codeError } = await supabase
        .from('min_spend_codes')
        .select(`
          *,
          floor_element:floor_elements(id, nom, type)
        `)
        .eq('code', code)
        .single();

      if (minSpendCode && !codeError) {
        console.log('Found old min_spend_code, migrating to wallet...');
        
        // Validate floor_element_id if selectedElementId is provided
        if (selectedElementId && minSpendCode.floor_element_id !== selectedElementId) {
          const elementName = minSpendCode.floor_element?.nom || 'l\'élément associé';
          throw new Error(`❌ Ce code est réservé pour ${elementName}`);
        }
        
        return await this.migrateMinSpendCode(minSpendCode);
      }

      return null;
    } catch (error) {
      console.error('Error fetching wallet:', error);
      return null;
    }
  }

  static async createWallet(walletData: CreateWalletData): Promise<WalletData> {
    try {
      const { data: wallet, error } = await supabase
        .from('min_spend_wallets')
        .insert({
          code: walletData.code,
          initial_credit: walletData.initialCredit,
          remaining_credit: walletData.initialCredit,
          currency: walletData.currency || 'EUR',
          expires_at: walletData.expiresAt,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: wallet.id,
        code: wallet.code,
        status: wallet.status as 'active' | 'suspended' | 'closed' | 'expired',
        currency: wallet.currency,
        initialCredit: Number(wallet.initial_credit),
        remainingCredit: Number(wallet.remaining_credit),
        progress: 0,
        expiresAt: wallet.expires_at,
        history: [],
        clientName: walletData.clientName,
        clientPhone: walletData.clientPhone
      };
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
      const { data, error } = await supabase.rpc('debit_wallet', {
        p_code: code,
        p_amount: amount,
        p_order_id: orderId,
        p_source: source,
        p_idempotency_key: idempotencyKey
      });

      if (error) throw error;

      const result = data as any;
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to debit wallet');
      }

      // Fetch updated wallet data
      return await this.getWallet(code) as WalletData;
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
      const { data, error } = await supabase.rpc('credit_wallet', {
        p_code: code,
        p_amount: amount,
        p_type: type,
        p_order_id: orderId,
        p_source: source,
        p_idempotency_key: idempotencyKey,
        p_notes: notes
      });

      if (error) throw error;

      const result = data as any;
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to credit wallet');
      }

      // Fetch updated wallet data
      return await this.getWallet(code) as WalletData;
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
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString(),
        updated_by: (await supabase.auth.getUser()).data.user?.id
      };
      
      if (expiresAt) {
        updateData.expires_at = expiresAt;
      }

      const { error } = await supabase
        .from('min_spend_wallets')
        .update(updateData)
        .eq('code', code);

      if (error) throw error;

      // Fetch updated wallet data
      return await this.getWallet(code) as WalletData;
    } catch (error) {
      console.error('Error updating wallet:', error);
      throw error;
    }
  }

  // Migration helper: Convert old min_spend_codes to new wallet format
  static async migrateMinSpendCode(minSpendCode: any): Promise<WalletData> {
    try {
      // Check if wallet already exists (direct query to avoid recursion)
      const { data: existingWallet } = await supabase
        .from('min_spend_wallets')
        .select('id')
        .eq('code', minSpendCode.code)
        .single();

      if (existingWallet) {
        // Wallet exists, fetch it with full data using direct query
        const { data: wallet, error } = await supabase
          .from('min_spend_wallets')
          .select(`
            *,
            transactions:min_spend_transactions(
              id,
              type,
              amount,
              order_id,
              source,
              notes,
              created_at
            )
          `)
          .eq('code', minSpendCode.code)
          .single();

        if (wallet && !error) {
          const progress = wallet.initial_credit > 0 
            ? ((wallet.initial_credit - wallet.remaining_credit) / wallet.initial_credit) * 100 
            : 0;

          return {
            id: wallet.id,
            code: wallet.code,
            status: wallet.status as 'active' | 'suspended' | 'closed' | 'expired',
            currency: wallet.currency,
            initialCredit: Number(wallet.initial_credit),
            remainingCredit: Number(wallet.remaining_credit),
            progress,
            expiresAt: wallet.expires_at,
            history: wallet.transactions?.map((t: any) => ({
              id: t.id,
              type: t.type,
              amount: Number(t.amount),
              orderId: t.order_id,
              source: t.source,
              notes: t.notes,
              createdAt: t.created_at
            })) || []
          };
        }
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
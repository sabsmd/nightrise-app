export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      client_reservations: {
        Row: {
          created_at: string
          event_id: string
          floor_element_id: string
          id: string
          min_spend_code_id: string
          statut: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          floor_element_id: string
          id?: string
          min_spend_code_id: string
          statut?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          floor_element_id?: string
          id?: string
          min_spend_code_id?: string
          statut?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_reservations_min_spend_code_id_fkey"
            columns: ["min_spend_code_id"]
            isOneToOne: false
            referencedRelation: "min_spend_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_reservations_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_reservations_event_id"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_reservations_floor_element"
            columns: ["floor_element_id"]
            isOneToOne: false
            referencedRelation: "floor_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_reservations_floor_element_id"
            columns: ["floor_element_id"]
            isOneToOne: false
            referencedRelation: "floor_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_reservations_min_spend_code"
            columns: ["min_spend_code_id"]
            isOneToOne: false
            referencedRelation: "min_spend_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_reservations_min_spend_code_id"
            columns: ["min_spend_code_id"]
            isOneToOne: false
            referencedRelation: "min_spend_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          artiste_dj: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          image: string | null
          image_file: string | null
          lieu: string
          titre: string
          type_evenement: string | null
          updated_at: string
        }
        Insert: {
          artiste_dj?: string | null
          created_at?: string
          date: string
          description?: string | null
          id?: string
          image?: string | null
          image_file?: string | null
          lieu: string
          titre: string
          type_evenement?: string | null
          updated_at?: string
        }
        Update: {
          artiste_dj?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          image?: string | null
          image_file?: string | null
          lieu?: string
          titre?: string
          type_evenement?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      floor_elements: {
        Row: {
          config: Json | null
          couleur: string | null
          created_at: string
          event_id: string
          height: number
          id: string
          nom: string
          position_x: number
          position_y: number
          type: string
          updated_at: string
          width: number
        }
        Insert: {
          config?: Json | null
          couleur?: string | null
          created_at?: string
          event_id: string
          height?: number
          id?: string
          nom: string
          position_x?: number
          position_y?: number
          type: string
          updated_at?: string
          width?: number
        }
        Update: {
          config?: Json | null
          couleur?: string | null
          created_at?: string
          event_id?: string
          height?: number
          id?: string
          nom?: string
          position_x?: number
          position_y?: number
          type?: string
          updated_at?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_floor_elements_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_floor_elements_event_id"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      min_spend_codes: {
        Row: {
          code: string
          created_at: string
          event_id: string
          floor_element_id: string
          id: string
          min_spend: number
          nom_client: string
          prenom_client: string
          reservation_id: string | null
          solde_restant: number
          statut: string
          telephone_client: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          event_id: string
          floor_element_id: string
          id?: string
          min_spend?: number
          nom_client: string
          prenom_client: string
          reservation_id?: string | null
          solde_restant?: number
          statut?: string
          telephone_client: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          event_id?: string
          floor_element_id?: string
          id?: string
          min_spend?: number
          nom_client?: string
          prenom_client?: string
          reservation_id?: string | null
          solde_restant?: number
          statut?: string
          telephone_client?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_min_spend_codes_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_min_spend_codes_event_id"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_min_spend_codes_floor_element"
            columns: ["floor_element_id"]
            isOneToOne: false
            referencedRelation: "floor_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_min_spend_codes_floor_element_id"
            columns: ["floor_element_id"]
            isOneToOne: false
            referencedRelation: "floor_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "min_spend_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "min_spend_codes_floor_element_id_fkey"
            columns: ["floor_element_id"]
            isOneToOne: false
            referencedRelation: "floor_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "min_spend_codes_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      min_spend_transactions: {
        Row: {
          amount: number
          code: string
          created_at: string
          id: string
          idempotency_key: string | null
          notes: string | null
          order_id: string | null
          source: string
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          code: string
          created_at?: string
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_id?: string | null
          source?: string
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_id?: string | null
          source?: string
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "min_spend_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "min_spend_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      min_spend_wallets: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          currency: string
          expires_at: string | null
          id: string
          initial_credit: number
          remaining_credit: number
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          currency?: string
          expires_at?: string | null
          id?: string
          initial_credit: number
          remaining_credit: number
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          expires_at?: string | null
          id?: string
          initial_credit?: number
          remaining_credit?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          prix_unitaire: number
          product_id: string
          quantite: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          prix_unitaire: number
          product_id: string
          quantite: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          prix_unitaire?: number
          product_id?: string
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          event_id: string
          id: string
          montant_total: number
          serveur_id: string | null
          statut: Database["public"]["Enums"]["order_status"]
          table_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          montant_total?: number
          serveur_id?: string | null
          statut?: Database["public"]["Enums"]["order_status"]
          table_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          montant_total?: number
          serveur_id?: string | null
          statut?: Database["public"]["Enums"]["order_status"]
          table_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          actif: boolean
          categorie: Database["public"]["Enums"]["product_category"]
          created_at: string
          id: string
          nom: string
          prix: number
          updated_at: string
        }
        Insert: {
          actif?: boolean
          categorie: Database["public"]["Enums"]["product_category"]
          created_at?: string
          id?: string
          nom: string
          prix: number
          updated_at?: string
        }
        Update: {
          actif?: boolean
          categorie?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          id?: string
          nom?: string
          prix?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          etablissement: string | null
          id: string
          nom: string
          role: Database["public"]["Enums"]["user_role"]
          siret: string | null
          telephone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          etablissement?: string | null
          id?: string
          nom: string
          role?: Database["public"]["Enums"]["user_role"]
          siret?: string | null
          telephone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          etablissement?: string | null
          id?: string
          nom?: string
          role?: Database["public"]["Enums"]["user_role"]
          siret?: string | null
          telephone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reservation_codes: {
        Row: {
          code: string
          created_at: string
          event_id: string
          expiration_date: string | null
          floor_element_id: string | null
          id: string
          nom_client: string
          prenom_client: string
          statut: string
          telephone_client: string
        }
        Insert: {
          code: string
          created_at?: string
          event_id: string
          expiration_date?: string | null
          floor_element_id?: string | null
          id?: string
          nom_client: string
          prenom_client: string
          statut?: string
          telephone_client: string
        }
        Update: {
          code?: string
          created_at?: string
          event_id?: string
          expiration_date?: string | null
          floor_element_id?: string | null
          id?: string
          nom_client?: string
          prenom_client?: string
          statut?: string
          telephone_client?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_codes_floor_element_id_fkey"
            columns: ["floor_element_id"]
            isOneToOne: false
            referencedRelation: "floor_elements"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string
          event_id: string
          floor_element_id: string
          id: string
          min_spend_code_id: string
          statut: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          floor_element_id: string
          id?: string
          min_spend_code_id: string
          statut?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          floor_element_id?: string
          id?: string
          min_spend_code_id?: string
          statut?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      secret_codes: {
        Row: {
          code_unique: string
          created_at: string
          id: string
          serveur_id: string
          validite: boolean
        }
        Insert: {
          code_unique: string
          created_at?: string
          id?: string
          serveur_id: string
          validite?: boolean
        }
        Update: {
          code_unique?: string
          created_at?: string
          id?: string
          serveur_id?: string
          validite?: boolean
        }
        Relationships: []
      }
      tables: {
        Row: {
          capacite: number | null
          created_at: string
          etat: Database["public"]["Enums"]["table_state"]
          event_id: string
          floor_element_id: string | null
          id: string
          min_spend: number
          nom: string
          position_x: number
          position_y: number
          updated_at: string
        }
        Insert: {
          capacite?: number | null
          created_at?: string
          etat?: Database["public"]["Enums"]["table_state"]
          event_id: string
          floor_element_id?: string | null
          id?: string
          min_spend?: number
          nom: string
          position_x?: number
          position_y?: number
          updated_at?: string
        }
        Update: {
          capacite?: number | null
          created_at?: string
          etat?: Database["public"]["Enums"]["table_state"]
          event_id?: string
          floor_element_id?: string | null
          id?: string
          min_spend?: number
          nom?: string
          position_x?: number
          position_y?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      credit_wallet: {
        Args: {
          p_amount: number
          p_code: string
          p_idempotency_key?: string
          p_notes?: string
          p_order_id?: string
          p_source?: string
          p_type?: string
        }
        Returns: Json
      }
      debit_wallet: {
        Args: {
          p_amount: number
          p_code: string
          p_idempotency_key?: string
          p_notes?: string
          p_order_id?: string
          p_source?: string
        }
        Returns: Json
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      order_status: "pending" | "validated" | "served"
      product_category: "boisson" | "bouteille" | "snack" | "shisha"
      table_state: "libre" | "occupée"
      user_role: "client" | "serveur" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      order_status: ["pending", "validated", "served"],
      product_category: ["boisson", "bouteille", "snack", "shisha"],
      table_state: ["libre", "occupée"],
      user_role: ["client", "serveur", "admin"],
    },
  },
} as const

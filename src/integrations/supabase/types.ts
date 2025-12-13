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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          address: string | null
          area: string | null
          city: string | null
          client_id: string
          created_at: string
          estimated_duration_minutes: number | null
          id: string
          mode: Database["public"]["Enums"]["service_mode"]
          notes: string | null
          price_agreed: number | null
          purohit_id: string
          remote_meeting_link: string | null
          scheduled_at: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          city?: string | null
          client_id: string
          created_at?: string
          estimated_duration_minutes?: number | null
          id?: string
          mode?: Database["public"]["Enums"]["service_mode"]
          notes?: string | null
          price_agreed?: number | null
          purohit_id: string
          remote_meeting_link?: string | null
          scheduled_at?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
        }
        Update: {
          address?: string | null
          area?: string | null
          city?: string | null
          client_id?: string
          created_at?: string
          estimated_duration_minutes?: number | null
          id?: string
          mode?: Database["public"]["Enums"]["service_mode"]
          notes?: string | null
          price_agreed?: number | null
          purohit_id?: string
          remote_meeting_link?: string | null
          scheduled_at?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_purohit_id_fkey"
            columns: ["purohit_id"]
            isOneToOne: false
            referencedRelation: "purohits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "pooja_services"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          area: string | null
          city: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          city: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          city?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_messages: {
        Row: {
          consultation_id: string
          created_at: string
          id: string
          message_text: string
          sender_id: string
          sender_role: Database["public"]["Enums"]["sender_role"]
        }
        Insert: {
          consultation_id: string
          created_at?: string
          id?: string
          message_text: string
          sender_id: string
          sender_role: Database["public"]["Enums"]["sender_role"]
        }
        Update: {
          consultation_id?: string
          created_at?: string
          id?: string
          message_text?: string
          sender_id?: string
          sender_role?: Database["public"]["Enums"]["sender_role"]
        }
        Relationships: [
          {
            foreignKeyName: "consultation_messages_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          client_id: string
          created_at: string
          id: string
          mode: Database["public"]["Enums"]["service_mode"] | null
          pooja_request_id: string | null
          purohit_id: string
          service_id: string | null
          status: Database["public"]["Enums"]["consultation_status"] | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["service_mode"] | null
          pooja_request_id?: string | null
          purohit_id: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["consultation_status"] | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["service_mode"] | null
          pooja_request_id?: string | null
          purohit_id?: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["consultation_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_pooja_request_id_fkey"
            columns: ["pooja_request_id"]
            isOneToOne: false
            referencedRelation: "pooja_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_purohit_id_fkey"
            columns: ["purohit_id"]
            isOneToOne: false
            referencedRelation: "purohits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "pooja_services"
            referencedColumns: ["id"]
          },
        ]
      }
      pooja_requests: {
        Row: {
          address: string | null
          area: string | null
          budget_max: number | null
          budget_min: number | null
          city: string
          client_id: string
          created_at: string
          custom_service_text: string | null
          id: string
          mode: Database["public"]["Enums"]["service_mode"]
          notes: string | null
          requested_date: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["pooja_request_status"] | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          budget_max?: number | null
          budget_min?: number | null
          city: string
          client_id: string
          created_at?: string
          custom_service_text?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["service_mode"]
          notes?: string | null
          requested_date?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["pooja_request_status"] | null
        }
        Update: {
          address?: string | null
          area?: string | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string
          client_id?: string
          created_at?: string
          custom_service_text?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["service_mode"]
          notes?: string | null
          requested_date?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["pooja_request_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "pooja_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pooja_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "pooja_services"
            referencedColumns: ["id"]
          },
        ]
      }
      pooja_services: {
        Row: {
          default_mode: Database["public"]["Enums"]["service_mode"] | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          default_mode?: Database["public"]["Enums"]["service_mode"] | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          default_mode?: Database["public"]["Enums"]["service_mode"] | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          phone?: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      purohit_availability_blocks: {
        Row: {
          created_at: string
          end_time: string
          id: string
          purohit_id: string
          reason: string | null
          start_time: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          purohit_id: string
          reason?: string | null
          start_time: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          purohit_id?: string
          reason?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "purohit_availability_blocks_purohit_id_fkey"
            columns: ["purohit_id"]
            isOneToOne: false
            referencedRelation: "purohits"
            referencedColumns: ["id"]
          },
        ]
      }
      purohit_portfolio_items: {
        Row: {
          content_text: string | null
          content_url: string | null
          created_at: string
          id: string
          purohit_id: string
          title: string
          type: Database["public"]["Enums"]["portfolio_item_type"]
        }
        Insert: {
          content_text?: string | null
          content_url?: string | null
          created_at?: string
          id?: string
          purohit_id: string
          title: string
          type: Database["public"]["Enums"]["portfolio_item_type"]
        }
        Update: {
          content_text?: string | null
          content_url?: string | null
          created_at?: string
          id?: string
          purohit_id?: string
          title?: string
          type?: Database["public"]["Enums"]["portfolio_item_type"]
        }
        Relationships: [
          {
            foreignKeyName: "purohit_portfolio_items_purohit_id_fkey"
            columns: ["purohit_id"]
            isOneToOne: false
            referencedRelation: "purohits"
            referencedColumns: ["id"]
          },
        ]
      }
      purohit_services: {
        Row: {
          id: string
          price_max: number | null
          price_min: number | null
          purohit_id: string
          service_id: string
        }
        Insert: {
          id?: string
          price_max?: number | null
          price_min?: number | null
          purohit_id: string
          service_id: string
        }
        Update: {
          id?: string
          price_max?: number | null
          price_min?: number | null
          purohit_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purohit_services_purohit_id_fkey"
            columns: ["purohit_id"]
            isOneToOne: false
            referencedRelation: "purohits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purohit_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "pooja_services"
            referencedColumns: ["id"]
          },
        ]
      }
      purohits: {
        Row: {
          area: string | null
          avatar_url: string | null
          bio: string | null
          city: string
          created_at: string
          email: string | null
          experience_years: number | null
          full_name: string
          id: string
          in_person_available: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          phone: string | null
          remote_pooja_available: boolean | null
          service_radius_km: number | null
          serviceable_cities: string[] | null
          user_id: string | null
        }
        Insert: {
          area?: string | null
          avatar_url?: string | null
          bio?: string | null
          city: string
          created_at?: string
          email?: string | null
          experience_years?: number | null
          full_name: string
          id?: string
          in_person_available?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          phone?: string | null
          remote_pooja_available?: boolean | null
          service_radius_km?: number | null
          serviceable_cities?: string[] | null
          user_id?: string | null
        }
        Update: {
          area?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string
          created_at?: string
          email?: string | null
          experience_years?: number | null
          full_name?: string
          id?: string
          in_person_available?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          phone?: string | null
          remote_pooja_available?: boolean | null
          service_radius_km?: number | null
          serviceable_cities?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purohits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          rating: number
          review_text: string | null
          reviewer_id: string
          reviewer_role: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          reviewer_id: string
          reviewer_role: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          reviewer_id?: string
          reviewer_role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_client_id: { Args: never; Returns: string }
      get_my_purohit_id: { Args: never; Returns: string }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client" | "purohit"
      booking_status: "pending" | "confirmed" | "completed" | "cancelled"
      consultation_status: "requested" | "accepted" | "completed" | "cancelled"
      pooja_request_status: "open" | "matched" | "closed"
      portfolio_item_type: "photo" | "certification" | "testimonial"
      sender_role: "client" | "purohit"
      service_mode: "remote" | "in_person" | "both"
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
      app_role: ["admin", "client", "purohit"],
      booking_status: ["pending", "confirmed", "completed", "cancelled"],
      consultation_status: ["requested", "accepted", "completed", "cancelled"],
      pooja_request_status: ["open", "matched", "closed"],
      portfolio_item_type: ["photo", "certification", "testimonial"],
      sender_role: ["client", "purohit"],
      service_mode: ["remote", "in_person", "both"],
    },
  },
} as const

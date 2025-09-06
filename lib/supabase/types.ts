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
      conversion_outcomes: {
        Row: {
          conversion_value: number | null
          created_at: string | null
          drop_off_stage: string | null
          hypothesis_id: string | null
          id: string
          outcome_type: string
          session_id: string | null
          time_to_conversion: number | null
        }
        Insert: {
          conversion_value?: number | null
          created_at?: string | null
          drop_off_stage?: string | null
          hypothesis_id?: string | null
          id?: string
          outcome_type: string
          session_id?: string | null
          time_to_conversion?: number | null
        }
        Update: {
          conversion_value?: number | null
          created_at?: string | null
          drop_off_stage?: string | null
          hypothesis_id?: string | null
          id?: string
          outcome_type?: string
          session_id?: string | null
          time_to_conversion?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_outcomes_hypothesis_id_fkey"
            columns: ["hypothesis_id"]
            isOneToOne: false
            referencedRelation: "hypotheses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_outcomes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "journey_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      hypotheses: {
        Row: {
          created_at: string | null
          expected_impact: number | null
          hypothesis_text: string
          id: string
          status: string | null
          target_metric: string
          template_id: string
          template_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expected_impact?: number | null
          hypothesis_text: string
          id?: string
          status?: string | null
          target_metric: string
          template_id: string
          template_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expected_impact?: number | null
          hypothesis_text?: string
          id?: string
          status?: string | null
          target_metric?: string
          template_id?: string
          template_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      journey_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_name: string
          event_type: string
          id: string
          session_id: string | null
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_name: string
          event_type: string
          id?: string
          session_id?: string | null
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_name?: string
          event_type?: string
          id?: string
          session_id?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "journey_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_sessions: {
        Row: {
          client_identifier: string | null
          completed_at: string | null
          created_at: string | null
          hypothesis_id: string | null
          id: string
          journey_stage: string
          metadata: Json | null
          session_id: string
          started_at: string | null
          template_id: string
          updated_at: string | null
        }
        Insert: {
          client_identifier?: string | null
          completed_at?: string | null
          created_at?: string | null
          hypothesis_id?: string | null
          id?: string
          journey_stage: string
          metadata?: Json | null
          session_id: string
          started_at?: string | null
          template_id: string
          updated_at?: string | null
        }
        Update: {
          client_identifier?: string | null
          completed_at?: string | null
          created_at?: string | null
          hypothesis_id?: string | null
          id?: string
          journey_stage?: string
          metadata?: Json | null
          session_id?: string
          started_at?: string | null
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_sessions_hypothesis_id_fkey"
            columns: ["hypothesis_id"]
            isOneToOne: false
            referencedRelation: "hypotheses"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_insights: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          identified_at: string | null
          metadata: Json | null
          pattern_description: string
          pattern_type: string
          sample_size: number | null
          template_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          identified_at?: string | null
          metadata?: Json | null
          pattern_description: string
          pattern_type: string
          sample_size?: number | null
          template_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          identified_at?: string | null
          metadata?: Json | null
          pattern_description?: string
          pattern_type?: string
          sample_size?: number | null
          template_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
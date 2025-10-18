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
      admin_audit_log: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          session_end: string | null
          session_start: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          session_end?: string | null
          session_start?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          session_end?: string | null
          session_start?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_generation_requests: {
        Row: {
          cost_cents: number | null
          created_at: string | null
          error_message: string | null
          feature: Database["public"]["Enums"]["ai_feature_type"]
          id: string
          options: Json | null
          processing_time_ms: number | null
          prompt: string | null
          provider: string
          result_url: string | null
          status: Database["public"]["Enums"]["generation_status"] | null
          user_id: string | null
        }
        Insert: {
          cost_cents?: number | null
          created_at?: string | null
          error_message?: string | null
          feature: Database["public"]["Enums"]["ai_feature_type"]
          id?: string
          options?: Json | null
          processing_time_ms?: number | null
          prompt?: string | null
          provider: string
          result_url?: string | null
          status?: Database["public"]["Enums"]["generation_status"] | null
          user_id?: string | null
        }
        Update: {
          cost_cents?: number | null
          created_at?: string | null
          error_message?: string | null
          feature?: Database["public"]["Enums"]["ai_feature_type"]
          id?: string
          options?: Json | null
          processing_time_ms?: number | null
          prompt?: string | null
          provider?: string
          result_url?: string | null
          status?: Database["public"]["Enums"]["generation_status"] | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          html_content: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          placeholders: Json | null
          style_sheet: string | null
          type: Database["public"]["Enums"]["template_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          placeholders?: Json | null
          style_sheet?: string | null
          type: Database["public"]["Enums"]["template_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          placeholders?: Json | null
          style_sheet?: string | null
          type?: Database["public"]["Enums"]["template_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_usage_tracking: {
        Row: {
          created_at: string | null
          feature: Database["public"]["Enums"]["ai_feature_type"]
          id: string
          period_end: string
          period_start: string
          subscription_tier: string | null
          total_cost_cents: number | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          feature: Database["public"]["Enums"]["ai_feature_type"]
          id?: string
          period_end: string
          period_start: string
          subscription_tier?: string | null
          total_cost_cents?: number | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          feature?: Database["public"]["Enums"]["ai_feature_type"]
          id?: string
          period_end?: string
          period_start?: string
          subscription_tier?: string | null
          total_cost_cents?: number | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          avatar_url: string | null
          bio: string | null
          color_palette: Json | null
          created_at: string | null
          examples: Json | null
          fonts: Json | null
          format_preset: string | null
          id: string
          logo_url: string | null
          raw_context: Json | null
          signature_phrases: string[] | null
          strengths: string[] | null
          tagline: string | null
          title: string | null
          tone_notes: string | null
          updated_at: string | null
          user_id: string
          visibility: string | null
          weaknesses: string[] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          color_palette?: Json | null
          created_at?: string | null
          examples?: Json | null
          fonts?: Json | null
          format_preset?: string | null
          id?: string
          logo_url?: string | null
          raw_context?: Json | null
          signature_phrases?: string[] | null
          strengths?: string[] | null
          tagline?: string | null
          title?: string | null
          tone_notes?: string | null
          updated_at?: string | null
          user_id: string
          visibility?: string | null
          weaknesses?: string[] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          color_palette?: Json | null
          created_at?: string | null
          examples?: Json | null
          fonts?: Json | null
          format_preset?: string | null
          id?: string
          logo_url?: string | null
          raw_context?: Json | null
          signature_phrases?: string[] | null
          strengths?: string[] | null
          tagline?: string | null
          title?: string | null
          tone_notes?: string | null
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
          weaknesses?: string[] | null
        }
        Relationships: []
      }
      content_flag_reasons: {
        Row: {
          auto_flag_enabled: boolean | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          reason_code: string
          reason_name: string
          severity: number | null
        }
        Insert: {
          auto_flag_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          reason_code: string
          reason_name: string
          severity?: number | null
        }
        Update: {
          auto_flag_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          reason_code?: string
          reason_name?: string
          severity?: number | null
        }
        Relationships: []
      }
      content_moderation_queue: {
        Row: {
          auto_flagged: boolean | null
          content_id: string
          content_type: string
          created_at: string | null
          flag_reason: string | null
          flagged_by: string | null
          flagging_details: Json | null
          id: string
          moderated_at: string | null
          moderator_id: string | null
          moderator_notes: string | null
          priority: number | null
          risk_score: number | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_flagged?: boolean | null
          content_id: string
          content_type: string
          created_at?: string | null
          flag_reason?: string | null
          flagged_by?: string | null
          flagging_details?: Json | null
          id?: string
          moderated_at?: string | null
          moderator_id?: string | null
          moderator_notes?: string | null
          priority?: number | null
          risk_score?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_flagged?: boolean | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          flag_reason?: string | null
          flagged_by?: string | null
          flagging_details?: Json | null
          id?: string
          moderated_at?: string | null
          moderator_id?: string | null
          moderator_notes?: string | null
          priority?: number | null
          risk_score?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cvs: {
        Row: {
          created_at: string | null
          experience: Json | null
          format_preset: string | null
          id: string
          links: Json | null
          skills: string[] | null
          summary: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          experience?: Json | null
          format_preset?: string | null
          id?: string
          links?: Json | null
          skills?: string[] | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          experience?: Json | null
          format_preset?: string | null
          id?: string
          links?: Json | null
          skills?: string[] | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_flags: Json | null
          admin_notes: string | null
          app_role: Database["public"]["Enums"]["app_role"] | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          full_name: string | null
          generations_used: number | null
          handle: string | null
          id: string
          last_admin_action: string | null
          last_sign_in: string | null
          plan: string | null
          role_tags: string[] | null
          socials: Json | null
          subscription_tier: string | null
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          updated_at: string | null
          visibility: string | null
          website_url: string | null
        }
        Insert: {
          admin_flags?: Json | null
          admin_notes?: string | null
          app_role?: Database["public"]["Enums"]["app_role"] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          generations_used?: number | null
          handle?: string | null
          id: string
          last_admin_action?: string | null
          last_sign_in?: string | null
          plan?: string | null
          role_tags?: string[] | null
          socials?: Json | null
          subscription_tier?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
          visibility?: string | null
          website_url?: string | null
        }
        Update: {
          admin_flags?: Json | null
          admin_notes?: string | null
          app_role?: Database["public"]["Enums"]["app_role"] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          generations_used?: number | null
          handle?: string | null
          id?: string
          last_admin_action?: string | null
          last_sign_in?: string | null
          plan?: string | null
          role_tags?: string[] | null
          socials?: Json | null
          subscription_tier?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
          visibility?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      shares: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          kind: string
          target_id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          kind: string
          target_id: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          kind?: string
          target_id?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          created_at: string | null
          id: string
          kind: string
          label: string | null
          last_fetched_at: string | null
          status: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          kind: string
          label?: string | null
          last_fetched_at?: string | null
          status?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          kind?: string
          label?: string | null
          last_fetched_at?: string | null
          status?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_assets: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          created_at: string | null
          generation_request_id: string | null
          id: string
          is_public: boolean | null
          metadata: Json | null
          moderation_status: Database["public"]["Enums"]["moderation_status"] | null
          storage_path: string
          user_id: string | null
        }
        Insert: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          created_at?: string | null
          generation_request_id?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"] | null
          storage_path: string
          user_id?: string | null
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"]
          created_at?: string | null
          generation_request_id?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"] | null
          storage_path?: string
          user_id?: string | null
        }
        Relationships: []
      }
      placeholder_images: {
        Row: {
          ai_generated: boolean | null
          category: Database["public"]["Enums"]["image_category"]
          created_at: string | null
          filename: string
          generation_prompt: string | null
          id: string
          metadata: Json | null
          storage_path: string
          tags: string[] | null
        }
        Insert: {
          ai_generated?: boolean | null
          category: Database["public"]["Enums"]["image_category"]
          created_at?: string | null
          filename: string
          generation_prompt?: string | null
          id?: string
          metadata?: Json | null
          storage_path: string
          tags?: string[] | null
        }
        Update: {
          ai_generated?: boolean | null
          category?: Database["public"]["Enums"]["image_category"]
          created_at?: string | null
          filename?: string
          generation_prompt?: string | null
          id?: string
          metadata?: Json | null
          storage_path?: string
          tags?: string[] | null
        }
        Relationships: []
      }
      uploads: {
        Row: {
          created_at: string | null
          extracted_text: string | null
          id: string
          mime_type: string | null
          original_name: string
          size_bytes: number | null
          storage_path: string
          user_id: string
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          extracted_text?: string | null
          id?: string
          mime_type?: string | null
          original_name: string
          size_bytes?: number | null
          storage_path: string
          user_id: string
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          extracted_text?: string | null
          id?: string
          mime_type?: string | null
          original_name?: string
          size_bytes?: number | null
          storage_path?: string
          user_id?: string
          visibility?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_user: {
        Args: {
          p_activated_by: string
          p_admin_notes?: string
          p_user_id: string
        }
        Returns: boolean
      }
      add_admin_notes: {
        Args: {
          p_admin_id: string
          p_notes: string
          p_user_id: string
        }
        Returns: boolean
      }
      calculate_content_risk_score: {
        Args: {
          p_content_text: string
          p_content_type: string
        }
        Returns: number
      }
      change_user_role: {
        Args: {
          p_admin_notes?: string
          p_changed_by: string
          p_new_role: string
          p_user_id: string
        }
        Returns: boolean
      }
      end_admin_session: {
        Args: {
          p_session_id?: string
          p_user_id: string
        }
        Returns: boolean
      }
      flag_content_for_moderation: {
        Args: {
          p_auto_flagged?: boolean
          p_content_id: string
          p_content_type: string
          p_flag_reason?: string
          p_flagged_by?: string
          p_flagging_details?: Json
          p_priority?: number
          p_risk_score?: number
          p_user_id: string
        }
        Returns: string
      }
      get_admin_user_list: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_role_filter?: string
          p_search?: string
          p_status_filter?: string
        }
        Returns: {
          admin_notes: string | null
          app_role: string | null
          content_count: number
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_suspended: boolean | null
          last_admin_action: string | null
          last_sign_in: string | null
          subscription_tier: string | null
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          total_generations: number | null
        }[]
      }
      get_moderation_queue: {
        Args: {
          p_content_type?: string
          p_limit?: number
          p_offset?: number
          p_priority_min?: number
          p_status?: string
        }
        Returns: {
          auto_flagged: boolean | null
          content_id: string
          content_type: string
          created_at: string | null
          flag_reason: string | null
          flagged_by: string | null
          flagging_details: Json | null
          id: string
          moderated_at: string | null
          moderator_id: string | null
          moderator_notes: string | null
          priority: number | null
          risk_score: number | null
          status: string | null
          updated_at: string | null
          user_email: string | null
          user_id: string
        }[]
      }
      get_share_by_token: {
        Args: { _token: string }
        Returns: {
          created_at: string
          expires_at: string
          id: string
          kind: string
          target_id: string
          token: string
          user_id: string
        }[]
      }
      get_user_admin_summary: {
        Args: {
          p_user_id: string
        }
        Returns: {
          admin_notes: string | null
          app_role: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_suspended: boolean | null
          last_admin_action: string | null
          last_sign_in: string | null
          recent_activity: Json | null
          subscription_tier: string | null
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          total_brands: number | null
          total_cvs: number | null
          total_generations: number | null
        }[]
      }
      get_user_tier: {
        Args: { user_id_param: string }
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      is_user_suspended: {
        Args: {
          p_user_id: string
        }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_action_type: string
          p_admin_user_id: string
          p_details?: Json
          p_ip_address?: string
          p_target_id?: string
          p_target_type?: string
          p_user_agent?: string
        }
        Returns: string
      }
      moderate_content: {
        Args: {
          p_moderator_id: string
          p_moderator_notes?: string
          p_queue_id: string
          p_status: string
        }
        Returns: boolean
      }
      start_admin_session: {
        Args: {
          p_ip_address?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      suspend_user: {
        Args: {
          p_admin_notes?: string
          p_suspended_by: string
          p_suspension_reason: string
          p_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ai_feature_type: "image_generation" | "voice_synthesis" | "video_generation" | "advanced_editing"
      app_role: "admin" | "moderator" | "super_admin" | "user"
      asset_type: "image" | "audio" | "video" | "document"
      generation_status: "pending" | "processing" | "completed" | "failed" | "cancelled"
      image_category: "avatars" | "backgrounds" | "logos" | "icons"
      moderation_status: "pending" | "approved" | "rejected" | "flagged"
      subscription_tier: "free" | "pro" | "elite"
      template_type: "brand_rider" | "cv" | "presentation"
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
      ai_feature_type: ["image_generation", "voice_synthesis", "video_generation", "advanced_editing"],
      app_role: ["admin", "moderator", "super_admin", "user"],
      asset_type: ["image", "audio", "video", "document"],
      generation_status: ["pending", "processing", "completed", "failed", "cancelled"],
      image_category: ["avatars", "backgrounds", "logos", "icons"],
      moderation_status: ["pending", "approved", "rejected", "flagged"],
      subscription_tier: ["free", "pro", "elite"],
      template_type: ["brand_rider", "cv", "presentation"],
    },
  },
} as const

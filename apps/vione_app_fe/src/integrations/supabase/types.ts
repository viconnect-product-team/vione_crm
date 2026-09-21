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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          association_id: string
          at: string
          category: string
          code: string
          created_at: string
          id: string
          ip: string
          target: string
          updated_at: string
          user: string
        }
        Insert: {
          action: string
          association_id?: string
          at: string
          category: string
          code: string
          created_at?: string
          id?: string
          ip?: string
          target: string
          updated_at?: string
          user: string
        }
        Update: {
          action?: string
          association_id?: string
          at?: string
          category?: string
          code?: string
          created_at?: string
          id?: string
          ip?: string
          target?: string
          updated_at?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_request_audit: {
        Row: {
          association_id: string | null
          capability: string | null
          created_at: string
          fallback_reason: string | null
          id: string
          model: string | null
          permission_level: string | null
          provider: string | null
          provider_latency_ms: number | null
          request_id: string
          source_count: number
          source_types: string[]
          total_latency_ms: number | null
          used_fallback: boolean
          user_id: string | null
        }
        Insert: {
          association_id?: string | null
          capability?: string | null
          created_at?: string
          fallback_reason?: string | null
          id?: string
          model?: string | null
          permission_level?: string | null
          provider?: string | null
          provider_latency_ms?: number | null
          request_id: string
          source_count?: number
          source_types?: string[]
          total_latency_ms?: number | null
          used_fallback?: boolean
          user_id?: string | null
        }
        Update: {
          association_id?: string | null
          capability?: string | null
          created_at?: string
          fallback_reason?: string | null
          id?: string
          model?: string | null
          permission_level?: string | null
          provider?: string | null
          provider_latency_ms?: number | null
          request_id?: string
          source_count?: number
          source_types?: string[]
          total_latency_ms?: number | null
          used_fallback?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      association_benefits: {
        Row: {
          association_id: string
          created_at: string
          desc_en: string
          desc_vi: string
          id: string
          sort_order: number
          title_en: string
          title_vi: string
          updated_at: string
        }
        Insert: {
          association_id: string
          created_at?: string
          desc_en?: string
          desc_vi?: string
          id?: string
          sort_order?: number
          title_en?: string
          title_vi: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          created_at?: string
          desc_en?: string
          desc_vi?: string
          id?: string
          sort_order?: number
          title_en?: string
          title_vi?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "association_benefits_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      association_logo_history: {
        Row: {
          action: string
          association_id: string
          changed_by: string | null
          changed_by_name: string | null
          created_at: string
          id: string
          new_logo_url: string | null
          old_logo_url: string | null
        }
        Insert: {
          action?: string
          association_id: string
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string
          id?: string
          new_logo_url?: string | null
          old_logo_url?: string | null
        }
        Update: {
          action?: string
          association_id?: string
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string
          id?: string
          new_logo_url?: string | null
          old_logo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "association_logo_history_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      associations: {
        Row: {
          about: string | null
          brand_primary: string | null
          contact_email: string | null
          created_at: string
          custom_domain: string | null
          domain_status: string
          domain_verification_token: string | null
          domain_verified_at: string | null
          id: string
          landing_published: boolean
          logo_url: string | null
          name: string
          public_card_enabled: boolean
          public_card_requires_active_member: boolean
          slug: string | null
          ssl_active_at: string | null
          ssl_checked_at: string | null
          ssl_status: string
          subdomain: string | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          about?: string | null
          brand_primary?: string | null
          contact_email?: string | null
          created_at?: string
          custom_domain?: string | null
          domain_status?: string
          domain_verification_token?: string | null
          domain_verified_at?: string | null
          id?: string
          landing_published?: boolean
          logo_url?: string | null
          name: string
          public_card_enabled?: boolean
          public_card_requires_active_member?: boolean
          slug?: string | null
          ssl_active_at?: string | null
          ssl_checked_at?: string | null
          ssl_status?: string
          subdomain?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          about?: string | null
          brand_primary?: string | null
          contact_email?: string | null
          created_at?: string
          custom_domain?: string | null
          domain_status?: string
          domain_verification_token?: string | null
          domain_verified_at?: string | null
          id?: string
          landing_published?: boolean
          logo_url?: string | null
          name?: string
          public_card_enabled?: boolean
          public_card_requires_active_member?: boolean
          slug?: string | null
          ssl_active_at?: string | null
          ssl_checked_at?: string | null
          ssl_status?: string
          subdomain?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      attendees: {
        Row: {
          association_id: string
          badges: string[]
          checked_in: boolean
          company: string
          created_at: string
          id: string
          initials: string
          membership: string
          name: string
          phone: string
          ticket_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          association_id?: string
          badges?: string[]
          checked_in?: boolean
          company?: string
          created_at?: string
          id: string
          initials?: string
          membership?: string
          name: string
          phone?: string
          ticket_type?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          badges?: string[]
          checked_in?: boolean
          company?: string
          created_at?: string
          id?: string
          initials?: string
          membership?: string
          name?: string
          phone?: string
          ticket_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendees_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      bc_admin_grants: {
        Row: {
          created_at: string
          granted_by: string | null
          level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          level: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          level?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bc_customer_logs: {
        Row: {
          body: string | null
          created_at: string
          customer_id: string
          from_stage: Database["public"]["Enums"]["bc_customer_stage"] | null
          id: string
          kind: Database["public"]["Enums"]["bc_customer_log_kind"]
          occurred_at: string
          owner_user_id: string
          to_stage: Database["public"]["Enums"]["bc_customer_stage"] | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          customer_id: string
          from_stage?: Database["public"]["Enums"]["bc_customer_stage"] | null
          id?: string
          kind?: Database["public"]["Enums"]["bc_customer_log_kind"]
          occurred_at?: string
          owner_user_id: string
          to_stage?: Database["public"]["Enums"]["bc_customer_stage"] | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          customer_id?: string
          from_stage?: Database["public"]["Enums"]["bc_customer_stage"] | null
          id?: string
          kind?: Database["public"]["Enums"]["bc_customer_log_kind"]
          occurred_at?: string
          owner_user_id?: string
          to_stage?: Database["public"]["Enums"]["bc_customer_stage"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bc_customer_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "bc_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      bc_customer_needs: {
        Row: {
          body: string
          created_at: string
          customer_id: string
          id: string
          kind: string
          owner_user_id: string
          priority: string
          resolved_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          customer_id: string
          id?: string
          kind: string
          owner_user_id: string
          priority?: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          customer_id?: string
          id?: string
          kind?: string
          owner_user_id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bc_customer_needs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "bc_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      bc_customer_tag_links: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          owner_user_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          owner_user_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          owner_user_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bc_customer_tag_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "bc_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bc_customer_tag_links_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "bc_customer_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      bc_customer_tag_suggestion_feedback: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          owner_user_id: string
          run_id: string | null
          tag_name: string
          updated_at: string
          verdict: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          owner_user_id: string
          run_id?: string | null
          tag_name: string
          updated_at?: string
          verdict: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          owner_user_id?: string
          run_id?: string | null
          tag_name?: string
          updated_at?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "bc_customer_tag_suggestion_feedback_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "bc_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bc_customer_tag_suggestion_feedback_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "bc_customer_tag_suggestion_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      bc_customer_tag_suggestion_runs: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          owner_user_id: string
          suggestions: Json
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          owner_user_id: string
          suggestions?: Json
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          owner_user_id?: string
          suggestions?: Json
        }
        Relationships: [
          {
            foreignKeyName: "bc_customer_tag_suggestion_runs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "bc_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      bc_customer_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          normalized_name: string
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          normalized_name: string
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          normalized_name?: string
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      bc_customers: {
        Row: {
          company_name: string | null
          created_at: string
          currency: string
          display_name: string | null
          expected_value: number | null
          id: string
          last_contact_at: string | null
          next_action_at: string | null
          note: string | null
          owner_user_id: string
          source_label: string | null
          stage: Database["public"]["Enums"]["bc_customer_stage"]
          target_card_id: string | null
          target_guest_id: string | null
          target_kind: Database["public"]["Enums"]["bc_customer_target_kind"]
          target_user_id: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          currency?: string
          display_name?: string | null
          expected_value?: number | null
          id?: string
          last_contact_at?: string | null
          next_action_at?: string | null
          note?: string | null
          owner_user_id: string
          source_label?: string | null
          stage?: Database["public"]["Enums"]["bc_customer_stage"]
          target_card_id?: string | null
          target_guest_id?: string | null
          target_kind: Database["public"]["Enums"]["bc_customer_target_kind"]
          target_user_id?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          currency?: string
          display_name?: string | null
          expected_value?: number | null
          id?: string
          last_contact_at?: string | null
          next_action_at?: string | null
          note?: string | null
          owner_user_id?: string
          source_label?: string | null
          stage?: Database["public"]["Enums"]["bc_customer_stage"]
          target_card_id?: string | null
          target_guest_id?: string | null
          target_kind?: Database["public"]["Enums"]["bc_customer_target_kind"]
          target_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bc_dm_messages: {
        Row: {
          body: string
          client_token: string
          created_at: string
          id: string
          read_at: string | null
          retracted_at: string | null
          sender_user_id: string
          thread_id: string
        }
        Insert: {
          body: string
          client_token: string
          created_at?: string
          id?: string
          read_at?: string | null
          retracted_at?: string | null
          sender_user_id: string
          thread_id: string
        }
        Update: {
          body?: string
          client_token?: string
          created_at?: string
          id?: string
          read_at?: string | null
          retracted_at?: string | null
          sender_user_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bc_dm_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "bc_dm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      bc_dm_threads: {
        Row: {
          created_at: string
          created_by: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          last_message_sender_id: string | null
          pair_user_high: string
          pair_user_low: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          last_message_sender_id?: string | null
          pair_user_high: string
          pair_user_low: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          last_message_sender_id?: string | null
          pair_user_high?: string
          pair_user_low?: string
          updated_at?: string
        }
        Relationships: []
      }
      broadcast_notification_dismissals: {
        Row: {
          created_at: string
          id: string
          notification_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_notification_dismissals_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      business_availability_preferences: {
        Row: {
          buffer_after_minutes: number
          buffer_before_minutes: number
          created_at: string
          default_meeting_duration_minutes: number
          id: string
          minimum_notice_minutes: number
          timezone: string
          updated_at: string
          user_id: string
          version: number
          working_days: number[]
          working_hours: Json
        }
        Insert: {
          buffer_after_minutes?: number
          buffer_before_minutes?: number
          created_at?: string
          default_meeting_duration_minutes?: number
          id?: string
          minimum_notice_minutes?: number
          timezone?: string
          updated_at?: string
          user_id: string
          version?: number
          working_days?: number[]
          working_hours?: Json
        }
        Update: {
          buffer_after_minutes?: number
          buffer_before_minutes?: number
          created_at?: string
          default_meeting_duration_minutes?: number
          id?: string
          minimum_notice_minutes?: number
          timezone?: string
          updated_at?: string
          user_id?: string
          version?: number
          working_days?: number[]
          working_hours?: Json
        }
        Relationships: []
      }
      business_calendar_accounts: {
        Row: {
          connected_at: string
          created_at: string
          expires_at: string | null
          id: string
          last_error_code: string | null
          last_sync_at: string | null
          provider: string
          provider_account_ref: string | null
          refreshed_at: string | null
          scopes: string[]
          status: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          connected_at?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_error_code?: string | null
          last_sync_at?: string | null
          provider: string
          provider_account_ref?: string | null
          refreshed_at?: string | null
          scopes?: string[]
          status?: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          connected_at?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_error_code?: string | null
          last_sync_at?: string | null
          provider?: string
          provider_account_ref?: string | null
          refreshed_at?: string | null
          scopes?: string[]
          status?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      business_card_audit: {
        Row: {
          actor_user_id: string | null
          association_id: string
          card_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
          reason: string | null
        }
        Insert: {
          actor_user_id?: string | null
          association_id: string
          card_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          reason?: string | null
        }
        Update: {
          actor_user_id?: string | null
          association_id?: string
          card_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_card_audit_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_card_audit_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "member_business_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      business_card_interactions: {
        Row: {
          association_id: string
          card_id: string
          created_at: string
          id: string
          interaction_type: string
          metadata: Json
          session_hash: string | null
          source: string | null
          viewer_member_id: string | null
          viewer_user_id: string | null
        }
        Insert: {
          association_id: string
          card_id: string
          created_at?: string
          id?: string
          interaction_type: string
          metadata?: Json
          session_hash?: string | null
          source?: string | null
          viewer_member_id?: string | null
          viewer_user_id?: string | null
        }
        Update: {
          association_id?: string
          card_id?: string
          created_at?: string
          id?: string
          interaction_type?: string
          metadata?: Json
          session_hash?: string | null
          source?: string | null
          viewer_member_id?: string | null
          viewer_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_card_interactions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_card_interactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "member_business_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      business_card_leads: {
        Row: {
          association_id: string
          card_id: string
          created_at: string
          id: string
          lead_type: string
          message: string | null
          metadata: Json
          owner_member_id: string
          preferred_time: string | null
          requester_email: string | null
          requester_member_id: string | null
          requester_name: string
          requester_phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          association_id: string
          card_id: string
          created_at?: string
          id?: string
          lead_type?: string
          message?: string | null
          metadata?: Json
          owner_member_id: string
          preferred_time?: string | null
          requester_email?: string | null
          requester_member_id?: string | null
          requester_name: string
          requester_phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          card_id?: string
          created_at?: string
          id?: string
          lead_type?: string
          message?: string | null
          metadata?: Json
          owner_member_id?: string
          preferred_time?: string | null
          requester_email?: string | null
          requester_member_id?: string | null
          requester_name?: string
          requester_phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_card_leads_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_card_leads_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "member_business_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      business_card_needs: {
        Row: {
          association_id: string | null
          card_id: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          association_id?: string | null
          card_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          association_id?: string | null
          card_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_card_needs_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_card_needs_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "member_business_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      business_card_ownership_backfill_items: {
        Row: {
          action: string
          assigned_owner_user_id: string | null
          card_id: string
          classification: string
          created_at: string
          id: string
          prior_owner_user_id: string | null
          run_id: string
        }
        Insert: {
          action: string
          assigned_owner_user_id?: string | null
          card_id: string
          classification: string
          created_at?: string
          id?: string
          prior_owner_user_id?: string | null
          run_id: string
        }
        Update: {
          action?: string
          assigned_owner_user_id?: string | null
          card_id?: string
          classification?: string
          created_at?: string
          id?: string
          prior_owner_user_id?: string | null
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_card_ownership_backfill_items_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "member_business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_card_ownership_backfill_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "business_card_ownership_backfill_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      business_card_ownership_backfill_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          eligible_count: number
          exception_count: number
          id: string
          migration_version: string
          preflight_summary: Json
          skipped_count: number
          started_at: string
          status: string
          updated_count: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          eligible_count?: number
          exception_count?: number
          id?: string
          migration_version: string
          preflight_summary?: Json
          skipped_count?: number
          started_at?: string
          status?: string
          updated_count?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          eligible_count?: number
          exception_count?: number
          id?: string
          migration_version?: string
          preflight_summary?: Json
          skipped_count?: number
          started_at?: string
          status?: string
          updated_count?: number
        }
        Relationships: []
      }
      business_card_services: {
        Row: {
          association_id: string | null
          card_id: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          link_url: string | null
          product_id: string | null
          sort_order: number
          title: string
        }
        Insert: {
          association_id?: string | null
          card_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          link_url?: string | null
          product_id?: string | null
          sort_order?: number
          title: string
        }
        Update: {
          association_id?: string | null
          card_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          link_url?: string | null
          product_id?: string | null
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_card_services_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_card_services_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "member_business_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      business_card_skills: {
        Row: {
          association_id: string | null
          card_id: string
          created_at: string
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          association_id?: string | null
          card_id: string
          created_at?: string
          id?: string
          label: string
          sort_order?: number
        }
        Update: {
          association_id?: string | null
          card_id?: string
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_card_skills_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_card_skills_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "member_business_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      business_connect_ai_rate_counters: {
        Row: {
          capability: string
          count: number
          requester_id: string
          updated_at: string
          window_start_utc: string
        }
        Insert: {
          capability: string
          count?: number
          requester_id: string
          updated_at?: string
          window_start_utc: string
        }
        Update: {
          capability?: string
          count?: number
          requester_id?: string
          updated_at?: string
          window_start_utc?: string
        }
        Relationships: []
      }
      business_connect_ai_requests: {
        Row: {
          actual_cost_millicents: number | null
          cache_hit: boolean
          canonical_result_id: string | null
          capability: string
          context_hash: string
          created_at: string
          error_code: string | null
          estimated_cost_millicents: number | null
          expires_at: string
          finished_at: string | null
          id: string
          idempotency_signature: string
          latency_ms: number | null
          model_id: string | null
          model_policy_class: string
          policy_version: string
          prompt_version: string
          provider_id: string | null
          requester_id: string
          scope_ref: string | null
          scope_type: string
          source_versions: Json
          started_at: string | null
          status: string
          status_reason: string | null
          tenant_scope_opaque: string
          timeout_ms: number
          token_budget: number
          updated_at: string
          user_idempotency_key: string | null
        }
        Insert: {
          actual_cost_millicents?: number | null
          cache_hit?: boolean
          canonical_result_id?: string | null
          capability: string
          context_hash: string
          created_at?: string
          error_code?: string | null
          estimated_cost_millicents?: number | null
          expires_at: string
          finished_at?: string | null
          id?: string
          idempotency_signature: string
          latency_ms?: number | null
          model_id?: string | null
          model_policy_class: string
          policy_version: string
          prompt_version: string
          provider_id?: string | null
          requester_id: string
          scope_ref?: string | null
          scope_type: string
          source_versions?: Json
          started_at?: string | null
          status?: string
          status_reason?: string | null
          tenant_scope_opaque: string
          timeout_ms: number
          token_budget: number
          updated_at?: string
          user_idempotency_key?: string | null
        }
        Update: {
          actual_cost_millicents?: number | null
          cache_hit?: boolean
          canonical_result_id?: string | null
          capability?: string
          context_hash?: string
          created_at?: string
          error_code?: string | null
          estimated_cost_millicents?: number | null
          expires_at?: string
          finished_at?: string | null
          id?: string
          idempotency_signature?: string
          latency_ms?: number | null
          model_id?: string | null
          model_policy_class?: string
          policy_version?: string
          prompt_version?: string
          provider_id?: string | null
          requester_id?: string
          scope_ref?: string | null
          scope_type?: string
          source_versions?: Json
          started_at?: string | null
          status?: string
          status_reason?: string | null
          tenant_scope_opaque?: string
          timeout_ms?: number
          token_budget?: number
          updated_at?: string
          user_idempotency_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bcai_req_canonical_fk"
            columns: ["canonical_result_id"]
            isOneToOne: false
            referencedRelation: "business_connect_ai_results"
            referencedColumns: ["id"]
          },
        ]
      }
      business_connect_ai_result_feedback: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json
          owner_id: string
          reason: string | null
          result_id: string
          tenant_scope_opaque: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json
          owner_id: string
          reason?: string | null
          result_id: string
          tenant_scope_opaque: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json
          owner_id?: string
          reason?: string | null
          result_id?: string
          tenant_scope_opaque?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_connect_ai_result_feedback_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "business_connect_ai_results"
            referencedColumns: ["id"]
          },
        ]
      }
      business_connect_ai_results: {
        Row: {
          accepted_at: string | null
          capability: string
          context_hash: string
          created_at: string
          expires_at: string
          id: string
          is_canonical: boolean
          meta: Json
          model_id: string | null
          model_policy_class: string
          owner_id: string
          payload: Json | null
          policy_version: string
          prompt_version: string
          provider_id: string | null
          rejected_at: string | null
          rejected_reason: string | null
          request_id: string
          reviewed_at: string | null
          source_versions: Json
          status: string
          tenant_scope_opaque: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          capability: string
          context_hash: string
          created_at?: string
          expires_at: string
          id?: string
          is_canonical?: boolean
          meta?: Json
          model_id?: string | null
          model_policy_class: string
          owner_id: string
          payload?: Json | null
          policy_version: string
          prompt_version: string
          provider_id?: string | null
          rejected_at?: string | null
          rejected_reason?: string | null
          request_id: string
          reviewed_at?: string | null
          source_versions?: Json
          status?: string
          tenant_scope_opaque: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          capability?: string
          context_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_canonical?: boolean
          meta?: Json
          model_id?: string | null
          model_policy_class?: string
          owner_id?: string
          payload?: Json | null
          policy_version?: string
          prompt_version?: string
          provider_id?: string | null
          rejected_at?: string | null
          rejected_reason?: string | null
          request_id?: string
          reviewed_at?: string | null
          source_versions?: Json
          status?: string
          tenant_scope_opaque?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_connect_ai_results_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "business_connect_ai_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      business_connect_ai_tool_invocations: {
        Row: {
          created_at: string
          error_code: string | null
          id: string
          input_summary: Json
          iteration: number
          latency_ms: number | null
          output_summary: Json
          owner_id: string
          request_id: string
          status: string
          tenant_scope_opaque: string
          tool_name: string
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          id?: string
          input_summary?: Json
          iteration: number
          latency_ms?: number | null
          output_summary?: Json
          owner_id: string
          request_id: string
          status: string
          tenant_scope_opaque: string
          tool_name: string
        }
        Update: {
          created_at?: string
          error_code?: string | null
          id?: string
          input_summary?: Json
          iteration?: number
          latency_ms?: number | null
          output_summary?: Json
          owner_id?: string
          request_id?: string
          status?: string
          tenant_scope_opaque?: string
          tool_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_connect_ai_tool_invocations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "business_connect_ai_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      business_identities: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          company_name: string | null
          country_code: string | null
          created_at: string
          display_name: string | null
          headline: string | null
          id: string
          job_title: string | null
          linkedin_url: string | null
          owner_user_id: string
          preferred_locale: string | null
          primary_email: string | null
          primary_phone: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          headline?: string | null
          id?: string
          job_title?: string | null
          linkedin_url?: string | null
          owner_user_id: string
          preferred_locale?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          headline?: string | null
          id?: string
          job_title?: string | null
          linkedin_url?: string | null
          owner_user_id?: string
          preferred_locale?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      business_identity_showcase_items: {
        Row: {
          created_at: string
          id: string
          kind: string
          logo_url: string | null
          owner_user_id: string
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          logo_url?: string | null
          owner_user_id: string
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          logo_url?: string | null
          owner_user_id?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_interactions: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          interaction_type: string
          location: string | null
          metadata: Json
          note: string | null
          occurred_at: string
          owner_user_id: string
          relationship_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          interaction_type: string
          location?: string | null
          metadata?: Json
          note?: string | null
          occurred_at?: string
          owner_user_id: string
          relationship_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          interaction_type?: string
          location?: string | null
          metadata?: Json
          note?: string | null
          occurred_at?: string
          owner_user_id?: string
          relationship_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_interactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_interactions_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "saved_business_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      business_meeting_agenda_items: {
        Row: {
          created_at: string
          created_by_user_id: string
          description: string | null
          estimated_minutes: number | null
          id: string
          linked_follow_up_id: string | null
          meeting_id: string
          owner_user_id: string | null
          parent_id: string | null
          position: number
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          linked_follow_up_id?: string | null
          meeting_id: string
          owner_user_id?: string | null
          parent_id?: string | null
          position: number
          status?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          linked_follow_up_id?: string | null
          meeting_id?: string
          owner_user_id?: string | null
          parent_id?: string | null
          position?: number
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_meeting_agenda_items_linked_follow_up_id_fkey"
            columns: ["linked_follow_up_id"]
            isOneToOne: false
            referencedRelation: "business_meeting_follow_ups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_meeting_agenda_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "business_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_meeting_agenda_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "business_meeting_agenda_items"
            referencedColumns: ["id"]
          },
        ]
      }
      business_meeting_calendar_projections: {
        Row: {
          calendar_account_id: string | null
          created_at: string
          external_event_ref: string | null
          id: string
          last_error_code: string | null
          last_synced_at: string | null
          meeting_id: string
          participant_user_id: string
          permanent_failure: boolean
          provider: string
          retry_after_at: string | null
          retry_count: number
          sync_status: string
          updated_at: string
        }
        Insert: {
          calendar_account_id?: string | null
          created_at?: string
          external_event_ref?: string | null
          id?: string
          last_error_code?: string | null
          last_synced_at?: string | null
          meeting_id: string
          participant_user_id: string
          permanent_failure?: boolean
          provider: string
          retry_after_at?: string | null
          retry_count?: number
          sync_status?: string
          updated_at?: string
        }
        Update: {
          calendar_account_id?: string | null
          created_at?: string
          external_event_ref?: string | null
          id?: string
          last_error_code?: string | null
          last_synced_at?: string | null
          meeting_id?: string
          participant_user_id?: string
          permanent_failure?: boolean
          provider?: string
          retry_after_at?: string | null
          retry_count?: number
          sync_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_meeting_calendar_projections_calendar_account_id_fkey"
            columns: ["calendar_account_id"]
            isOneToOne: false
            referencedRelation: "business_calendar_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_meeting_calendar_projections_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "business_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      business_meeting_events: {
        Row: {
          actor_user_id: string | null
          event_type: string
          id: string
          meeting_id: string
          metadata: Json
          mutation_key: string | null
          occurred_at: string
          proposal_version: number | null
          source_type:
            | Database["public"]["Enums"]["business_meeting_source_type"]
            | null
        }
        Insert: {
          actor_user_id?: string | null
          event_type: string
          id?: string
          meeting_id: string
          metadata?: Json
          mutation_key?: string | null
          occurred_at?: string
          proposal_version?: number | null
          source_type?:
            | Database["public"]["Enums"]["business_meeting_source_type"]
            | null
        }
        Update: {
          actor_user_id?: string | null
          event_type?: string
          id?: string
          meeting_id?: string
          metadata?: Json
          mutation_key?: string | null
          occurred_at?: string
          proposal_version?: number | null
          source_type?:
            | Database["public"]["Enums"]["business_meeting_source_type"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "business_meeting_events_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "business_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      business_meeting_follow_ups: {
        Row: {
          cancelled_at: string | null
          client_request_id: string | null
          completed_at: string | null
          created_at: string
          created_by_user_id: string
          description: string | null
          due_at: string | null
          id: string
          meeting_id: string
          outcome_id: string | null
          owner_user_id: string
          priority: string
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          cancelled_at?: string | null
          client_request_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id: string
          description?: string | null
          due_at?: string | null
          id?: string
          meeting_id: string
          outcome_id?: string | null
          owner_user_id: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          cancelled_at?: string | null
          client_request_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          due_at?: string | null
          id?: string
          meeting_id?: string
          outcome_id?: string | null
          owner_user_id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_meeting_follow_ups_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "business_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_meeting_follow_ups_outcome_id_fkey"
            columns: ["outcome_id"]
            isOneToOne: false
            referencedRelation: "business_meeting_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      business_meeting_mutations: {
        Row: {
          actor_user_id: string
          created_at: string
          meeting_id: string | null
          mutation_key: string
          operation: string
          result: Json
        }
        Insert: {
          actor_user_id: string
          created_at?: string
          meeting_id?: string | null
          mutation_key: string
          operation: string
          result: Json
        }
        Update: {
          actor_user_id?: string
          created_at?: string
          meeting_id?: string | null
          mutation_key?: string
          operation?: string
          result?: Json
        }
        Relationships: []
      }
      business_meeting_outcomes: {
        Row: {
          client_request_id: string | null
          created_at: string
          finalized_at: string | null
          id: string
          meeting_id: string
          outcome_status: string
          outcome_type: string
          recorded_by_user_id: string
          summary: string | null
          updated_at: string
          version: number
        }
        Insert: {
          client_request_id?: string | null
          created_at?: string
          finalized_at?: string | null
          id?: string
          meeting_id: string
          outcome_status?: string
          outcome_type: string
          recorded_by_user_id: string
          summary?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          client_request_id?: string | null
          created_at?: string
          finalized_at?: string | null
          id?: string
          meeting_id?: string
          outcome_status?: string
          outcome_type?: string
          recorded_by_user_id?: string
          summary?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_meeting_outcomes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: true
            referencedRelation: "business_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      business_meeting_participants: {
        Row: {
          created_at: string
          id: string
          joined_at: string
          left_at: string | null
          meeting_id: string
          responded_at: string | null
          response_message: string | null
          response_status: Database["public"]["Enums"]["business_meeting_response_status"]
          role: Database["public"]["Enums"]["business_meeting_participant_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          meeting_id: string
          responded_at?: string | null
          response_message?: string | null
          response_status?: Database["public"]["Enums"]["business_meeting_response_status"]
          role: Database["public"]["Enums"]["business_meeting_participant_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          meeting_id?: string
          responded_at?: string | null
          response_message?: string | null
          response_status?: Database["public"]["Enums"]["business_meeting_response_status"]
          role?: Database["public"]["Enums"]["business_meeting_participant_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "business_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      business_meeting_private_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          meeting_id: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          meeting_id: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          meeting_id?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_meeting_private_notes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "business_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      business_meeting_proposals: {
        Row: {
          accepted_at: string | null
          created_at: string
          end_at: string
          id: string
          location_text: string | null
          location_type: Database["public"]["Enums"]["business_meeting_location_type"]
          meeting_id: string
          meeting_url: string | null
          proposal_message: string | null
          proposed_by_user_id: string
          start_at: string
          superseded_at: string | null
          timezone: string
          version: number
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          end_at: string
          id?: string
          location_text?: string | null
          location_type?: Database["public"]["Enums"]["business_meeting_location_type"]
          meeting_id: string
          meeting_url?: string | null
          proposal_message?: string | null
          proposed_by_user_id: string
          start_at: string
          superseded_at?: string | null
          timezone: string
          version: number
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          end_at?: string
          id?: string
          location_text?: string | null
          location_type?: Database["public"]["Enums"]["business_meeting_location_type"]
          meeting_id?: string
          meeting_url?: string | null
          proposal_message?: string | null
          proposed_by_user_id?: string
          start_at?: string
          superseded_at?: string | null
          timezone?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_meeting_proposals_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "business_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      business_meeting_shared_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          meeting_id: string
          note_status: string
          published_at: string | null
          updated_at: string
          updated_by_user_id: string
          version: number
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          meeting_id: string
          note_status?: string
          published_at?: string | null
          updated_at?: string
          updated_by_user_id: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          meeting_id?: string
          note_status?: string
          published_at?: string | null
          updated_at?: string
          updated_by_user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_meeting_shared_notes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: true
            referencedRelation: "business_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      business_meeting_time_proposal_responses: {
        Row: {
          created_at: string
          id: string
          participant_id: string
          proposal_id: string
          responded_at: string
          response: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_id: string
          proposal_id: string
          responded_at?: string
          response: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_id?: string
          proposal_id?: string
          responded_at?: string
          response?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_meeting_time_proposal_responses_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "business_meeting_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_meeting_time_proposal_responses_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "business_meeting_time_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      business_meeting_time_proposals: {
        Row: {
          client_request_id: string | null
          created_at: string
          end_at: string
          id: string
          meeting_id: string
          proposed_by_user_id: string
          start_at: string
          status: string
          timezone: string
          updated_at: string
          version: number
        }
        Insert: {
          client_request_id?: string | null
          created_at?: string
          end_at: string
          id?: string
          meeting_id: string
          proposed_by_user_id: string
          start_at: string
          status?: string
          timezone: string
          updated_at?: string
          version?: number
        }
        Update: {
          client_request_id?: string | null
          created_at?: string
          end_at?: string
          id?: string
          meeting_id?: string
          proposed_by_user_id?: string
          start_at?: string
          status?: string
          timezone?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_meeting_time_proposals_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "business_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      business_meetings: {
        Row: {
          active_proposal_version: number | null
          association_id: string | null
          cancelled_at: string | null
          company_id: string | null
          completed_at: string | null
          confirmed_proposal_id: string | null
          created_at: string
          created_by_user_id: string
          description: string | null
          id: string
          meeting_type: Database["public"]["Enums"]["business_meeting_type"]
          organizer_user_id: string
          scheduled_end_at: string | null
          scheduled_start_at: string | null
          scheduled_timezone: string | null
          scheduling_mode: string
          selected_time_proposal_id: string | null
          source_id: string | null
          source_type: Database["public"]["Enums"]["business_meeting_source_type"]
          status: Database["public"]["Enums"]["business_meeting_status"]
          timezone: string
          title: string
          updated_at: string
        }
        Insert: {
          active_proposal_version?: number | null
          association_id?: string | null
          cancelled_at?: string | null
          company_id?: string | null
          completed_at?: string | null
          confirmed_proposal_id?: string | null
          created_at?: string
          created_by_user_id: string
          description?: string | null
          id?: string
          meeting_type: Database["public"]["Enums"]["business_meeting_type"]
          organizer_user_id: string
          scheduled_end_at?: string | null
          scheduled_start_at?: string | null
          scheduled_timezone?: string | null
          scheduling_mode?: string
          selected_time_proposal_id?: string | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["business_meeting_source_type"]
          status?: Database["public"]["Enums"]["business_meeting_status"]
          timezone: string
          title: string
          updated_at?: string
        }
        Update: {
          active_proposal_version?: number | null
          association_id?: string | null
          cancelled_at?: string | null
          company_id?: string | null
          completed_at?: string | null
          confirmed_proposal_id?: string | null
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          id?: string
          meeting_type?: Database["public"]["Enums"]["business_meeting_type"]
          organizer_user_id?: string
          scheduled_end_at?: string | null
          scheduled_start_at?: string | null
          scheduled_timezone?: string | null
          scheduling_mode?: string
          selected_time_proposal_id?: string | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["business_meeting_source_type"]
          status?: Database["public"]["Enums"]["business_meeting_status"]
          timezone?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_meetings_selected_time_proposal_fkey"
            columns: ["selected_time_proposal_id"]
            isOneToOne: false
            referencedRelation: "business_meeting_time_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      business_notification_dispatches: {
        Row: {
          attempt_count: number
          channel: string
          claimed_at: string | null
          created_at: string
          delivered_at: string | null
          external_reference: string | null
          id: string
          last_error_code: string | null
          next_retry_at: string | null
          notification_id: string
          payload_hash: string | null
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          channel: string
          claimed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          external_reference?: string | null
          id?: string
          last_error_code?: string | null
          next_retry_at?: string | null
          notification_id: string
          payload_hash?: string | null
          provider?: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          channel?: string
          claimed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          external_reference?: string | null
          id?: string
          last_error_code?: string | null
          next_retry_at?: string | null
          notification_id?: string
          payload_hash?: string | null
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_notification_dispatches_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "business_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      business_notification_escalations: {
        Row: {
          claim_token: string | null
          claimed_at: string | null
          created_at: string
          dedupe_key: string
          escalation_level: number
          id: string
          next_run_at: string
          policy_key: string
          recipient_user_id: string
          source_domain: string
          source_record_id: string
          status: string
          updated_at: string
        }
        Insert: {
          claim_token?: string | null
          claimed_at?: string | null
          created_at?: string
          dedupe_key: string
          escalation_level: number
          id?: string
          next_run_at: string
          policy_key: string
          recipient_user_id: string
          source_domain: string
          source_record_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          claim_token?: string | null
          claimed_at?: string | null
          created_at?: string
          dedupe_key?: string
          escalation_level?: number
          id?: string
          next_run_at?: string
          policy_key?: string
          recipient_user_id?: string
          source_domain?: string
          source_record_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_notification_event_receipts: {
        Row: {
          created_at: string
          id: string
          notification_count: number
          policy_version: string
          processed_at: string
          result: string
          source_event_id: string
          suppression_reason: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notification_count?: number
          policy_version?: string
          processed_at?: string
          result: string
          source_event_id: string
          suppression_reason?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notification_count?: number
          policy_version?: string
          processed_at?: string
          result?: string
          source_event_id?: string
          suppression_reason?: string | null
        }
        Relationships: []
      }
      business_notification_preference_overrides: {
        Row: {
          created_at: string
          email_enabled: boolean | null
          id: string
          in_app_enabled: boolean | null
          notification_kind: string
          push_enabled: boolean | null
          reminder_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          notification_kind: string
          push_enabled?: boolean | null
          reminder_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          notification_kind?: string
          push_enabled?: boolean | null
          reminder_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_notification_preferences: {
        Row: {
          created_at: string
          critical_bypass_quiet_hours: boolean
          digest_mode: string
          digest_time: string
          email_enabled: boolean
          global_enabled: boolean
          id: string
          in_app_enabled: boolean
          push_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          timezone: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          critical_bypass_quiet_hours?: boolean
          digest_mode?: string
          digest_time?: string
          email_enabled?: boolean
          global_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          critical_bypass_quiet_hours?: boolean
          digest_mode?: string
          digest_time?: string
          email_enabled?: boolean
          global_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      business_notification_schedules: {
        Row: {
          attempt_count: number
          claim_token: string | null
          claimed_at: string | null
          created_at: string
          dedupe_key: string
          id: string
          last_error_code: string | null
          next_retry_at: string | null
          notification_kind: string
          policy_version: string
          recipient_user_id: string
          scheduled_for: string
          source_domain: string
          source_record_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          claim_token?: string | null
          claimed_at?: string | null
          created_at?: string
          dedupe_key: string
          id?: string
          last_error_code?: string | null
          next_retry_at?: string | null
          notification_kind: string
          policy_version?: string
          recipient_user_id: string
          scheduled_for: string
          source_domain: string
          source_record_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          claim_token?: string | null
          claimed_at?: string | null
          created_at?: string
          dedupe_key?: string
          id?: string
          last_error_code?: string | null
          next_retry_at?: string | null
          notification_kind?: string
          policy_version?: string
          recipient_user_id?: string
          scheduled_for?: string
          source_domain?: string
          source_record_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_notifications: {
        Row: {
          action_kind: string | null
          action_label_key: string | null
          action_target: Json | null
          archived_at: string | null
          body_key: string
          created_at: string
          dedupe_key: string
          delivered_at: string | null
          event_kind: string
          expired_at: string | null
          id: string
          notification_kind: string
          policy_version: string
          priority: string
          read_at: string | null
          recipient_user_id: string
          safe_display_data: Json
          scheduled_for: string | null
          schema_version: string
          source_domain: string
          source_event_id: string | null
          source_record_id: string
          status: string
          title_key: string
          updated_at: string
        }
        Insert: {
          action_kind?: string | null
          action_label_key?: string | null
          action_target?: Json | null
          archived_at?: string | null
          body_key: string
          created_at?: string
          dedupe_key: string
          delivered_at?: string | null
          event_kind: string
          expired_at?: string | null
          id?: string
          notification_kind: string
          policy_version?: string
          priority: string
          read_at?: string | null
          recipient_user_id: string
          safe_display_data?: Json
          scheduled_for?: string | null
          schema_version?: string
          source_domain: string
          source_event_id?: string | null
          source_record_id: string
          status?: string
          title_key: string
          updated_at?: string
        }
        Update: {
          action_kind?: string | null
          action_label_key?: string | null
          action_target?: Json | null
          archived_at?: string | null
          body_key?: string
          created_at?: string
          dedupe_key?: string
          delivered_at?: string | null
          event_kind?: string
          expired_at?: string | null
          id?: string
          notification_kind?: string
          policy_version?: string
          priority?: string
          read_at?: string | null
          recipient_user_id?: string
          safe_display_data?: Json
          scheduled_for?: string | null
          schema_version?: string
          source_domain?: string
          source_event_id?: string | null
          source_record_id?: string
          status?: string
          title_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_relationship_memories: {
        Row: {
          canonical_key: string
          canonical_value: Json
          confidence: number
          created_at: string
          first_observed_at: string
          id: string
          last_observed_at: string
          last_reviewed_at: string | null
          last_reviewed_by: string | null
          memory_kind: string
          owner_user_id: string
          registry_version: string
          row_version: number
          scope_ref: string
          scope_type: string
          sensitivity: string
          source_count: number
          status: string
          subject_ref: string
          subject_type: string
          superseded_by_memory_id: string | null
          updated_at: string
        }
        Insert: {
          canonical_key: string
          canonical_value?: Json
          confidence?: number
          created_at?: string
          first_observed_at?: string
          id?: string
          last_observed_at?: string
          last_reviewed_at?: string | null
          last_reviewed_by?: string | null
          memory_kind: string
          owner_user_id: string
          registry_version?: string
          row_version?: number
          scope_ref?: string
          scope_type?: string
          sensitivity?: string
          source_count?: number
          status?: string
          subject_ref: string
          subject_type: string
          superseded_by_memory_id?: string | null
          updated_at?: string
        }
        Update: {
          canonical_key?: string
          canonical_value?: Json
          confidence?: number
          created_at?: string
          first_observed_at?: string
          id?: string
          last_observed_at?: string
          last_reviewed_at?: string | null
          last_reviewed_by?: string | null
          memory_kind?: string
          owner_user_id?: string
          registry_version?: string
          row_version?: number
          scope_ref?: string
          scope_type?: string
          sensitivity?: string
          source_count?: number
          status?: string
          subject_ref?: string
          subject_type?: string
          superseded_by_memory_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_relationship_memories_superseded_by_memory_id_fkey"
            columns: ["superseded_by_memory_id"]
            isOneToOne: false
            referencedRelation: "business_relationship_memories"
            referencedColumns: ["id"]
          },
        ]
      }
      business_relationship_memory_embeddings: {
        Row: {
          attempt_count: number
          claim_expires_at: string | null
          claim_token: string | null
          claimed_at: string | null
          content_hash: string
          created_at: string
          dimensions: number
          embedding: string | null
          embedding_profile: string
          generated_at: string | null
          id: string
          input_version: string
          last_error_code: string | null
          memory_id: string
          model_id: string
          model_version: string
          owner_user_id: string
          provider_class: string
          stale_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          claim_expires_at?: string | null
          claim_token?: string | null
          claimed_at?: string | null
          content_hash: string
          created_at?: string
          dimensions: number
          embedding?: string | null
          embedding_profile: string
          generated_at?: string | null
          id?: string
          input_version: string
          last_error_code?: string | null
          memory_id: string
          model_id: string
          model_version: string
          owner_user_id: string
          provider_class: string
          stale_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          claim_expires_at?: string | null
          claim_token?: string | null
          claimed_at?: string | null
          content_hash?: string
          created_at?: string
          dimensions?: number
          embedding?: string | null
          embedding_profile?: string
          generated_at?: string | null
          id?: string
          input_version?: string
          last_error_code?: string | null
          memory_id?: string
          model_id?: string
          model_version?: string
          owner_user_id?: string
          provider_class?: string
          stale_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_relationship_memory_embeddings_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "business_relationship_memories"
            referencedColumns: ["id"]
          },
        ]
      }
      business_relationship_memory_extraction_receipts: {
        Row: {
          attempt_count: number
          candidate_count: number
          claim_expires_at: string | null
          claim_token: string | null
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          extractor_id: string
          extractor_version: string
          id: string
          last_error: string | null
          owner_user_id: string
          row_version: number
          source_domain: string
          source_record_id: string
          source_version: string
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          candidate_count?: number
          claim_expires_at?: string | null
          claim_token?: string | null
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          extractor_id: string
          extractor_version: string
          id?: string
          last_error?: string | null
          owner_user_id: string
          row_version?: number
          source_domain: string
          source_record_id: string
          source_version?: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          candidate_count?: number
          claim_expires_at?: string | null
          claim_token?: string | null
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          extractor_id?: string
          extractor_version?: string
          id?: string
          last_error?: string | null
          owner_user_id?: string
          row_version?: number
          source_domain?: string
          source_record_id?: string
          source_version?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_relationship_memory_feedback: {
        Row: {
          created_at: string
          feedback_kind: string
          id: string
          memory_id: string
          note: string | null
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          feedback_kind: string
          id?: string
          memory_id: string
          note?: string | null
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          feedback_kind?: string
          id?: string
          memory_id?: string
          note?: string | null
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_relationship_memory_feedback_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "business_relationship_memories"
            referencedColumns: ["id"]
          },
        ]
      }
      business_relationship_memory_links: {
        Row: {
          created_at: string
          from_memory_id: string
          id: string
          link_kind: string
          owner_user_id: string
          to_memory_id: string
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          from_memory_id: string
          id?: string
          link_kind: string
          owner_user_id: string
          to_memory_id: string
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          from_memory_id?: string
          id?: string
          link_kind?: string
          owner_user_id?: string
          to_memory_id?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_relationship_memory_links_from_memory_id_fkey"
            columns: ["from_memory_id"]
            isOneToOne: false
            referencedRelation: "business_relationship_memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_relationship_memory_links_to_memory_id_fkey"
            columns: ["to_memory_id"]
            isOneToOne: false
            referencedRelation: "business_relationship_memories"
            referencedColumns: ["id"]
          },
        ]
      }
      business_relationship_memory_sources: {
        Row: {
          created_at: string
          evidence_type: string
          extractor_id: string
          extractor_version: string
          id: string
          memory_id: string
          observed_at: string
          owner_user_id: string
          snippet_safe: string | null
          source_domain: string
          source_record_id: string
          source_ref: string
          source_version: string
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          evidence_type?: string
          extractor_id?: string
          extractor_version?: string
          id?: string
          memory_id: string
          observed_at?: string
          owner_user_id: string
          snippet_safe?: string | null
          source_domain: string
          source_record_id: string
          source_ref: string
          source_version?: string
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          evidence_type?: string
          extractor_id?: string
          extractor_version?: string
          id?: string
          memory_id?: string
          observed_at?: string
          owner_user_id?: string
          snippet_safe?: string | null
          source_domain?: string
          source_record_id?: string
          source_ref?: string
          source_version?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_relationship_memory_sources_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "business_relationship_memories"
            referencedColumns: ["id"]
          },
        ]
      }
      business_relationship_moment_media: {
        Row: {
          byte_size: number | null
          created_at: string
          height: number | null
          id: string
          media_type: string
          moment_id: string
          owner_user_id: string
          sort_order: number
          storage_path: string
          width: number | null
        }
        Insert: {
          byte_size?: number | null
          created_at?: string
          height?: number | null
          id?: string
          media_type: string
          moment_id: string
          owner_user_id: string
          sort_order?: number
          storage_path: string
          width?: number | null
        }
        Update: {
          byte_size?: number | null
          created_at?: string
          height?: number | null
          id?: string
          media_type?: string
          moment_id?: string
          owner_user_id?: string
          sort_order?: number
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_relationship_moment_media_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "business_relationship_moments"
            referencedColumns: ["id"]
          },
        ]
      }
      business_relationship_moment_reminders: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          label: string | null
          moment_id: string
          owner_user_id: string
          remind_at: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          label?: string | null
          moment_id: string
          owner_user_id: string
          remind_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          label?: string | null
          moment_id?: string
          owner_user_id?: string
          remind_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_relationship_moment_reminders_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "business_relationship_moments"
            referencedColumns: ["id"]
          },
        ]
      }
      business_relationship_moments: {
        Row: {
          client_token: string
          created_at: string
          event_name: string | null
          id: string
          note: string | null
          occurred_at: string
          owner_user_id: string
          place_label: string | null
          status: string
          target_card_id: string | null
          target_guest_id: string | null
          target_kind: string
          target_user_id: string | null
          updated_at: string
        }
        Insert: {
          client_token: string
          created_at?: string
          event_name?: string | null
          id?: string
          note?: string | null
          occurred_at: string
          owner_user_id: string
          place_label?: string | null
          status?: string
          target_card_id?: string | null
          target_guest_id?: string | null
          target_kind: string
          target_user_id?: string | null
          updated_at?: string
        }
        Update: {
          client_token?: string
          created_at?: string
          event_name?: string | null
          id?: string
          note?: string | null
          occurred_at?: string
          owner_user_id?: string
          place_label?: string | null
          status?: string
          target_card_id?: string | null
          target_guest_id?: string | null
          target_kind?: string
          target_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_relationship_moments_target_guest_id_fkey"
            columns: ["target_guest_id"]
            isOneToOne: false
            referencedRelation: "guest_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      business_relationship_person_plans: {
        Row: {
          completed_at: string | null
          created_at: string
          due_at: string
          id: string
          kind: string
          location_label: string | null
          note: string | null
          owner_user_id: string
          status: string
          target_card_id: string | null
          target_guest_id: string | null
          target_kind: string
          target_user_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_at: string
          id?: string
          kind: string
          location_label?: string | null
          note?: string | null
          owner_user_id: string
          status?: string
          target_card_id?: string | null
          target_guest_id?: string | null
          target_kind: string
          target_user_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_at?: string
          id?: string
          kind?: string
          location_label?: string | null
          note?: string | null
          owner_user_id?: string
          status?: string
          target_card_id?: string | null
          target_guest_id?: string | null
          target_kind?: string
          target_user_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_relationship_person_plans_target_guest_id_fkey"
            columns: ["target_guest_id"]
            isOneToOne: false
            referencedRelation: "guest_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      card_ai_import_history: {
        Row: {
          applied_at: string | null
          created_at: string
          id: string
          note: string | null
          qr_background: string | null
          suggestion: Json
          template_id: string | null
          thumbnail: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          id?: string
          note?: string | null
          qr_background?: string | null
          suggestion: Json
          template_id?: string | null
          thumbnail: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          id?: string
          note?: string | null
          qr_background?: string | null
          suggestion?: Json
          template_id?: string | null
          thumbnail?: string
          user_id?: string
        }
        Relationships: []
      }
      card_settings: {
        Row: {
          created_at: string
          display_company: string | null
          display_name: string | null
          photo_url: string | null
          show_address: boolean
          show_company: boolean
          show_email: boolean
          show_name: boolean
          show_phone: boolean
          show_photo: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_company?: string | null
          display_name?: string | null
          photo_url?: string | null
          show_address?: boolean
          show_company?: boolean
          show_email?: boolean
          show_name?: boolean
          show_phone?: boolean
          show_photo?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_company?: string | null
          display_name?: string | null
          photo_url?: string | null
          show_address?: boolean
          show_company?: boolean
          show_email?: boolean
          show_name?: boolean
          show_phone?: boolean
          show_photo?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      checkin_logs: {
        Row: {
          association_id: string
          attendee_id: string
          created_at: string
          id: string
          result: string
        }
        Insert: {
          association_id?: string
          attendee_id: string
          created_at?: string
          id?: string
          result?: string
        }
        Update: {
          association_id?: string
          attendee_id?: string
          created_at?: string
          id?: string
          result?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_logs_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_logs_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "attendees"
            referencedColumns: ["id"]
          },
        ]
      }
      community_invitations: {
        Row: {
          accepted_by: string | null
          association_id: string
          created_at: string
          email: string
          email_body: string | null
          email_subject: string | null
          id: string
          invite_url: string | null
          invited_by: string
          invited_role: string
          locale: string | null
          note: string | null
          responded_at: string | null
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_by?: string | null
          association_id: string
          created_at?: string
          email: string
          email_body?: string | null
          email_subject?: string | null
          id?: string
          invite_url?: string | null
          invited_by: string
          invited_role?: string
          locale?: string | null
          note?: string | null
          responded_at?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_by?: string | null
          association_id?: string
          created_at?: string
          email?: string
          email_body?: string | null
          email_subject?: string | null
          id?: string
          invite_url?: string | null
          invited_by?: string
          invited_role?: string
          locale?: string | null
          note?: string | null
          responded_at?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_invitations_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_invite_templates: {
        Row: {
          association_id: string
          body: string
          created_at: string
          id: string
          locale: string
          subject: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          association_id: string
          body: string
          created_at?: string
          id?: string
          locale: string
          subject: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          association_id?: string
          body?: string
          created_at?: string
          id?: string
          locale?: string
          subject?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_invite_templates_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_join_requests: {
        Row: {
          association_id: string
          cancel_reason: string | null
          created_at: string
          decided_at: string | null
          id: string
          message: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          association_id: string
          cancel_reason?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          association_id?: string
          cancel_reason?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_join_requests_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_member_role_events: {
        Row: {
          actor_user_id: string
          association_id: string
          created_at: string
          id: string
          invitation_id: string | null
          new_role: string
          old_role: string
          target_user_id: string
        }
        Insert: {
          actor_user_id: string
          association_id: string
          created_at?: string
          id?: string
          invitation_id?: string | null
          new_role: string
          old_role: string
          target_user_id: string
        }
        Update: {
          actor_user_id?: string
          association_id?: string
          created_at?: string
          id?: string
          invitation_id?: string | null
          new_role?: string
          old_role?: string
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_member_role_events_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_member_role_events_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "community_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_opportunity_followup_attachments: {
        Row: {
          association_id: string
          created_at: string
          id: string
          kind: string
          mime_type: string | null
          opportunity_id: string
          size_bytes: number | null
          storage_path: string | null
          title: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          association_id: string
          created_at?: string
          id?: string
          kind: string
          mime_type?: string | null
          opportunity_id: string
          size_bytes?: number | null
          storage_path?: string | null
          title?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          association_id?: string
          created_at?: string
          id?: string
          kind?: string
          mime_type?: string | null
          opportunity_id?: string
          size_bytes?: number | null
          storage_path?: string | null
          title?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      community_opportunity_followup_events: {
        Row: {
          association_id: string
          created_at: string
          id: string
          kind: string
          note: string | null
          opportunity_id: string
          progress: string | null
          remind_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          association_id: string
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          opportunity_id: string
          progress?: string | null
          remind_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          association_id?: string
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          opportunity_id?: string
          progress?: string | null
          remind_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      community_opportunity_followups: {
        Row: {
          association_id: string
          created_at: string
          id: string
          note: string | null
          opportunity_id: string
          progress: string
          remind_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          association_id: string
          created_at?: string
          id?: string
          note?: string | null
          opportunity_id: string
          progress?: string
          remind_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          association_id?: string
          created_at?: string
          id?: string
          note?: string | null
          opportunity_id?: string
          progress?: string
          remind_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          city: string | null
          country: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          owner_user_id: string
          phone: string | null
          size: string | null
          slug: string
          status: string
          updated_at: string
          verified: boolean
          visibility: string
          website: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          owner_user_id: string
          phone?: string | null
          size?: string | null
          slug: string
          status?: string
          updated_at?: string
          verified?: boolean
          visibility?: string
          website?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          owner_user_id?: string
          phone?: string | null
          size?: string | null
          slug?: string
          status?: string
          updated_at?: string
          verified?: boolean
          visibility?: string
          website?: string | null
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          id: string
          invited_by: string | null
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          association_id: string
          created_at: string
          id: string
          owner_id: string
          peer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          association_id?: string
          created_at?: string
          id?: string
          owner_id: string
          peer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          peer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          cta_intent: string | null
          cta_source: string | null
          email: string
          id: string
          job_title: string | null
          locale: string | null
          name: string
          notes: string | null
          organization: string
          phone: string | null
          preferred_date: string | null
          preferred_slot: string | null
          status: string
          status_changed_at: string | null
          status_changed_by: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          cta_intent?: string | null
          cta_source?: string | null
          email: string
          id?: string
          job_title?: string | null
          locale?: string | null
          name: string
          notes?: string | null
          organization: string
          phone?: string | null
          preferred_date?: string | null
          preferred_slot?: string | null
          status?: string
          status_changed_at?: string | null
          status_changed_by?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          cta_intent?: string | null
          cta_source?: string | null
          email?: string
          id?: string
          job_title?: string | null
          locale?: string | null
          name?: string
          notes?: string | null
          organization?: string
          phone?: string | null
          preferred_date?: string | null
          preferred_slot?: string | null
          status?: string
          status_changed_at?: string | null
          status_changed_by?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          association_id: string
          category: string
          code: string
          created_at: string
          file_path: string | null
          id: string
          name: string
          size: string
          type: string
          updated_at: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          association_id?: string
          category: string
          code: string
          created_at?: string
          file_path?: string | null
          id?: string
          name: string
          size?: string
          type: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Update: {
          association_id?: string
          category?: string
          code?: string
          created_at?: string
          file_path?: string | null
          id?: string
          name?: string
          size?: string
          type?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          association_id: string
          audience: string
          clicked: number
          code: string
          created_at: string
          id: string
          name: string
          opened: number
          sent: number
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          association_id?: string
          audience?: string
          clicked?: number
          code: string
          created_at?: string
          id?: string
          name: string
          opened?: number
          sent?: number
          sent_at?: string | null
          status: string
          subject?: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          audience?: string
          clicked?: number
          code?: string
          created_at?: string
          id?: string
          name?: string
          opened?: number
          sent?: number
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          association_id: string
          created_at: string
          email: string
          event_id: string
          id: string
          member_code: string
          member_name: string
          registered_at: string
          status: string
          ticket_type: string
          updated_at: string
        }
        Insert: {
          association_id?: string
          created_at?: string
          email?: string
          event_id: string
          id: string
          member_code: string
          member_name?: string
          registered_at?: string
          status?: string
          ticket_type?: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          created_at?: string
          email?: string
          event_id?: string
          id?: string
          member_code?: string
          member_name?: string
          registered_at?: string
          status?: string
          ticket_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_ticket_types: {
        Row: {
          association_id: string
          created_at: string
          description: string
          event_id: string
          id: string
          name: string
          price: number
          quantity: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          association_id?: string
          created_at?: string
          description?: string
          event_id: string
          id: string
          name: string
          price?: number
          quantity?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          association_id?: string
          created_at?: string
          description?: string
          event_id?: string
          id?: string
          name?: string
          price?: number
          quantity?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_ticket_types_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          association_id: string
          capacity: number
          created_at: string
          date: string
          id: string
          location: string
          name: string
          qr_fields: string[]
          registered: number
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          association_id?: string
          capacity?: number
          created_at?: string
          date: string
          id: string
          location?: string
          name: string
          qr_fields?: string[]
          registered?: number
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          capacity?: number
          created_at?: string
          date?: string
          id?: string
          location?: string
          name?: string
          qr_fields?: string[]
          registered?: number
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      global_connection_mutations: {
        Row: {
          actor_user_id: string
          connection_id: string | null
          created_at: string
          mutation_key: string
          operation: string
          result: Json
        }
        Insert: {
          actor_user_id: string
          connection_id?: string | null
          created_at?: string
          mutation_key: string
          operation: string
          result?: Json
        }
        Update: {
          actor_user_id?: string
          connection_id?: string | null
          created_at?: string
          mutation_key?: string
          operation?: string
          result?: Json
        }
        Relationships: []
      }
      gn_notification_prefs: {
        Row: {
          connection_accepted: boolean
          connection_request: boolean
          connection_status_update: boolean
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_accepted?: boolean
          connection_request?: boolean
          connection_status_update?: boolean
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_accepted?: boolean
          connection_request?: boolean
          connection_status_update?: boolean
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gn_notifications: {
        Row: {
          actor_summary: Json
          actor_user_id: string | null
          connection_id: string | null
          created_at: string
          id: string
          origin_event_id: string | null
          read_at: string | null
          recipient_user_id: string
          type: Database["public"]["Enums"]["gn_notification_type"]
        }
        Insert: {
          actor_summary?: Json
          actor_user_id?: string | null
          connection_id?: string | null
          created_at?: string
          id?: string
          origin_event_id?: string | null
          read_at?: string | null
          recipient_user_id: string
          type: Database["public"]["Enums"]["gn_notification_type"]
        }
        Update: {
          actor_summary?: Json
          actor_user_id?: string | null
          connection_id?: string | null
          created_at?: string
          id?: string
          origin_event_id?: string | null
          read_at?: string | null
          recipient_user_id?: string
          type?: Database["public"]["Enums"]["gn_notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "gn_notifications_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "user_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gn_notifications_origin_event_id_fkey"
            columns: ["origin_event_id"]
            isOneToOne: false
            referencedRelation: "user_connection_events"
            referencedColumns: ["id"]
          },
        ]
      }
      gn_reports: {
        Row: {
          category: Database["public"]["Enums"]["gn_report_category"]
          connection_id: string | null
          created_at: string
          details: string | null
          id: string
          reported_user_id: string
          reporter_user_id: string
          resolution_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["gn_report_status"]
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["gn_report_category"]
          connection_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reported_user_id: string
          reporter_user_id: string
          resolution_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["gn_report_status"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["gn_report_category"]
          connection_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reported_user_id?: string
          reporter_user_id?: string
          resolution_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["gn_report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gn_reports_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "user_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_edges: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by_user_id: string | null
          directionality: string
          edge_kind: string
          id: string
          idempotency_key: string | null
          metadata: Json
          registry_version: number
          source_node_id: string
          status: string
          target_node_id: string
          tenant_scope_id: string | null
          tenant_scope_type: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          visibility_class: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          directionality?: string
          edge_kind: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          registry_version?: number
          source_node_id: string
          status?: string
          target_node_id: string
          tenant_scope_id?: string | null
          tenant_scope_type?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          visibility_class?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          directionality?: string
          edge_kind?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          registry_version?: number
          source_node_id?: string
          status?: string
          target_node_id?: string
          tenant_scope_id?: string | null
          tenant_scope_type?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          visibility_class?: string
        }
        Relationships: [
          {
            foreignKeyName: "graph_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_nodes: {
        Row: {
          archived_at: string | null
          created_at: string
          external_ref_id: string
          external_ref_type: string
          id: string
          metadata: Json
          node_kind: string
          registry_version: number
          status: string
          tenant_scope_id: string | null
          tenant_scope_type: string
          updated_at: string
          visibility_class: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          external_ref_id: string
          external_ref_type: string
          id?: string
          metadata?: Json
          node_kind: string
          registry_version?: number
          status?: string
          tenant_scope_id?: string | null
          tenant_scope_type?: string
          updated_at?: string
          visibility_class?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          external_ref_id?: string
          external_ref_type?: string
          id?: string
          metadata?: Json
          node_kind?: string
          registry_version?: number
          status?: string
          tenant_scope_id?: string | null
          tenant_scope_type?: string
          updated_at?: string
          visibility_class?: string
        }
        Relationships: []
      }
      graph_outbox_events: {
        Row: {
          aggregate_id: string
          aggregate_type: string
          attempt_count: number
          available_at: string
          created_at: string
          event_kind: string
          id: string
          idempotency_key: string
          last_error_code: string | null
          occurred_at: string
          payload: Json
          processed_at: string | null
        }
        Insert: {
          aggregate_id: string
          aggregate_type: string
          attempt_count?: number
          available_at?: string
          created_at?: string
          event_kind: string
          id?: string
          idempotency_key: string
          last_error_code?: string | null
          occurred_at?: string
          payload?: Json
          processed_at?: string | null
        }
        Update: {
          aggregate_id?: string
          aggregate_type?: string
          attempt_count?: number
          available_at?: string
          created_at?: string
          event_kind?: string
          id?: string
          idempotency_key?: string
          last_error_code?: string | null
          occurred_at?: string
          payload?: Json
          processed_at?: string | null
        }
        Relationships: []
      }
      graph_registry_versions: {
        Row: {
          deployed_at: string
          id: string
          manifest: Json
          manifest_hash: string
          version: number
        }
        Insert: {
          deployed_at?: string
          id?: string
          manifest: Json
          manifest_hash: string
          version: number
        }
        Update: {
          deployed_at?: string
          id?: string
          manifest?: Json
          manifest_hash?: string
          version?: number
        }
        Relationships: []
      }
      graph_timeline_events: {
        Row: {
          actor_node_id: string | null
          actor_user_id: string | null
          archived_at: string | null
          collapse_key: string | null
          created_at: string
          dedupe_key: string | null
          edge_id: string | null
          event_kind: string
          id: string
          metadata: Json
          occurred_at: string
          registry_version: number
          related_node_id: string | null
          subject_node_id: string
          summary_key: string
          tenant_scope_id: string | null
          tenant_scope_type: string
          visibility_class: string
        }
        Insert: {
          actor_node_id?: string | null
          actor_user_id?: string | null
          archived_at?: string | null
          collapse_key?: string | null
          created_at?: string
          dedupe_key?: string | null
          edge_id?: string | null
          event_kind: string
          id?: string
          metadata?: Json
          occurred_at?: string
          registry_version: number
          related_node_id?: string | null
          subject_node_id: string
          summary_key: string
          tenant_scope_id?: string | null
          tenant_scope_type?: string
          visibility_class?: string
        }
        Update: {
          actor_node_id?: string | null
          actor_user_id?: string | null
          archived_at?: string | null
          collapse_key?: string | null
          created_at?: string
          dedupe_key?: string | null
          edge_id?: string | null
          event_kind?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          registry_version?: number
          related_node_id?: string | null
          subject_node_id?: string
          summary_key?: string
          tenant_scope_id?: string | null
          tenant_scope_type?: string
          visibility_class?: string
        }
        Relationships: [
          {
            foreignKeyName: "graph_timeline_events_actor_node_id_fkey"
            columns: ["actor_node_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_timeline_events_edge_id_fkey"
            columns: ["edge_id"]
            isOneToOne: false
            referencedRelation: "graph_edges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_timeline_events_related_node_id_fkey"
            columns: ["related_node_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_timeline_events_subject_node_id_fkey"
            columns: ["subject_node_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_contacts: {
        Row: {
          address: string | null
          capture_scan_id: string | null
          client_token: string
          company_name: string | null
          consent_version: string | null
          consented_at: string | null
          created_at: string
          display_name: string
          email: string | null
          first_captured_at: string | null
          first_shared_at: string
          id: string
          last_shared_at: string
          owner_label: string | null
          owner_note: string | null
          owner_user_id: string
          phone: string | null
          source: string
          source_card_id: string | null
          source_identity_id: string | null
          title: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          capture_scan_id?: string | null
          client_token: string
          company_name?: string | null
          consent_version?: string | null
          consented_at?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          first_captured_at?: string | null
          first_shared_at?: string
          id?: string
          last_shared_at?: string
          owner_label?: string | null
          owner_note?: string | null
          owner_user_id: string
          phone?: string | null
          source?: string
          source_card_id?: string | null
          source_identity_id?: string | null
          title?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          capture_scan_id?: string | null
          client_token?: string
          company_name?: string | null
          consent_version?: string | null
          consented_at?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          first_captured_at?: string | null
          first_shared_at?: string
          id?: string
          last_shared_at?: string
          owner_label?: string | null
          owner_note?: string | null
          owner_user_id?: string
          phone?: string | null
          source?: string
          source_card_id?: string | null
          source_identity_id?: string | null
          title?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_contacts_source_card_id_fkey"
            columns: ["source_card_id"]
            isOneToOne: false
            referencedRelation: "member_business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_contacts_source_identity_id_fkey"
            columns: ["source_identity_id"]
            isOneToOne: false
            referencedRelation: "business_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_backfill_reports: {
        Row: {
          created_at: string
          details: Json
          duplicate_mapping: number
          id: string
          missing_user: number
          profiles_created: number
          profiles_skipped: number
          run_label: string
        }
        Insert: {
          created_at?: string
          details?: Json
          duplicate_mapping?: number
          id?: string
          missing_user?: number
          profiles_created?: number
          profiles_skipped?: number
          run_label: string
        }
        Update: {
          created_at?: string
          details?: Json
          duplicate_mapping?: number
          id?: string
          missing_user?: number
          profiles_created?: number
          profiles_skipped?: number
          run_label?: string
        }
        Relationships: []
      }
      identity_field_visibility: {
        Row: {
          field_key: string
          identity_id: string
          owner_user_id: string
          updated_at: string
          visibility: string
        }
        Insert: {
          field_key: string
          identity_id: string
          owner_user_id: string
          updated_at?: string
          visibility: string
        }
        Update: {
          field_key?: string
          identity_id?: string
          owner_user_id?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_field_visibility_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "business_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_nfc_tags: {
        Row: {
          created_at: string
          id: string
          identity_id: string
          label: string | null
          owner_user_id: string
          revoked_at: string | null
          share_link_id: string
          status: string
          updated_at: string
          written_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          identity_id: string
          label?: string | null
          owner_user_id: string
          revoked_at?: string | null
          share_link_id: string
          status?: string
          updated_at?: string
          written_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          identity_id?: string
          label?: string | null
          owner_user_id?: string
          revoked_at?: string | null
          share_link_id?: string
          status?: string
          updated_at?: string
          written_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_nfc_tags_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "business_identities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_nfc_tags_share_link_id_fkey"
            columns: ["share_link_id"]
            isOneToOne: false
            referencedRelation: "identity_share_links"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_share_links: {
        Row: {
          created_at: string
          id: string
          identity_id: string
          last_used_at: string | null
          owner_user_id: string
          public_token: string
          revoked_at: string | null
          rotated_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          identity_id: string
          last_used_at?: string | null
          owner_user_id: string
          public_token: string
          revoked_at?: string | null
          rotated_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          identity_id?: string
          last_used_at?: string | null
          owner_user_id?: string
          public_token?: string
          revoked_at?: string | null
          rotated_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_share_links_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "business_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      introduction_analytics_daily: {
        Row: {
          accepted_count: number
          acknowledged_count: number
          analytics_version: string
          closed_no_outcome_count: number
          confidence_bucket: string
          connected_count: number
          delivered_count: number
          expired_count: number
          id: number
          metric_date: string
          not_connected_count: number
          path_depth: number
          progressed_count: number
          requested_count: number
          scope_id: string | null
          scope_type: string
          total_accept_seconds: number
          total_ack_seconds: number
          total_connect_seconds: number
          total_delivery_seconds: number
          total_progressed_seconds: number
          updated_at: string
        }
        Insert: {
          accepted_count?: number
          acknowledged_count?: number
          analytics_version?: string
          closed_no_outcome_count?: number
          confidence_bucket: string
          connected_count?: number
          delivered_count?: number
          expired_count?: number
          id?: number
          metric_date: string
          not_connected_count?: number
          path_depth: number
          progressed_count?: number
          requested_count?: number
          scope_id?: string | null
          scope_type: string
          total_accept_seconds?: number
          total_ack_seconds?: number
          total_connect_seconds?: number
          total_delivery_seconds?: number
          total_progressed_seconds?: number
          updated_at?: string
        }
        Update: {
          accepted_count?: number
          acknowledged_count?: number
          analytics_version?: string
          closed_no_outcome_count?: number
          confidence_bucket?: string
          connected_count?: number
          delivered_count?: number
          expired_count?: number
          id?: number
          metric_date?: string
          not_connected_count?: number
          path_depth?: number
          progressed_count?: number
          requested_count?: number
          scope_id?: string | null
          scope_type?: string
          total_accept_seconds?: number
          total_ack_seconds?: number
          total_connect_seconds?: number
          total_delivery_seconds?: number
          total_progressed_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      introduction_analytics_durations: {
        Row: {
          confidence_bucket: string
          created_at: string
          duration_seconds: number
          id: number
          metric_date: string
          metric_kind: string
          path_depth: number
          scope_id: string | null
          scope_type: string
          source_event_id: string
        }
        Insert: {
          confidence_bucket: string
          created_at?: string
          duration_seconds: number
          id?: number
          metric_date: string
          metric_kind: string
          path_depth: number
          scope_id?: string | null
          scope_type: string
          source_event_id: string
        }
        Update: {
          confidence_bucket?: string
          created_at?: string
          duration_seconds?: number
          id?: number
          metric_date?: string
          metric_kind?: string
          path_depth?: number
          scope_id?: string | null
          scope_type?: string
          source_event_id?: string
        }
        Relationships: []
      }
      introduction_deliveries: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_note: string | null
          delivery_snapshot: Json
          expires_at: string
          id: string
          idempotency_key: string | null
          intermediary_person_node_id: string
          intermediary_user_id: string
          introduction_request_id: string
          requester_person_node_id: string
          requester_user_id: string
          revoked_at: string | null
          status: string
          target_person_node_id: string
          target_user_id: string
          updated_at: string
          version: number
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_note?: string | null
          delivery_snapshot: Json
          expires_at?: string
          id?: string
          idempotency_key?: string | null
          intermediary_person_node_id: string
          intermediary_user_id: string
          introduction_request_id: string
          requester_person_node_id: string
          requester_user_id: string
          revoked_at?: string | null
          status: string
          target_person_node_id: string
          target_user_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_note?: string | null
          delivery_snapshot?: Json
          expires_at?: string
          id?: string
          idempotency_key?: string | null
          intermediary_person_node_id?: string
          intermediary_user_id?: string
          introduction_request_id?: string
          requester_person_node_id?: string
          requester_user_id?: string
          revoked_at?: string | null
          status?: string
          target_person_node_id?: string
          target_user_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "introduction_deliveries_introduction_request_id_fkey"
            columns: ["introduction_request_id"]
            isOneToOne: false
            referencedRelation: "introduction_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      introduction_ops_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          association_id: string | null
          category: string
          created_at: string
          details: Json
          first_seen_at: string
          id: string
          last_seen_at: string
          message: string
          occurrence_count: number
          resolved_at: string | null
          rule_key: string
          scope: string
          severity: string
          state: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          association_id?: string | null
          category: string
          created_at?: string
          details?: Json
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          message: string
          occurrence_count?: number
          resolved_at?: string | null
          rule_key: string
          scope: string
          severity: string
          state?: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          association_id?: string | null
          category?: string
          created_at?: string
          details?: Json
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          message?: string
          occurrence_count?: number
          resolved_at?: string | null
          rule_key?: string
          scope?: string
          severity?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "introduction_ops_alerts_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      introduction_ops_consumer_runs: {
        Row: {
          adapter_name: string | null
          batch_id: string | null
          created_at: string
          details: Json
          error_code: string | null
          events_claimed: number
          events_deadlettered: number
          events_delivered: number
          events_failed: number
          finished_at: string | null
          id: string
          started_at: string
          status: string
        }
        Insert: {
          adapter_name?: string | null
          batch_id?: string | null
          created_at?: string
          details?: Json
          error_code?: string | null
          events_claimed?: number
          events_deadlettered?: number
          events_delivered?: number
          events_failed?: number
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
        }
        Update: {
          adapter_name?: string | null
          batch_id?: string | null
          created_at?: string
          details?: Json
          error_code?: string | null
          events_claimed?: number
          events_deadlettered?: number
          events_delivered?: number
          events_failed?: number
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      introduction_ops_job_runs: {
        Row: {
          created_at: string
          details: Json
          error_code: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          job_name: string
          rows_processed: number
          started_at: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: Json
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name: string
          rows_processed?: number
          started_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: Json
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name?: string
          rows_processed?: number
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      introduction_outcomes: {
        Row: {
          acknowledged_at: string | null
          connection_observed_at: string | null
          created_at: string
          expires_at: string
          id: string
          intermediary_person_node_id: string
          intermediary_user_id: string
          introduction_delivery_id: string
          introduction_request_id: string
          outcome_note: string | null
          outcome_source: string | null
          outcome_type: string | null
          progressed_at: string | null
          requester_person_node_id: string
          requester_user_id: string
          resolved_at: string | null
          status: string
          target_person_node_id: string
          target_user_id: string
          updated_at: string
          version: number
        }
        Insert: {
          acknowledged_at?: string | null
          connection_observed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          intermediary_person_node_id: string
          intermediary_user_id: string
          introduction_delivery_id: string
          introduction_request_id: string
          outcome_note?: string | null
          outcome_source?: string | null
          outcome_type?: string | null
          progressed_at?: string | null
          requester_person_node_id: string
          requester_user_id: string
          resolved_at?: string | null
          status?: string
          target_person_node_id: string
          target_user_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          acknowledged_at?: string | null
          connection_observed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          intermediary_person_node_id?: string
          intermediary_user_id?: string
          introduction_delivery_id?: string
          introduction_request_id?: string
          outcome_note?: string | null
          outcome_source?: string | null
          outcome_type?: string | null
          progressed_at?: string | null
          requester_person_node_id?: string
          requester_user_id?: string
          resolved_at?: string | null
          status?: string
          target_person_node_id?: string
          target_user_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "introduction_outcomes_introduction_delivery_id_fkey"
            columns: ["introduction_delivery_id"]
            isOneToOne: true
            referencedRelation: "introduction_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "introduction_outcomes_introduction_request_id_fkey"
            columns: ["introduction_request_id"]
            isOneToOne: false
            referencedRelation: "introduction_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      introduction_requests: {
        Row: {
          cancelled_at: string | null
          created_at: string
          expires_at: string
          id: string
          idempotency_key: string | null
          intermediary_person_node_id: string
          intermediary_user_id: string
          introduction_version: string
          path_id: string
          path_snapshot: Json
          request_note: string | null
          requester_person_node_id: string
          requester_user_id: string
          responded_at: string | null
          status: string
          strength_version: string
          target_person_node_id: string
          updated_at: string
          version: number
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          idempotency_key?: string | null
          intermediary_person_node_id: string
          intermediary_user_id: string
          introduction_version: string
          path_id: string
          path_snapshot: Json
          request_note?: string | null
          requester_person_node_id: string
          requester_user_id: string
          responded_at?: string | null
          status?: string
          strength_version: string
          target_person_node_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          idempotency_key?: string | null
          intermediary_person_node_id?: string
          intermediary_user_id?: string
          introduction_version?: string
          path_id?: string
          path_snapshot?: Json
          request_note?: string | null
          requester_person_node_id?: string
          requester_user_id?: string
          responded_at?: string | null
          status?: string
          strength_version?: string
          target_person_node_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      invoice_reminders: {
        Row: {
          by_name: string
          channel: string
          created_at: string
          id: string
          invoice_id: string
          note: string | null
          sent_at: string
          updated_at: string
        }
        Insert: {
          by_name?: string
          channel: string
          created_at?: string
          id?: string
          invoice_id: string
          note?: string | null
          sent_at?: string
          updated_at?: string
        }
        Update: {
          by_name?: string
          channel?: string
          created_at?: string
          id?: string
          invoice_id?: string
          note?: string | null
          sent_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          association_id: string
          created_at: string
          due_date: string
          id: string
          invoice_no: string
          member_id: string
          method: string | null
          paid_at: string | null
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          amount?: number
          association_id?: string
          created_at?: string
          due_date: string
          id: string
          invoice_no: string
          member_id: string
          method?: string | null
          paid_at?: string | null
          status: string
          updated_at?: string
          year: number
        }
        Update: {
          amount?: number
          association_id?: string
          created_at?: string
          due_date?: string
          id?: string
          invoice_no?: string
          member_id?: string
          method?: string | null
          paid_at?: string | null
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          association_id: string
          attendees: number
          code: string
          created_at: string
          date: string
          id: string
          location: string
          status: string
          time: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          association_id?: string
          attendees?: number
          code: string
          created_at?: string
          date: string
          id?: string
          location?: string
          status: string
          time?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          attendees?: number
          code?: string
          created_at?: string
          date?: string
          id?: string
          location?: string
          status?: string
          time?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      member_account_audit: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          details: string | null
          id: string
          member_id: string
          member_name: string | null
          new_user_id: string | null
          old_user_id: string | null
          target_email: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          member_id: string
          member_name?: string | null
          new_user_id?: string | null
          old_user_id?: string | null
          target_email?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          member_id?: string
          member_name?: string | null
          new_user_id?: string | null
          old_user_id?: string | null
          target_email?: string | null
        }
        Relationships: []
      }
      member_business_cards: {
        Row: {
          address: string | null
          allow_contact_exchange: boolean
          association_id: string | null
          avatar_url: string | null
          bio: string | null
          bio_en: string | null
          branding_settings: Json
          card_kind: string
          company_id: string | null
          company_logo_url: string | null
          company_name: string | null
          company_name_en: string | null
          cover_url: string | null
          created_at: string
          cta_settings: Json
          custom_brand_color: string | null
          display_name: string | null
          display_name_en: string | null
          facebook_url: string | null
          headline: string | null
          headline_en: string | null
          id: string
          last_viewed_at: string | null
          linkedin_url: string | null
          map_url: string | null
          member_id: string | null
          owner_user_id: string | null
          professional_title: string | null
          professional_title_en: string | null
          public_mode: string
          published_at: string | null
          qr_options: Json | null
          seo_settings: Json
          slug: string
          status: string
          theme_id: string | null
          tiktok_url: string | null
          updated_at: string
          visibility_settings: Json
          website: string | null
          work_email: string | null
          work_phone: string | null
          youtube_url: string | null
          zalo_url: string | null
        }
        Insert: {
          address?: string | null
          allow_contact_exchange?: boolean
          association_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          bio_en?: string | null
          branding_settings?: Json
          card_kind?: string
          company_id?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_name_en?: string | null
          cover_url?: string | null
          created_at?: string
          cta_settings?: Json
          custom_brand_color?: string | null
          display_name?: string | null
          display_name_en?: string | null
          facebook_url?: string | null
          headline?: string | null
          headline_en?: string | null
          id?: string
          last_viewed_at?: string | null
          linkedin_url?: string | null
          map_url?: string | null
          member_id?: string | null
          owner_user_id?: string | null
          professional_title?: string | null
          professional_title_en?: string | null
          public_mode?: string
          published_at?: string | null
          qr_options?: Json | null
          seo_settings?: Json
          slug: string
          status?: string
          theme_id?: string | null
          tiktok_url?: string | null
          updated_at?: string
          visibility_settings?: Json
          website?: string | null
          work_email?: string | null
          work_phone?: string | null
          youtube_url?: string | null
          zalo_url?: string | null
        }
        Update: {
          address?: string | null
          allow_contact_exchange?: boolean
          association_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          bio_en?: string | null
          branding_settings?: Json
          card_kind?: string
          company_id?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_name_en?: string | null
          cover_url?: string | null
          created_at?: string
          cta_settings?: Json
          custom_brand_color?: string | null
          display_name?: string | null
          display_name_en?: string | null
          facebook_url?: string | null
          headline?: string | null
          headline_en?: string | null
          id?: string
          last_viewed_at?: string | null
          linkedin_url?: string | null
          map_url?: string | null
          member_id?: string | null
          owner_user_id?: string | null
          professional_title?: string | null
          professional_title_en?: string | null
          public_mode?: string
          published_at?: string | null
          qr_options?: Json | null
          seo_settings?: Json
          slug?: string
          status?: string
          theme_id?: string | null
          tiktok_url?: string | null
          updated_at?: string
          visibility_settings?: Json
          website?: string | null
          work_email?: string | null
          work_phone?: string | null
          youtube_url?: string | null
          zalo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_business_cards_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_business_cards_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_checkin_rejections: {
        Row: {
          actor_user_id: string
          association_id: string | null
          attempted_event_id: string | null
          created_at: string
          id: string
          method: string
          payload_hash: string
          reason_code: string
        }
        Insert: {
          actor_user_id: string
          association_id?: string | null
          attempted_event_id?: string | null
          created_at?: string
          id?: string
          method: string
          payload_hash: string
          reason_code: string
        }
        Update: {
          actor_user_id?: string
          association_id?: string | null
          attempted_event_id?: string | null
          created_at?: string
          id?: string
          method?: string
          payload_hash?: string
          reason_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_checkin_rejections_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      member_checkins: {
        Row: {
          association_id: string
          checked_at: string
          client_id: string
          created_at: string
          event_id: string | null
          event_title: string
          id: string
          member_code: string
          method: string
          status: string
        }
        Insert: {
          association_id?: string
          checked_at: string
          client_id: string
          created_at?: string
          event_id?: string | null
          event_title: string
          id?: string
          member_code: string
          method: string
          status: string
        }
        Update: {
          association_id?: string
          checked_at?: string
          client_id?: string
          created_at?: string
          event_id?: string | null
          event_title?: string
          id?: string
          member_code?: string
          method?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_checkins_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      member_identity_events: {
        Row: {
          actor_user_id: string | null
          association_id: string
          created_at: string
          event_type: string
          id: string
          member_id: string
          metadata: Json
          pass_id: string | null
          reason: string | null
        }
        Insert: {
          actor_user_id?: string | null
          association_id: string
          created_at?: string
          event_type: string
          id?: string
          member_id: string
          metadata?: Json
          pass_id?: string | null
          reason?: string | null
        }
        Update: {
          actor_user_id?: string | null
          association_id?: string
          created_at?: string
          event_type?: string
          id?: string
          member_id?: string
          metadata?: Json
          pass_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_identity_events_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_identity_events_pass_id_fkey"
            columns: ["pass_id"]
            isOneToOne: false
            referencedRelation: "member_identity_passes"
            referencedColumns: ["id"]
          },
        ]
      }
      member_identity_passes: {
        Row: {
          association_id: string
          card_version: number
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          issued_at: string | null
          last_signed_at: string | null
          last_verified_at: string | null
          member_id: string
          pass_serial: string
          replaced_by: string | null
          revoked_at: string | null
          status: string
          suspended_at: string | null
          updated_at: string
          updated_by: string | null
          wallet_apple_pass_id: string | null
          wallet_google_pass_id: string | null
        }
        Insert: {
          association_id: string
          card_version?: number
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          last_signed_at?: string | null
          last_verified_at?: string | null
          member_id: string
          pass_serial: string
          replaced_by?: string | null
          revoked_at?: string | null
          status?: string
          suspended_at?: string | null
          updated_at?: string
          updated_by?: string | null
          wallet_apple_pass_id?: string | null
          wallet_google_pass_id?: string | null
        }
        Update: {
          association_id?: string
          card_version?: number
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          last_signed_at?: string | null
          last_verified_at?: string | null
          member_id?: string
          pass_serial?: string
          replaced_by?: string | null
          revoked_at?: string | null
          status?: string
          suspended_at?: string | null
          updated_at?: string
          updated_by?: string | null
          wallet_apple_pass_id?: string | null
          wallet_google_pass_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_identity_passes_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_identity_passes_replaced_by_fkey"
            columns: ["replaced_by"]
            isOneToOne: false
            referencedRelation: "member_identity_passes"
            referencedColumns: ["id"]
          },
        ]
      }
      member_notifications: {
        Row: {
          association_id: string
          body: string
          created_at: string
          dismissed: boolean
          id: string
          read: boolean
          recipient_id: string
          ref_id: string | null
          ref_type: string | null
          title: string
          type: string
        }
        Insert: {
          association_id: string
          body?: string
          created_at?: string
          dismissed?: boolean
          id?: string
          read?: boolean
          recipient_id: string
          ref_id?: string | null
          ref_type?: string | null
          title: string
          type?: string
        }
        Update: {
          association_id?: string
          body?: string
          created_at?: string
          dismissed?: boolean
          id?: string
          read?: boolean
          recipient_id?: string
          ref_id?: string | null
          ref_type?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      member_personnel: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          member_id: string
          name: string
          phone: string | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          member_id: string
          name: string
          phone?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          member_id?: string
          name?: string
          phone?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_personnel_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          about: string
          address: string
          association_id: string
          code: string
          contact: string
          created_at: string
          email: string
          employees: number | null
          fee_paid: boolean
          fee_year: number
          id: string
          industry: string
          joined_at: string
          last_reminder: string | null
          level: string
          name: string
          new_term_end: string | null
          payment_status: string
          phone: string
          region: string
          reminder_count: number
          renewed_at: string | null
          status: string
          tax_code: string | null
          term_end: string | null
          type: string
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          about?: string
          address?: string
          association_id?: string
          code: string
          contact?: string
          created_at?: string
          email?: string
          employees?: number | null
          fee_paid?: boolean
          fee_year: number
          id: string
          industry: string
          joined_at: string
          last_reminder?: string | null
          level: string
          name: string
          new_term_end?: string | null
          payment_status?: string
          phone?: string
          region: string
          reminder_count?: number
          renewed_at?: string | null
          status: string
          tax_code?: string | null
          term_end?: string | null
          type: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          about?: string
          address?: string
          association_id?: string
          code?: string
          contact?: string
          created_at?: string
          email?: string
          employees?: number | null
          fee_paid?: boolean
          fee_year?: number
          id?: string
          industry?: string
          joined_at?: string
          last_reminder?: string | null
          level?: string
          name?: string
          new_term_end?: string | null
          payment_status?: string
          phone?: string
          region?: string
          reminder_count?: number
          renewed_at?: string | null
          status?: string
          tax_code?: string | null
          term_end?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          association_id: string
          created_at: string
          id: string
          is_default: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          association_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          association_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          association_id: string
          created_at: string
          from_id: string
          id: string
          read_at: string | null
          text: string
          to_id: string
        }
        Insert: {
          association_id?: string
          created_at?: string
          from_id: string
          id?: string
          read_at?: string | null
          text: string
          to_id: string
        }
        Update: {
          association_id?: string
          created_at?: string
          from_id?: string
          id?: string
          read_at?: string | null
          text?: string
          to_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          association_id: string
          author: string
          category: string
          code: string
          created_at: string
          excerpt: string
          id: string
          published_at: string
          status: string
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          association_id?: string
          author: string
          category: string
          code: string
          created_at?: string
          excerpt?: string
          id?: string
          published_at?: string
          status: string
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          association_id?: string
          author?: string
          category?: string
          code?: string
          created_at?: string
          excerpt?: string
          id?: string
          published_at?: string
          status?: string
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "news_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          association_id: string
          audience: string
          body: string
          channel: string
          code: string
          created_at: string
          id: string
          reach: number
          sent_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          association_id?: string
          audience: string
          body?: string
          channel: string
          code: string
          created_at?: string
          id?: string
          reach?: number
          sent_at?: string
          status: string
          title: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          audience?: string
          body?: string
          channel?: string
          code?: string
          created_at?: string
          id?: string
          reach?: number
          sent_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          association_id: string
          budget_max: number | null
          budget_min: number | null
          created_at: string
          deadline: string
          description: string
          emoji: string
          id: string
          industry: string
          poster_id: string
          region: string
          status: string
          title: string
          type: string
          updated_at: string
          views: number
        }
        Insert: {
          association_id?: string
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          deadline: string
          description?: string
          emoji?: string
          id: string
          industry?: string
          poster_id: string
          region?: string
          status?: string
          title: string
          type: string
          updated_at?: string
          views?: number
        }
        Update: {
          association_id?: string
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          deadline?: string
          description?: string
          emoji?: string
          id?: string
          industry?: string
          poster_id?: string
          region?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_interests: {
        Row: {
          association_id: string
          contact: string
          created_at: string
          id: string
          interest_level: string
          member_id: string
          message: string
          opportunity_id: string
        }
        Insert: {
          association_id?: string
          contact?: string
          created_at?: string
          id: string
          interest_level?: string
          member_id: string
          message?: string
          opportunity_id: string
        }
        Update: {
          association_id?: string
          contact?: string
          created_at?: string
          id?: string
          interest_level?: string
          member_id?: string
          message?: string
          opportunity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_interests_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      outcome_event_dispatches: {
        Row: {
          adapter_name: string
          attempt_count: number
          created_at: string
          dead_lettered_at: string | null
          delivered_at: string | null
          id: string
          last_error_code: string | null
          lease_expires_at: string | null
          next_attempt_at: string | null
          outbox_event_id: string
          processing_owner: string | null
          processing_started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          adapter_name: string
          attempt_count?: number
          created_at?: string
          dead_lettered_at?: string | null
          delivered_at?: string | null
          id?: string
          last_error_code?: string | null
          lease_expires_at?: string | null
          next_attempt_at?: string | null
          outbox_event_id: string
          processing_owner?: string | null
          processing_started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          adapter_name?: string
          attempt_count?: number
          created_at?: string
          dead_lettered_at?: string | null
          delivered_at?: string | null
          id?: string
          last_error_code?: string | null
          lease_expires_at?: string | null
          next_attempt_at?: string | null
          outbox_event_id?: string
          processing_owner?: string | null
          processing_started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outcome_event_dispatches_outbox_event_id_fkey"
            columns: ["outbox_event_id"]
            isOneToOne: false
            referencedRelation: "graph_outbox_events"
            referencedColumns: ["id"]
          },
        ]
      }
      perks: {
        Row: {
          association_id: string
          category: string | null
          created_at: string
          description: string | null
          discount: string | null
          icon: string | null
          id: string
          link: string | null
          partner: string | null
          sort_order: number
          status: string
          summary: string | null
          title: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          association_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          discount?: string | null
          icon?: string | null
          id?: string
          link?: string | null
          partner?: string | null
          sort_order?: number
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          association_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          discount?: string | null
          icon?: string | null
          id?: string
          link?: string | null
          partner?: string | null
          sort_order?: number
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perks_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          association_id: string
          category: string
          created_at: string
          description: string
          emoji: string
          facebook_url: string | null
          id: string
          image_urls: string[]
          pdf_url: string | null
          price: number
          seller_id: string
          status: string
          title: string
          updated_at: string
          views: number
          website_url: string | null
        }
        Insert: {
          association_id?: string
          category: string
          created_at?: string
          description?: string
          emoji?: string
          facebook_url?: string | null
          id: string
          image_urls?: string[]
          pdf_url?: string | null
          price?: number
          seller_id: string
          status?: string
          title: string
          updated_at?: string
          views?: number
          website_url?: string | null
        }
        Update: {
          association_id?: string
          category?: string
          created_at?: string
          description?: string
          emoji?: string
          facebook_url?: string | null
          id?: string
          image_urls?: string[]
          pdf_url?: string | null
          price?: number
          seller_id?: string
          status?: string
          title?: string
          updated_at?: string
          views?: number
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          location: string | null
          phone: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          location?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          association_id: string
          buyer_id: string
          cancel_reason: string | null
          contact: string
          created_at: string
          id: string
          message: string
          product_id: string
          quantity: number
          reminder_count: number
          status: string
          updated_at: string
        }
        Insert: {
          association_id?: string
          buyer_id: string
          cancel_reason?: string | null
          contact?: string
          created_at?: string
          id: string
          message?: string
          product_id: string
          quantity?: number
          reminder_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          buyer_id?: string
          cancel_reason?: string | null
          contact?: string
          created_at?: string
          id?: string
          message?: string
          product_id?: string
          quantity?: number
          reminder_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          owner_user_id: string
          target_card_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          owner_user_id: string
          target_card_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          owner_user_id?: string
          target_card_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_events_target_card_id_fkey"
            columns: ["target_card_id"]
            isOneToOne: false
            referencedRelation: "member_business_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_intelligence_interactions: {
        Row: {
          id: string
          kind: string
          occurred_at: string
          recommendation_type: string | null
          viewer_user_id: string
        }
        Insert: {
          id?: string
          kind: string
          occurred_at?: string
          recommendation_type?: string | null
          viewer_user_id: string
        }
        Update: {
          id?: string
          kind?: string
          occurred_at?: string
          recommendation_type?: string | null
          viewer_user_id?: string
        }
        Relationships: []
      }
      relationship_intelligence_preferences: {
        Row: {
          behavioral_adaptation_enabled: boolean
          created_at: string
          policy_version: string
          preferred_contact_action: string
          recommendations_enabled: boolean
          reconnect_cadence: string
          reconnect_enabled: boolean
          updated_at: string
          viewer_user_id: string
        }
        Insert: {
          behavioral_adaptation_enabled?: boolean
          created_at?: string
          policy_version?: string
          preferred_contact_action?: string
          recommendations_enabled?: boolean
          reconnect_cadence?: string
          reconnect_enabled?: boolean
          updated_at?: string
          viewer_user_id: string
        }
        Update: {
          behavioral_adaptation_enabled?: boolean
          created_at?: string
          policy_version?: string
          preferred_contact_action?: string
          recommendations_enabled?: boolean
          reconnect_cadence?: string
          reconnect_enabled?: boolean
          updated_at?: string
          viewer_user_id?: string
        }
        Relationships: []
      }
      relationship_recommendation_dismissals: {
        Row: {
          created_at: string
          dismissed_until: string
          id: string
          owner_user_id: string
          person_id: string
          recommendation_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dismissed_until: string
          id?: string
          owner_user_id: string
          person_id: string
          recommendation_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dismissed_until?: string
          id?: string
          owner_user_id?: string
          person_id?: string
          recommendation_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      renewal_audit_log: {
        Row: {
          amount_paid: number
          association_id: string
          created_at: string
          error_code: string | null
          error_message: string | null
          event_type: string
          id: string
          invoice_no: string | null
          ip_address: string | null
          member_id: string
          metadata: Json
          method: string | null
          new_term_end: string | null
          previous_renewed_at: string | null
          previous_term_end: string | null
          reference: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          amount_paid?: number
          association_id: string
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          invoice_no?: string | null
          ip_address?: string | null
          member_id: string
          metadata?: Json
          method?: string | null
          new_term_end?: string | null
          previous_renewed_at?: string | null
          previous_term_end?: string | null
          reference: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          association_id?: string
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          invoice_no?: string | null
          ip_address?: string | null
          member_id?: string
          metadata?: Json
          method?: string | null
          new_term_end?: string | null
          previous_renewed_at?: string | null
          previous_term_end?: string | null
          reference?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "renewal_audit_log_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewal_audit_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      reply_templates: {
        Row: {
          association_id: string
          body_en: string
          body_vi: string
          channel: string
          created_at: string
          id: string
          is_active: boolean
          label_en: string
          label_vi: string
          priority: number
          subject_en: string | null
          subject_vi: string | null
          updated_at: string
        }
        Insert: {
          association_id: string
          body_en?: string
          body_vi?: string
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label_en?: string
          label_vi?: string
          priority?: number
          subject_en?: string | null
          subject_vi?: string | null
          updated_at?: string
        }
        Update: {
          association_id?: string
          body_en?: string
          body_vi?: string
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label_en?: string
          label_vi?: string
          priority?: number
          subject_en?: string | null
          subject_vi?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reply_templates_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          association_id: string
          comment: string
          created_at: string
          id: string
          rating: number
          review_type: string
          reviewer_id: string
          reviewer_name: string
          seller_id: string
        }
        Insert: {
          association_id?: string
          comment?: string
          created_at?: string
          id?: string
          rating: number
          review_type?: string
          reviewer_id: string
          reviewer_name?: string
          seller_id: string
        }
        Update: {
          association_id?: string
          comment?: string
          created_at?: string
          id?: string
          rating?: number
          review_type?: string
          reviewer_id?: string
          reviewer_name?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      role_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          association_id: string | null
          created_at: string
          details: Json | null
          id: string
          new_role: string | null
          old_role: string | null
          target_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          association_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          new_role?: string | null
          old_role?: string | null
          target_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          association_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          new_role?: string | null
          old_role?: string | null
          target_email?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      saved_business_card_tags: {
        Row: {
          created_at: string
          saved_card_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          saved_card_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          saved_card_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_business_card_tags_saved_card_id_fkey"
            columns: ["saved_card_id"]
            isOneToOne: false
            referencedRelation: "saved_business_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_business_card_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "saved_card_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_business_cards: {
        Row: {
          anniversary: string | null
          archived: boolean
          birthday: string | null
          collection_id: string | null
          color: string | null
          company: string | null
          company_id: string | null
          created_at: string
          event: string | null
          favorite: boolean
          first_met_at: string | null
          id: string
          importance: number
          industry: string | null
          interest: string | null
          labels: string[]
          last_contact_at: string | null
          last_opened: string | null
          last_scan_at: string | null
          last_viewed_at: string | null
          meeting_place: string | null
          met_at: string | null
          notes: string | null
          open_count: number
          owner_user_id: string
          priority: string | null
          referral: string | null
          reminder_at: string | null
          saved_at: string
          source: string
          source_metadata: Json
          tags: string[]
          target_card_id: string
          updated_at: string
        }
        Insert: {
          anniversary?: string | null
          archived?: boolean
          birthday?: string | null
          collection_id?: string | null
          color?: string | null
          company?: string | null
          company_id?: string | null
          created_at?: string
          event?: string | null
          favorite?: boolean
          first_met_at?: string | null
          id?: string
          importance?: number
          industry?: string | null
          interest?: string | null
          labels?: string[]
          last_contact_at?: string | null
          last_opened?: string | null
          last_scan_at?: string | null
          last_viewed_at?: string | null
          meeting_place?: string | null
          met_at?: string | null
          notes?: string | null
          open_count?: number
          owner_user_id: string
          priority?: string | null
          referral?: string | null
          reminder_at?: string | null
          saved_at?: string
          source?: string
          source_metadata?: Json
          tags?: string[]
          target_card_id: string
          updated_at?: string
        }
        Update: {
          anniversary?: string | null
          archived?: boolean
          birthday?: string | null
          collection_id?: string | null
          color?: string | null
          company?: string | null
          company_id?: string | null
          created_at?: string
          event?: string | null
          favorite?: boolean
          first_met_at?: string | null
          id?: string
          importance?: number
          industry?: string | null
          interest?: string | null
          labels?: string[]
          last_contact_at?: string | null
          last_opened?: string | null
          last_scan_at?: string | null
          last_viewed_at?: string | null
          meeting_place?: string | null
          met_at?: string | null
          notes?: string | null
          open_count?: number
          owner_user_id?: string
          priority?: string | null
          referral?: string | null
          reminder_at?: string | null
          saved_at?: string
          source?: string
          source_metadata?: Json
          tags?: string[]
          target_card_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_business_cards_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "saved_card_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_business_cards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_business_cards_target_card_id_fkey"
            columns: ["target_card_id"]
            isOneToOne: false
            referencedRelation: "member_business_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_card_collections: {
        Row: {
          archived_at: string | null
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          kind: string
          name: string
          normalized_name: string
          owner_user_id: string
          position: number
          slug: string
          sort_order: number
          system_key: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          kind?: string
          name: string
          normalized_name: string
          owner_user_id: string
          position?: number
          slug: string
          sort_order?: number
          system_key?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          kind?: string
          name?: string
          normalized_name?: string
          owner_user_id?: string
          position?: number
          slug?: string
          sort_order?: number
          system_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_card_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          normalized_name: string
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          normalized_name: string
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          normalized_name?: string
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sponsor_packages: {
        Row: {
          association_id: string
          available: number
          benefits: string[]
          created_at: string
          id: string
          price: number
          sold: number
          tier: string
          updated_at: string
        }
        Insert: {
          association_id?: string
          available?: number
          benefits?: string[]
          created_at?: string
          id: string
          price?: number
          sold?: number
          tier?: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          available?: number
          benefits?: string[]
          created_at?: string
          id?: string
          price?: number
          sold?: number
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_packages_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          amount: number
          association_id: string
          contact: string
          created_at: string
          email: string
          events: number
          id: string
          name: string
          phone: string
          since: string
          status: string
          tier: string
          updated_at: string
        }
        Insert: {
          amount?: number
          association_id?: string
          contact?: string
          created_at?: string
          email?: string
          events?: number
          id: string
          name: string
          phone?: string
          since: string
          status?: string
          tier?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          association_id?: string
          contact?: string
          created_at?: string
          email?: string
          events?: number
          id?: string
          name?: string
          phone?: string
          since?: string
          status?: string
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_rate_limits: {
        Row: {
          count: number
          ip: string
          updated_at: string
          window_start: string
        }
        Insert: {
          count?: number
          ip: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          count?: number
          ip?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          association_id: string
          category: string
          code: string
          created_at: string
          date: string
          description: string
          id: string
          method: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          association_id?: string
          category: string
          code: string
          created_at?: string
          date: string
          description?: string
          id?: string
          method: string
          status: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          association_id?: string
          category?: string
          code?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          method?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_connection_events: {
        Row: {
          actor_user_id: string
          connection_id: string
          counterpart_user_id: string
          created_at: string
          id: string
          mutation_key: string | null
          occurred_at: string
          source_id: string | null
          source_type:
            | Database["public"]["Enums"]["global_connection_source_type"]
            | null
          transition: string
        }
        Insert: {
          actor_user_id: string
          connection_id: string
          counterpart_user_id: string
          created_at?: string
          id?: string
          mutation_key?: string | null
          occurred_at?: string
          source_id?: string | null
          source_type?:
            | Database["public"]["Enums"]["global_connection_source_type"]
            | null
          transition: string
        }
        Update: {
          actor_user_id?: string
          connection_id?: string
          counterpart_user_id?: string
          created_at?: string
          id?: string
          mutation_key?: string | null
          occurred_at?: string
          source_id?: string | null
          source_type?:
            | Database["public"]["Enums"]["global_connection_source_type"]
            | null
          transition?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_connection_events_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "user_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      user_connections: {
        Row: {
          blocked_by_user_id: string | null
          created_at: string
          disconnected_at: string | null
          id: string
          pair_user_high: string | null
          pair_user_low: string | null
          recipient_user_id: string
          requested_at: string
          requester_user_id: string
          responded_at: string | null
          source_id: string | null
          source_type: Database["public"]["Enums"]["global_connection_source_type"]
          status: Database["public"]["Enums"]["global_connection_status"]
          status_reason: string | null
          updated_at: string
        }
        Insert: {
          blocked_by_user_id?: string | null
          created_at?: string
          disconnected_at?: string | null
          id?: string
          pair_user_high?: string | null
          pair_user_low?: string | null
          recipient_user_id: string
          requested_at?: string
          requester_user_id: string
          responded_at?: string | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["global_connection_source_type"]
          status?: Database["public"]["Enums"]["global_connection_status"]
          status_reason?: string | null
          updated_at?: string
        }
        Update: {
          blocked_by_user_id?: string | null
          created_at?: string
          disconnected_at?: string | null
          id?: string
          pair_user_high?: string | null
          pair_user_low?: string | null
          recipient_user_id?: string
          requested_at?: string
          requester_user_id?: string
          responded_at?: string | null
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["global_connection_source_type"]
          status?: Database["public"]["Enums"]["global_connection_status"]
          status_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_device_sessions: {
        Row: {
          browser: string | null
          created_at: string
          device_key: string
          device_label: string | null
          first_seen_at: string
          id: string
          is_standalone: boolean
          last_seen_at: string
          platform: string | null
          revoked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_key: string
          device_label?: string | null
          first_seen_at?: string
          id?: string
          is_standalone?: boolean
          last_seen_at?: string
          platform?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_key?: string
          device_label?: string | null
          first_seen_at?: string
          id?: string
          is_standalone?: boolean
          last_seen_at?: string
          platform?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string
          display_name: string | null
          industry: string | null
          locale: string
          onboarding_status: Database["public"]["Enums"]["onboarding_status"]
          professional_title: string | null
          region: string | null
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          industry?: string | null
          locale?: string
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          professional_title?: string | null
          region?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          industry?: string | null
          locale?: string
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          professional_title?: string | null
          region?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          email_notif: boolean
          lang: string | null
          org_email: string | null
          org_name: string | null
          sms_notif: boolean
          two_fa: boolean
          updated_at: string
          user_id: string
          voting_open_pref: string | null
        }
        Insert: {
          created_at?: string
          email_notif?: boolean
          lang?: string | null
          org_email?: string | null
          org_name?: string | null
          sms_notif?: boolean
          two_fa?: boolean
          updated_at?: string
          user_id: string
          voting_open_pref?: string | null
        }
        Update: {
          created_at?: string
          email_notif?: boolean
          lang?: string | null
          org_email?: string | null
          org_name?: string | null
          sms_notif?: boolean
          two_fa?: boolean
          updated_at?: string
          user_id?: string
          voting_open_pref?: string | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          association_id: string
          created_at: string
          eligible: number
          ends_at: string
          id: string
          options: Json
          starts_at: string
          status: string
          title: string
          type: string
          updated_at: string
          voted: number
        }
        Insert: {
          association_id?: string
          created_at?: string
          eligible?: number
          ends_at: string
          id: string
          options?: Json
          starts_at: string
          status?: string
          title: string
          type?: string
          updated_at?: string
          voted?: number
        }
        Update: {
          association_id?: string
          created_at?: string
          eligible?: number
          ends_at?: string
          id?: string
          options?: Json
          starts_at?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
          voted?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _intro_analytics_add_duration: {
        Args: {
          p_confidence_bucket: string
          p_duration_seconds: number
          p_metric_date: string
          p_metric_kind: string
          p_path_depth: number
          p_scopes: Json
          p_source_event_id: string
        }
        Returns: undefined
      }
      _intro_analytics_bump: {
        Args: {
          p_confidence_bucket: string
          p_counter: string
          p_delta: number
          p_metric_date: string
          p_path_depth: number
          p_scopes: Json
        }
        Returns: undefined
      }
      _intro_analytics_bump_seconds: {
        Args: {
          p_confidence_bucket: string
          p_delta: number
          p_metric_date: string
          p_path_depth: number
          p_scopes: Json
          p_seconds_col: string
        }
        Returns: undefined
      }
      _intro_analytics_scopes: {
        Args: { p_intermediary_uid: string; p_requester_uid: string }
        Returns: Json
      }
      add_member_notification: {
        Args: {
          _assoc: string
          _body: string
          _recipient: string
          _title: string
          _type: string
        }
        Returns: undefined
      }
      bc_admin_level: { Args: { _uid: string }; Returns: string }
      bc_dm_is_participant: {
        Args: { _thread_id: string; _user_id: string }
        Returns: boolean
      }
      bc_dm_pair_allowed: {
        Args: { _high: string; _low: string }
        Returns: boolean
      }
      bc_rm_owns_memory: { Args: { _memory_id: string }; Returns: boolean }
      bcai_accept_result: { Args: { p_result_id: string }; Returns: undefined }
      bcai_claim_request: {
        Args: {
          p_capability: string
          p_context_hash: string
          p_estimated_cost_millicents: number
          p_expires_at: string
          p_idempotency_signature: string
          p_model_policy_class: string
          p_policy_version: string
          p_prompt_version: string
          p_scope_ref: string
          p_scope_type: string
          p_source_versions: Json
          p_tenant_scope_opaque: string
          p_timeout_ms: number
          p_token_budget: number
          p_user_idempotency_key: string
        }
        Returns: {
          canonical_result_id: string
          existing_status: string
          is_new: boolean
          request_id: string
        }[]
      }
      bcai_increment_rate: {
        Args: { p_capability: string; p_daily_limit: number }
        Returns: {
          allowed: boolean
          current_count: number
          daily_limit: number
        }[]
      }
      bcai_record_result: {
        Args: {
          p_cache_hit: boolean
          p_context_hash: string
          p_expires_at: string
          p_meta: Json
          p_model_id: string
          p_model_policy_class: string
          p_payload: Json
          p_policy_version: string
          p_prompt_version: string
          p_provider_id: string
          p_request_id: string
          p_source_versions: Json
        }
        Returns: string
      }
      bcai_record_tool_invocation: {
        Args: {
          p_error_code: string
          p_input_summary: Json
          p_iteration: number
          p_latency_ms: number
          p_output_summary: Json
          p_request_id: string
          p_status: string
          p_tool_name: string
        }
        Returns: string
      }
      bcai_reject_result: {
        Args: { p_reason: string; p_result_id: string }
        Returns: undefined
      }
      bcai_transition_request: {
        Args: {
          p_actual_cost_millicents: number
          p_error_code: string
          p_latency_ms: number
          p_model_id: string
          p_next_status: string
          p_provider_id: string
          p_reason: string
          p_request_id: string
        }
        Returns: undefined
      }
      bm_all_required_accepted: {
        Args: { _meeting_id: string }
        Returns: boolean
      }
      bm_eligibility_source: {
        Args: { _organizer: string; _target: string }
        Returns: string
      }
      bm_is_participant: {
        Args: { _meeting: string; _uid: string }
        Returns: boolean
      }
      bm_log_event: {
        Args: {
          _actor: string
          _meeting: string
          _meta: Json
          _mkey: string
          _source: Database["public"]["Enums"]["business_meeting_source_type"]
          _type: string
          _version: number
        }
        Returns: undefined
      }
      bm_pair_blocked: { Args: { _a: string; _b: string }; Returns: boolean }
      bm_require_user: { Args: never; Returns: string }
      bm_valid_timezone: { Args: { _tz: string }; Returns: boolean }
      bm_validate_timing: {
        Args: { _end: string; _start: string; _tz: string }
        Returns: undefined
      }
      bmai_authorize_organizer: {
        Args: { _meeting_id: string; _uid: string }
        Returns: undefined
      }
      bmai_is_agenda_eligible: {
        Args: {
          _status: Database["public"]["Enums"]["business_meeting_status"]
        }
        Returns: boolean
      }
      bmfu_actor_authorised: {
        Args: { _meeting: string; _user: string }
        Returns: boolean
      }
      bmfu_is_organizer: {
        Args: { _meeting: string; _user: string }
        Returns: boolean
      }
      bmfu_owner_eligible: {
        Args: { _meeting: string; _user: string }
        Returns: boolean
      }
      bmo_is_meeting_eligible: {
        Args: {
          _status: Database["public"]["Enums"]["business_meeting_status"]
        }
        Returns: boolean
      }
      bmsn_authorize_organizer: {
        Args: { _meeting_id: string; _uid: string }
        Returns: undefined
      }
      bnotif_archive: {
        Args: { _id: string }
        Returns: {
          action_kind: string | null
          action_label_key: string | null
          action_target: Json | null
          archived_at: string | null
          body_key: string
          created_at: string
          dedupe_key: string
          delivered_at: string | null
          event_kind: string
          expired_at: string | null
          id: string
          notification_kind: string
          policy_version: string
          priority: string
          read_at: string | null
          recipient_user_id: string
          safe_display_data: Json
          scheduled_for: string | null
          schema_version: string
          source_domain: string
          source_event_id: string | null
          source_record_id: string
          status: string
          title_key: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "business_notifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      bnotif_archive_all_read: { Args: never; Returns: number }
      bnotif_claim_dispatches: {
        Args: { _batch: number; _token: string }
        Returns: {
          attempt_count: number
          channel: string
          claimed_at: string | null
          created_at: string
          delivered_at: string | null
          external_reference: string | null
          id: string
          last_error_code: string | null
          next_retry_at: string | null
          notification_id: string
          payload_hash: string | null
          provider: string
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "business_notification_dispatches"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      bnotif_claim_schedules: {
        Args: { _batch: number; _token: string }
        Returns: {
          attempt_count: number
          claim_token: string | null
          claimed_at: string | null
          created_at: string
          dedupe_key: string
          id: string
          last_error_code: string | null
          next_retry_at: string | null
          notification_kind: string
          policy_version: string
          recipient_user_id: string
          scheduled_for: string
          source_domain: string
          source_record_id: string
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "business_notification_schedules"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      bnotif_mark_read: {
        Args: { _id: string }
        Returns: {
          action_kind: string | null
          action_label_key: string | null
          action_target: Json | null
          archived_at: string | null
          body_key: string
          created_at: string
          dedupe_key: string
          delivered_at: string | null
          event_kind: string
          expired_at: string | null
          id: string
          notification_kind: string
          policy_version: string
          priority: string
          read_at: string | null
          recipient_user_id: string
          safe_display_data: Json
          scheduled_for: string | null
          schema_version: string
          source_domain: string
          source_event_id: string | null
          source_record_id: string
          status: string
          title_key: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "business_notifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      bnotif_mark_unread: {
        Args: { _id: string }
        Returns: {
          action_kind: string | null
          action_label_key: string | null
          action_target: Json | null
          archived_at: string | null
          body_key: string
          created_at: string
          dedupe_key: string
          delivered_at: string | null
          event_kind: string
          expired_at: string | null
          id: string
          notification_kind: string
          policy_version: string
          priority: string
          read_at: string | null
          recipient_user_id: string
          safe_display_data: Json
          scheduled_for: string | null
          schema_version: string
          source_domain: string
          source_event_id: string | null
          source_record_id: string
          status: string
          title_key: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "business_notifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      bnotif_recover_stuck: {
        Args: { _threshold_minutes: number }
        Returns: number
      }
      bnotif_unread_count: { Args: never; Returns: number }
      business_availability_preferences_update: {
        Args: {
          _buffer_after_minutes: number
          _buffer_before_minutes: number
          _default_meeting_duration_minutes: number
          _expected_version?: number
          _minimum_notice_minutes: number
          _timezone: string
          _working_days: number[]
          _working_hours: Json
        }
        Returns: {
          buffer_after_minutes: number
          buffer_before_minutes: number
          created_at: string
          default_meeting_duration_minutes: number
          id: string
          minimum_notice_minutes: number
          timezone: string
          updated_at: string
          user_id: string
          version: number
          working_days: number[]
          working_hours: Json
        }
        SetofOptions: {
          from: "*"
          to: "business_availability_preferences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      business_meeting_accept: {
        Args: {
          _meeting_id: string
          _mutation_key?: string
          _proposal_version: number
        }
        Returns: Json
      }
      business_meeting_agenda_item_create: {
        Args: {
          _description?: string
          _estimated_minutes?: number
          _linked_follow_up_id?: string
          _meeting_id: string
          _owner_user_id?: string
          _parent_id?: string
          _title: string
        }
        Returns: Json
      }
      business_meeting_agenda_item_delete: {
        Args: { _expected_version: number; _item_id: string }
        Returns: Json
      }
      business_meeting_agenda_item_set_status: {
        Args: {
          _expected_version: number
          _item_id: string
          _next_status: string
        }
        Returns: Json
      }
      business_meeting_agenda_item_update: {
        Args: {
          _clear_description?: boolean
          _clear_estimated_minutes?: boolean
          _clear_linked_follow_up?: boolean
          _clear_owner?: boolean
          _description?: string
          _estimated_minutes?: number
          _expected_version: number
          _item_id: string
          _linked_follow_up_id?: string
          _owner_user_id?: string
          _title?: string
        }
        Returns: Json
      }
      business_meeting_agenda_reorder: {
        Args: {
          _expected_versions: number[]
          _meeting_id: string
          _ordered_ids: string[]
          _parent_id: string
        }
        Returns: Json
      }
      business_meeting_calendar_projections_claim: {
        Args: { _limit?: number; _now?: string }
        Returns: {
          calendar_account_id: string | null
          created_at: string
          external_event_ref: string | null
          id: string
          last_error_code: string | null
          last_synced_at: string | null
          meeting_id: string
          participant_user_id: string
          permanent_failure: boolean
          provider: string
          retry_after_at: string | null
          retry_count: number
          sync_status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "business_meeting_calendar_projections"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      business_meeting_calendar_sync_reconcile: {
        Args: {
          _error_code?: string
          _external_event_ref?: string
          _meeting_id: string
          _participant_user_id: string
          _provider: string
          _sync_status: string
        }
        Returns: {
          calendar_account_id: string | null
          created_at: string
          external_event_ref: string | null
          id: string
          last_error_code: string | null
          last_synced_at: string | null
          meeting_id: string
          participant_user_id: string
          permanent_failure: boolean
          provider: string
          retry_after_at: string | null
          retry_count: number
          sync_status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "business_meeting_calendar_projections"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      business_meeting_cancel: {
        Args: {
          _expected_version?: number
          _meeting_id: string
          _mutation_key?: string
          _reason?: string
        }
        Returns: Json
      }
      business_meeting_complete: {
        Args: {
          _expected_version?: number
          _meeting_id: string
          _mutation_key?: string
        }
        Returns: Json
      }
      business_meeting_create_draft: {
        Args: {
          _association_id?: string
          _company_id?: string
          _description?: string
          _meeting_type: string
          _mutation_key?: string
          _source_id?: string
          _source_type?: string
          _target_user_id: string
          _timezone?: string
          _title: string
        }
        Returns: Json
      }
      business_meeting_decline: {
        Args: {
          _meeting_id: string
          _mutation_key?: string
          _proposal_version: number
          _reason?: string
        }
        Returns: Json
      }
      business_meeting_follow_up_cancel: {
        Args: { _expected_version: number; _follow_up_id: string }
        Returns: Json
      }
      business_meeting_follow_up_create: {
        Args: {
          _client_request_id?: string
          _description?: string
          _due_at?: string
          _meeting_id: string
          _outcome_id?: string
          _owner_user_id: string
          _priority?: string
          _title: string
        }
        Returns: Json
      }
      business_meeting_follow_up_set_status: {
        Args: {
          _expected_version: number
          _follow_up_id: string
          _target_status: string
        }
        Returns: Json
      }
      business_meeting_follow_up_update: {
        Args: {
          _clear_description?: boolean
          _clear_due_at?: boolean
          _description?: string
          _due_at?: string
          _expected_version: number
          _follow_up_id: string
          _owner_user_id?: string
          _priority?: string
          _title?: string
        }
        Returns: Json
      }
      business_meeting_mark_no_show: {
        Args: {
          _expected_version?: number
          _meeting_id: string
          _mutation_key?: string
        }
        Returns: Json
      }
      business_meeting_outcome_create: {
        Args: {
          _client_request_id?: string
          _meeting_id: string
          _outcome_type: string
          _summary?: string
        }
        Returns: Json
      }
      business_meeting_outcome_finalize: {
        Args: { _expected_version: number; _meeting_id: string }
        Returns: Json
      }
      business_meeting_outcome_update: {
        Args: {
          _clear_summary?: boolean
          _expected_version: number
          _meeting_id: string
          _outcome_type?: string
          _summary?: string
        }
        Returns: Json
      }
      business_meeting_private_note_upsert: {
        Args: {
          _content: string
          _expected_version?: number
          _meeting_id: string
        }
        Returns: Json
      }
      business_meeting_propose: {
        Args: {
          _end_at: string
          _location_text?: string
          _location_type?: string
          _meeting_id: string
          _meeting_url?: string
          _mutation_key?: string
          _proposal_message?: string
          _start_at: string
          _timezone: string
        }
        Returns: Json
      }
      business_meeting_propose_new_time: {
        Args: {
          _base_version: number
          _end_at: string
          _location_text?: string
          _location_type?: string
          _meeting_id: string
          _meeting_url?: string
          _mutation_key?: string
          _proposal_message?: string
          _start_at: string
          _timezone: string
        }
        Returns: Json
      }
      business_meeting_shared_note_get_or_create: {
        Args: { _meeting_id: string }
        Returns: Json
      }
      business_meeting_shared_note_publish: {
        Args: { _expected_version: number; _meeting_id: string }
        Returns: Json
      }
      business_meeting_shared_note_update: {
        Args: {
          _content: string
          _expected_version: number
          _meeting_id: string
        }
        Returns: Json
      }
      business_meeting_tentatively_accept: {
        Args: {
          _meeting_id: string
          _mutation_key?: string
          _proposal_version: number
        }
        Returns: Json
      }
      business_meeting_time_proposal_respond: {
        Args: { _proposal_id: string; _response: string }
        Returns: {
          created_at: string
          id: string
          participant_id: string
          proposal_id: string
          responded_at: string
          response: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "business_meeting_time_proposal_responses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      business_meeting_time_proposal_select: {
        Args: { _expected_meeting_version?: number; _proposal_id: string }
        Returns: {
          client_request_id: string | null
          created_at: string
          end_at: string
          id: string
          meeting_id: string
          proposed_by_user_id: string
          start_at: string
          status: string
          timezone: string
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "business_meeting_time_proposals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      business_meeting_time_proposals_create:
        | {
            Args: { _meeting_id: string; _proposals: Json }
            Returns: {
              client_request_id: string | null
              created_at: string
              end_at: string
              id: string
              meeting_id: string
              proposed_by_user_id: string
              start_at: string
              status: string
              timezone: string
              updated_at: string
              version: number
            }[]
            SetofOptions: {
              from: "*"
              to: "business_meeting_time_proposals"
              isOneToOne: false
              isSetofReturn: true
            }
          }
        | {
            Args: {
              _client_request_id?: string
              _meeting_id: string
              _proposals: Json
            }
            Returns: {
              client_request_id: string | null
              created_at: string
              end_at: string
              id: string
              meeting_id: string
              proposed_by_user_id: string
              start_at: string
              status: string
              timezone: string
              updated_at: string
              version: number
            }[]
            SetofOptions: {
              from: "*"
              to: "business_meeting_time_proposals"
              isOneToOne: false
              isSetofReturn: true
            }
          }
      business_meeting_workspace_list_v1: {
        Args: {
          p_bucket: string
          p_cursor_meeting_id?: string
          p_cursor_sort_at?: string
          p_limit?: number
          p_meeting_type?: string
          p_now?: string
          p_source_type?: string
        }
        Returns: Json
      }
      business_meeting_workspace_summary_v1: {
        Args: { p_now?: string }
        Returns: Json
      }
      business_relationship_memory_apply_candidate: {
        Args: {
          p_candidate: Json
          p_claim_token: string
          p_expected_version?: number
          p_extractor_id: string
          p_extractor_version: string
          p_receipt_id: string
        }
        Returns: Json
      }
      business_relationship_memory_supersede: {
        Args: {
          p_candidate: Json
          p_claim_token: string
          p_expected_version: number
          p_old_memory_id: string
          p_receipt_id: string
        }
        Returns: Json
      }
      check_and_increment_sync_rate: {
        Args: { _ip: string; _max: number; _window_seconds: number }
        Returns: boolean
      }
      claim_relationship_memory_extraction_receipts: {
        Args: {
          p_claim_token: string
          p_extractor_id: string
          p_limit: number
          p_stale_after_seconds?: number
        }
        Returns: {
          attempt_count: number
          claim_token: string
          extractor_id: string
          extractor_version: string
          id: string
          owner_user_id: string
          row_version: number
          source_domain: string
          source_record_id: string
          source_version: string
        }[]
      }
      complete_relationship_memory_extraction_receipt: {
        Args: {
          p_candidate_count: number
          p_claim_token: string
          p_id: string
          p_partial: boolean
        }
        Returns: {
          applied: boolean
          new_row_version: number
          new_status: string
        }[]
      }
      current_association_id: { Args: never; Returns: string }
      current_member_id: { Args: never; Returns: string }
      ensure_my_member_profile: { Args: never; Returns: string }
      fail_relationship_memory_extraction_receipt: {
        Args: { p_claim_token: string; p_error: string; p_id: string }
        Returns: {
          applied: boolean
          new_row_version: number
          new_status: string
        }[]
      }
      global_connection_accept: {
        Args: { _connection_id: string; _mutation_key?: string }
        Returns: Json
      }
      global_connection_block: {
        Args: {
          _mutation_key?: string
          _reason?: string
          _target_user_id: string
        }
        Returns: Json
      }
      global_connection_cancel: {
        Args: { _connection_id: string; _mutation_key?: string }
        Returns: Json
      }
      global_connection_decline: {
        Args: {
          _connection_id: string
          _mutation_key?: string
          _reason?: string
        }
        Returns: Json
      }
      global_connection_disconnect: {
        Args: {
          _connection_id: string
          _mutation_key?: string
          _reason?: string
        }
        Returns: Json
      }
      global_connection_send_request: {
        Args: {
          _mutation_key?: string
          _source_id?: string
          _source_type?: string
          _target_user_id: string
        }
        Returns: Json
      }
      global_connection_send_request_guarded: {
        Args: {
          _mutation_key?: string
          _source_id?: string
          _source_type?: string
          _target_user_id: string
        }
        Returns: Json
      }
      gn_actor_public_summary: { Args: { _uid: string }; Returns: Json }
      gn_apply_transition: {
        Args: {
          _conn: string
          _mutation_key: string
          _op: string
          _reason: string
        }
        Returns: Json
      }
      gn_log_event: {
        Args: {
          _actor: string
          _conn: string
          _counterpart: string
          _mkey: string
          _source: Database["public"]["Enums"]["global_connection_source_type"]
          _source_id: string
          _transition: string
        }
        Returns: undefined
      }
      gn_mark_notifications_read: { Args: { _ids?: string[] }; Returns: number }
      gn_report_set_status: {
        Args: { _note?: string; _report_id: string; _status: string }
        Returns: undefined
      }
      gn_report_user: {
        Args: {
          _category: string
          _connection_id?: string
          _details?: string
          _reported_user_id: string
        }
        Returns: string
      }
      gn_require_user: { Args: never; Returns: string }
      graph_archive_edge: { Args: { _edge_id: string }; Returns: undefined }
      graph_archive_node: { Args: { _node_id: string }; Returns: undefined }
      graph_can_read_node: {
        Args: { _node: Database["public"]["Tables"]["graph_nodes"]["Row"] }
        Returns: boolean
      }
      graph_can_read_node_id: { Args: { _node_id: string }; Returns: boolean }
      graph_create_edge: {
        Args: {
          _directionality: string
          _edge_kind: string
          _idempotency_key: string
          _metadata: Json
          _registry_version: number
          _source_node_id: string
          _target_node_id: string
          _tenant_scope_id: string
          _tenant_scope_type: string
          _timeline_emit: boolean
          _timeline_summary_key: string
          _visibility_class: string
        }
        Returns: string
      }
      graph_emit_outbox_event: {
        Args: {
          _aggregate_id: string
          _aggregate_type: string
          _event_kind: string
          _idempotency_key: string
          _payload: Json
        }
        Returns: string
      }
      graph_record_timeline_event: {
        Args: {
          _actor_node_id: string
          _actor_user_id: string
          _collapse_key: string
          _dedupe_key: string
          _edge_id: string
          _event_kind: string
          _metadata: Json
          _registry_version: number
          _related_node_id: string
          _subject_node_id: string
          _summary_key: string
          _tenant_scope_id: string
          _tenant_scope_type: string
          _visibility_class: string
        }
        Returns: string
      }
      graph_register_node: {
        Args: {
          _external_ref_id: string
          _external_ref_type: string
          _metadata: Json
          _node_kind: string
          _registry_version: number
          _tenant_scope_id: string
          _tenant_scope_type: string
          _visibility_class: string
        }
        Returns: string
      }
      graph_restore_edge: { Args: { _edge_id: string }; Returns: undefined }
      graph_restore_node: { Args: { _node_id: string }; Returns: undefined }
      graph_timeline_event_get: {
        Args: { _event_id: string }
        Returns: {
          actor_node_id: string | null
          actor_user_id: string | null
          archived_at: string | null
          collapse_key: string | null
          created_at: string
          dedupe_key: string | null
          edge_id: string | null
          event_kind: string
          id: string
          metadata: Json
          occurred_at: string
          registry_version: number
          related_node_id: string | null
          subject_node_id: string
          summary_key: string
          tenant_scope_id: string | null
          tenant_scope_type: string
          visibility_class: string
        }[]
        SetofOptions: {
          from: "*"
          to: "graph_timeline_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      graph_update_edge_metadata: {
        Args: { _edge_id: string; _metadata: Json }
        Returns: undefined
      }
      graph_user_in_scope: {
        Args: { _scope_id: string; _scope_type: string }
        Returns: boolean
      }
      graph_user_owns_node: {
        Args: { _node: Database["public"]["Tables"]["graph_nodes"]["Row"] }
        Returns: boolean
      }
      graph_viewer_connected_to: {
        Args: { _node_id: string }
        Returns: boolean
      }
      greatest_text_sensitivity: {
        Args: { a: string; b: string }
        Returns: string
      }
      has_assoc_role: {
        Args: {
          _association_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      intro_analytics_authorize: {
        Args: { p_scope_id: string; p_scope_type: string }
        Returns: boolean
      }
      intro_analytics_confidence_from_snapshot: {
        Args: { snap: Json }
        Returns: string
      }
      intro_analytics_confidence_performance: {
        Args: {
          p_from: string
          p_path_depth?: number
          p_scope_id: string
          p_scope_type: string
          p_to: string
        }
        Returns: {
          accepted_count: number
          acknowledged_count: number
          confidence_bucket: string
          connected_count: number
          delivered_count: number
          progressed_count: number
          requested_count: number
        }[]
      }
      intro_analytics_depth_from_snapshot: {
        Args: { snap: Json }
        Returns: number
      }
      intro_analytics_intermediary_impact: {
        Args: { p_from: string; p_to: string }
        Returns: {
          accepted_count: number
          acknowledged_count: number
          connected_count: number
          delivered_count: number
          median_deliver_seconds: number
          progressed_count: number
          requested_count: number
        }[]
      }
      intro_analytics_overview: {
        Args: {
          p_confidence?: string
          p_from: string
          p_path_depth?: number
          p_scope_id: string
          p_scope_type: string
          p_to: string
        }
        Returns: {
          accepted_count: number
          acknowledged_count: number
          closed_no_outcome_count: number
          connected_count: number
          delivered_count: number
          expired_count: number
          not_connected_count: number
          progressed_count: number
          requested_count: number
          total_accept_seconds: number
          total_ack_seconds: number
          total_connect_seconds: number
          total_delivery_seconds: number
          total_progressed_seconds: number
        }[]
      }
      intro_analytics_path_performance: {
        Args: {
          p_confidence?: string
          p_from: string
          p_scope_id: string
          p_scope_type: string
          p_to: string
        }
        Returns: {
          accepted_count: number
          acknowledged_count: number
          connected_count: number
          delivered_count: number
          path_depth: number
          progressed_count: number
          requested_count: number
        }[]
      }
      intro_analytics_time_to_outcome: {
        Args: {
          p_confidence?: string
          p_from: string
          p_path_depth?: number
          p_scope_id: string
          p_scope_type: string
          p_to: string
        }
        Returns: {
          metric_kind: string
          p50_seconds: number
          p75_seconds: number
          p90_seconds: number
          sample_size: number
        }[]
      }
      intro_analytics_trend: {
        Args: {
          p_confidence?: string
          p_from: string
          p_path_depth?: number
          p_scope_id: string
          p_scope_type: string
          p_to: string
        }
        Returns: {
          accepted_count: number
          acknowledged_count: number
          closed_no_outcome_count: number
          connected_count: number
          delivered_count: number
          expired_count: number
          metric_date: string
          not_connected_count: number
          progressed_count: number
          requested_count: number
        }[]
      }
      intro_delivery_acknowledge: {
        Args: { p_id: string }
        Returns: {
          acknowledged_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_note: string | null
          delivery_snapshot: Json
          expires_at: string
          id: string
          idempotency_key: string | null
          intermediary_person_node_id: string
          intermediary_user_id: string
          introduction_request_id: string
          requester_person_node_id: string
          requester_user_id: string
          revoked_at: string | null
          status: string
          target_person_node_id: string
          target_user_id: string
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "introduction_deliveries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      intro_delivery_deliver: {
        Args: {
          p_delivery_note: string
          p_delivery_snapshot: Json
          p_idempotency_key: string
          p_introduction_request_id: string
        }
        Returns: {
          acknowledged_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_note: string | null
          delivery_snapshot: Json
          expires_at: string
          id: string
          idempotency_key: string | null
          intermediary_person_node_id: string
          intermediary_user_id: string
          introduction_request_id: string
          requester_person_node_id: string
          requester_user_id: string
          revoked_at: string | null
          status: string
          target_person_node_id: string
          target_user_id: string
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "introduction_deliveries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      intro_delivery_revoke: {
        Args: { p_id: string }
        Returns: {
          acknowledged_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_note: string | null
          delivery_snapshot: Json
          expires_at: string
          id: string
          idempotency_key: string | null
          intermediary_person_node_id: string
          intermediary_user_id: string
          introduction_request_id: string
          requester_person_node_id: string
          requester_user_id: string
          revoked_at: string | null
          status: string
          target_person_node_id: string
          target_user_id: string
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "introduction_deliveries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      intro_ops_adapter_stats: {
        Args: {
          _association_id?: string
          _range_hours?: number
          _scope?: string
        }
        Returns: Json
      }
      intro_ops_alert_acknowledge: {
        Args: { _alert_id: string }
        Returns: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          association_id: string | null
          category: string
          created_at: string
          details: Json
          first_seen_at: string
          id: string
          last_seen_at: string
          message: string
          occurrence_count: number
          resolved_at: string | null
          rule_key: string
          scope: string
          severity: string
          state: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "introduction_ops_alerts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      intro_ops_alert_resolve: {
        Args: { _alert_id: string }
        Returns: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          association_id: string | null
          category: string
          created_at: string
          details: Json
          first_seen_at: string
          id: string
          last_seen_at: string
          message: string
          occurrence_count: number
          resolved_at: string | null
          rule_key: string
          scope: string
          severity: string
          state: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "introduction_ops_alerts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      intro_ops_alerts_evaluate: { Args: never; Returns: Json }
      intro_ops_alerts_evaluate_recorded: { Args: never; Returns: Json }
      intro_ops_alerts_list: {
        Args: {
          _association_id?: string
          _limit?: number
          _scope?: string
          _state?: string
        }
        Returns: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          association_id: string | null
          category: string
          created_at: string
          details: Json
          first_seen_at: string
          id: string
          last_seen_at: string
          message: string
          occurrence_count: number
          resolved_at: string | null
          rule_key: string
          scope: string
          severity: string
          state: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "introduction_ops_alerts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      intro_ops_alerts_raise_or_refresh: {
        Args: {
          _category: string
          _details: Json
          _message: string
          _rule_key: string
          _severity: string
        }
        Returns: undefined
      }
      intro_ops_assert_view: {
        Args: { _association_id: string; _scope: string }
        Returns: undefined
      }
      intro_ops_can_view: {
        Args: { _association_id: string; _scope: string }
        Returns: boolean
      }
      intro_ops_consumer_runs: {
        Args: { _association_id?: string; _limit?: number; _scope?: string }
        Returns: {
          adapter_name: string | null
          batch_id: string | null
          created_at: string
          details: Json
          error_code: string | null
          events_claimed: number
          events_deadlettered: number
          events_delivered: number
          events_failed: number
          finished_at: string | null
          id: string
          started_at: string
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "introduction_ops_consumer_runs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      intro_ops_deliveries_stats: {
        Args: {
          _association_id?: string
          _range_hours?: number
          _scope?: string
        }
        Returns: Json
      }
      intro_ops_health_summary: {
        Args: { _association_id?: string; _scope?: string }
        Returns: Json
      }
      intro_ops_outbox_stats: {
        Args: { _association_id?: string; _scope?: string }
        Returns: Json
      }
      intro_ops_outcomes_stats: {
        Args: {
          _association_id?: string
          _range_hours?: number
          _scope?: string
        }
        Returns: Json
      }
      intro_ops_raise_alert: {
        Args: {
          _association_id: string
          _category: string
          _details?: Json
          _message: string
          _rule_key: string
          _scope: string
          _severity: string
        }
        Returns: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          association_id: string | null
          category: string
          created_at: string
          details: Json
          first_seen_at: string
          id: string
          last_seen_at: string
          message: string
          occurrence_count: number
          resolved_at: string | null
          rule_key: string
          scope: string
          severity: string
          state: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "introduction_ops_alerts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      intro_ops_record_consumer_run: {
        Args: {
          _adapter_name: string
          _batch_id: string
          _details?: Json
          _error_code?: string
          _events_claimed?: number
          _events_deadlettered?: number
          _events_delivered?: number
          _events_failed?: number
          _finished_at: string
          _started_at: string
          _status: string
        }
        Returns: string
      }
      intro_ops_record_job_run: {
        Args: {
          _details?: Json
          _error_code?: string
          _error_message?: string
          _finished_at: string
          _job_name: string
          _rows_processed?: number
          _started_at: string
          _status: string
        }
        Returns: string
      }
      intro_ops_requests_stats: {
        Args: {
          _association_id?: string
          _range_hours?: number
          _scope?: string
        }
        Returns: Json
      }
      intro_ops_scheduler_runs: {
        Args: { _association_id?: string; _limit?: number; _scope?: string }
        Returns: {
          created_at: string
          details: Json
          error_code: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          job_name: string
          rows_processed: number
          started_at: string
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "introduction_ops_job_runs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      intro_ops_thresholds: { Args: never; Returns: Json }
      intro_ops_user_in_association: {
        Args: { _association_id: string; _user_id: string }
        Returns: boolean
      }
      intro_outcome_create_on_ack: {
        Args: { p_delivery_id: string }
        Returns: {
          acknowledged_at: string | null
          connection_observed_at: string | null
          created_at: string
          expires_at: string
          id: string
          intermediary_person_node_id: string
          intermediary_user_id: string
          introduction_delivery_id: string
          introduction_request_id: string
          outcome_note: string | null
          outcome_source: string | null
          outcome_type: string | null
          progressed_at: string | null
          requester_person_node_id: string
          requester_user_id: string
          resolved_at: string | null
          status: string
          target_person_node_id: string
          target_user_id: string
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "introduction_outcomes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      intro_outcome_emit_event: {
        Args: {
          _event_kind: string
          _outcome: Database["public"]["Tables"]["introduction_outcomes"]["Row"]
        }
        Returns: undefined
      }
      intro_outcome_expire: {
        Args: { p_outcome_id: string }
        Returns: {
          acknowledged_at: string | null
          connection_observed_at: string | null
          created_at: string
          expires_at: string
          id: string
          intermediary_person_node_id: string
          intermediary_user_id: string
          introduction_delivery_id: string
          introduction_request_id: string
          outcome_note: string | null
          outcome_source: string | null
          outcome_type: string | null
          progressed_at: string | null
          requester_person_node_id: string
          requester_user_id: string
          resolved_at: string | null
          status: string
          target_person_node_id: string
          target_user_id: string
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "introduction_outcomes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      intro_outcome_expire_sweep: {
        Args: { p_limit?: number }
        Returns: number
      }
      intro_outcome_expire_sweep_recorded: {
        Args: { p_limit?: number }
        Returns: number
      }
      intro_outcome_mark_no_outcome: {
        Args: { p_outcome_id: string }
        Returns: {
          acknowledged_at: string | null
          connection_observed_at: string | null
          created_at: string
          expires_at: string
          id: string
          intermediary_person_node_id: string
          intermediary_user_id: string
          introduction_delivery_id: string
          introduction_request_id: string
          outcome_note: string | null
          outcome_source: string | null
          outcome_type: string | null
          progressed_at: string | null
          requester_person_node_id: string
          requester_user_id: string
          resolved_at: string | null
          status: string
          target_person_node_id: string
          target_user_id: string
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "introduction_outcomes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      intro_outcome_mark_progressed: {
        Args: { p_note?: string; p_outcome_id: string }
        Returns: {
          acknowledged_at: string | null
          connection_observed_at: string | null
          created_at: string
          expires_at: string
          id: string
          intermediary_person_node_id: string
          intermediary_user_id: string
          introduction_delivery_id: string
          introduction_request_id: string
          outcome_note: string | null
          outcome_source: string | null
          outcome_type: string | null
          progressed_at: string | null
          requester_person_node_id: string
          requester_user_id: string
          resolved_at: string | null
          status: string
          target_person_node_id: string
          target_user_id: string
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "introduction_outcomes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      intro_outcome_observe_connection: {
        Args: { p_outcome_id: string }
        Returns: {
          acknowledged_at: string | null
          connection_observed_at: string | null
          created_at: string
          expires_at: string
          id: string
          intermediary_person_node_id: string
          intermediary_user_id: string
          introduction_delivery_id: string
          introduction_request_id: string
          outcome_note: string | null
          outcome_source: string | null
          outcome_type: string | null
          progressed_at: string | null
          requester_person_node_id: string
          requester_user_id: string
          resolved_at: string | null
          status: string
          target_person_node_id: string
          target_user_id: string
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "introduction_outcomes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      intro_outcome_reconcile: {
        Args: { p_limit?: number }
        Returns: {
          created: number
          expired: number
          observed: number
        }[]
      }
      intro_outcome_reconcile_recorded: {
        Args: { p_limit?: number }
        Returns: Json
      }
      intro_request_accept: {
        Args: { p_id: string }
        Returns: {
          cancelled_at: string | null
          created_at: string
          expires_at: string
          id: string
          idempotency_key: string | null
          intermediary_person_node_id: string
          intermediary_user_id: string
          introduction_version: string
          path_id: string
          path_snapshot: Json
          request_note: string | null
          requester_person_node_id: string
          requester_user_id: string
          responded_at: string | null
          status: string
          strength_version: string
          target_person_node_id: string
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "introduction_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      intro_request_cancel: {
        Args: { p_id: string }
        Returns: {
          cancelled_at: string | null
          created_at: string
          expires_at: string
          id: string
          idempotency_key: string | null
          intermediary_person_node_id: string
          intermediary_user_id: string
          introduction_version: string
          path_id: string
          path_snapshot: Json
          request_note: string | null
          requester_person_node_id: string
          requester_user_id: string
          responded_at: string | null
          status: string
          strength_version: string
          target_person_node_id: string
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "introduction_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      intro_request_decline: {
        Args: { p_id: string }
        Returns: {
          cancelled_at: string | null
          created_at: string
          expires_at: string
          id: string
          idempotency_key: string | null
          intermediary_person_node_id: string
          intermediary_user_id: string
          introduction_version: string
          path_id: string
          path_snapshot: Json
          request_note: string | null
          requester_person_node_id: string
          requester_user_id: string
          responded_at: string | null
          status: string
          strength_version: string
          target_person_node_id: string
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "introduction_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      intro_request_send: {
        Args: {
          p_idempotency_key: string
          p_intermediary_person_node_id: string
          p_intermediary_user_id: string
          p_introduction_version: string
          p_path_id: string
          p_path_snapshot: Json
          p_request_note: string
          p_strength_version: string
          p_target_person_node_id: string
        }
        Returns: {
          cancelled_at: string | null
          created_at: string
          expires_at: string
          id: string
          idempotency_key: string | null
          intermediary_person_node_id: string
          intermediary_user_id: string
          introduction_version: string
          path_id: string
          path_snapshot: Json
          request_note: string | null
          requester_person_node_id: string
          requester_user_id: string
          responded_at: string | null
          status: string
          strength_version: string
          target_person_node_id: string
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "introduction_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_assoc_manager: { Args: { _association_id: string }; Returns: boolean }
      is_company_manager: { Args: { _company_id: string }; Returns: boolean }
      is_company_member: { Args: { _company_id: string }; Returns: boolean }
      is_member_of: { Args: { _association_id: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      is_public_business_card: { Args: { _card_id: string }; Returns: boolean }
      link_my_member_profile: { Args: { _member_id: string }; Returns: string }
      list_my_linkable_members: {
        Args: never
        Returns: {
          already_linked: boolean
          association_id: string
          association_name: string
          code: string
          email: string
          id: string
          name: string
        }[]
      }
      list_peers: {
        Args: never
        Returns: {
          code: string
          id: string
          industry: string
          level: string
          name: string
          region: string
          status: string
          type: string
        }[]
      }
      log_business_card_member_event: {
        Args: { _card_id: string; _event_type: string; _metadata?: Json }
        Returns: undefined
      }
      manages_business_card: { Args: { _card_id: string }; Returns: boolean }
      my_bc_admin_level: { Args: never; Returns: string }
      net_accept_request: { Args: { _peer: string }; Returns: undefined }
      net_decline_request: { Args: { _peer: string }; Returns: undefined }
      net_remove_connection: { Args: { _peer: string }; Returns: undefined }
      net_send_request: { Args: { _peer: string }; Returns: undefined }
      outcome_consumer_claim_batch: {
        Args: { _batch?: number }
        Returns: {
          aggregate_id: string
          aggregate_type: string
          attempt_count: number
          created_at: string
          event_kind: string
          id: string
          idempotency_key: string
          occurred_at: string
          payload: Json
        }[]
      }
      outcome_consumer_finalize: {
        Args: { _outbox_event_id: string; _required_adapters: string[] }
        Returns: boolean
      }
      outcome_consumer_has_earlier_pending: {
        Args: { _outbox_id: string }
        Returns: boolean
      }
      outcome_consumer_release: {
        Args: { _next_available_at: string; _outbox_event_id: string }
        Returns: undefined
      }
      outcome_consumer_replay: {
        Args: { _adapter_name?: string; _outbox_event_id: string }
        Returns: number
      }
      outcome_dispatch_record: {
        Args: {
          _adapter_name: string
          _error_code?: string
          _next_attempt_at?: string
          _outbox_event_id: string
          _status: string
        }
        Returns: {
          adapter_name: string
          attempt_count: number
          created_at: string
          dead_lettered_at: string | null
          delivered_at: string | null
          id: string
          last_error_code: string | null
          lease_expires_at: string | null
          next_attempt_at: string | null
          outbox_event_id: string
          processing_owner: string | null
          processing_started_at: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "outcome_event_dispatches"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      outcome_event_is_supported: { Args: { _kind: string }; Returns: boolean }
      owns_business_card: { Args: { _card_id: string }; Returns: boolean }
      owns_company: { Args: { _company_id: string }; Returns: boolean }
      resolve_card_scan_duplicates: {
        Args: {
          p_company_name?: string
          p_display_name?: string
          p_email: string
          p_phone: string
        }
        Returns: Json
      }
      rollback_business_card_ownership_backfill: {
        Args: { _run_id: string }
        Returns: Json
      }
      run_business_card_ownership_backfill: {
        Args: { _version: string }
        Returns: Json
      }
      save_scanned_guest_contact: {
        Args: {
          p_address: string
          p_client_token: string
          p_company_name: string
          p_confirmed_new?: boolean
          p_display_name: string
          p_email: string
          p_field_choices?: Json
          p_phone: string
          p_resolution: string
          p_scan_id: string
          p_target_guest_id?: string
          p_title: string
          p_website: string
        }
        Returns: Json
      }
      set_active_association: {
        Args: { _association_id: string }
        Returns: undefined
      }
      share_guest_contact: {
        Args: {
          p_client_token: string
          p_company_name: string
          p_consent_version: string
          p_display_name: string
          p_email: string
          p_phone: string
          p_slug: string
          p_title: string
        }
        Returns: Json
      }
      skip_relationship_memory_extraction_receipt: {
        Args: { p_claim_token: string; p_id: string; p_reason: string }
        Returns: {
          applied: boolean
          new_row_version: number
          new_status: string
        }[]
      }
      unlink_my_member_profile: {
        Args: { _member_id: string }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "active" | "suspended" | "deactivated"
      app_role: "admin" | "member" | "platform_admin"
      bc_customer_log_kind:
        | "call"
        | "meeting"
        | "email"
        | "message"
        | "note"
        | "stage_change"
      bc_customer_stage:
        | "prospect"
        | "consulting"
        | "won"
        | "nurturing"
        | "inactive"
      bc_customer_target_kind: "connection" | "saved_card" | "guest_contact"
      business_meeting_location_type:
        | "physical"
        | "online"
        | "phone"
        | "hybrid"
        | "unspecified"
      business_meeting_participant_role: "organizer" | "required" | "optional"
      business_meeting_response_status:
        | "pending"
        | "accepted"
        | "declined"
        | "tentative"
        | "proposed_new_time"
      business_meeting_source_type:
        | "global_connection"
        | "saved_card"
        | "business_profile"
        | "company"
        | "association"
        | "event"
        | "qr"
        | "nfc"
        | "manual"
        | "referral"
      business_meeting_status:
        | "draft"
        | "proposed"
        | "confirmed"
        | "declined"
        | "cancelled"
        | "completed"
        | "no_show"
      business_meeting_type:
        | "in_person"
        | "video_call"
        | "phone_call"
        | "business_lunch"
        | "demo"
        | "consultation"
        | "interview"
        | "networking"
        | "site_visit"
        | "other"
      global_connection_source_type:
        | "business_card"
        | "saved_card"
        | "qr"
        | "nfc"
        | "event"
        | "meeting"
        | "association"
        | "community"
        | "company"
        | "marketplace"
        | "manual"
        | "referral"
      global_connection_status:
        | "pending"
        | "accepted"
        | "declined"
        | "cancelled"
        | "disconnected"
        | "blocked"
      gn_notification_type:
        | "connection_request"
        | "connection_accepted"
        | "connection_status_update"
      gn_report_category:
        | "spam"
        | "harassment"
        | "impersonation"
        | "inappropriate"
        | "other"
      gn_report_status: "open" | "reviewing" | "actioned" | "dismissed"
      onboarding_status: "new" | "in_progress" | "completed"
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
      account_status: ["active", "suspended", "deactivated"],
      app_role: ["admin", "member", "platform_admin"],
      bc_customer_log_kind: [
        "call",
        "meeting",
        "email",
        "message",
        "note",
        "stage_change",
      ],
      bc_customer_stage: [
        "prospect",
        "consulting",
        "won",
        "nurturing",
        "inactive",
      ],
      bc_customer_target_kind: ["connection", "saved_card", "guest_contact"],
      business_meeting_location_type: [
        "physical",
        "online",
        "phone",
        "hybrid",
        "unspecified",
      ],
      business_meeting_participant_role: ["organizer", "required", "optional"],
      business_meeting_response_status: [
        "pending",
        "accepted",
        "declined",
        "tentative",
        "proposed_new_time",
      ],
      business_meeting_source_type: [
        "global_connection",
        "saved_card",
        "business_profile",
        "company",
        "association",
        "event",
        "qr",
        "nfc",
        "manual",
        "referral",
      ],
      business_meeting_status: [
        "draft",
        "proposed",
        "confirmed",
        "declined",
        "cancelled",
        "completed",
        "no_show",
      ],
      business_meeting_type: [
        "in_person",
        "video_call",
        "phone_call",
        "business_lunch",
        "demo",
        "consultation",
        "interview",
        "networking",
        "site_visit",
        "other",
      ],
      global_connection_source_type: [
        "business_card",
        "saved_card",
        "qr",
        "nfc",
        "event",
        "meeting",
        "association",
        "community",
        "company",
        "marketplace",
        "manual",
        "referral",
      ],
      global_connection_status: [
        "pending",
        "accepted",
        "declined",
        "cancelled",
        "disconnected",
        "blocked",
      ],
      gn_notification_type: [
        "connection_request",
        "connection_accepted",
        "connection_status_update",
      ],
      gn_report_category: [
        "spam",
        "harassment",
        "impersonation",
        "inappropriate",
        "other",
      ],
      gn_report_status: ["open", "reviewing", "actioned", "dismissed"],
      onboarding_status: ["new", "in_progress", "completed"],
    },
  },
} as const

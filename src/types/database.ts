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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      _migrations: {
        Row: {
          applied_at: string
          name: string
        }
        Insert: {
          applied_at?: string
          name: string
        }
        Update: {
          applied_at?: string
          name?: string
        }
        Relationships: []
      }
      admin_emails: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      event_agenda: {
        Row: {
          body: string
          event_id: string
          id: string
          questions: string[]
          sort_order: number
          time_label: string
          title: string
        }
        Insert: {
          body?: string
          event_id: string
          id?: string
          questions?: string[]
          sort_order?: number
          time_label?: string
          title: string
        }
        Update: {
          body?: string
          event_id?: string
          id?: string
          questions?: string[]
          sort_order?: number
          time_label?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_agenda_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          created_at: string
          description: string
          end_time: string | null
          event_date: string | null
          hebrew_month: number | null
          hebrew_year: number | null
          host_name: string
          host_user_id: string | null
          id: string
          kind: Database["public"]["Enums"]["proposal_kind"] | null
          location: string
          price_ils: number
          published: boolean
          start_time: string | null
          title: string
          topic: string
          type: Database["public"]["Enums"]["event_type"]
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string
          end_time?: string | null
          event_date?: string | null
          hebrew_month?: number | null
          hebrew_year?: number | null
          host_name?: string
          host_user_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["proposal_kind"] | null
          location?: string
          price_ils?: number
          published?: boolean
          start_time?: string | null
          title: string
          topic?: string
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string
          end_time?: string | null
          event_date?: string | null
          hebrew_month?: number | null
          hebrew_year?: number | null
          host_name?: string
          host_user_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["proposal_kind"] | null
          location?: string
          price_ils?: number
          published?: boolean
          start_time?: string | null
          title?: string
          topic?: string
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_sections: {
        Row: {
          color: string
          created_at: string
          description: string
          icon: string
          id: string
          is_new: boolean
          key: string
          name: string
          sort_order: number
          tint: string
          visible: boolean
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_new?: boolean
          key: string
          name: string
          sort_order?: number
          tint?: string
          visible?: boolean
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_new?: boolean
          key?: string
          name?: string
          sort_order?: number
          tint?: string
          visible?: boolean
        }
        Relationships: []
      }
      hosting_proposals: {
        Row: {
          created_at: string
          description: string
          display_name: string
          event_id: string | null
          id: string
          kind: Database["public"]["Enums"]["proposal_kind"]
          needs: string
          preferred_month: string
          status: Database["public"]["Enums"]["proposal_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          display_name?: string
          event_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["proposal_kind"]
          needs?: string
          preferred_month?: string
          status?: Database["public"]["Enums"]["proposal_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          display_name?: string
          event_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["proposal_kind"]
          needs?: string
          preferred_month?: string
          status?: Database["public"]["Enums"]["proposal_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hosting_proposals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hosting_proposals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hosting_proposals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string
          created_at: string
          help_kind: Database["public"]["Enums"]["help_kind"] | null
          id: string
          image_path: string | null
          pinned: boolean
          section_id: string
          status: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          help_kind?: Database["public"]["Enums"]["help_kind"] | null
          id?: string
          image_path?: string | null
          pinned?: boolean
          section_id: string
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          help_kind?: Database["public"]["Enums"]["help_kind"] | null
          id?: string
          image_path?: string | null
          pinned?: boolean
          section_id?: string
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "forum_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved_at: string | null
          birth_month: number | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          over_30_confirmed: boolean
          phone: string
          remind_birthday: boolean
          role: Database["public"]["Enums"]["member_role"]
          status: Database["public"]["Enums"]["member_status"]
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          birth_month?: number | null
          created_at?: string
          email: string
          first_name?: string
          id: string
          last_name?: string
          over_30_confirmed?: boolean
          phone?: string
          remind_birthday?: boolean
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["member_status"]
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          birth_month?: number | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          over_30_confirmed?: boolean
          phone?: string
          remind_birthday?: boolean
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["member_status"]
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      topic_team: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_team_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_team_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_team_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      member_directory: {
        Row: {
          birth_month: number | null
          first_name: string | null
          id: string | null
          last_name: string | null
          role: Database["public"]["Enums"]["member_role"] | null
          status: Database["public"]["Enums"]["member_status"] | null
        }
        Insert: {
          birth_month?: number | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["member_role"] | null
          status?: Database["public"]["Enums"]["member_status"] | null
        }
        Update: {
          birth_month?: number | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["member_role"] | null
          status?: Database["public"]["Enums"]["member_status"] | null
        }
        Relationships: []
      }
      post_feed: {
        Row: {
          author_first_name: string | null
          author_id: string | null
          author_last_name: string | null
          body: string | null
          comment_count: number | null
          created_at: string | null
          help_kind: Database["public"]["Enums"]["help_kind"] | null
          id: string | null
          image_path: string | null
          like_count: number | null
          liked_by_me: boolean | null
          pinned: boolean | null
          section_color: string | null
          section_id: string | null
          section_key: string | null
          section_name: string | null
          section_tint: string | null
          status: Database["public"]["Enums"]["post_status"] | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "forum_sections"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      birth_month_count: { Args: { m: number }; Returns: number }
      is_active: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      registration_count: { Args: { eid: string }; Returns: number }
      topic_team_count: { Args: { eid: string }; Returns: number }
    }
    Enums: {
      event_type: "general" | "millionaire" | "birthday"
      help_kind: "asking" | "offering"
      member_role: "member" | "admin"
      member_status: "pending" | "active" | "paused"
      post_status: "pending" | "published" | "hidden"
      proposal_kind: "talent" | "insight" | "story" | "other"
      proposal_status: "new" | "scheduled" | "declined"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      event_type: ["general", "millionaire", "birthday"],
      help_kind: ["asking", "offering"],
      member_role: ["member", "admin"],
      member_status: ["pending", "active", "paused"],
      post_status: ["pending", "published", "hidden"],
      proposal_kind: ["talent", "insight", "story", "other"],
      proposal_status: ["new", "scheduled", "declined"],
    },
  },
} as const

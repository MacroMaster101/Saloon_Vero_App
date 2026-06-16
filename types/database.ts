// Database types for the Vero Salon schema (supabase/migrations/0001_init.sql).
//
// Hand-authored to match the migration exactly so the app is fully type-checked
// without a Docker-based `supabase gen types`. Regenerate from the live schema
// when a Supabase access token or local Docker is available:
//   supabase gen types typescript --project-id <ref> > types/database.ts
// Keep this file in sync with supabase/migrations/*.sql.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type ServiceCategory = 'hair' | 'beauty';
export type UserRole = 'user' | 'staff' | 'admin';

export interface Database {
  public: {
    Tables: {
      services: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          category: ServiceCategory;
          price_lkr: number;
          duration_min: number;
          icon: string;
          bookable: boolean;
          sort_order: number;
          is_active: boolean;
          is_featured: boolean;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string;
          category: ServiceCategory;
          price_lkr: number;
          duration_min: number;
          icon?: string;
          bookable?: boolean;
          sort_order?: number;
          is_active?: boolean;
          is_featured?: boolean;
        };
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
        Relationships: [];
      };
      stylists: {
        Row: {
          id: string;
          slug: string;
          name: string;
          role: string;
          tags: string[];
          avatar_url: string | null;
          sort_order: number;
          is_active: boolean;
          rating?: number | null;
          rating_count?: number | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          role?: string;
          tags?: string[];
          avatar_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          rating?: number | null;
          rating_count?: number | null;
        };
        Update: Partial<Database['public']['Tables']['stylists']['Insert']>;
        Relationships: [];
      };
      business_hours: {
        Row: {
          day_of_week: number;
          open_minute: number;
          close_minute: number;
          is_closed: boolean;
        };
        Insert: {
          day_of_week: number;
          open_minute: number;
          close_minute: number;
          is_closed?: boolean;
        };
        Update: Partial<Database['public']['Tables']['business_hours']['Insert']>;
        Relationships: [];
      };
      blocked_slots: {
        Row: {
          id: string;
          stylist_id: string | null;
          starts_at: string;
          ends_at: string;
          reason: string;
        };
        Insert: {
          id?: string;
          stylist_id?: string | null;
          starts_at: string;
          ends_at: string;
          reason?: string;
        };
        Update: Partial<Database['public']['Tables']['blocked_slots']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'blocked_slots_stylist_id_fkey';
            columns: ['stylist_id'];
            referencedRelation: 'stylists';
            referencedColumns: ['id'];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          reference: string;
          service_id: string;
          stylist_id: string | null;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          notes: string;
          starts_at: string;
          ends_at: string;
          status: BookingStatus;
          created_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          reference: string;
          service_id: string;
          stylist_id?: string | null;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          notes?: string;
          starts_at: string;
          ends_at: string;
          status?: BookingStatus;
          created_at?: string;
          user_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'bookings_service_id_fkey';
            columns: ['service_id'];
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_stylist_id_fkey';
            columns: ['stylist_id'];
            referencedRelation: 'stylists';
            referencedColumns: ['id'];
          },
        ];
      };
      gallery: {
        Row: {
          id: string;
          title: string;
          tag: string;
          category: string;
          image_url: string;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          tag?: string;
          category?: string;
          image_url: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['gallery']['Insert']>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          role: 'user' | 'staff' | 'admin';
          stylist_id: string | null;
          full_name: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: 'user' | 'staff' | 'admin';
          stylist_id?: string | null;
          full_name?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_stylist_id_fkey';
            columns: ['stylist_id'];
            referencedRelation: 'stylists';
            referencedColumns: ['id'];
          },
        ];
      };
      site_content: {
        Row: { key: string; value: Record<string, unknown>; updated_at: string };
        Insert: { key: string; value?: Record<string, unknown>; updated_at?: string };
        Update: Partial<Database['public']['Tables']['site_content']['Insert']>;
        Relationships: [];
      };
      stylist_reviews: {
        Row: {
          id: string;
          stylist_id: string;
          customer_name: string;
          rating: number;
          comment: string;
          created_at: string;
          likes_count: number;
          reports_count: number;
        };
        Insert: {
          id?: string;
          stylist_id: string;
          customer_name: string;
          rating: number;
          comment: string;
          created_at?: string;
          likes_count?: number;
          reports_count?: number;
        };
        Update: Partial<Database['public']['Tables']['stylist_reviews']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'stylist_reviews_stylist_id_fkey';
            columns: ['stylist_id'];
            referencedRelation: 'stylists';
            referencedColumns: ['id'];
          }
        ];
      };
      conversations: {
        Row: {
          id: string;
          customer_id: string;
          stylist_id: string;
          created_at: string;
          last_message_at: string | null;
          last_message_preview: string | null;
          customer_unread: number;
          stylist_unread: number;
        };
        Insert: {
          customer_id: string;
          stylist_id: string;
        };
        Update: {
          customer_unread?: number;
          stylist_unread?: number;
          last_message_at?: string | null;
          last_message_preview?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_stylist_id_fkey';
            columns: ['stylist_id'];
            referencedRelation: 'stylists';
            referencedColumns: ['id'];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string | null;
          kind: 'text' | 'image' | 'booking';
          body: string | null;
          image_url: string | null;
          booking_id: string | null;
          created_at: string;
        };
        Insert: {
          conversation_id: string;
          sender_id: string;
          kind?: 'text' | 'image' | 'booking';
          body?: string | null;
          image_url?: string | null;
          booking_id?: string | null;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          }
        ];
      };
      push_tokens: {
        Row: {
          user_id: string;
          token: string;
          platform: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          token: string;
          platform?: string | null;
          updated_at?: string;
        };
        Update: {
          platform?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      anonymize_user_bookings: { Args: { target: string }; Returns: undefined };
      purge_old_bookings: { Args: { older_than_months?: number }; Returns: number };
      toggle_review_like: { Args: { p_review_id: string; p_delta: number }; Returns: undefined };
      report_review: { Args: { p_review_id: string }; Returns: undefined };
      mark_conversation_read: { Args: { p_conversation_id: string }; Returns: undefined };
      claim_bookings: { Args: { p_booking_references: string[] }; Returns: undefined };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

// Convenience row aliases used throughout the app.
export type Service = Database['public']['Tables']['services']['Row'];
export type SiteContentRow = Database['public']['Tables']['site_content']['Row'];
export type Stylist = Database['public']['Tables']['stylists']['Row'];
export type BusinessHour = Database['public']['Tables']['business_hours']['Row'];
export type BlockedSlot = Database['public']['Tables']['blocked_slots']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type GalleryItem = Database['public']['Tables']['gallery']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type StylistReview = Database['public']['Tables']['stylist_reviews']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];

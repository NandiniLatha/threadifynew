/**
 * Supabase Database Types
 *
 * Hand-generated from the current schema (migrations 20260709 → 20260728).
 * Regenerate with:  supabase gen types typescript --linked > types/database.ts
 *
 * Migration 20260728000001 adds:
 *   - 'suspended' to VerificationStatus
 *   - 10 new columns on tailor_profiles
 *   - Tables: tailor_specializations, tailor_skills, tailor_experience,
 *     tailor_pricing, tailor_availability, tailor_delivery_options,
 *     tailor_portfolio_items, tailor_social_links,
 *     tailor_verification_documents, tailor_certifications
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ── Enums ─────────────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'tailor' | 'admin'

export type RequestStatus =
  | 'draft'
  | 'pending_bids'
  | 'assigned'
  | 'paid'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'reviewed'
  | 'cancelled'

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

// ── Tailor onboarding domain types ───────────────────────────────────────────

export type TailorGender =
  | 'male'
  | 'female'
  | 'non_binary'
  | 'prefer_not_to_say'

export type TailorSpecializationName =
  | 'mens_wear'
  | 'womens_wear'
  | 'bridal_wear'
  | 'ethnic_wear'
  | 'western_wear'
  | 'kids_wear'
  | 'luxury_couture'
  | 'alterations'
  | 'uniform_stitching'

export type TailorSkillName =
  | 'embroidery'
  | 'hand_stitching'
  | 'machine_stitching'
  | 'pattern_making'
  | 'fashion_illustration'
  | 'custom_measurements'
  | 'fabric_consultation'
  | 'bridal_designing'

export type PortfolioMediaType = 'image' | 'video' | 'before_after'

export type VerificationDocType = 'govt_id' | 'business_license' | 'gst'

export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

export type NotificationType =
  | 'bid_received'
  | 'bid_accepted'
  | 'order_paid'
  | 'order_in_production'
  | 'order_shipped'
  | 'order_delivered'
  | 'review_received'
  | 'message_received'
  | 'dispute_opened'
  | 'system'

export type AvailabilityStatus =
  | 'accepting_orders'
  | 'limited_availability'
  | 'fully_booked'
  | 'on_leave'

export type PaymentStatus = 'pending' | 'completed' | 'refunded' | 'failed'

export type ActivityEventType =
  | 'user_signup'
  | 'order_created'
  | 'bid_submitted'
  | 'bid_accepted'
  | 'payment_completed'
  | 'order_status_changed'
  | 'review_submitted'
  | 'dispute_opened'
  | 'message_sent'
  | 'profile_updated'

// ── Row types ─────────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id:         string
          email:      string
          role:       UserRole
          name:       string | null
          phone:      string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id:         string
          email:      string
          role?:      UserRole
          name?:      string | null
          phone?:     string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?:        string
          email?:     string
          role?:      UserRole
          name?:      string | null
          phone?:     string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }

      addresses: {
        Row: {
          id:          string
          user_id:     string
          label:       string
          line1:       string
          line2:       string | null
          city:        string
          state:       string
          postal_code: string
          country:     string
          is_default:  boolean
          created_at:  string
          updated_at:  string
        }
        Insert: {
          id?:         string
          user_id:     string
          label?:      string
          line1:       string
          line2?:      string | null
          city:        string
          state:       string
          postal_code: string
          country?:    string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          label?:      string
          line1?:      string
          line2?:      string | null
          city?:       string
          state?:      string
          postal_code?: string
          country?:    string
          is_default?: boolean
          updated_at?: string
        }
      }

      tailor_profiles: {
        Row: {
          user_id:                string
          bio:                    string | null
          verification_status:    VerificationStatus
          verification_docs_url:  string | null
          stripe_account_id:      string | null
          razorpay_account_id:    string | null
          avg_rating:             number
          portfolio_images:       string[]
          featured:               boolean
          location:               string | null
          experience_years:       number | null
          starting_price:         number | null
          response_time_hrs:      number
          availability_status:    AvailabilityStatus
          specialty:              string[]
          measurement_options:    string[]
          // ── Added in migration 20260728000001 ──
          boutique_name:          string | null
          profile_photo_url:      string | null
          age:                    number | null
          gender:                 TailorGender | null
          mobile:                 string | null
          languages:              string[]
          about:                  string | null
          fashion_design_degree:  string | null
          gst_number:             string | null
          onboarding_completed:   boolean
          created_at:             string
          updated_at:             string
        }
        Insert: {
          user_id:                string
          bio?:                   string | null
          verification_status?:   VerificationStatus
          verification_docs_url?: string | null
          stripe_account_id?:     string | null
          razorpay_account_id?:   string | null
          avg_rating?:            number
          portfolio_images?:      string[]
          featured?:              boolean
          location?:              string | null
          experience_years?:      number | null
          starting_price?:        number | null
          response_time_hrs?:     number
          availability_status?:   AvailabilityStatus
          specialty?:             string[]
          measurement_options?:   string[]
          boutique_name?:         string | null
          profile_photo_url?:     string | null
          age?:                   number | null
          gender?:                TailorGender | null
          mobile?:                string | null
          languages?:             string[]
          about?:                 string | null
          fashion_design_degree?: string | null
          gst_number?:            string | null
          onboarding_completed?:  boolean
          created_at?:            string
          updated_at?:            string
        }
        Update: {
          bio?:                   string | null
          verification_status?:   VerificationStatus
          verification_docs_url?: string | null
          stripe_account_id?:     string | null
          razorpay_account_id?:   string | null
          avg_rating?:            number
          portfolio_images?:      string[]
          featured?:              boolean
          location?:              string | null
          experience_years?:      number | null
          starting_price?:        number | null
          response_time_hrs?:     number
          availability_status?:   AvailabilityStatus
          specialty?:             string[]
          measurement_options?:   string[]
          boutique_name?:         string | null
          profile_photo_url?:     string | null
          age?:                   number | null
          gender?:                TailorGender | null
          mobile?:                string | null
          languages?:             string[]
          about?:                 string | null
          fashion_design_degree?: string | null
          gst_number?:            string | null
          onboarding_completed?:  boolean
          updated_at?:            string
        }
      }

      tailor_specializations: {
        Row: {
          id:         string
          tailor_id:  string
          name:       TailorSpecializationName
          created_at: string
        }
        Insert: {
          id?:        string
          tailor_id:  string
          name:       TailorSpecializationName
          created_at?: string
        }
        Update: {
          name?: TailorSpecializationName
        }
      }

      tailor_skills: {
        Row: {
          id:         string
          tailor_id:  string
          name:       TailorSkillName
          created_at: string
        }
        Insert: {
          id?:        string
          tailor_id:  string
          name:       TailorSkillName
          created_at?: string
        }
        Update: {
          name?: TailorSkillName
        }
      }

      tailor_experience: {
        Row: {
          tailor_id:           string
          total_years:         number
          previous_boutique:   string | null
          current_boutique:    string | null
          freelance_exp_years: number
          updated_at:          string
        }
        Insert: {
          tailor_id:            string
          total_years?:         number
          previous_boutique?:   string | null
          current_boutique?:    string | null
          freelance_exp_years?: number
          updated_at?:          string
        }
        Update: {
          total_years?:         number
          previous_boutique?:   string | null
          current_boutique?:    string | null
          freelance_exp_years?: number
          updated_at?:          string
        }
      }

      tailor_pricing: {
        Row: {
          tailor_id:               string
          stitching_charge:        number | null
          consultation_fee:        number | null
          starting_price:          number | null
          premium_package:         number | null
          express_delivery_charge: number | null
          updated_at:              string
        }
        Insert: {
          tailor_id:                string
          stitching_charge?:        number | null
          consultation_fee?:        number | null
          starting_price?:          number | null
          premium_package?:         number | null
          express_delivery_charge?: number | null
          updated_at?:              string
        }
        Update: {
          stitching_charge?:        number | null
          consultation_fee?:        number | null
          starting_price?:          number | null
          premium_package?:         number | null
          express_delivery_charge?: number | null
          updated_at?:              string
        }
      }

      tailor_availability: {
        Row: {
          tailor_id:           string
          working_days:        string[]
          working_hours_start: string | null  // stored as 'HH:MM' time string
          working_hours_end:   string | null
          vacation_mode:       boolean
          accepting_orders:    boolean
          updated_at:          string
        }
        Insert: {
          tailor_id:            string
          working_days?:        string[]
          working_hours_start?: string | null
          working_hours_end?:   string | null
          vacation_mode?:       boolean
          accepting_orders?:    boolean
          updated_at?:          string
        }
        Update: {
          working_days?:        string[]
          working_hours_start?: string | null
          working_hours_end?:   string | null
          vacation_mode?:       boolean
          accepting_orders?:    boolean
          updated_at?:          string
        }
      }

      tailor_delivery_options: {
        Row: {
          tailor_id:             string
          pickup_available:      boolean
          doorstep_measurement:  boolean
          home_delivery:         boolean
          shipping_areas:        string[]
          max_delivery_distance: number | null
          updated_at:            string
        }
        Insert: {
          tailor_id:              string
          pickup_available?:      boolean
          doorstep_measurement?:  boolean
          home_delivery?:         boolean
          shipping_areas?:        string[]
          max_delivery_distance?: number | null
          updated_at?:            string
        }
        Update: {
          pickup_available?:      boolean
          doorstep_measurement?:  boolean
          home_delivery?:         boolean
          shipping_areas?:        string[]
          max_delivery_distance?: number | null
          updated_at?:            string
        }
      }

      tailor_portfolio_items: {
        Row: {
          id:            string
          tailor_id:     string
          storage_path:  string
          public_url:    string
          media_type:    PortfolioMediaType
          caption:       string | null
          display_order: number
          created_at:    string
        }
        Insert: {
          id?:           string
          tailor_id:     string
          storage_path:  string
          public_url:    string
          media_type?:   PortfolioMediaType
          caption?:      string | null
          display_order?: number
          created_at?:   string
        }
        Update: {
          storage_path?:  string
          public_url?:    string
          media_type?:    PortfolioMediaType
          caption?:       string | null
          display_order?: number
        }
      }

      tailor_social_links: {
        Row: {
          tailor_id:  string
          instagram:  string | null
          facebook:   string | null
          pinterest:  string | null
          website:    string | null
          updated_at: string
        }
        Insert: {
          tailor_id:  string
          instagram?: string | null
          facebook?:  string | null
          pinterest?: string | null
          website?:   string | null
          updated_at?: string
        }
        Update: {
          instagram?: string | null
          facebook?:  string | null
          pinterest?: string | null
          website?:   string | null
          updated_at?: string
        }
      }

      tailor_verification_documents: {
        Row: {
          id:           string
          tailor_id:    string
          doc_type:     VerificationDocType
          storage_path: string  // PRIVATE path only — never a public URL
          uploaded_at:  string
        }
        Insert: {
          id?:          string
          tailor_id:    string
          doc_type:     VerificationDocType
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          storage_path?: string
          uploaded_at?:  string
        }
      }

      tailor_certifications: {
        Row: {
          id:           string
          tailor_id:    string
          name:         string
          issuing_body: string | null
          year:         number | null
          created_at:   string
        }
        Insert: {
          id?:          string
          tailor_id:    string
          name:         string
          issuing_body?: string | null
          year?:        number | null
          created_at?:  string
        }
        Update: {
          name?:         string
          issuing_body?: string | null
          year?:         number | null
        }
      }

      design_requests: {
        Row: {
          id:                     string
          customer_id:            string
          tailor_id:              string | null
          accepted_quotation_id:  string | null
          image_url:              string
          ai_tags:                Json
          budget_min:             number
          budget_max:             number
          deadline:               string
          status:                 RequestStatus
          notes:                  string | null
          razorpay_order_id:      string | null
          razorpay_payment_id:    string | null
          amount_paid:            number | null
          platform_commission:    number | null
          delivered_confirmed_at: string | null
          created_at:             string
          updated_at:             string
        }
        Insert: {
          id?:                    string
          customer_id:            string
          tailor_id?:             string | null
          accepted_quotation_id?: string | null
          image_url:              string
          ai_tags?:               Json
          budget_min:             number
          budget_max:             number
          deadline:               string
          status?:                RequestStatus
          notes?:                 string | null
          razorpay_order_id?:     string | null
          razorpay_payment_id?:   string | null
          amount_paid?:           number | null
          platform_commission?:   number | null
          delivered_confirmed_at?: string | null
          created_at?:            string
          updated_at?:            string
        }
        Update: {
          tailor_id?:             string | null
          accepted_quotation_id?: string | null
          image_url?:             string
          ai_tags?:               Json
          budget_min?:            number
          budget_max?:            number
          deadline?:              string
          status?:                RequestStatus
          notes?:                 string | null
          razorpay_order_id?:     string | null
          razorpay_payment_id?:   string | null
          amount_paid?:           number | null
          platform_commission?:   number | null
          delivered_confirmed_at?: string | null
          updated_at?:            string
        }
      }

      design_request_images: {
        Row: {
          id:          string
          request_id:  string
          image_url:   string
          is_primary:  boolean
          sort_order:  number
          uploaded_by: string | null
          created_at:  string
        }
        Insert: {
          id?:         string
          request_id:  string
          image_url:   string
          is_primary?: boolean
          sort_order?: number
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          image_url?:  string
          is_primary?: boolean
          sort_order?: number
        }
      }

      wishlist_items: {
        Row: {
          id:          string
          customer_id: string
          image_url:   string
          ai_tags:     Json
          budget_min:  number | null
          budget_max:  number | null
          deadline:    string | null
          notes:       string | null
          created_at:  string
          updated_at:  string
        }
        Insert: {
          id?:         string
          customer_id: string
          image_url:   string
          ai_tags?:    Json
          budget_min?: number | null
          budget_max?: number | null
          deadline?:   string | null
          notes?:      string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          image_url?:  string
          ai_tags?:    Json
          budget_min?: number | null
          budget_max?: number | null
          deadline?:   string | null
          notes?:      string | null
          updated_at?: string
        }
      }

      quotations: {
        Row: {
          id:             string
          request_id:     string
          tailor_id:      string
          price:          number
          estimated_days: number
          note:           string | null
          status:         string            // legacy text column kept for compat
          bid_status:     BidStatus
          created_at:     string
          updated_at:     string
        }
        Insert: {
          id?:            string
          request_id:     string
          tailor_id:      string
          price:          number
          estimated_days: number
          note?:          string | null
          status?:        string
          bid_status?:    BidStatus
          created_at?:    string
          updated_at?:    string
        }
        Update: {
          price?:          number
          estimated_days?: number
          note?:           string | null
          status?:         string
          bid_status?:     BidStatus
          updated_at?:     string
        }
      }

      messages: {
        Row: {
          id:             string
          order_id:       string
          sender_id:      string
          content:        string
          attachment_url: string | null
          read_by:        string[]
          created_at:     string
          updated_at:     string
        }
        Insert: {
          id?:            string
          order_id:       string
          sender_id:      string
          content:        string
          attachment_url?: string | null
          read_by?:       string[]
          created_at?:    string
          updated_at?:    string
        }
        Update: {
          content?:       string
          attachment_url?: string | null
          read_by?:       string[]
          updated_at?:    string
        }
      }

      conversations: {
        Row: {
          id:                   string
          order_id:             string
          customer_id:          string
          tailor_id:            string
          last_message_at:      string | null
          last_message_preview: string | null
          customer_unread:      number
          tailor_unread:        number
          created_at:           string
          updated_at:           string
        }
        Insert: {
          id?:                   string
          order_id:              string
          customer_id:           string
          tailor_id:             string
          last_message_at?:      string | null
          last_message_preview?: string | null
          customer_unread?:      number
          tailor_unread?:        number
          created_at?:           string
          updated_at?:           string
        }
        Update: {
          last_message_at?:      string | null
          last_message_preview?: string | null
          customer_unread?:      number
          tailor_unread?:        number
          updated_at?:           string
        }
      }

      reviews: {
        Row: {
          id:         string
          order_id:   string
          tailor_id:  string | null
          rating:     number
          comment:    string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?:        string
          order_id:   string
          tailor_id?: string | null
          rating:     number
          comment?:   string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          rating?:    number
          comment?:   string | null
          updated_at?: string
        }
      }

      notifications: {
        Row: {
          id:                string
          user_id:           string
          message:           string
          link:              string | null
          read:              boolean
          notification_type: NotificationType
          created_at:        string
          updated_at:        string
        }
        Insert: {
          id?:               string
          user_id:           string
          message:           string
          link?:             string | null
          read?:             boolean
          notification_type?: NotificationType
          created_at?:       string
          updated_at?:       string
        }
        Update: {
          message?:          string
          link?:             string | null
          read?:             boolean
          notification_type?: NotificationType
          updated_at?:       string
        }
      }

      payments: {
        Row: {
          id:                   string
          order_id:             string
          customer_id:          string
          tailor_id:            string
          amount:               number
          platform_fee:         number
          tailor_payout:        number
          currency:             string
          payment_status:       PaymentStatus
          razorpay_order_id:    string | null
          razorpay_payment_id:  string | null
          razorpay_signature:   string | null
          refund_id:            string | null
          refunded_at:          string | null
          refund_amount:        number | null
          payout_released:      boolean
          payout_released_at:   string | null
          created_at:           string
          updated_at:           string
        }
        Insert: {
          id?:                  string
          order_id:             string
          customer_id:          string
          tailor_id:            string
          amount:               number
          platform_fee?:        number
          tailor_payout:        number
          currency?:            string
          payment_status?:      PaymentStatus
          razorpay_order_id?:   string | null
          razorpay_payment_id?: string | null
          razorpay_signature?:  string | null
          refund_id?:           string | null
          refunded_at?:         string | null
          refund_amount?:       number | null
          payout_released?:     boolean
          payout_released_at?:  string | null
          created_at?:          string
          updated_at?:          string
        }
        Update: {
          payment_status?:      PaymentStatus
          razorpay_order_id?:   string | null
          razorpay_payment_id?: string | null
          razorpay_signature?:  string | null
          refund_id?:           string | null
          refunded_at?:         string | null
          refund_amount?:       number | null
          payout_released?:     boolean
          payout_released_at?:  string | null
          updated_at?:          string
        }
      }

      saved_tailors: {
        Row: {
          id:          string
          customer_id: string
          tailor_id:   string
          created_at:  string
          updated_at:  string
        }
        Insert: {
          id?:         string
          customer_id: string
          tailor_id:   string
          created_at?: string
          updated_at?: string
        }
        Update: {
          updated_at?: string
        }
      }

      measurements: {
        Row: {
          id:            string
          user_id:       string
          label:         string
          chest:         number | null
          waist:         number | null
          hips:          number | null
          shoulder:      number | null
          sleeve_length: number | null
          inseam:        number | null
          neck:          number | null
          height:        number | null
          weight:        number | null
          custom:        Json
          is_default:    boolean
          created_at:    string
          updated_at:    string
        }
        Insert: {
          id?:            string
          user_id:        string
          label?:         string
          chest?:         number | null
          waist?:         number | null
          hips?:          number | null
          shoulder?:      number | null
          sleeve_length?: number | null
          inseam?:        number | null
          neck?:          number | null
          height?:        number | null
          weight?:        number | null
          custom?:        Json
          is_default?:    boolean
          created_at?:    string
          updated_at?:    string
        }
        Update: {
          label?:         string
          chest?:         number | null
          waist?:         number | null
          hips?:          number | null
          shoulder?:      number | null
          sleeve_length?: number | null
          inseam?:        number | null
          neck?:          number | null
          height?:        number | null
          weight?:        number | null
          custom?:        Json
          is_default?:    boolean
          updated_at?:    string
        }
      }

      order_status_history: {
        Row: {
          id:          string
          order_id:    string
          from_status: RequestStatus | null
          to_status:   RequestStatus
          changed_by:  string | null
          note:        string | null
          created_at:  string
        }
        Insert: {
          id?:         string
          order_id:    string
          from_status?: RequestStatus | null
          to_status:   RequestStatus
          changed_by?: string | null
          note?:       string | null
          created_at?: string
        }
        Update: never  // immutable audit log
      }

      disputes: {
        Row: {
          id:          string
          order_id:    string
          raised_by:   string
          reason:      string
          status:      string
          admin_notes: string | null
          created_at:  string
        }
        Insert: {
          id?:         string
          order_id:    string
          raised_by:   string
          reason:      string
          status?:     string
          admin_notes?: string | null
          created_at?: string
        }
        Update: {
          status?:      string
          admin_notes?: string | null
        }
      }

      activity_logs: {
        Row: {
          id:          string
          actor_id:    string | null
          event:       ActivityEventType
          entity_type: string
          entity_id:   string | null
          metadata:    Json
          ip_address:  string | null
          created_at:  string
        }
        Insert: {
          id?:         string
          actor_id?:   string | null
          event:       ActivityEventType
          entity_type: string
          entity_id?:  string | null
          metadata?:   Json
          ip_address?: string | null
          created_at?: string
        }
        Update: never  // immutable audit log
      }
    }

    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_tailor: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      fn_create_notification: {
        Args: {
          p_user_id: string
          p_message: string
          p_link?: string
          p_notification_type?: NotificationType
        }
        Returns: string | null
      }
      fn_accept_bid: {
        Args: {
          p_request_id: string
          p_quote_id: string
          p_customer_id: string
        }
        Returns: Json
      }
      fn_update_order_status: {
        Args: {
          p_order_id: string
          p_new_status: RequestStatus
          p_actor_id: string
        }
        Returns: Json
      }
    }

    Enums: {
      user_role:                   UserRole
      request_status:              RequestStatus
      verification_status_type:    VerificationStatus
      bid_status_type:             BidStatus
      notification_type:           NotificationType
      availability_status_type:    AvailabilityStatus
      payment_status_type:         PaymentStatus
      activity_event_type:         ActivityEventType
      tailor_specialization_name:  TailorSpecializationName
      tailor_skill_name:           TailorSkillName
      portfolio_media_type:        PortfolioMediaType
      verification_doc_type:       VerificationDocType
    }
  }
}

// ── Convenience helpers ───────────────────────────────────────────────────────

/** Shorthand to extract a Row type from a table */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type UserRow                      = TableRow<'users'>
export type TailorProfileRow             = TableRow<'tailor_profiles'>
export type DesignRequestRow             = TableRow<'design_requests'>
export type QuotationRow                 = TableRow<'quotations'>
export type MessageRow                   = TableRow<'messages'>
export type ConversationRow              = TableRow<'conversations'>
export type ReviewRow                    = TableRow<'reviews'>
export type NotificationRow              = TableRow<'notifications'>
export type PaymentRow                   = TableRow<'payments'>
export type SavedTailorRow               = TableRow<'saved_tailors'>
export type MeasurementRow               = TableRow<'measurements'>
export type OrderStatusHistoryRow        = TableRow<'order_status_history'>
export type AddressRow                   = TableRow<'addresses'>
export type DesignRequestImageRow        = TableRow<'design_request_images'>
export type ActivityLogRow               = TableRow<'activity_logs'>
export type DisputeRow                   = TableRow<'disputes'>
export type WishlistItemRow              = TableRow<'wishlist_items'>
// ── Tailor onboarding tables (migration 20260728000001) ───────
export type TailorSpecializationRow      = TableRow<'tailor_specializations'>
export type TailorSkillRow               = TableRow<'tailor_skills'>
export type TailorExperienceRow          = TableRow<'tailor_experience'>
export type TailorPricingRow             = TableRow<'tailor_pricing'>
export type TailorAvailabilityRow        = TableRow<'tailor_availability'>
export type TailorDeliveryOptionsRow     = TableRow<'tailor_delivery_options'>
export type TailorPortfolioItemRow       = TableRow<'tailor_portfolio_items'>
export type TailorSocialLinksRow         = TableRow<'tailor_social_links'>
export type TailorVerificationDocRow     = TableRow<'tailor_verification_documents'>
export type TailorCertificationRow       = TableRow<'tailor_certifications'>

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
      class_bookings: {
        Row: {
          booking_date: string
          created_at: string
          end_time: string
          id: string
          meeting_url: string | null
          notes: string | null
          paid_at: string | null
          payment_status: string | null
          platform_fee: number | null
          price: number | null
          staff_earnings: number | null
          start_time: string
          status: string
          student_id: string
          teacher_id: string | null
          tutor_id: string | null
          updated_at: string
        }
        Insert: {
          booking_date: string
          created_at?: string
          end_time: string
          id?: string
          meeting_url?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_status?: string | null
          platform_fee?: number | null
          price?: number | null
          staff_earnings?: number | null
          start_time: string
          status?: string
          student_id: string
          teacher_id?: string | null
          tutor_id?: string | null
          updated_at?: string
        }
        Update: {
          booking_date?: string
          created_at?: string
          end_time?: string
          id?: string
          meeting_url?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_status?: string | null
          platform_fee?: number | null
          price?: number | null
          staff_earnings?: number | null
          start_time?: string
          status?: string
          student_id?: string
          teacher_id?: string | null
          tutor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      class_requests: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          request_type: string
          responded_at: string | null
          status: string
          student_id: string
          teacher_id: string | null
          tutor_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          request_type: string
          responded_at?: string | null
          status?: string
          student_id: string
          teacher_id?: string | null
          tutor_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          request_type?: string
          responded_at?: string | null
          status?: string
          student_id?: string
          teacher_id?: string | null
          tutor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_requests_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_requests_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_requests_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_requests_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_requests_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_requests_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      class_reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          staff_id: string
          student_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          staff_id: string
          student_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          staff_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "class_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "staff_bookings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_reviews_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_reviews_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_reviews_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_tests: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          teacher_id: string
          test_type: string
          time_limit_minutes: number | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          teacher_id: string
          test_type: string
          time_limit_minutes?: number | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          teacher_id?: string
          test_type?: string
          time_limit_minutes?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_tests_teacher_fk"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_tests_teacher_fk"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_tests_teacher_fk"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          message: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          message: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          message?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_hours: {
        Row: {
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          hours: number
          id: string
          justification: string
          user_id: string
        }
        Insert: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          hours: number
          id?: string
          justification: string
          user_id: string
        }
        Update: {
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          hours?: number
          id?: string
          justification?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_hours_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_hours_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_hours_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_hours_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_hours_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_hours_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_hours_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_hours_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_hours_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          feature_key: string
          feature_name: string
          id: string
          is_enabled: boolean | null
          phase: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          feature_key: string
          feature_name: string
          id?: string
          is_enabled?: boolean | null
          phase?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          feature_key?: string
          feature_name?: string
          id?: string
          is_enabled?: boolean | null
          phase?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          student_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      placement_tests: {
        Row: {
          audio_url: string | null
          correct_answer: string | null
          created_at: string
          id: string
          level: Database["public"]["Enums"]["cefr_level"]
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          question: string
          question_number: number
          question_type: string
        }
        Insert: {
          audio_url?: string | null
          correct_answer?: string | null
          created_at?: string
          id?: string
          level: Database["public"]["Enums"]["cefr_level"]
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question: string
          question_number: number
          question_type?: string
        }
        Update: {
          audio_url?: string | null
          correct_answer?: string | null
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question?: string
          question_number?: number
          question_type?: string
        }
        Relationships: []
      }
      platform_earnings: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          platform_fee: number
          staff_earnings: number
          staff_id: string
          total_amount: number
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          platform_fee: number
          staff_earnings: number
          staff_id: string
          total_amount: number
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          platform_fee?: number
          staff_earnings?: number
          staff_id?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "platform_earnings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "class_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_earnings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "staff_bookings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string | null
          created_at: string | null
          file_name: string | null
          id: string
          media_type: string | null
          media_url: string | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          allergies: string | null
          approved_at: string | null
          approved_by: string | null
          availability: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          currency: string | null
          diet: string | null
          email: string
          experience: string | null
          full_name: string
          hourly_rate: number | null
          id: string
          is_approved: boolean | null
          is_public_profile: boolean | null
          languages_spoken: string[] | null
          nationality: string | null
          show_followers: boolean | null
          show_following: boolean | null
          social_links: Json | null
          staff_type: string | null
          study_objectives: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          allergies?: string | null
          approved_at?: string | null
          approved_by?: string | null
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          currency?: string | null
          diet?: string | null
          email: string
          experience?: string | null
          full_name: string
          hourly_rate?: number | null
          id: string
          is_approved?: boolean | null
          is_public_profile?: boolean | null
          languages_spoken?: string[] | null
          nationality?: string | null
          show_followers?: boolean | null
          show_following?: boolean | null
          social_links?: Json | null
          staff_type?: string | null
          study_objectives?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          allergies?: string | null
          approved_at?: string | null
          approved_by?: string | null
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          currency?: string | null
          diet?: string | null
          email?: string
          experience?: string | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          is_approved?: boolean | null
          is_public_profile?: boolean | null
          languages_spoken?: string[] | null
          nationality?: string | null
          show_followers?: boolean | null
          show_following?: boolean | null
          social_links?: Json | null
          staff_type?: string | null
          study_objectives?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          active: boolean
          capacity: number
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule_events: {
        Row: {
          color: string | null
          created_at: string
          created_by: string
          day_of_week: number
          description: string | null
          end_time: string
          event_type: string
          id: string
          is_active: boolean
          level: Database["public"]["Enums"]["cefr_level"] | null
          room_id: string | null
          start_time: string
          teacher_id: string | null
          title: string
          tutor_id: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by: string
          day_of_week: number
          description?: string | null
          end_time: string
          event_type: string
          id?: string
          is_active?: boolean
          level?: Database["public"]["Enums"]["cefr_level"] | null
          room_id?: string | null
          start_time: string
          teacher_id?: string | null
          title: string
          tutor_id?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string
          day_of_week?: number
          description?: string | null
          end_time?: string
          event_type?: string
          id?: string
          is_active?: boolean
          level?: Database["public"]["Enums"]["cefr_level"] | null
          room_id?: string | null
          start_time?: string
          teacher_id?: string | null
          title?: string
          tutor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_events_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_events_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_events_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_events_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_events_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_events_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_events_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          active: boolean | null
          created_at: string
          file_url: string
          id: string
          title: string
          uploaded_by: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          file_url: string
          id?: string
          title: string
          uploaded_by: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          file_url?: string
          id?: string
          title?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      staff_hours: {
        Row: {
          calculated_hours: number
          created_at: string
          id: string
          last_calculated_at: string | null
          manual_adjustment_hours: number
          total_hours: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calculated_hours?: number
          created_at?: string
          id?: string
          last_calculated_at?: string | null
          manual_adjustment_hours?: number
          total_hours?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calculated_hours?: number
          created_at?: string
          id?: string
          last_calculated_at?: string | null
          manual_adjustment_hours?: number
          total_hours?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_hours_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_hours_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_hours_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_modality_requests: {
        Row: {
          created_at: string | null
          current_modality: string
          id: string
          reason: string | null
          requested_modality: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_modality: string
          id?: string
          reason?: string | null
          requested_modality: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_modality?: string
          id?: string
          reason?: string | null
          requested_modality?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      student_class_schedules: {
        Row: {
          created_at: string
          created_by: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          schedule_type: string
          start_time: string
          student_id: string
          teacher_id: string | null
          tutor_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          schedule_type: string
          start_time: string
          student_id: string
          teacher_id?: string | null
          tutor_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          schedule_type?: string
          start_time?: string
          student_id?: string
          teacher_id?: string | null
          tutor_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          created_at: string
          id: string
          initial_feedback: string | null
          level: Database["public"]["Enums"]["cefr_level"] | null
          placement_test_answers: Json | null
          placement_test_oral_completed: boolean | null
          placement_test_status: Database["public"]["Enums"]["test_status"]
          placement_test_written_score: number | null
          room: string | null
          status: Database["public"]["Enums"]["student_status"]
          student_type: Database["public"]["Enums"]["student_modality"]
          teacher_id: string | null
          tutor_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          initial_feedback?: string | null
          level?: Database["public"]["Enums"]["cefr_level"] | null
          placement_test_answers?: Json | null
          placement_test_oral_completed?: boolean | null
          placement_test_status?: Database["public"]["Enums"]["test_status"]
          placement_test_written_score?: number | null
          room?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          student_type?: Database["public"]["Enums"]["student_modality"]
          teacher_id?: string | null
          tutor_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          initial_feedback?: string | null
          level?: Database["public"]["Enums"]["cefr_level"] | null
          placement_test_answers?: Json | null
          placement_test_oral_completed?: boolean | null
          placement_test_status?: Database["public"]["Enums"]["test_status"]
          placement_test_written_score?: number | null
          room?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          student_type?: Database["public"]["Enums"]["student_modality"]
          teacher_id?: string | null
          tutor_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_progress_notes: {
        Row: {
          achievements: string | null
          achievements_by: string | null
          challenges: string | null
          challenges_by: string | null
          class_topics: string | null
          class_topics_by: string | null
          created_at: string
          created_by: string
          day_type: string
          id: string
          notes: string | null
          tutoring_topics: string | null
          tutoring_topics_by: string | null
          updated_at: string
          vocabulary: string | null
          vocabulary_by: string | null
          week_id: string
        }
        Insert: {
          achievements?: string | null
          achievements_by?: string | null
          challenges?: string | null
          challenges_by?: string | null
          class_topics?: string | null
          class_topics_by?: string | null
          created_at?: string
          created_by: string
          day_type: string
          id?: string
          notes?: string | null
          tutoring_topics?: string | null
          tutoring_topics_by?: string | null
          updated_at?: string
          vocabulary?: string | null
          vocabulary_by?: string | null
          week_id: string
        }
        Update: {
          achievements?: string | null
          achievements_by?: string | null
          challenges?: string | null
          challenges_by?: string | null
          class_topics?: string | null
          class_topics_by?: string | null
          created_at?: string
          created_by?: string
          day_type?: string
          id?: string
          notes?: string | null
          tutoring_topics?: string | null
          tutoring_topics_by?: string | null
          updated_at?: string
          vocabulary?: string | null
          vocabulary_by?: string | null
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_notes_achievements_by_fkey"
            columns: ["achievements_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_notes_achievements_by_fkey"
            columns: ["achievements_by"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_notes_achievements_by_fkey"
            columns: ["achievements_by"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_notes_challenges_by_fkey"
            columns: ["challenges_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_notes_challenges_by_fkey"
            columns: ["challenges_by"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_notes_challenges_by_fkey"
            columns: ["challenges_by"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_notes_class_topics_by_fkey"
            columns: ["class_topics_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_notes_class_topics_by_fkey"
            columns: ["class_topics_by"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_notes_class_topics_by_fkey"
            columns: ["class_topics_by"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_notes_tutoring_topics_by_fkey"
            columns: ["tutoring_topics_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_notes_tutoring_topics_by_fkey"
            columns: ["tutoring_topics_by"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_notes_tutoring_topics_by_fkey"
            columns: ["tutoring_topics_by"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_notes_vocabulary_by_fkey"
            columns: ["vocabulary_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_notes_vocabulary_by_fkey"
            columns: ["vocabulary_by"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_notes_vocabulary_by_fkey"
            columns: ["vocabulary_by"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_notes_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "student_progress_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress_weeks: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          is_completed: boolean
          student_id: string
          updated_at: string
          week_number: number
          week_objectives: string | null
          week_theme: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          student_id: string
          updated_at?: string
          week_number: number
          week_objectives?: string | null
          week_theme?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          student_id?: string
          updated_at?: string
          week_number?: number
          week_objectives?: string | null
          week_theme?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_weeks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_weeks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_weeks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      student_schedule_assignments: {
        Row: {
          assigned_by: string
          created_at: string
          id: string
          schedule_event_id: string
          student_id: string
        }
        Insert: {
          assigned_by: string
          created_at?: string
          id?: string
          schedule_event_id: string
          student_id: string
        }
        Update: {
          assigned_by?: string
          created_at?: string
          id?: string
          schedule_event_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_schedule_assignments_schedule_event_id_fkey"
            columns: ["schedule_event_id"]
            isOneToOne: false
            referencedRelation: "schedule_events"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed: boolean | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          student_id: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          student_id: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          student_id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_tutor_messages: {
        Row: {
          created_at: string
          id: string
          message: string | null
          sender_id: string
          student_id: string
          task_id: string | null
          test_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          sender_id: string
          student_id: string
          task_id?: string | null
          test_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          sender_id?: string
          student_id?: string
          task_id?: string | null
          test_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ttm_sender_fk"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ttm_sender_fk"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ttm_sender_fk"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ttm_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ttm_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ttm_student_fk"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ttm_task_fk"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ttm_test_fk"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "custom_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      template_questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          id: string
          options: Json | null
          order_number: number
          points: number
          question_text: string
          question_type: string
          template_id: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          options?: Json | null
          order_number: number
          points?: number
          question_text: string
          question_type: string
          template_id: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          options?: Json | null
          order_number?: number
          points?: number
          question_text?: string
          question_type?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "test_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      test_answers: {
        Row: {
          answer_text: string | null
          assignment_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          points_earned: number | null
          question_id: string
        }
        Insert: {
          answer_text?: string | null
          assignment_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id: string
        }
        Update: {
          answer_text?: string | null
          assignment_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_answers_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "test_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "test_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_assignments: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string
          feedback: string | null
          graded_at: string | null
          id: string
          score: number | null
          started_at: string | null
          status: string
          student_id: string
          test_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string
          feedback?: string | null
          graded_at?: string | null
          id?: string
          score?: number | null
          started_at?: string | null
          status?: string
          student_id: string
          test_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string
          feedback?: string | null
          graded_at?: string | null
          id?: string
          score?: number | null
          started_at?: string | null
          status?: string
          student_id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_assignments_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "custom_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          id: string
          options: Json | null
          order_number: number
          points: number
          question_text: string
          question_type: string
          test_id: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          options?: Json | null
          order_number: number
          points?: number
          question_text: string
          question_type: string
          test_id: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          options?: Json | null
          order_number?: number
          points?: number
          question_text?: string
          question_type?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "custom_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          teacher_id: string
          test_type: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          teacher_id: string
          test_type: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          teacher_id?: string
          test_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_templates_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_templates_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_templates_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          notes: string | null
          session_date: string
          student_id: string
          topic: string
          tutor_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes: number
          id?: string
          notes?: string | null
          session_date: string
          student_id: string
          topic: string
          tutor_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          session_date?: string
          student_id?: string
          topic?: string
          tutor_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
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
      video_calls: {
        Row: {
          caller_id: string
          created_at: string
          duration_minutes: number | null
          ended_at: string | null
          id: string
          room_id: string
          started_at: string
          student_id: string
        }
        Insert: {
          caller_id: string
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          room_id: string
          started_at?: string
          student_id: string
        }
        Update: {
          caller_id?: string
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          room_id?: string
          started_at?: string
          student_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_staff_profiles: {
        Row: {
          availability: string | null
          avatar_url: string | null
          bio: string | null
          currency: string | null
          experience: string | null
          full_name: string | null
          hourly_rate: number | null
          id: string | null
          is_approved: boolean | null
          languages_spoken: string[] | null
          role: Database["public"]["Enums"]["app_role"] | null
          timezone: string | null
        }
        Relationships: []
      }
      safe_profiles_view: {
        Row: {
          age: number | null
          allergies: string | null
          approved_at: string | null
          approved_by: string | null
          availability: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          currency: string | null
          diet: string | null
          email: string | null
          experience: string | null
          full_name: string | null
          hourly_rate: number | null
          id: string | null
          is_approved: boolean | null
          is_public_profile: boolean | null
          languages_spoken: string[] | null
          nationality: string | null
          show_followers: boolean | null
          show_following: boolean | null
          social_links: Json | null
          staff_type: string | null
          study_objectives: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          age?: never
          allergies?: never
          approved_at?: never
          approved_by?: never
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          currency?: never
          diet?: never
          email?: never
          experience?: string | null
          full_name?: string | null
          hourly_rate?: never
          id?: string | null
          is_approved?: boolean | null
          is_public_profile?: boolean | null
          languages_spoken?: string[] | null
          nationality?: never
          show_followers?: boolean | null
          show_following?: boolean | null
          social_links?: Json | null
          staff_type?: string | null
          study_objectives?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          age?: never
          allergies?: never
          approved_at?: never
          approved_by?: never
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          currency?: never
          diet?: never
          email?: never
          experience?: string | null
          full_name?: string | null
          hourly_rate?: never
          id?: string | null
          is_approved?: boolean | null
          is_public_profile?: boolean | null
          languages_spoken?: string[] | null
          nationality?: never
          show_followers?: boolean | null
          show_following?: boolean | null
          social_links?: Json | null
          staff_type?: string | null
          study_objectives?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_bookings_view: {
        Row: {
          booking_date: string | null
          created_at: string | null
          end_time: string | null
          id: string | null
          meeting_url: string | null
          notes: string | null
          paid_at: string | null
          payment_status: string | null
          platform_fee: number | null
          price: number | null
          staff_earnings: number | null
          start_time: string | null
          status: string | null
          student_id: string | null
          teacher_id: string | null
          tutor_id: string | null
          updated_at: string | null
        }
        Insert: {
          booking_date?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string | null
          meeting_url?: string | null
          notes?: string | null
          paid_at?: never
          payment_status?: never
          platform_fee?: never
          price?: never
          staff_earnings?: never
          start_time?: string | null
          status?: string | null
          student_id?: string | null
          teacher_id?: string | null
          tutor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_date?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string | null
          meeting_url?: string | null
          notes?: string | null
          paid_at?: never
          payment_status?: never
          platform_fee?: never
          price?: never
          staff_earnings?: never
          start_time?: string | null
          status?: string | null
          student_id?: string | null
          teacher_id?: string | null
          tutor_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "public_staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "safe_profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_staff_hours: { Args: never; Returns: undefined }
      create_notification: {
        Args: {
          p_message: string
          p_related_id?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      get_test_questions_for_student: {
        Args: { p_test_id: string }
        Returns: {
          created_at: string
          id: string
          options: Json
          order_number: number
          points: number
          question_text: string
          question_type: string
          test_id: string
        }[]
      }
      has_admin_or_coordinator_role: {
        Args: { _user_id: string }
        Returns: boolean
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
      app_role: "admin" | "teacher" | "tutor" | "student" | "coordinator"
      cefr_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
      student_modality: "presencial" | "online"
      student_status: "active" | "out_of_school"
      test_status: "not_started" | "pending" | "completed"
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
      app_role: ["admin", "teacher", "tutor", "student", "coordinator"],
      cefr_level: ["A1", "A2", "B1", "B2", "C1", "C2"],
      student_modality: ["presencial", "online"],
      student_status: ["active", "out_of_school"],
      test_status: ["not_started", "pending", "completed"],
    },
  },
} as const

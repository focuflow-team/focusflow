// 자동 생성 대체용 Supabase DB 타입
// 실제 환경에서는 `supabase gen types typescript --linked` 로 재생성하세요.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SubscriptionTier = 'free' | 'pro' | 'team'
export type SessionStatus   = 'completed' | 'interrupted' | 'in_progress'
export type InsightType     = 'daily_summary' | 'pattern_analysis' | 'recommendation'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:                     string
          email:                  string
          display_name:           string | null
          avatar_url:             string | null
          subscription_tier:      SubscriptionTier
          stripe_customer_id:     string | null
          stripe_subscription_id: string | null
          timezone:               string
          settings:               Json
          created_at:             string
          updated_at:             string
        }
        Insert: {
          id:                     string
          email:                  string
          display_name?:          string | null
          avatar_url?:            string | null
          subscription_tier?:     SubscriptionTier
          stripe_customer_id?:    string | null
          stripe_subscription_id?: string | null
          timezone?:              string
          settings?:              Json
          created_at?:            string
          updated_at?:            string
        }
        Update: {
          id?:                     string
          email?:                  string
          display_name?:           string | null
          avatar_url?:             string | null
          subscription_tier?:      SubscriptionTier
          stripe_customer_id?:     string | null
          stripe_subscription_id?: string | null
          timezone?:               string
          settings?:               Json
          updated_at?:             string
        }
        Relationships: []
      }

      focus_sessions: {
        Row: {
          id:                     string
          user_id:                string
          task_name:              string | null
          duration_minutes:       number
          break_duration_minutes: number
          status:                 SessionStatus
          interruptions:          number
          mood_before:            number | null
          mood_after:             number | null
          started_at:             string
          ended_at:               string | null
          created_at:             string
        }
        Insert: {
          id?:                     string
          user_id:                 string
          task_name?:              string | null
          duration_minutes?:       number
          break_duration_minutes?: number
          status?:                 SessionStatus
          interruptions?:          number
          mood_before?:            number | null
          mood_after?:             number | null
          started_at?:             string
          ended_at?:               string | null
          created_at?:             string
        }
        Update: {
          task_name?:              string | null
          duration_minutes?:       number
          break_duration_minutes?: number
          status?:                 SessionStatus
          interruptions?:          number
          mood_before?:            number | null
          mood_after?:             number | null
          ended_at?:               string | null
        }
        Relationships: [
          {
            foreignKeyName: 'focus_sessions_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }

      ai_insights: {
        Row: {
          id:           string
          user_id:      string
          insight_type: InsightType
          content:      string
          metadata:     Json
          created_at:   string
        }
        Insert: {
          id?:           string
          user_id:       string
          insight_type:  InsightType
          content:       string
          metadata?:     Json
          created_at?:   string
        }
        Update: {
          content?:   string
          metadata?:  Json
        }
        Relationships: [
          {
            foreignKeyName: 'ai_insights_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }

      google_calendar_tokens: {
        Row: {
          id:            string
          user_id:       string
          access_token:  string
          refresh_token: string | null
          expires_at:    string | null
          calendar_id:   string | null
          created_at:    string
          updated_at:    string
        }
        Insert: {
          id?:            string
          user_id:        string
          access_token:   string
          refresh_token?: string | null
          expires_at?:    string | null
          calendar_id?:   string | null
          created_at?:    string
          updated_at?:    string
        }
        Update: {
          access_token?:  string
          refresh_token?: string | null
          expires_at?:    string | null
          calendar_id?:   string | null
          updated_at?:    string
        }
        Relationships: [
          {
            foreignKeyName: 'google_calendar_tokens_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }

    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      subscription_tier: SubscriptionTier
      session_status:    SessionStatus
      insight_type:      InsightType
    }
    CompositeTypes: Record<string, never>
  }
}

// 편의 타입 별칭
export type Profile               = Database['public']['Tables']['profiles']['Row']
export type FocusSession          = Database['public']['Tables']['focus_sessions']['Row']
export type AiInsight             = Database['public']['Tables']['ai_insights']['Row']
export type GoogleCalendarTokens  = Database['public']['Tables']['google_calendar_tokens']['Row']

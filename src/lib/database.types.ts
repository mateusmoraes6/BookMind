export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      genres: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          icon?: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string
          is_default?: boolean
          created_at?: string
        }
      }
      subcategories: {
        Row: {
          id: string
          genre_id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          genre_id: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          genre_id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
      }
      books: {
        Row: {
          id: string
          user_id: string
          title: string
          author: string
          publication_year: number | null
          genre_id: string | null
          total_pages: number
          cover_url: string | null
          isbn: string | null
          description: string | null
          status: 'not_started' | 'in_progress' | 'completed'
          personal_rating: number | null
          current_page: number
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          author: string
          publication_year?: number | null
          genre_id?: string | null
          total_pages?: number
          cover_url?: string | null
          isbn?: string | null
          description?: string | null
          status?: 'not_started' | 'in_progress' | 'completed'
          personal_rating?: number | null
          current_page?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          author?: string
          publication_year?: number | null
          genre_id?: string | null
          total_pages?: number
          cover_url?: string | null
          isbn?: string | null
          description?: string | null
          status?: 'not_started' | 'in_progress' | 'completed'
          personal_rating?: number | null
          current_page?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      book_tags: {
        Row: {
          id: string
          book_id: string
          user_id: string
          tag: string
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          user_id: string
          tag: string
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          user_id?: string
          tag?: string
          created_at?: string
        }
      }
      reading_sessions: {
        Row: {
          id: string
          user_id: string
          book_id: string
          pages_read: number
          start_page: number | null
          end_page: number | null
          duration_minutes: number
          session_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          pages_read?: number
          start_page?: number | null
          end_page?: number | null
          duration_minutes?: number
          session_date?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          pages_read?: number
          start_page?: number | null
          end_page?: number | null
          duration_minutes?: number
          session_date?: string
          notes?: string | null
          created_at?: string
        }
      }
      reading_goals: {
        Row: {
          id: string
          user_id: string
          goal_type: 'daily_pages' | 'monthly_books' | 'yearly_books'
          target_value: number
          period_start: string
          period_end: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_type: 'daily_pages' | 'monthly_books' | 'yearly_books'
          target_value: number
          period_start: string
          period_end: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_type?: 'daily_pages' | 'monthly_books' | 'yearly_books'
          target_value?: number
          period_start?: string
          period_end?: string
          is_active?: boolean
          created_at?: string
        }
      }
      book_notes: {
        Row: {
          id: string
          user_id: string
          book_id: string
          page_number: number | null
          chapter: string | null
          content: string
          is_highlight: boolean
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          page_number?: number | null
          chapter?: string | null
          content: string
          is_highlight?: boolean
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          page_number?: number | null
          chapter?: string | null
          content?: string
          is_highlight?: boolean
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      book_reviews: {
        Row: {
          id: string
          user_id: string
          book_id: string
          review_text: string | null
          rating: number | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          review_text?: string | null
          rating?: number | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          review_text?: string | null
          rating?: number | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      custom_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          icon: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          icon?: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          icon?: string
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type: string
          achievement_name: string
          description: string | null
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_type: string
          achievement_name: string
          description?: string | null
          unlocked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_type?: string
          achievement_name?: string
          description?: string | null
          unlocked_at?: string
        }
      }
      user_preferences: {
        Row: {
          user_id: string
          daily_reading_reminder: boolean
          reminder_time: string
          theme: string
          books_per_page: number
          updated_at: string
        }
        Insert: {
          user_id: string
          daily_reading_reminder?: boolean
          reminder_time?: string
          theme?: string
          books_per_page?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          daily_reading_reminder?: boolean
          reminder_time?: string
          theme?: string
          books_per_page?: number
          updated_at?: string
        }
      }
    }
  }
}

/*
  # BookMind Database Schema - Complete Structure

  ## Overview
  This migration creates the complete database schema for BookMind, an intelligent reading manager application.
  The schema supports book management, reading progress tracking, goal setting, annotations, and personalized recommendations.

  ## New Tables

  ### 1. profiles
  - `id` (uuid, PK, references auth.users)
  - `email` (text)
  - `full_name` (text)
  - `avatar_url` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. genres
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to profiles)
  - `name` (text)
  - `color` (text) - for visual organization
  - `icon` (text) - icon identifier
  - `is_default` (boolean) - system vs user-created
  - `created_at` (timestamptz)

  ### 3. subcategories
  - `id` (uuid, PK)
  - `genre_id` (uuid, FK to genres)
  - `user_id` (uuid, FK to profiles)
  - `name` (text)
  - `created_at` (timestamptz)

  ### 4. books
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to profiles)
  - `title` (text)
  - `author` (text)
  - `publication_year` (integer)
  - `genre_id` (uuid, FK to genres)
  - `total_pages` (integer)
  - `cover_url` (text)
  - `isbn` (text)
  - `description` (text)
  - `status` (text) - not_started, in_progress, completed
  - `personal_rating` (integer) - 1-5 stars
  - `current_page` (integer)
  - `started_at` (timestamptz)
  - `completed_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. book_subcategories
  - `book_id` (uuid, FK to books)
  - `subcategory_id` (uuid, FK to subcategories)
  - Join table for many-to-many relationship

  ### 6. book_tags
  - `id` (uuid, PK)
  - `book_id` (uuid, FK to books)
  - `user_id` (uuid, FK to profiles)
  - `tag` (text)
  - `created_at` (timestamptz)

  ### 7. reading_sessions
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to profiles)
  - `book_id` (uuid, FK to books)
  - `pages_read` (integer)
  - `start_page` (integer)
  - `end_page` (integer)
  - `duration_minutes` (integer)
  - `session_date` (date)
  - `notes` (text)
  - `created_at` (timestamptz)

  ### 8. reading_goals
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to profiles)
  - `goal_type` (text) - daily_pages, monthly_books, yearly_books
  - `target_value` (integer)
  - `period_start` (date)
  - `period_end` (date)
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### 9. book_notes
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to profiles)
  - `book_id` (uuid, FK to books)
  - `page_number` (integer)
  - `chapter` (text)
  - `content` (text)
  - `is_highlight` (boolean)
  - `color` (text) - for highlight colors
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 10. book_reviews
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to profiles)
  - `book_id` (uuid, FK to books)
  - `review_text` (text)
  - `rating` (integer)
  - `is_public` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 11. custom_lists
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to profiles)
  - `name` (text)
  - `description` (text)
  - `icon` (text)
  - `color` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 12. list_books
  - `list_id` (uuid, FK to custom_lists)
  - `book_id` (uuid, FK to books)
  - `added_at` (timestamptz)
  - Join table with timestamp

  ### 13. achievements
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to profiles)
  - `achievement_type` (text)
  - `achievement_name` (text)
  - `description` (text)
  - `unlocked_at` (timestamptz)

  ### 14. user_preferences
  - `user_id` (uuid, PK, FK to profiles)
  - `daily_reading_reminder` (boolean)
  - `reminder_time` (time)
  - `theme` (text)
  - `books_per_page` (integer)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies ensure users can only access their own data
  - Authenticated users only for all operations
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create genres table
CREATE TABLE IF NOT EXISTS genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#6366f1',
  icon text DEFAULT 'book',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE genres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own genres"
  ON genres FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own genres"
  ON genres FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own genres"
  ON genres FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own genres"
  ON genres FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  genre_id uuid REFERENCES genres(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subcategories"
  ON subcategories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subcategories"
  ON subcategories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subcategories"
  ON subcategories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subcategories"
  ON subcategories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  author text NOT NULL,
  publication_year integer,
  genre_id uuid REFERENCES genres(id) ON DELETE SET NULL,
  total_pages integer DEFAULT 0,
  cover_url text,
  isbn text,
  description text,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  personal_rating integer CHECK (personal_rating >= 1 AND personal_rating <= 5),
  current_page integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own books"
  ON books FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books"
  ON books FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own books"
  ON books FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create book_subcategories join table
CREATE TABLE IF NOT EXISTS book_subcategories (
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  subcategory_id uuid REFERENCES subcategories(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (book_id, subcategory_id)
);

ALTER TABLE book_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own book subcategories"
  ON book_subcategories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_subcategories.book_id
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own book subcategories"
  ON book_subcategories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_subcategories.book_id
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own book subcategories"
  ON book_subcategories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_subcategories.book_id
      AND books.user_id = auth.uid()
    )
  );

-- Create book_tags table
CREATE TABLE IF NOT EXISTS book_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tag text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE book_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own book tags"
  ON book_tags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own book tags"
  ON book_tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own book tags"
  ON book_tags FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create reading_sessions table
CREATE TABLE IF NOT EXISTS reading_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  pages_read integer DEFAULT 0,
  start_page integer,
  end_page integer,
  duration_minutes integer DEFAULT 0,
  session_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading sessions"
  ON reading_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading sessions"
  ON reading_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading sessions"
  ON reading_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading sessions"
  ON reading_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create reading_goals table
CREATE TABLE IF NOT EXISTS reading_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  goal_type text NOT NULL CHECK (goal_type IN ('daily_pages', 'monthly_books', 'yearly_books')),
  target_value integer NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reading_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading goals"
  ON reading_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading goals"
  ON reading_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading goals"
  ON reading_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading goals"
  ON reading_goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create book_notes table
CREATE TABLE IF NOT EXISTS book_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  page_number integer,
  chapter text,
  content text NOT NULL,
  is_highlight boolean DEFAULT false,
  color text DEFAULT '#fbbf24',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE book_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own book notes"
  ON book_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own book notes"
  ON book_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own book notes"
  ON book_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own book notes"
  ON book_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create book_reviews table
CREATE TABLE IF NOT EXISTS book_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  review_text text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book_id)
);

ALTER TABLE book_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own book reviews"
  ON book_reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own book reviews"
  ON book_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own book reviews"
  ON book_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own book reviews"
  ON book_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create custom_lists table
CREATE TABLE IF NOT EXISTS custom_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  icon text DEFAULT 'list',
  color text DEFAULT '#8b5cf6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE custom_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custom lists"
  ON custom_lists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom lists"
  ON custom_lists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom lists"
  ON custom_lists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom lists"
  ON custom_lists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create list_books join table
CREATE TABLE IF NOT EXISTS list_books (
  list_id uuid REFERENCES custom_lists(id) ON DELETE CASCADE NOT NULL,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  added_at timestamptz DEFAULT now(),
  PRIMARY KEY (list_id, book_id)
);

ALTER TABLE list_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own list books"
  ON list_books FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_lists
      WHERE custom_lists.id = list_books.list_id
      AND custom_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own list books"
  ON list_books FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_lists
      WHERE custom_lists.id = list_books.list_id
      AND custom_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own list books"
  ON list_books FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_lists
      WHERE custom_lists.id = list_books.list_id
      AND custom_lists.user_id = auth.uid()
    )
  );

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_type text NOT NULL,
  achievement_name text NOT NULL,
  description text,
  unlocked_at timestamptz DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  daily_reading_reminder boolean DEFAULT true,
  reminder_time time DEFAULT '20:00:00',
  theme text DEFAULT 'light',
  books_per_page integer DEFAULT 12,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_genre_id ON books(genre_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book_id ON reading_sessions(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_date ON reading_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_book_notes_book_id ON book_notes(book_id);
CREATE INDEX IF NOT EXISTS idx_genres_user_id ON genres(user_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_genre_id ON subcategories(genre_id);
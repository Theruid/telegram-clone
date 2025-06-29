/*
  # Create users and messaging system

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `username` (text, unique)
      - `display_name` (text)
      - `avatar_url` (text)
      - `is_online` (boolean)
      - `last_seen` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `contacts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `contact_id` (uuid, references profiles)
      - `status` (text) - 'pending', 'accepted', 'blocked'
      - `created_at` (timestamptz)
    
    - `messages`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references profiles)
      - `receiver_id` (uuid, references profiles)
      - `content` (text)
      - `is_read` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for messaging between contacts
</sql>

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  avatar_url text DEFAULT 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  is_online boolean DEFAULT false,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, contact_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Contacts policies
CREATE POLICY "Users can view their contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = contact_id);

CREATE POLICY "Users can manage their contacts"
  ON contacts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', new.email),
    COALESCE(new.raw_user_meta_data->>'display_name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update last_seen
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles 
  SET last_seen = now(), updated_at = now()
  WHERE id = auth.uid();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
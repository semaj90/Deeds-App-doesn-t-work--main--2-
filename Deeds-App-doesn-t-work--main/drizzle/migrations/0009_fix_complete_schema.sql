-- Drop existing tables if they exist and recreate with correct structure
DROP TABLE IF EXISTS case_activities CASCADE;
DROP TABLE IF EXISTS evidence CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS criminals CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  email_verified timestamp,
  hashed_password text,
  role varchar(50) DEFAULT 'prosecutor' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  first_name varchar(100),
  last_name varchar(100),
  name text,
  title varchar(100),
  department varchar(200),
  phone varchar(20),
  office_address text,
  avatar text,
  bio text,
  specializations jsonb DEFAULT '[]' NOT NULL
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamp NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

-- Create criminals table
CREATE TABLE IF NOT EXISTS criminals (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  middle_name varchar(100),
  aliases jsonb DEFAULT '[]' NOT NULL,
  date_of_birth timestamp,
  address text,
  phone varchar(20),
  email varchar(255),
  height integer,
  weight integer,
  eye_color varchar(20),
  hair_color varchar(20),
  distinguishing_marks text,
  photo_url text,
  threat_level varchar(20) DEFAULT 'low' NOT NULL,
  priors jsonb DEFAULT '[]' NOT NULL,
  convictions jsonb DEFAULT '[]' NOT NULL,
  notes text,
  ai_summary text,
  ai_tags jsonb DEFAULT '[]' NOT NULL,
  created_by uuid REFERENCES users(id),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Create cases table
CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number varchar(50),
  title varchar(255) NOT NULL,
  description text,
  incident_date timestamp,
  location text,
  priority varchar(20) DEFAULT 'medium' NOT NULL,
  status varchar(20) DEFAULT 'open' NOT NULL,
  category varchar(50),
  danger_score integer DEFAULT 0 NOT NULL,
  estimated_value decimal(12,2),
  jurisdiction varchar(100),
  lead_prosecutor uuid REFERENCES users(id),
  assigned_team jsonb DEFAULT '[]' NOT NULL,
  ai_summary text,
  ai_tags jsonb DEFAULT '[]' NOT NULL,
  metadata jsonb DEFAULT '{}' NOT NULL,
  created_by uuid REFERENCES users(id),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  closed_at timestamp
);

-- Create evidence table
CREATE TABLE IF NOT EXISTS evidence (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  criminal_id integer REFERENCES criminals(id),
  title varchar(255) NOT NULL,
  description text,
  file_url text,
  file_type varchar(100),
  file_size integer,
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Create statutes table
CREATE TABLE IF NOT EXISTS statutes (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code varchar(50) NOT NULL UNIQUE,
  title varchar(255) NOT NULL,
  description text,
  full_text text,
  category varchar(100),
  severity varchar(20),
  min_penalty varchar(255),
  max_penalty varchar(255),
  jurisdiction varchar(100),
  effective_date timestamp,
  ai_summary text,
  tags jsonb DEFAULT '[]' NOT NULL,
  related_statutes jsonb DEFAULT '[]' NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Create case_activities table
CREATE TABLE IF NOT EXISTS case_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  activity_type varchar(50) NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  scheduled_for timestamp,
  completed_at timestamp,
  status varchar(20) DEFAULT 'pending' NOT NULL,
  priority varchar(20) DEFAULT 'medium' NOT NULL,
  assigned_to uuid REFERENCES users(id),
  related_evidence jsonb DEFAULT '[]' NOT NULL,
  related_criminals jsonb DEFAULT '[]' NOT NULL,
  metadata jsonb DEFAULT '{}' NOT NULL,
  created_by uuid REFERENCES users(id),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_criminals_name ON criminals(first_name, last_name);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_created_by ON cases(created_by);
CREATE INDEX idx_evidence_case_id ON evidence(case_id);
CREATE INDEX idx_evidence_criminal_id ON evidence(criminal_id);
CREATE INDEX idx_case_activities_case_id ON case_activities(case_id);

-- Insert a default admin user (password: password123)
INSERT INTO users (email, hashed_password, name, first_name, last_name, role) 
VALUES (
  'admin@example.com', 
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYhBSBLtYyiLaGm', -- password123
  'System Administrator',
  'System',
  'Administrator',
  'admin'
) ON CONFLICT (email) DO NOTHING;

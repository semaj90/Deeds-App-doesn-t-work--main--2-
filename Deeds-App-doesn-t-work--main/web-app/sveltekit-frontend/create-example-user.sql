-- Add example@example.com user for testing
-- Run this directly in your PostgreSQL database

-- First, let's check if the user already exists
SELECT email FROM users WHERE email = 'example@example.com';

-- If no results, insert the user with a hashed password for 'password123'
-- Note: Replace the hash below with a proper bcrypt hash if needed

INSERT INTO users (
  id,
  email,
  hashed_password,
  role,
  name,
  first_name,
  last_name,
  is_active,
  email_verified,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'example@example.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- This is bcrypt hash for 'password'
  'prosecutor',
  'Example User',
  'Example',
  'User',
  true,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Verify the user was created
SELECT email, role, name, is_active, email_verified FROM users WHERE email = 'example@example.com';

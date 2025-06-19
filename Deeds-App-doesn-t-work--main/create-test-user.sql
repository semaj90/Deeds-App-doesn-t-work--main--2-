-- Create test user for login
INSERT INTO users (
  email, 
  hashed_password, 
  role, 
  is_active, 
  first_name, 
  last_name, 
  name, 
  title, 
  department, 
  provider
) VALUES (
  'example@example.com',
  E'\\$2b\\$12\\$N9qo8uLOickgx2ZMRZoMye7I6F.x1WaO.jzB6V8G6PrZfJT.8KJpm', -- bcrypt hash for 'password123'
  'prosecutor',
  true,
  'Test',
  'User',
  'Test User',
  'Prosecutor',
  'Criminal Justice',
  'credentials'
);

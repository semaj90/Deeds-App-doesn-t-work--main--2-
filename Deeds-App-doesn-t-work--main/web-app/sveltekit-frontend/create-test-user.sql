INSERT INTO users (email, name, first_name, last_name, hashed_password, role) 
VALUES ('testuser@example.com', 'Test User', 'Test', 'User', '$2b$10$gpEwJGTsQFfq2kZD67jbTuWlRq7oBx2ZTyXEHOfYoJEnkrneY33na', 'prosecutor') 
ON CONFLICT (email) DO NOTHING;

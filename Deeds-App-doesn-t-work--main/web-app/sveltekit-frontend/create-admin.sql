INSERT INTO users (email, name, hashed_password, role) 
VALUES ('admin@example.com', 'Admin User', '$2b$10$gpEwJGTsQFfq2kZD67jbTuWlRq7oBx2ZTyXEHOfYoJEnkrneY33na', 'prosecutor') 
ON CONFLICT (email) DO NOTHING;

-- Insert sample data with correct column names

-- Sample Cases
INSERT INTO cases (
    case_number,
    title,
    description,
    status,
    priority,
    incident_date,
    jurisdiction,
    created_by,
    lead_prosecutor
) VALUES 
(
    'CASE-2025-001',
    'State vs. Smith - Financial Fraud',
    'Investigation into alleged financial fraud involving multiple bank accounts and unauthorized transactions totaling $75,000',
    'investigation',
    'high',
    '2025-01-15',
    'State Court',
    (SELECT id FROM users WHERE email = 'example@example.com'),
    (SELECT id FROM users WHERE email = 'example@example.com')
),
(
    'CASE-2025-002',
    'People vs. Johnson - Drug Trafficking',
    'Major drug trafficking case involving interstate commerce and distribution of controlled substances',
    'active',
    'critical',
    '2025-02-01',
    'Federal Court',
    (SELECT id FROM users WHERE email = 'example@example.com'),
    (SELECT id FROM users WHERE email = 'example@example.com')
),
(
    'CASE-2025-003',
    'State vs. Williams - Cybercrime',
    'Cybercrime investigation involving identity theft and online fraud schemes affecting elderly victims',
    'pending',
    'medium',
    '2025-02-15',
    'State Court',
    (SELECT id FROM users WHERE email = 'example@example.com'),
    (SELECT id FROM users WHERE email = 'example@example.com')
);

-- Sample Criminals
INSERT INTO criminals (
    first_name,
    last_name,
    date_of_birth,
    address,
    phone,
    email,
    aliases,
    distinguishing_marks,
    notes,
    created_by
) VALUES 
(
    'Robert',
    'Smith',
    '1985-03-15',
    '123 Main Street, Anytown, ST 12345',
    '555-0123',
    'robert.smith@email.com',
    '["Bob Smith", "R. Smith", "Bobby"]'::jsonb,
    'Scar on left hand from childhood accident',
    'Former accountant at ABC Accounting Firm. No prior convictions.',
    (SELECT id FROM users WHERE email = 'example@example.com')
),
(
    'Michael',
    'Johnson',
    '1978-11-22',
    '456 Oak Avenue, Metro City, ST 67890',
    '555-0456',
    'mj.johnson@email.com',
    '["Mike Johnson", "Big Mike", "MJ"]'::jsonb,
    'Tattoo of eagle on right shoulder',
    'Long-haul truck driver. Previous arrests: DUI (2019), Drug possession (2021)',
    (SELECT id FROM users WHERE email = 'example@example.com')
),
(
    'Sarah',
    'Williams',
    '1992-07-08',
    '789 Pine Street, Techville, ST 11111',
    '555-0789',
    'sarah.williams@techmail.com',
    '["Sara Williams", "S. Williams", "Techie Sara"]'::jsonb,
    'Small birthmark on neck',
    'Software developer at TechCorp Solutions. No criminal history.',
    (SELECT id FROM users WHERE email = 'example@example.com')
);

-- Sample Evidence (linking to cases)
INSERT INTO evidence (
    case_id,
    title,
    file_name,
    file_url,
    file_type,
    file_size,
    description,
    tags,
    summary,
    uploaded_by
) VALUES 
(
    (SELECT id FROM cases WHERE case_number = 'CASE-2025-001'),
    'Bank Statements January 2025',
    'bank_statements_jan_2025.pdf',
    '/uploads/evidence/bank_statements_jan_2025.pdf',
    'application/pdf',
    2048576,
    'Bank statements showing suspicious transactions and unauthorized transfers',
    '["financial", "fraud", "bank-records", "january-2025"]'::jsonb,
    'Contains evidence of 15 unauthorized transfers totaling $45,000 between January 1-31, 2025',
    (SELECT id FROM users WHERE email = 'example@example.com')
),
(
    (SELECT id FROM cases WHERE case_number = 'CASE-2025-001'),
    'Accounting Software Logs',
    'accounting_software_logs.xlsx',
    '/uploads/evidence/accounting_software_logs.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    1536000,
    'Detailed logs from accounting software showing manual entry modifications',
    '["financial", "fraud", "software-logs", "accounting"]'::jsonb,
    'Log entries show 23 manual modifications to transaction records, all made outside business hours',
    (SELECT id FROM users WHERE email = 'example@example.com')
),
(
    (SELECT id FROM cases WHERE case_number = 'CASE-2025-002'),
    'Drug Seizure Photos',
    'drug_seizure_photos.zip',
    '/uploads/evidence/drug_seizure_photos.zip',
    'application/zip',
    15728640,
    'Photographs from drug seizure operation including packaging and scale photos',
    '["drugs", "trafficking", "seizure", "photos"]'::jsonb,
    'Contains 47 high-resolution photos documenting seizure of 2.5kg cocaine and packaging materials',
    (SELECT id FROM users WHERE email = 'example@example.com')
),
(
    (SELECT id FROM cases WHERE case_number = 'CASE-2025-003'),
    'Victim Email Communications',
    'victim_communications.eml',
    '/uploads/evidence/victim_communications.eml',
    'message/rfc822',
    256000,
    'Email communications between perpetrator and elderly victims',
    '["cybercrime", "identity-theft", "emails", "victim-communications"]'::jsonb,
    'Email chain showing phishing attempts and personal information harvesting targeting 12 elderly victims',
    (SELECT id FROM users WHERE email = 'example@example.com')
);

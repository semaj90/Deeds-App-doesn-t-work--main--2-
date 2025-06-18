-- Drop old primary key if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'session' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE session DROP CONSTRAINT IF EXISTS session_pkey;
  END IF;
END $$;

-- Drop old sessionToken column if it exists
ALTER TABLE session DROP COLUMN IF EXISTS "sessionToken";

-- Add new id column if it doesn't exist
ALTER TABLE session ADD COLUMN IF NOT EXISTS id text;

-- Add new primary key on id if not exists
DO $$
DECLARE
    pk_name text;
BEGIN
    SELECT constraint_name INTO pk_name
    FROM information_schema.table_constraints
    WHERE table_name = 'session'
      AND constraint_type = 'PRIMARY KEY'
    LIMIT 1;
    IF pk_name IS NULL THEN
        EXECUTE 'ALTER TABLE session ADD PRIMARY KEY (id)';
    END IF;
END $$;

-- Add expiresAt column if it doesn't exist
ALTER TABLE session ADD COLUMN IF NOT EXISTS "expiresAt" timestamp NOT NULL DEFAULT now();

-- Drop old expires column if it exists
ALTER TABLE session DROP COLUMN IF EXISTS "expires";

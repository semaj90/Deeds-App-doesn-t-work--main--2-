DO $$
DECLARE
    pk_name text;
BEGIN
    SELECT constraint_name INTO pk_name
    FROM information_schema.table_constraints
    WHERE table_name = 'authenticator'
      AND constraint_type = 'PRIMARY KEY'
    LIMIT 1;
    IF pk_name IS NULL THEN
        EXECUTE 'ALTER TABLE authenticator ADD PRIMARY KEY ("credentialID")';
    END IF;
END $$;

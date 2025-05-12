-- Make created_by field nullable
DO $$
BEGIN
  BEGIN
    ALTER TABLE lead_followups 
    ALTER COLUMN created_by DROP NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error making created_by nullable: %', SQLERRM;
  END;
END $$;

-- Try to change the type to TEXT if it's UUID
DO $$
BEGIN
  BEGIN
    ALTER TABLE lead_followups 
    ALTER COLUMN created_by TYPE TEXT;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error changing created_by to TEXT: %', SQLERRM;
  END;
END $$;

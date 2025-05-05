-- Check if the auth_logs table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'auth_logs'
  ) THEN
    -- Create the auth_logs table
    CREATE TABLE public.auth_logs (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      success BOOLEAN NOT NULL DEFAULT false,
      message TEXT,
      ip_address VARCHAR(45),
      user_agent TEXT,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Add indexes for better query performance
    CREATE INDEX idx_auth_logs_username ON public.auth_logs(username);
    CREATE INDEX idx_auth_logs_timestamp ON public.auth_logs(timestamp);
    
    -- Add comment
    COMMENT ON TABLE public.auth_logs IS 'Stores authentication attempt logs for security auditing';
  END IF;
END
$$;

-- Check if the user_accounts table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_accounts') THEN
        -- Create user_accounts table
        CREATE TABLE public.user_accounts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            employee_id INTEGER NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
            role_id INTEGER NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
            username VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            last_login TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT unique_employee_account UNIQUE (employee_id)
        );

        -- Create indexes
        CREATE INDEX idx_user_accounts_employee_id ON public.user_accounts(employee_id);
        CREATE INDEX idx_user_accounts_role_id ON public.user_accounts(role_id);
        CREATE INDEX idx_user_accounts_username ON public.user_accounts(username);
        
        -- Add comment
        COMMENT ON TABLE public.user_accounts IS 'Table storing user accounts for authentication';
    END IF;
END
$$;

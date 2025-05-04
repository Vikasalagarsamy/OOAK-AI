-- Check if the user_accounts table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_accounts') THEN
        -- Create the user_accounts table
        CREATE TABLE public.user_accounts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
            role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            last_login TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX idx_user_accounts_employee_id ON public.user_accounts(employee_id);
        CREATE INDEX idx_user_accounts_role_id ON public.user_accounts(role_id);
        CREATE INDEX idx_user_accounts_email ON public.user_accounts(email);
        
        -- Add a comment to the table
        COMMENT ON TABLE public.user_accounts IS 'Stores user account information for employees';
    END IF;
END
$$;

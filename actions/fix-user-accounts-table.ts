"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"

export async function fixUserAccountsTable() {
  try {
    console.log("🔧 [USER_TABLE] Starting user_accounts table fix via PostgreSQL...")

    const result = await transaction(async (client) => {
      console.log("🔍 [USER_TABLE] Checking and creating user_accounts table...")

      // Check if the user_accounts table exists and create it if it doesn't
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'user_accounts'
          ) THEN
            -- Create the user_accounts table
            CREATE TABLE user_accounts (
              id SERIAL PRIMARY KEY,
              employee_id INTEGER NOT NULL,
              role_id INTEGER NOT NULL,
              username VARCHAR(255) NOT NULL UNIQUE,
              email VARCHAR(255) NOT NULL UNIQUE,
              password_hash VARCHAR(255) NOT NULL,
              is_active BOOLEAN DEFAULT true,
              last_login TIMESTAMP,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Add indexes
            CREATE INDEX idx_user_accounts_employee_id ON user_accounts(employee_id);
            CREATE INDEX idx_user_accounts_role_id ON user_accounts(role_id);
            CREATE INDEX idx_user_accounts_username ON user_accounts(username);
            CREATE INDEX idx_user_accounts_email ON user_accounts(email);
            
            RAISE NOTICE 'Created user_accounts table with indexes';
          ELSE
            RAISE NOTICE 'user_accounts table already exists';
          END IF;
        END
        $$;
      `)

      console.log("🔍 [USER_TABLE] Checking and creating auth_logs table...")

      // Check if the auth_logs table exists and create it if it doesn't
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'auth_logs'
          ) THEN
            -- Create the auth_logs table
            CREATE TABLE auth_logs (
              id SERIAL PRIMARY KEY,
              user_id INTEGER,
              action VARCHAR(50) NOT NULL,
              ip_address VARCHAR(50),
              user_agent TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Add index
            CREATE INDEX idx_auth_logs_user_id ON auth_logs(user_id);
            CREATE INDEX idx_auth_logs_created_at ON auth_logs(created_at);
            CREATE INDEX idx_auth_logs_action ON auth_logs(action);
            
            RAISE NOTICE 'Created auth_logs table with indexes';
          ELSE
            RAISE NOTICE 'auth_logs table already exists';
          END IF;
        END
        $$;
      `)

      console.log("🔗 [USER_TABLE] Setting up foreign key constraints...")

      // Check and fix foreign key constraints
      await client.query(`
        DO $$
        BEGIN
          -- Check if the employee_id foreign key constraint exists and drop it
          IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'user_accounts_employee_id_fkey'
            AND table_name = 'user_accounts'
          ) THEN
            -- Drop the constraint if it exists
            ALTER TABLE user_accounts DROP CONSTRAINT user_accounts_employee_id_fkey;
            RAISE NOTICE 'Dropped existing employee_id foreign key constraint';
          END IF;

          -- Check if the role_id foreign key constraint exists and drop it
          IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'user_accounts_role_id_fkey'
            AND table_name = 'user_accounts'
          ) THEN
            -- Drop the constraint if it exists
            ALTER TABLE user_accounts DROP CONSTRAINT user_accounts_role_id_fkey;
            RAISE NOTICE 'Dropped existing role_id foreign key constraint';
          END IF;
          
          -- Add the constraints back with ON DELETE CASCADE
          ALTER TABLE user_accounts
          ADD CONSTRAINT user_accounts_employee_id_fkey
          FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
          
          ALTER TABLE user_accounts
          ADD CONSTRAINT user_accounts_role_id_fkey
          FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
          
          RAISE NOTICE 'Added foreign key constraints with CASCADE';
          
          -- Check if auth_logs has a foreign key constraint to user_accounts and drop it
          IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'auth_logs_user_id_fkey'
            AND table_name = 'auth_logs'
          ) THEN
            -- Drop the constraint if it exists
            ALTER TABLE auth_logs DROP CONSTRAINT auth_logs_user_id_fkey;
            RAISE NOTICE 'Dropped existing auth_logs foreign key constraint';
          END IF;
          
          -- Add the constraint back with ON DELETE CASCADE
          ALTER TABLE auth_logs
          ADD CONSTRAINT auth_logs_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE;
          
          RAISE NOTICE 'Added auth_logs foreign key constraint with CASCADE';
        END
        $$;
      `)

      console.log("🛡️ [USER_TABLE] Adding data integrity constraints...")

      // Add additional constraints for data integrity
      await client.query(`
        DO $$
        BEGIN
          -- Add check constraints if they don't exist
          BEGIN
            ALTER TABLE user_accounts
            ADD CONSTRAINT user_accounts_username_length_check
            CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 50);
          EXCEPTION
            WHEN duplicate_object THEN
              RAISE NOTICE 'Username length constraint already exists';
          END;

          BEGIN
            ALTER TABLE user_accounts
            ADD CONSTRAINT user_accounts_email_format_check
            CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
          EXCEPTION
            WHEN duplicate_object THEN
              RAISE NOTICE 'Email format constraint already exists';
          END;

          BEGIN
            ALTER TABLE auth_logs
            ADD CONSTRAINT auth_logs_action_check
            CHECK (action IN ('login', 'logout', 'password_change', 'account_locked', 'password_reset'));
          EXCEPTION
            WHEN duplicate_object THEN
              RAISE NOTICE 'Auth logs action constraint already exists';
          END;
        END
        $$;
      `)

      console.log("📊 [USER_TABLE] Creating audit triggers...")

      // Create updated_at trigger for user_accounts
      await client.query(`
        DO $$
        BEGIN
          -- Create trigger function if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.routines
            WHERE routine_name = 'update_updated_at_column'
          ) THEN
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $func$
            BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
            END;
            $func$ LANGUAGE plpgsql;
          END IF;

          -- Drop trigger if it exists and recreate
          DROP TRIGGER IF EXISTS update_user_accounts_updated_at ON user_accounts;
          
          CREATE TRIGGER update_user_accounts_updated_at
            BEFORE UPDATE ON user_accounts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
          RAISE NOTICE 'Created updated_at trigger for user_accounts';
        END
        $$;
      `)

      return { success: true }
    })

    console.log("✅ [USER_TABLE] User accounts table fix completed successfully!")

    revalidatePath("/organization/user-accounts")
    return {
      success: true,
      message: "User accounts table fixed successfully with enhanced constraints and triggers",
    }
  } catch (error: any) {
    console.error("❌ [USER_TABLE] Unexpected error in fixUserAccountsTable:", error)
    return {
      success: false,
      error: `An unexpected error occurred: ${error.message}`,
    }
  }
}

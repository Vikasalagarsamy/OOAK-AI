"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"

export async function fixUserAccountsSchema() {
  try {
    console.log("🔧 [USER_SCHEMA] Starting user_accounts schema fix via PostgreSQL...")

    const result = await transaction(async (client) => {
      console.log("🔍 [USER_SCHEMA] Checking if user_accounts table exists...")

      // Check if user_accounts table exists and create it if it doesn't
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
            
            RAISE NOTICE 'Created user_accounts table';
          ELSE
            RAISE NOTICE 'user_accounts table already exists';
          END IF;
        END
        $$;
      `)

      console.log("🔗 [USER_SCHEMA] Setting up foreign key constraints...")

      // Ensure the foreign key constraints exist
      await client.query(`
        DO $$
        BEGIN
          -- Check if the employee_id foreign key constraint exists
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'user_accounts_employee_id_fkey'
            AND table_name = 'user_accounts'
          ) THEN
            -- Add the constraint if it doesn't exist
            ALTER TABLE user_accounts
            ADD CONSTRAINT user_accounts_employee_id_fkey
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Added employee_id foreign key constraint';
          ELSE
            RAISE NOTICE 'employee_id foreign key constraint already exists';
          END IF;

          -- Check if the role_id foreign key constraint exists
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'user_accounts_role_id_fkey'
            AND table_name = 'user_accounts'
          ) THEN
            -- Add the constraint if it doesn't exist
            ALTER TABLE user_accounts
            ADD CONSTRAINT user_accounts_role_id_fkey
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT;
            
            RAISE NOTICE 'Added role_id foreign key constraint';
          ELSE
            RAISE NOTICE 'role_id foreign key constraint already exists';
          END IF;
        END
        $$;
      `)

      console.log("🚀 [USER_SCHEMA] Creating performance indexes...")

      // Add indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_accounts_employee_id ON user_accounts(employee_id);
        CREATE INDEX IF NOT EXISTS idx_user_accounts_role_id ON user_accounts(role_id);
        CREATE INDEX IF NOT EXISTS idx_user_accounts_username ON user_accounts(username);
        CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts(email);
        CREATE INDEX IF NOT EXISTS idx_user_accounts_is_active ON user_accounts(is_active);
      `)

      console.log("🛡️ [USER_SCHEMA] Adding additional constraints...")

      // Add additional constraints for data integrity
      await client.query(`
        DO $$
        BEGIN
          -- Add check constraint for username length
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.check_constraints
            WHERE constraint_name = 'user_accounts_username_length_check'
          ) THEN
            ALTER TABLE user_accounts
            ADD CONSTRAINT user_accounts_username_length_check
            CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 50);
          END IF;

          -- Add check constraint for email format (basic)
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.check_constraints
            WHERE constraint_name = 'user_accounts_email_format_check'
          ) THEN
            ALTER TABLE user_accounts
            ADD CONSTRAINT user_accounts_email_format_check
            CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
          END IF;

          -- Add check constraint for password hash length
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.check_constraints
            WHERE constraint_name = 'user_accounts_password_hash_check'
          ) THEN
            ALTER TABLE user_accounts
            ADD CONSTRAINT user_accounts_password_hash_check
            CHECK (LENGTH(password_hash) >= 60); -- bcrypt hashes are typically 60 characters
          END IF;
        END
        $$;
      `)

      console.log("📊 [USER_SCHEMA] Creating audit trigger...")

      // Create an updated_at trigger
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

          -- Create trigger if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.triggers
            WHERE trigger_name = 'update_user_accounts_updated_at'
          ) THEN
            CREATE TRIGGER update_user_accounts_updated_at
              BEFORE UPDATE ON user_accounts
              FOR EACH ROW
              EXECUTE FUNCTION update_updated_at_column();
          END IF;
        END
        $$;
      `)

      return { success: true }
    })

    console.log("✅ [USER_SCHEMA] User accounts schema fix completed successfully!")

    revalidatePath("/organization/user-accounts")
    return { success: true, message: "User accounts schema fixed successfully" }
  } catch (error: any) {
    console.error("❌ [USER_SCHEMA] Error in fixUserAccountsSchema:", error)
    return { 
      success: false, 
      error: `An unexpected error occurred: ${error.message}` 
    }
  }
}

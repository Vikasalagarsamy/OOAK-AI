-- Check if bugs table exists before creating
BEGIN;
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bugs') THEN
        CREATE TABLE bugs (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
            status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
            assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
            reporter_id UUID REFERENCES users(id) NOT NULL,
            due_date TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Add indexes for performance
        CREATE INDEX idx_bugs_status ON bugs(status);
        CREATE INDEX idx_bugs_severity ON bugs(severity);
        CREATE INDEX idx_bugs_assignee ON bugs(assignee_id);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bug_comments') THEN
        CREATE TABLE bug_comments (
            id SERIAL PRIMARY KEY,
            bug_id INTEGER REFERENCES bugs(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id) NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_bug_comments_bug_id ON bug_comments(bug_id);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bug_attachments') THEN
        CREATE TABLE bug_attachments (
            id SERIAL PRIMARY KEY,
            bug_id INTEGER REFERENCES bugs(id) ON DELETE CASCADE,
            file_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(255) NOT NULL,
            file_type VARCHAR(100) NOT NULL,
            file_size INTEGER NOT NULL,
            uploaded_by UUID REFERENCES users(id) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_bug_attachments_bug_id ON bug_attachments(bug_id);
    END IF;

    -- Create function to update updated_at timestamp
    IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    END IF;

    -- Create triggers for updated_at
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trigger_bugs_updated_at') THEN
        CREATE TRIGGER trigger_bugs_updated_at
        BEFORE UPDATE ON bugs
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trigger_bug_comments_updated_at') THEN
        CREATE TRIGGER trigger_bug_comments_updated_at
        BEFORE UPDATE ON bug_comments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
COMMIT;

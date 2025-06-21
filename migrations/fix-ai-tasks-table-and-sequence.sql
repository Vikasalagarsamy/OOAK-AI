-- Drop existing table and sequence
DROP TABLE IF EXISTS ai_tasks CASCADE;
DROP SEQUENCE IF EXISTS ai_tasks_id_seq CASCADE;

-- Create sequence first
CREATE SEQUENCE ai_tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Create table with proper sequence
CREATE TABLE ai_tasks (
    id INTEGER DEFAULT nextval('ai_tasks_id_seq') PRIMARY KEY,
    task_title VARCHAR(255) NOT NULL,
    task_description TEXT,
    priority VARCHAR(20) DEFAULT 'medium'::character varying,
    status VARCHAR(20) DEFAULT 'pending'::character varying,
    due_date TIMESTAMP WITH TIME ZONE,
    category VARCHAR(50),
    assigned_to VARCHAR(255),
    assigned_by VARCHAR(255),
    metadata JSONB,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    client_name VARCHAR(255),
    business_impact TEXT,
    ai_reasoning TEXT,
    estimated_value NUMERIC(12,2),
    lead_id INTEGER,
    quotation_id INTEGER,
    actual_hours NUMERIC(5,2),
    quality_rating INTEGER,
    assigned_to_employee_id INTEGER,
    task_type VARCHAR(50),
    completion_notes TEXT,
    CONSTRAINT ai_tasks_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    CONSTRAINT ai_tasks_quality_rating_check CHECK (quality_rating >= 1 AND quality_rating <= 5),
    CONSTRAINT ai_tasks_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

-- Set sequence ownership
ALTER SEQUENCE ai_tasks_id_seq OWNED BY ai_tasks.id;

-- Add indexes
CREATE INDEX idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX idx_ai_tasks_assigned_to ON ai_tasks(assigned_to);
CREATE INDEX idx_ai_tasks_category ON ai_tasks(category);
CREATE INDEX idx_ai_tasks_priority ON ai_tasks(priority);
CREATE INDEX idx_ai_tasks_lead_id ON ai_tasks(lead_id);
CREATE INDEX idx_ai_tasks_assigned_to_employee_id ON ai_tasks(assigned_to_employee_id);

-- Grant permissions
ALTER TABLE ai_tasks OWNER TO postgres;
GRANT ALL ON SEQUENCE ai_tasks_id_seq TO postgres;
GRANT ALL ON TABLE ai_tasks TO postgres;

-- Create function to get next ID
CREATE OR REPLACE FUNCTION next_ai_task_id()
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN nextval('ai_tasks_id_seq');
END;
$$;

-- Create function to insert task
CREATE OR REPLACE FUNCTION insert_ai_task(
    p_task_title VARCHAR(255),
    p_task_description TEXT,
    p_priority VARCHAR(20),
    p_status VARCHAR(20),
    p_due_date TIMESTAMP WITH TIME ZONE,
    p_category VARCHAR(50),
    p_assigned_to VARCHAR(255),
    p_assigned_by VARCHAR(255),
    p_metadata JSONB,
    p_client_name VARCHAR(255),
    p_business_impact TEXT,
    p_ai_reasoning TEXT,
    p_estimated_value NUMERIC(12,2),
    p_lead_id INTEGER,
    p_quotation_id INTEGER,
    p_assigned_to_employee_id INTEGER,
    p_task_type VARCHAR(50)
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_task_id INTEGER;
BEGIN
    INSERT INTO ai_tasks (
        task_title,
        task_description,
        priority,
        status,
        due_date,
        category,
        assigned_to,
        assigned_by,
        metadata,
        client_name,
        business_impact,
        ai_reasoning,
        estimated_value,
        lead_id,
        quotation_id,
        assigned_to_employee_id,
        task_type
    ) VALUES (
        p_task_title,
        p_task_description,
        p_priority,
        p_status,
        p_due_date,
        p_category,
        p_assigned_to,
        p_assigned_by,
        p_metadata,
        p_client_name,
        p_business_impact,
        p_ai_reasoning,
        p_estimated_value,
        p_lead_id,
        p_quotation_id,
        p_assigned_to_employee_id,
        p_task_type
    ) RETURNING id INTO v_task_id;

    RETURN v_task_id;
END;
$$; 
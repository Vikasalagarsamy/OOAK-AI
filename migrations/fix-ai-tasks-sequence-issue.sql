-- Drop existing sequence
DROP SEQUENCE IF EXISTS ai_tasks_id_seq CASCADE;

-- Create new sequence
CREATE SEQUENCE ai_tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Set the sequence owner
ALTER SEQUENCE ai_tasks_id_seq OWNED BY ai_tasks.id;

-- Set the default value for the id column
ALTER TABLE ai_tasks ALTER COLUMN id SET DEFAULT nextval('ai_tasks_id_seq');

-- Grant permissions
GRANT ALL ON SEQUENCE ai_tasks_id_seq TO postgres;

-- Create function to get next ID
CREATE OR REPLACE FUNCTION next_ai_task_id()
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN nextval('ai_tasks_id_seq');
END;
$$;

-- Create trigger to automatically set ID
CREATE OR REPLACE FUNCTION set_ai_task_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := nextval('ai_tasks_id_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ai_task_id_trigger
  BEFORE INSERT ON ai_tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_ai_task_id(); 
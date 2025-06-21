-- Create a function to get the next ID from the sequence
CREATE OR REPLACE FUNCTION next_ai_task_id()
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN nextval('ai_tasks_id_seq');
END;
$$; 
-- Create a function to set primary company for an employee
CREATE OR REPLACE FUNCTION set_primary_company(
  p_employee_id INT,
  p_allocation_id INT
)
RETURNS VOID AS $$
DECLARE
  v_company_id INT;
  v_branch_id INT;
BEGIN
  -- First, get company_id and branch_id from the allocation
  SELECT company_id, branch_id INTO v_company_id, v_branch_id
  FROM employee_companies
  WHERE id = p_allocation_id;
  
  -- Update all allocations to not be primary
  UPDATE employee_companies
  SET is_primary = FALSE
  WHERE employee_id = p_employee_id;
  
  -- Set the selected allocation as primary
  UPDATE employee_companies
  SET is_primary = TRUE
  WHERE id = p_allocation_id;
  
  -- Update the employee's primary company and home branch
  UPDATE employees
  SET 
    primary_company_id = v_company_id,
    home_branch_id = v_branch_id
  WHERE id = p_employee_id;
END;
$$ LANGUAGE plpgsql;

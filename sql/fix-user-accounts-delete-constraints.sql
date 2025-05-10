-- Function to check if a user account can be deleted
CREATE OR REPLACE FUNCTION can_delete_user_account(account_id integer)
RETURNS json AS $$
DECLARE
  result json;
  account_exists boolean;
  has_auth_logs boolean;
  has_other_constraints boolean;
BEGIN
  -- Check if the account exists
  SELECT EXISTS(
    SELECT 1 FROM user_accounts WHERE id = account_id
  ) INTO account_exists;
  
  IF NOT account_exists THEN
    result := json_build_object(
      'can_delete', false,
      'reason', 'Account does not exist',
      'account_id', account_id
    );
    RETURN result;
  END IF;
  
  -- Check if there are auth_logs referencing this account
  SELECT EXISTS(
    SELECT 1 FROM auth_logs WHERE user_id = account_id
  ) INTO has_auth_logs;
  
  -- Check for other potential constraints (this is a placeholder)
  has_other_constraints := false;
  
  IF has_auth_logs OR has_other_constraints THEN
    result := json_build_object(
      'can_delete', false,
      'reason', CASE 
                  WHEN has_auth_logs THEN 'Account has authentication logs'
                  ELSE 'Account has other constraints'
                END,
      'account_id', account_id,
      'has_auth_logs', has_auth_logs,
      'has_other_constraints', has_other_constraints
    );
  ELSE
    result := json_build_object(
      'can_delete', true,
      'account_id', account_id
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to fix constraints and enable deletion
CREATE OR REPLACE FUNCTION fix_user_account_constraints(account_id integer)
RETURNS json AS $$
DECLARE
  result json;
  account_exists boolean;
  auth_logs_deleted boolean := false;
  other_constraints_fixed boolean := false;
BEGIN
  -- Check if the account exists
  SELECT EXISTS(
    SELECT 1 FROM user_accounts WHERE id = account_id
  ) INTO account_exists;
  
  IF NOT account_exists THEN
    result := json_build_object(
      'success', false,
      'reason', 'Account does not exist',
      'account_id', account_id
    );
    RETURN result;
  END IF;
  
  -- Delete auth_logs for this user if they exist
  DELETE FROM auth_logs WHERE user_id = account_id;
  GET DIAGNOSTICS auth_logs_deleted = ROW_COUNT;
  
  -- Fix other constraints (placeholder for future implementation)
  other_constraints_fixed := true;
  
  result := json_build_object(
    'success', true,
    'account_id', account_id,
    'auth_logs_deleted', auth_logs_deleted > 0,
    'auth_logs_count', auth_logs_deleted,
    'other_constraints_fixed', other_constraints_fixed
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

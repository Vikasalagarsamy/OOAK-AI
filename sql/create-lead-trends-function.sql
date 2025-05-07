-- Create a function to get lead trends by date
CREATE OR REPLACE FUNCTION get_lead_trends_by_date(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  source_ids INTEGER[] DEFAULT NULL,
  employee_ids INTEGER[] DEFAULT NULL,
  status_list TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  date_group DATE,
  lead_count BIGINT,
  status TEXT,
  lead_source_id INTEGER,
  lead_source_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('day', l.created_at)::DATE AS date_group,
    COUNT(l.id) AS lead_count,
    l.status,
    l.lead_source_id,
    ls.name AS lead_source_name
  FROM
    leads l
  LEFT JOIN
    lead_sources ls ON l.lead_source_id = ls.id
  WHERE
    (start_date IS NULL OR l.created_at >= start_date) AND
    (end_date IS NULL OR l.created_at <= end_date) AND
    (source_ids IS NULL OR array_length(source_ids, 1) IS NULL OR l.lead_source_id = ANY(source_ids)) AND
    (employee_ids IS NULL OR array_length(employee_ids, 1) IS NULL OR l.assigned_to = ANY(employee_ids)) AND
    (status_list IS NULL OR array_length(status_list, 1) IS NULL OR l.status = ANY(status_list))
  GROUP BY
    date_group, l.status, l.lead_source_id, ls.name
  ORDER BY
    date_group;
END;
$$ LANGUAGE plpgsql;

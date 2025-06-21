import psycopg2
from datetime import datetime

# 🧠 Update these with your DB details
DB_CONFIG = {
    'dbname': 'postgres',
    'user': 'postgres',
    'password': 'postgres',
    'host': '127.0.0.1',
    'port': 54322
}

OUTPUT_LOG = 'fk_mismatch_log.html'

QUERY = """
WITH possible_joins AS (
  SELECT 
    tc.constraint_name,
    kcu.table_schema AS fk_schema,
    kcu.table_name AS fk_table,
    kcu.column_name AS fk_column,
    ccu.table_schema AS ref_schema,
    ccu.table_name AS ref_table,
    ccu.column_name AS ref_column
  FROM 
    information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE 
    tc.constraint_type = 'FOREIGN KEY'
),
fk_data_types AS (
  SELECT 
    pj.*,
    fkcol.data_type AS fk_data_type,
    refcol.data_type AS ref_data_type
  FROM 
    possible_joins pj
  JOIN information_schema.columns fkcol
    ON pj.fk_table = fkcol.table_name
   AND pj.fk_column = fkcol.column_name
   AND pj.fk_schema = fkcol.table_schema
  JOIN information_schema.columns refcol
    ON pj.ref_table = refcol.table_name
   AND pj.ref_column = refcol.column_name
   AND pj.ref_schema = refcol.table_schema
)
SELECT 
  constraint_name,
  fk_schema || '.' || fk_table || '.' || fk_column AS foreign_key,
  fk_data_type,
  ref_schema || '.' || ref_table || '.' || ref_column AS referenced_column,
  ref_data_type,
  CASE 
    WHEN fk_data_type <> ref_data_type THEN '❌ MISMATCH'
    ELSE '✅ MATCH'
  END AS status
FROM 
  fk_data_types
ORDER BY 
  status DESC;
"""

def run_check():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute(QUERY)
    results = cur.fetchall()

    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    html = f"<h2>Foreign Key Type Check - {timestamp}</h2><table border='1'>"
    html += "<tr><th>Constraint</th><th>Foreign Key</th><th>FK Type</th><th>Referenced Column</th><th>Ref Type</th><th>Status</th></tr>"

    for row in results:
        constraint, fk_col, fk_type, ref_col, ref_type, status = row
        color = '#d4edda' if 'MATCH' in status else '#f8d7da'
        html += f"<tr style='background-color:{color}'><td>{constraint}</td><td>{fk_col}</td><td>{fk_type}</td><td>{ref_col}</td><td>{ref_type}</td><td>{status}</td></tr>"

    html += "</table>"

    with open(OUTPUT_LOG, 'w') as f:
        f.write(html)

    print(f"✅ FK check completed. Output written to {OUTPUT_LOG}")

if __name__ == "__main__":
    run_check()

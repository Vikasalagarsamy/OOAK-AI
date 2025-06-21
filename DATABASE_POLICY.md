# 🚫 STRICT DATABASE POLICY 🚫

## FORBIDDEN OPERATIONS (NEVER ALLOWED)
- ❌ `npx supabase db reset` - **PERMANENTLY BANNED**
- ❌ `DROP DATABASE` / `DROP TABLE` - **PERMANENTLY BANNED**
- ❌ `TRUNCATE TABLE` - **PERMANENTLY BANNED** 
- ❌ Any destructive operations without explicit written permission
- ❌ Migration rollbacks without approval

## ALLOWED OPERATIONS
- ✅ `psql -f specific_migration.sql` - Run specific migrations only
- ✅ `CREATE TABLE` - For new tables only
- ✅ `ALTER TABLE ADD COLUMN` - Adding columns only
- ✅ `CREATE INDEX` - Performance improvements
- ✅ `INSERT`, `UPDATE`, `SELECT` - Data operations
- ✅ Creating functions, triggers, policies

## MANDATORY PROCESS
1. **ASK PERMISSION** before any schema changes
2. **SHOW EXACT SQL** before execution
3. **USE ADDITIVE CHANGES** only (never destructive)
4. **BACKUP FIRST** if touching existing data

## VIOLATION CONSEQUENCES
- Immediate termination of database access
- Full data recovery required at violator's expense
- Loss of database privileges

**AGREED BY:** Assistant AI
**DATE:** $(date)
**WITNESS:** User (Database Owner)

---
*This policy is NON-NEGOTIABLE and PERMANENT* 
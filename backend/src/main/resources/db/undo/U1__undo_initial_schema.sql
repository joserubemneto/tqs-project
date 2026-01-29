-- =============================================================================
-- U1__undo_initial_schema.sql
-- Rollback script for V1__initial_schema.sql
-- CAUTION: This will DROP all tables and data!
-- =============================================================================

-- Wrap in transaction for atomicity
BEGIN;

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS redemptions CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS opportunity_skills CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS user_skills CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS skills CASCADE;

-- Drop Flyway history table if doing a complete reset
-- DROP TABLE IF EXISTS flyway_schema_history CASCADE;

COMMIT;

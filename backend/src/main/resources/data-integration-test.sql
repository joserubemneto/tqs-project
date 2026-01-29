-- =============================================================================
-- data-integration-test.sql
-- Seed data for E2E integration tests
-- This file runs when using the integration-test profile with ddl-auto: create
-- Default password for all seeded users: password
-- =============================================================================

-- Insert admin user only if it doesn't exist
INSERT INTO users (email, password, name, role, points, created_at, updated_at)
SELECT 'admin@ua.pt', 
       '$2a$10$w/RTKkG/tQ00sCIK4ST9pOBE4disgBStZmOe7eHqP.QPB.8udzWeG',
       'System Administrator',
       'ADMIN',
       0,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@ua.pt'
);

-- Insert sample promoter
INSERT INTO users (email, password, name, role, points, created_at, updated_at)
SELECT 'promoter@ua.pt',
       '$2a$10$w/RTKkG/tQ00sCIK4ST9pOBE4disgBStZmOe7eHqP.QPB.8udzWeG',
       'Sample Promoter',
       'PROMOTER',
       0,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'promoter@ua.pt'
);

-- Insert sample volunteer
INSERT INTO users (email, password, name, role, points, created_at, updated_at)
SELECT 'volunteer@ua.pt',
       '$2a$10$w/RTKkG/tQ00sCIK4ST9pOBE4disgBStZmOe7eHqP.QPB.8udzWeG',
       'Sample Volunteer',
       'VOLUNTEER',
       50,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'volunteer@ua.pt'
);

-- =============================================================================
-- V2__seed_admin_user.sql
-- Seed initial admin user for the platform
-- Default password for all seeded users: password
-- =============================================================================

-- Insert admin user only if it doesn't exist
INSERT INTO users (email, password, name, role, points, created_at, updated_at)
SELECT 'admin@ua.pt', 
       '$2a$10$w/RTKkG/tQ00sCIK4ST9pOBE4disgBStZmOe7eHqP.QPB.8udzWeG', -- password
       'System Administrator',
       'ADMIN',
       0,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@ua.pt'
);

-- Also create a sample promoter and volunteer for testing
INSERT INTO users (email, password, name, role, points, created_at, updated_at)
SELECT 'promoter@ua.pt',
       '$2a$10$w/RTKkG/tQ00sCIK4ST9pOBE4disgBStZmOe7eHqP.QPB.8udzWeG', -- password
       'Sample Promoter',
       'PROMOTER',
       0,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'promoter@ua.pt'
);

INSERT INTO users (email, password, name, role, points, created_at, updated_at)
SELECT 'volunteer@ua.pt',
       '$2a$10$w/RTKkG/tQ00sCIK4ST9pOBE4disgBStZmOe7eHqP.QPB.8udzWeG', -- password
       'Sample Volunteer',
       'VOLUNTEER',
       50,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'volunteer@ua.pt'
);

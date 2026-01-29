-- =============================================================================
-- V2__seed_admin_user.sql (H2 version)
-- Seed initial admin user for the platform
-- Default password for all seeded users: password
-- =============================================================================

-- Insert admin user
MERGE INTO users (email, password, name, role, points, created_at, updated_at)
KEY (email)
VALUES ('admin@ua.pt', 
        '$2a$10$w/RTKkG/tQ00sCIK4ST9pOBE4disgBStZmOe7eHqP.QPB.8udzWeG',
        'System Administrator',
        'ADMIN',
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP);

-- Insert sample promoter
MERGE INTO users (email, password, name, role, points, created_at, updated_at)
KEY (email)
VALUES ('promoter@ua.pt',
        '$2a$10$w/RTKkG/tQ00sCIK4ST9pOBE4disgBStZmOe7eHqP.QPB.8udzWeG',
        'Sample Promoter',
        'PROMOTER',
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP);

-- Insert sample volunteer
MERGE INTO users (email, password, name, role, points, created_at, updated_at)
KEY (email)
VALUES ('volunteer@ua.pt',
        '$2a$10$w/RTKkG/tQ00sCIK4ST9pOBE4disgBStZmOe7eHqP.QPB.8udzWeG',
        'Sample Volunteer',
        'VOLUNTEER',
        50,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP);

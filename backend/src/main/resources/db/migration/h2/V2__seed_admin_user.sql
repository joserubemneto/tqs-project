-- =============================================================================
-- V2__seed_admin_user.sql (H2 version)
-- Seed initial admin user for the platform
-- Password: Admin123! (BCrypt encoded)
-- =============================================================================

-- Insert admin user
MERGE INTO users (email, password, name, role, points, created_at, updated_at)
KEY (email)
VALUES ('admin@ua.pt', 
        '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
        'System Administrator',
        'ADMIN',
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP);

-- Insert sample promoter
MERGE INTO users (email, password, name, role, points, created_at, updated_at)
KEY (email)
VALUES ('promoter@ua.pt',
        '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
        'Sample Promoter',
        'PROMOTER',
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP);

-- Insert sample volunteer
MERGE INTO users (email, password, name, role, points, created_at, updated_at)
KEY (email)
VALUES ('volunteer@ua.pt',
        '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
        'Sample Volunteer',
        'VOLUNTEER',
        50,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP);

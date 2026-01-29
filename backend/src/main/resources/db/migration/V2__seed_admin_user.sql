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

INSERT INTO users (email, password, name, role, points, bio, created_at, updated_at)
SELECT 'volunteer@ua.pt',
       '$2a$10$w/RTKkG/tQ00sCIK4ST9pOBE4disgBStZmOe7eHqP.QPB.8udzWeG', -- password
       'Sample Volunteer',
       'VOLUNTEER',
       50,
       'I am passionate about helping others and making a difference in my community.',
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'volunteer@ua.pt'
);

-- =============================================================================
-- SEED SKILLS
-- =============================================================================
INSERT INTO skills (name, category, description)
SELECT 'Communication', 'COMMUNICATION', 'Effective verbal and written communication'
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Communication');

INSERT INTO skills (name, category, description)
SELECT 'Leadership', 'LEADERSHIP', 'Ability to lead and motivate teams'
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Leadership');

INSERT INTO skills (name, category, description)
SELECT 'Programming', 'TECHNICAL', 'Software development and coding skills'
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Programming');

INSERT INTO skills (name, category, description)
SELECT 'Design', 'CREATIVE', 'Visual and graphic design skills'
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Design');

INSERT INTO skills (name, category, description)
SELECT 'Event Planning', 'ADMINISTRATIVE', 'Organizing and coordinating events'
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Event Planning');

INSERT INTO skills (name, category, description)
SELECT 'Public Speaking', 'SOCIAL', 'Presenting to audiences'
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Public Speaking');

INSERT INTO skills (name, category, description)
SELECT 'English', 'LANGUAGE', 'English language proficiency'
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'English');

INSERT INTO skills (name, category, description)
SELECT 'Portuguese', 'LANGUAGE', 'Portuguese language proficiency'
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Portuguese');

-- =============================================================================
-- ASSOCIATE SKILLS WITH VOLUNTEER USER
-- =============================================================================
INSERT INTO user_skills (user_id, skill_id)
SELECT u.id, s.id
FROM users u, skills s
WHERE u.email = 'volunteer@ua.pt' AND s.name = 'Communication'
  AND NOT EXISTS (
    SELECT 1 FROM user_skills us WHERE us.user_id = u.id AND us.skill_id = s.id
  );

INSERT INTO user_skills (user_id, skill_id)
SELECT u.id, s.id
FROM users u, skills s
WHERE u.email = 'volunteer@ua.pt' AND s.name = 'English'
  AND NOT EXISTS (
    SELECT 1 FROM user_skills us WHERE us.user_id = u.id AND us.skill_id = s.id
  );

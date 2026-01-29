-- =============================================================================
-- V3__seed_skills.sql
-- Seed skills for the platform
-- =============================================================================

-- Seed skills (idempotent - only inserts if not exists)
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
-- ASSOCIATE SKILLS WITH VOLUNTEER USER (if exists and not already associated)
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

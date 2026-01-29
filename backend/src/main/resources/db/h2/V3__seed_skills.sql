-- =============================================================================
-- V3__seed_skills.sql (H2 version)
-- Seed skills for the platform
-- =============================================================================

-- Seed skills using H2's MERGE syntax
MERGE INTO skills (name, category, description) KEY (name)
VALUES ('Communication', 'COMMUNICATION', 'Effective verbal and written communication');

MERGE INTO skills (name, category, description) KEY (name)
VALUES ('Leadership', 'LEADERSHIP', 'Ability to lead and motivate teams');

MERGE INTO skills (name, category, description) KEY (name)
VALUES ('Programming', 'TECHNICAL', 'Software development and coding skills');

MERGE INTO skills (name, category, description) KEY (name)
VALUES ('Design', 'CREATIVE', 'Visual and graphic design skills');

MERGE INTO skills (name, category, description) KEY (name)
VALUES ('Event Planning', 'ADMINISTRATIVE', 'Organizing and coordinating events');

MERGE INTO skills (name, category, description) KEY (name)
VALUES ('Public Speaking', 'SOCIAL', 'Presenting to audiences');

MERGE INTO skills (name, category, description) KEY (name)
VALUES ('English', 'LANGUAGE', 'English language proficiency');

MERGE INTO skills (name, category, description) KEY (name)
VALUES ('Portuguese', 'LANGUAGE', 'Portuguese language proficiency');

-- =============================================================================
-- ASSOCIATE SKILLS WITH VOLUNTEER USER
-- =============================================================================
INSERT INTO user_skills (user_id, skill_id)
SELECT u.id, s.id FROM users u, skills s
WHERE u.email = 'volunteer@ua.pt' AND s.name = 'Communication'
  AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id = u.id AND skill_id = s.id);

INSERT INTO user_skills (user_id, skill_id)
SELECT u.id, s.id FROM users u, skills s
WHERE u.email = 'volunteer@ua.pt' AND s.name = 'English'
  AND NOT EXISTS (SELECT 1 FROM user_skills WHERE user_id = u.id AND skill_id = s.id);

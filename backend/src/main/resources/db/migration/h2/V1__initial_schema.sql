-- =============================================================================
-- V1__initial_schema.sql (H2 Compatible Version)
-- Initial database schema for UA Volunteering Platform
-- This is the H2-compatible version for testing
-- =============================================================================

-- =============================================================================
-- SKILLS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS skills (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);

-- =============================================================================
-- USERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    bio VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =============================================================================
-- USER_SKILLS JOIN TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_skills (
    user_id BIGINT NOT NULL,
    skill_id BIGINT NOT NULL,
    
    PRIMARY KEY (user_id, skill_id),
    CONSTRAINT fk_user_skills_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_skills_skill FOREIGN KEY (skill_id) 
        REFERENCES skills(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON user_skills(skill_id);

-- =============================================================================
-- PARTNERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS partners (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    logo_url VARCHAR(500),
    website VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_partners_active ON partners(active);
CREATE INDEX IF NOT EXISTS idx_partners_name ON partners(name);

-- =============================================================================
-- OPPORTUNITIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS opportunities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    points_reward INTEGER NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    max_volunteers INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    location VARCHAR(255),
    promoter_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    
    CONSTRAINT fk_opportunities_promoter FOREIGN KEY (promoter_id) 
        REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_opportunities_promoter ON opportunities(promoter_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_start_date ON opportunities(start_date);
CREATE INDEX IF NOT EXISTS idx_opportunities_end_date ON opportunities(end_date);

-- =============================================================================
-- OPPORTUNITY_SKILLS JOIN TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS opportunity_skills (
    opportunity_id BIGINT NOT NULL,
    skill_id BIGINT NOT NULL,
    
    PRIMARY KEY (opportunity_id, skill_id),
    CONSTRAINT fk_opportunity_skills_opportunity FOREIGN KEY (opportunity_id) 
        REFERENCES opportunities(id) ON DELETE CASCADE,
    CONSTRAINT fk_opportunity_skills_skill FOREIGN KEY (skill_id) 
        REFERENCES skills(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_opportunity_skills_opportunity ON opportunity_skills(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_skills_skill ON opportunity_skills(skill_id);

-- =============================================================================
-- APPLICATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS applications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    volunteer_id BIGINT NOT NULL,
    opportunity_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    message VARCHAR(500),
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    CONSTRAINT fk_applications_volunteer FOREIGN KEY (volunteer_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_applications_opportunity FOREIGN KEY (opportunity_id) 
        REFERENCES opportunities(id) ON DELETE CASCADE,
    CONSTRAINT uk_applications_volunteer_opportunity 
        UNIQUE (volunteer_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_volunteer ON applications(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity ON applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- =============================================================================
-- REWARDS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS rewards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    points_cost INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    partner_id BIGINT,
    quantity INTEGER,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    available_from TIMESTAMP,
    available_until TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_rewards_partner FOREIGN KEY (partner_id) 
        REFERENCES partners(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_rewards_partner ON rewards(partner_id);
CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(type);
CREATE INDEX IF NOT EXISTS idx_rewards_active ON rewards(active);
CREATE INDEX IF NOT EXISTS idx_rewards_points ON rewards(points_cost);

-- =============================================================================
-- REDEMPTIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS redemptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    reward_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    points_spent INTEGER NOT NULL,
    redeemed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    
    CONSTRAINT fk_redemptions_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_redemptions_reward FOREIGN KEY (reward_id) 
        REFERENCES rewards(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_redemptions_user ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_reward ON redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_code ON redemptions(code);

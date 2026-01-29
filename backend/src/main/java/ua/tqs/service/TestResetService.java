package ua.tqs.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.dto.CreateOpportunityRequest;
import ua.tqs.dto.OpportunityResponse;
import ua.tqs.exception.OpportunityValidationException;
import ua.tqs.exception.UserNotFoundException;
import ua.tqs.model.Opportunity;
import ua.tqs.model.Skill;
import ua.tqs.model.User;
import ua.tqs.model.enums.OpportunityStatus;
import ua.tqs.repository.OpportunityRepository;
import ua.tqs.repository.SkillRepository;
import ua.tqs.repository.UserRepository;

import java.util.HashSet;
import java.util.Set;

/**
 * Service for resetting the database to its initial state during E2E tests.
 * Only available in the integration-test profile.
 */
@Slf4j
@Service
@Profile("integration-test")
@RequiredArgsConstructor
public class TestResetService {

    private final JdbcTemplate jdbcTemplate;
    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;

    // BCrypt hash of "password" - same as in data-integration-test.sql
    private static final String PASSWORD_HASH = "$2a$10$w/RTKkG/tQ00sCIK4ST9pOBE4disgBStZmOe7eHqP.QPB.8udzWeG";

    /**
     * Resets the database to its initial seed state.
     * Deletes all data and re-seeds with the initial test data.
     */
    @Transactional
    public void resetDatabase() {
        log.info("Resetting database to initial state for E2E tests");

        // Delete data in order respecting foreign key constraints
        deleteAllData();

        // Re-seed the database with initial test data
        seedTestData();

        log.info("Database reset complete");
    }

    private void deleteAllData() {
        // Delete in reverse order of dependencies
        jdbcTemplate.execute("DELETE FROM applications");
        jdbcTemplate.execute("DELETE FROM redemptions");
        jdbcTemplate.execute("DELETE FROM opportunity_skills");
        jdbcTemplate.execute("DELETE FROM opportunities");
        jdbcTemplate.execute("DELETE FROM rewards");
        jdbcTemplate.execute("DELETE FROM user_skills");
        jdbcTemplate.execute("DELETE FROM users");
        jdbcTemplate.execute("DELETE FROM partners");
        jdbcTemplate.execute("DELETE FROM skills");

        log.debug("All data deleted");
    }

    private void seedTestData() {
        // Seed skills
        seedSkills();

        // Seed users
        seedUsers();

        // Associate skills with volunteer
        associateVolunteerSkills();

        log.debug("Test data seeded");
    }

    private void seedSkills() {
        jdbcTemplate.update(
            "INSERT INTO skills (name, category, description) VALUES (?, ?, ?)",
            "Communication", "COMMUNICATION", "Effective verbal and written communication"
        );
        jdbcTemplate.update(
            "INSERT INTO skills (name, category, description) VALUES (?, ?, ?)",
            "Leadership", "LEADERSHIP", "Ability to lead and motivate teams"
        );
        jdbcTemplate.update(
            "INSERT INTO skills (name, category, description) VALUES (?, ?, ?)",
            "Programming", "TECHNICAL", "Software development and coding skills"
        );
        jdbcTemplate.update(
            "INSERT INTO skills (name, category, description) VALUES (?, ?, ?)",
            "Design", "CREATIVE", "Visual and graphic design skills"
        );
        jdbcTemplate.update(
            "INSERT INTO skills (name, category, description) VALUES (?, ?, ?)",
            "Event Planning", "ADMINISTRATIVE", "Organizing and coordinating events"
        );
        jdbcTemplate.update(
            "INSERT INTO skills (name, category, description) VALUES (?, ?, ?)",
            "Public Speaking", "SOCIAL", "Presenting to audiences"
        );
        jdbcTemplate.update(
            "INSERT INTO skills (name, category, description) VALUES (?, ?, ?)",
            "English", "LANGUAGE", "English language proficiency"
        );
        jdbcTemplate.update(
            "INSERT INTO skills (name, category, description) VALUES (?, ?, ?)",
            "Portuguese", "LANGUAGE", "Portuguese language proficiency"
        );
    }

    private void seedUsers() {
        // Admin user
        jdbcTemplate.update(
            "INSERT INTO users (email, password, name, role, points, created_at, updated_at) " +
            "VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
            "admin@ua.pt", PASSWORD_HASH, "System Administrator", "ADMIN", 0
        );

        // Promoter user
        jdbcTemplate.update(
            "INSERT INTO users (email, password, name, role, points, created_at, updated_at) " +
            "VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
            "promoter@ua.pt", PASSWORD_HASH, "Sample Promoter", "PROMOTER", 0
        );

        // Volunteer user
        jdbcTemplate.update(
            "INSERT INTO users (email, password, name, role, points, bio, created_at, updated_at) " +
            "VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
            "volunteer@ua.pt", PASSWORD_HASH, "Sample Volunteer", "VOLUNTEER", 50,
            "I am passionate about helping others and making a difference in my community."
        );
    }

    private void associateVolunteerSkills() {
        // Get volunteer user ID
        Long volunteerId = jdbcTemplate.queryForObject(
            "SELECT id FROM users WHERE email = ?",
            Long.class,
            "volunteer@ua.pt"
        );

        // Get skill IDs
        Long communicationId = jdbcTemplate.queryForObject(
            "SELECT id FROM skills WHERE name = ?",
            Long.class,
            "Communication"
        );
        Long englishId = jdbcTemplate.queryForObject(
            "SELECT id FROM skills WHERE name = ?",
            Long.class,
            "English"
        );

        // Associate skills
        jdbcTemplate.update(
            "INSERT INTO user_skills (user_id, skill_id) VALUES (?, ?)",
            volunteerId, communicationId
        );
        jdbcTemplate.update(
            "INSERT INTO user_skills (user_id, skill_id) VALUES (?, ?)",
            volunteerId, englishId
        );
    }

    /**
     * Creates an opportunity with OPEN status for E2E testing.
     * This allows testing volunteer applications without going through the normal flow.
     */
    @Transactional
    public OpportunityResponse createOpenOpportunity(CreateOpportunityRequest request) {
        // Validate end date is after start date
        if (request.getEndDate().isBefore(request.getStartDate()) ||
            request.getEndDate().isEqual(request.getStartDate())) {
            throw new OpportunityValidationException("End date must be after start date");
        }

        // Validate at least one skill is required
        if (request.getRequiredSkillIds() == null || request.getRequiredSkillIds().isEmpty()) {
            throw new OpportunityValidationException("At least one skill is required");
        }

        // Get the promoter (use the default test promoter)
        User promoter = userRepository.findByEmail("promoter@ua.pt")
                .orElseThrow(() -> new UserNotFoundException("promoter@ua.pt"));

        // Get and validate required skills
        Set<Skill> requiredSkills = new HashSet<>();
        for (Long skillId : request.getRequiredSkillIds()) {
            Skill skill = skillRepository.findById(skillId)
                    .orElseThrow(() -> new OpportunityValidationException(
                            "Skill not found with id: " + skillId));
            requiredSkills.add(skill);
        }

        // Build the opportunity entity with OPEN status
        Opportunity opportunity = Opportunity.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .pointsReward(request.getPointsReward())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .maxVolunteers(request.getMaxVolunteers())
                .status(OpportunityStatus.OPEN) // Set to OPEN for testing
                .location(request.getLocation())
                .promoter(promoter)
                .requiredSkills(requiredSkills)
                .build();

        Opportunity savedOpportunity = opportunityRepository.save(opportunity);
        log.info("Created OPEN opportunity '{}' (id: {}) for testing",
                savedOpportunity.getTitle(), savedOpportunity.getId());

        return OpportunityResponse.fromOpportunity(savedOpportunity);
    }
}

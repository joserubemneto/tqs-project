package ua.tqs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.dto.CreateOpportunityRequest;
import ua.tqs.model.Opportunity;
import ua.tqs.model.Skill;
import ua.tqs.model.User;
import ua.tqs.model.enums.OpportunityStatus;
import ua.tqs.model.enums.SkillCategory;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.OpportunityRepository;
import ua.tqs.repository.SkillRepository;
import ua.tqs.repository.UserRepository;
import ua.tqs.service.JwtService;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for OpportunityController.
 * 
 * Test Strategy:
 * - Uses @SpringBootTest with full application context
 * - Tests opportunity CRUD operations with authentication
 * - Uses H2 in-memory database (test profile)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class OpportunityControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private OpportunityRepository opportunityRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private ObjectMapper objectMapper;

    private User promoterUser;
    private User volunteerUser;
    private String promoterToken;
    private String volunteerToken;
    private Skill communicationSkill;
    private Skill leadershipSkill;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        opportunityRepository.deleteAll();
        userRepository.deleteAll();
        skillRepository.deleteAll();

        // Create skills
        communicationSkill = Skill.builder()
                .name("Communication")
                .category(SkillCategory.COMMUNICATION)
                .description("Effective communication skills")
                .build();
        communicationSkill = skillRepository.save(communicationSkill);

        leadershipSkill = Skill.builder()
                .name("Leadership")
                .category(SkillCategory.LEADERSHIP)
                .description("Ability to lead teams")
                .build();
        leadershipSkill = skillRepository.save(leadershipSkill);

        // Create promoter user
        promoterUser = User.builder()
                .email("promoter@ua.pt")
                .password(passwordEncoder.encode("PromoterPass123"))
                .name("Promoter User")
                .role(UserRole.PROMOTER)
                .points(0)
                .build();
        promoterUser = userRepository.save(promoterUser);
        promoterToken = jwtService.generateToken(promoterUser);

        // Create volunteer user
        volunteerUser = User.builder()
                .email("volunteer@ua.pt")
                .password(passwordEncoder.encode("VolunteerPass123"))
                .name("Volunteer User")
                .role(UserRole.VOLUNTEER)
                .points(50)
                .build();
        volunteerUser = userRepository.save(volunteerUser);
        volunteerToken = jwtService.generateToken(volunteerUser);
    }

    @Nested
    @DisplayName("POST /api/opportunities")
    class CreateOpportunityEndpoint {

        @Test
        @DisplayName("should return 201 CREATED with valid opportunity data")
        void shouldCreateOpportunityWithValidData() throws Exception {
            CreateOpportunityRequest request = CreateOpportunityRequest.builder()
                    .title("UA Open Day Support")
                    .description("Help with university open day activities")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .location("University Campus")
                    .requiredSkillIds(Set.of(communicationSkill.getId()))
                    .build();

            mockMvc.perform(post("/api/opportunities")
                    .header("Authorization", "Bearer " + promoterToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").exists())
                    .andExpect(jsonPath("$.title").value("UA Open Day Support"))
                    .andExpect(jsonPath("$.description").value("Help with university open day activities"))
                    .andExpect(jsonPath("$.pointsReward").value(50))
                    .andExpect(jsonPath("$.maxVolunteers").value(10))
                    .andExpect(jsonPath("$.status").value("DRAFT"))
                    .andExpect(jsonPath("$.location").value("University Campus"))
                    .andExpect(jsonPath("$.promoter.id").value(promoterUser.getId()))
                    .andExpect(jsonPath("$.requiredSkills").isArray())
                    .andExpect(jsonPath("$.requiredSkills.length()").value(1));
        }

        @Test
        @DisplayName("should persist opportunity in database")
        void shouldPersistOpportunityInDatabase() throws Exception {
            CreateOpportunityRequest request = CreateOpportunityRequest.builder()
                    .title("UA Open Day Support")
                    .description("Help with university open day activities")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .requiredSkillIds(Set.of(communicationSkill.getId()))
                    .build();

            mockMvc.perform(post("/api/opportunities")
                    .header("Authorization", "Bearer " + promoterToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated());

            assertThat(opportunityRepository.findByPromoter(promoterUser)).hasSize(1);
            Opportunity savedOpportunity = opportunityRepository.findByPromoter(promoterUser).get(0);
            assertThat(savedOpportunity.getTitle()).isEqualTo("UA Open Day Support");
            assertThat(savedOpportunity.getStatus()).isEqualTo(OpportunityStatus.DRAFT);
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST when end date is before start date")
        void shouldReturnBadRequestWhenEndDateBeforeStartDate() throws Exception {
            CreateOpportunityRequest request = CreateOpportunityRequest.builder()
                    .title("UA Open Day Support")
                    .description("Help with university open day activities")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(7))
                    .endDate(LocalDateTime.now().plusDays(1))
                    .maxVolunteers(10)
                    .requiredSkillIds(Set.of(communicationSkill.getId()))
                    .build();

            mockMvc.perform(post("/api/opportunities")
                    .header("Authorization", "Bearer " + promoterToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("End date must be after start date"));
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST when no skills provided")
        void shouldReturnBadRequestWhenNoSkillsProvided() throws Exception {
            CreateOpportunityRequest request = CreateOpportunityRequest.builder()
                    .title("UA Open Day Support")
                    .description("Help with university open day activities")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .requiredSkillIds(Set.of())
                    .build();

            mockMvc.perform(post("/api/opportunities")
                    .header("Authorization", "Bearer " + promoterToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("At least one skill is required"));
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST when title is blank")
        void shouldReturnBadRequestWhenTitleIsBlank() throws Exception {
            CreateOpportunityRequest request = CreateOpportunityRequest.builder()
                    .title("")
                    .description("Help with university open day activities")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .requiredSkillIds(Set.of(communicationSkill.getId()))
                    .build();

            mockMvc.perform(post("/api/opportunities")
                    .header("Authorization", "Bearer " + promoterToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Title is required"));
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST when maxVolunteers is less than 1")
        void shouldReturnBadRequestWhenMaxVolunteersLessThanOne() throws Exception {
            CreateOpportunityRequest request = CreateOpportunityRequest.builder()
                    .title("UA Open Day Support")
                    .description("Help with university open day activities")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(0)
                    .requiredSkillIds(Set.of(communicationSkill.getId()))
                    .build();

            mockMvc.perform(post("/api/opportunities")
                    .header("Authorization", "Bearer " + promoterToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Max volunteers must be at least 1"));
        }

        @Test
        @DisplayName("should return 403 FORBIDDEN for volunteer role")
        void shouldReturnForbiddenForVolunteerRole() throws Exception {
            CreateOpportunityRequest request = CreateOpportunityRequest.builder()
                    .title("UA Open Day Support")
                    .description("Help with university open day activities")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .requiredSkillIds(Set.of(communicationSkill.getId()))
                    .build();

            mockMvc.perform(post("/api/opportunities")
                    .header("Authorization", "Bearer " + volunteerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 403 FORBIDDEN when no token provided")
        void shouldReturnForbiddenWithoutToken() throws Exception {
            CreateOpportunityRequest request = CreateOpportunityRequest.builder()
                    .title("UA Open Day Support")
                    .description("Help with university open day activities")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .requiredSkillIds(Set.of(communicationSkill.getId()))
                    .build();

            mockMvc.perform(post("/api/opportunities")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should create opportunity with multiple skills")
        void shouldCreateOpportunityWithMultipleSkills() throws Exception {
            CreateOpportunityRequest request = CreateOpportunityRequest.builder()
                    .title("Leadership Workshop")
                    .description("Lead a workshop for students")
                    .pointsReward(100)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(3))
                    .maxVolunteers(5)
                    .requiredSkillIds(Set.of(communicationSkill.getId(), leadershipSkill.getId()))
                    .build();

            mockMvc.perform(post("/api/opportunities")
                    .header("Authorization", "Bearer " + promoterToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.requiredSkills.length()").value(2));
        }
    }

    @Nested
    @DisplayName("GET /api/opportunities/my")
    class GetMyOpportunitiesEndpoint {

        @Test
        @DisplayName("should return 200 OK with empty list when no opportunities")
        void shouldReturnEmptyListWhenNoOpportunities() throws Exception {
            mockMvc.perform(get("/api/opportunities/my")
                    .header("Authorization", "Bearer " + promoterToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(0));
        }

        @Test
        @DisplayName("should return 200 OK with list of promoter's opportunities")
        void shouldReturnPromotersOpportunities() throws Exception {
            // Create an opportunity first
            Set<Skill> skills = new HashSet<>();
            skills.add(communicationSkill);

            Opportunity opportunity = Opportunity.builder()
                    .title("UA Open Day Support")
                    .description("Help with university open day activities")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .status(OpportunityStatus.DRAFT)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(opportunity);

            mockMvc.perform(get("/api/opportunities/my")
                    .header("Authorization", "Bearer " + promoterToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].title").value("UA Open Day Support"));
        }

        @Test
        @DisplayName("should return 403 FORBIDDEN for volunteer role")
        void shouldReturnForbiddenForVolunteerRole() throws Exception {
            mockMvc.perform(get("/api/opportunities/my")
                    .header("Authorization", "Bearer " + volunteerToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 403 FORBIDDEN when no token provided")
        void shouldReturnForbiddenWithoutToken() throws Exception {
            mockMvc.perform(get("/api/opportunities/my"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should only return opportunities for current promoter")
        void shouldOnlyReturnOpportunitiesForCurrentPromoter() throws Exception {
            // Create another promoter
            User anotherPromoter = User.builder()
                    .email("other-promoter@ua.pt")
                    .password(passwordEncoder.encode("OtherPass123"))
                    .name("Other Promoter")
                    .role(UserRole.PROMOTER)
                    .points(0)
                    .build();
            anotherPromoter = userRepository.save(anotherPromoter);

            Set<Skill> skills = new HashSet<>();
            skills.add(communicationSkill);

            // Create opportunity for current promoter
            Opportunity myOpportunity = Opportunity.builder()
                    .title("My Opportunity")
                    .description("My opportunity description")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .status(OpportunityStatus.DRAFT)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(myOpportunity);

            // Create opportunity for another promoter
            Opportunity otherOpportunity = Opportunity.builder()
                    .title("Other Opportunity")
                    .description("Other opportunity description")
                    .pointsReward(30)
                    .startDate(LocalDateTime.now().plusDays(2))
                    .endDate(LocalDateTime.now().plusDays(8))
                    .maxVolunteers(5)
                    .status(OpportunityStatus.OPEN)
                    .promoter(anotherPromoter)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(otherOpportunity);

            mockMvc.perform(get("/api/opportunities/my")
                    .header("Authorization", "Bearer " + promoterToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].title").value("My Opportunity"));
        }
    }
}

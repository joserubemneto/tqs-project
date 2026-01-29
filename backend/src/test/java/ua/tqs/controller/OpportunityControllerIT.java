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

    @Nested
    @DisplayName("GET /api/opportunities")
    class GetAllOpportunitiesEndpoint {

        @Test
        @DisplayName("should return 200 OK without authentication")
        void shouldReturnOkWithoutAuthentication() throws Exception {
            mockMvc.perform(get("/api/opportunities"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("should return 200 OK with empty page when no open opportunities")
        void shouldReturnEmptyPageWhenNoOpenOpportunities() throws Exception {
            mockMvc.perform(get("/api/opportunities"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.content.length()").value(0))
                    .andExpect(jsonPath("$.totalElements").value(0));
        }

        @Test
        @DisplayName("should return only OPEN opportunities")
        void shouldReturnOnlyOpenOpportunities() throws Exception {
            Set<Skill> skills = new HashSet<>();
            skills.add(communicationSkill);

            // Create DRAFT opportunity (should not be returned)
            Opportunity draftOpportunity = Opportunity.builder()
                    .title("Draft Opportunity")
                    .description("A draft opportunity")
                    .pointsReward(30)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(5)
                    .status(OpportunityStatus.DRAFT)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(draftOpportunity);

            // Create OPEN opportunity (should be returned)
            Opportunity openOpportunity = Opportunity.builder()
                    .title("Open Opportunity")
                    .description("An open opportunity")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(2))
                    .endDate(LocalDateTime.now().plusDays(10))
                    .maxVolunteers(10)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(openOpportunity);

            mockMvc.perform(get("/api/opportunities"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(1))
                    .andExpect(jsonPath("$.content[0].title").value("Open Opportunity"))
                    .andExpect(jsonPath("$.content[0].status").value("OPEN"));
        }

        @Test
        @DisplayName("should return paginated results")
        void shouldReturnPaginatedResults() throws Exception {
            Set<Skill> skills = new HashSet<>();
            skills.add(communicationSkill);

            // Create multiple OPEN opportunities
            for (int i = 1; i <= 15; i++) {
                Opportunity opportunity = Opportunity.builder()
                        .title("Opportunity " + i)
                        .description("Description " + i)
                        .pointsReward(10 * i)
                        .startDate(LocalDateTime.now().plusDays(i))
                        .endDate(LocalDateTime.now().plusDays(i + 7))
                        .maxVolunteers(5)
                        .status(OpportunityStatus.OPEN)
                        .promoter(promoterUser)
                        .requiredSkills(skills)
                        .build();
                opportunityRepository.save(opportunity);
            }

            // Request first page with size 10
            mockMvc.perform(get("/api/opportunities")
                    .param("page", "0")
                    .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(10))
                    .andExpect(jsonPath("$.totalElements").value(15))
                    .andExpect(jsonPath("$.totalPages").value(2))
                    .andExpect(jsonPath("$.number").value(0));

            // Request second page
            mockMvc.perform(get("/api/opportunities")
                    .param("page", "1")
                    .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(5))
                    .andExpect(jsonPath("$.number").value(1));
        }

        @Test
        @DisplayName("should support sorting by startDate ascending")
        void shouldSupportSortingByStartDateAscending() throws Exception {
            Set<Skill> skills = new HashSet<>();
            skills.add(communicationSkill);

            Opportunity laterOpportunity = Opportunity.builder()
                    .title("Later Opportunity")
                    .description("Starts later")
                    .pointsReward(30)
                    .startDate(LocalDateTime.now().plusDays(10))
                    .endDate(LocalDateTime.now().plusDays(15))
                    .maxVolunteers(5)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(laterOpportunity);

            Opportunity earlierOpportunity = Opportunity.builder()
                    .title("Earlier Opportunity")
                    .description("Starts earlier")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(5))
                    .maxVolunteers(10)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(earlierOpportunity);

            mockMvc.perform(get("/api/opportunities")
                    .param("sortBy", "startDate")
                    .param("sortDir", "asc"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(2))
                    .andExpect(jsonPath("$.content[0].title").value("Earlier Opportunity"))
                    .andExpect(jsonPath("$.content[1].title").value("Later Opportunity"));
        }

        @Test
        @DisplayName("should support sorting by startDate descending")
        void shouldSupportSortingByStartDateDescending() throws Exception {
            Set<Skill> skills = new HashSet<>();
            skills.add(communicationSkill);

            Opportunity laterOpportunity = Opportunity.builder()
                    .title("Later Opportunity")
                    .description("Starts later")
                    .pointsReward(30)
                    .startDate(LocalDateTime.now().plusDays(10))
                    .endDate(LocalDateTime.now().plusDays(15))
                    .maxVolunteers(5)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(laterOpportunity);

            Opportunity earlierOpportunity = Opportunity.builder()
                    .title("Earlier Opportunity")
                    .description("Starts earlier")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(5))
                    .maxVolunteers(10)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(earlierOpportunity);

            mockMvc.perform(get("/api/opportunities")
                    .param("sortBy", "startDate")
                    .param("sortDir", "desc"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(2))
                    .andExpect(jsonPath("$.content[0].title").value("Later Opportunity"))
                    .andExpect(jsonPath("$.content[1].title").value("Earlier Opportunity"));
        }

        @Test
        @DisplayName("should return opportunity with all details")
        void shouldReturnOpportunityWithAllDetails() throws Exception {
            Set<Skill> skills = new HashSet<>();
            skills.add(communicationSkill);
            skills.add(leadershipSkill);

            Opportunity opportunity = Opportunity.builder()
                    .title("Detailed Opportunity")
                    .description("A detailed opportunity with all fields")
                    .pointsReward(100)
                    .startDate(LocalDateTime.now().plusDays(5))
                    .endDate(LocalDateTime.now().plusDays(12))
                    .maxVolunteers(20)
                    .location("University Campus, Building A")
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(opportunity);

            mockMvc.perform(get("/api/opportunities"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].id").exists())
                    .andExpect(jsonPath("$.content[0].title").value("Detailed Opportunity"))
                    .andExpect(jsonPath("$.content[0].description").value("A detailed opportunity with all fields"))
                    .andExpect(jsonPath("$.content[0].pointsReward").value(100))
                    .andExpect(jsonPath("$.content[0].maxVolunteers").value(20))
                    .andExpect(jsonPath("$.content[0].location").value("University Campus, Building A"))
                    .andExpect(jsonPath("$.content[0].status").value("OPEN"))
                    .andExpect(jsonPath("$.content[0].promoter.id").exists())
                    .andExpect(jsonPath("$.content[0].promoter.name").value("Promoter User"))
                    .andExpect(jsonPath("$.content[0].requiredSkills").isArray())
                    .andExpect(jsonPath("$.content[0].requiredSkills.length()").value(2));
        }

        @Test
        @DisplayName("should also work with authentication")
        void shouldAlsoWorkWithAuthentication() throws Exception {
            Set<Skill> skills = new HashSet<>();
            skills.add(communicationSkill);

            Opportunity opportunity = Opportunity.builder()
                    .title("Test Opportunity")
                    .description("Test description")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(opportunity);

            // Works with promoter token
            mockMvc.perform(get("/api/opportunities")
                    .header("Authorization", "Bearer " + promoterToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(1));

            // Works with volunteer token
            mockMvc.perform(get("/api/opportunities")
                    .header("Authorization", "Bearer " + volunteerToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(1));
        }

        @Test
        @DisplayName("should filter opportunities by skill ID")
        void shouldFilterOpportunitiesBySkillId() throws Exception {
            Set<Skill> communicationSkills = new HashSet<>();
            communicationSkills.add(communicationSkill);

            Set<Skill> leadershipSkills = new HashSet<>();
            leadershipSkills.add(leadershipSkill);

            // Create opportunity with communication skill
            Opportunity commOpportunity = Opportunity.builder()
                    .title("Communication Opportunity")
                    .description("Needs communication skills")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(communicationSkills)
                    .build();
            opportunityRepository.save(commOpportunity);

            // Create opportunity with leadership skill
            Opportunity leaderOpportunity = Opportunity.builder()
                    .title("Leadership Opportunity")
                    .description("Needs leadership skills")
                    .pointsReward(75)
                    .startDate(LocalDateTime.now().plusDays(2))
                    .endDate(LocalDateTime.now().plusDays(8))
                    .maxVolunteers(5)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(leadershipSkills)
                    .build();
            opportunityRepository.save(leaderOpportunity);

            // Filter by communication skill
            mockMvc.perform(get("/api/opportunities")
                    .param("skillIds", communicationSkill.getId().toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(1))
                    .andExpect(jsonPath("$.content[0].title").value("Communication Opportunity"));

            // Filter by leadership skill
            mockMvc.perform(get("/api/opportunities")
                    .param("skillIds", leadershipSkill.getId().toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(1))
                    .andExpect(jsonPath("$.content[0].title").value("Leadership Opportunity"));
        }

        @Test
        @DisplayName("should filter opportunities by multiple skill IDs")
        void shouldFilterOpportunitiesByMultipleSkillIds() throws Exception {
            Set<Skill> communicationSkills = new HashSet<>();
            communicationSkills.add(communicationSkill);

            Set<Skill> leadershipSkills = new HashSet<>();
            leadershipSkills.add(leadershipSkill);

            // Create opportunities
            Opportunity commOpportunity = Opportunity.builder()
                    .title("Communication Opportunity")
                    .description("Needs communication skills")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(communicationSkills)
                    .build();
            opportunityRepository.save(commOpportunity);

            Opportunity leaderOpportunity = Opportunity.builder()
                    .title("Leadership Opportunity")
                    .description("Needs leadership skills")
                    .pointsReward(75)
                    .startDate(LocalDateTime.now().plusDays(2))
                    .endDate(LocalDateTime.now().plusDays(8))
                    .maxVolunteers(5)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(leadershipSkills)
                    .build();
            opportunityRepository.save(leaderOpportunity);

            // Filter by both skills (should return both - OR logic)
            mockMvc.perform(get("/api/opportunities")
                    .param("skillIds", communicationSkill.getId().toString())
                    .param("skillIds", leadershipSkill.getId().toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(2));
        }

        @Test
        @DisplayName("should filter opportunities by minimum points")
        void shouldFilterOpportunitiesByMinPoints() throws Exception {
            Set<Skill> skills = new HashSet<>();
            skills.add(communicationSkill);

            // Create opportunity with low points
            Opportunity lowPointsOpp = Opportunity.builder()
                    .title("Low Points Opportunity")
                    .description("Low points")
                    .pointsReward(20)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(lowPointsOpp);

            // Create opportunity with high points
            Opportunity highPointsOpp = Opportunity.builder()
                    .title("High Points Opportunity")
                    .description("High points")
                    .pointsReward(100)
                    .startDate(LocalDateTime.now().plusDays(2))
                    .endDate(LocalDateTime.now().plusDays(8))
                    .maxVolunteers(5)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(highPointsOpp);

            // Filter by minimum 50 points
            mockMvc.perform(get("/api/opportunities")
                    .param("minPoints", "50"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(1))
                    .andExpect(jsonPath("$.content[0].title").value("High Points Opportunity"));
        }

        @Test
        @DisplayName("should filter opportunities by maximum points")
        void shouldFilterOpportunitiesByMaxPoints() throws Exception {
            Set<Skill> skills = new HashSet<>();
            skills.add(communicationSkill);

            // Create opportunity with low points
            Opportunity lowPointsOpp = Opportunity.builder()
                    .title("Low Points Opportunity")
                    .description("Low points")
                    .pointsReward(20)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(lowPointsOpp);

            // Create opportunity with high points
            Opportunity highPointsOpp = Opportunity.builder()
                    .title("High Points Opportunity")
                    .description("High points")
                    .pointsReward(100)
                    .startDate(LocalDateTime.now().plusDays(2))
                    .endDate(LocalDateTime.now().plusDays(8))
                    .maxVolunteers(5)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(highPointsOpp);

            // Filter by maximum 50 points
            mockMvc.perform(get("/api/opportunities")
                    .param("maxPoints", "50"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(1))
                    .andExpect(jsonPath("$.content[0].title").value("Low Points Opportunity"));
        }

        @Test
        @DisplayName("should filter opportunities by points range")
        void shouldFilterOpportunitiesByPointsRange() throws Exception {
            Set<Skill> skills = new HashSet<>();
            skills.add(communicationSkill);

            // Create opportunities with different points
            Opportunity lowOpp = Opportunity.builder()
                    .title("Low Points")
                    .description("Low")
                    .pointsReward(20)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(lowOpp);

            Opportunity midOpp = Opportunity.builder()
                    .title("Mid Points")
                    .description("Mid")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(2))
                    .endDate(LocalDateTime.now().plusDays(8))
                    .maxVolunteers(5)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(midOpp);

            Opportunity highOpp = Opportunity.builder()
                    .title("High Points")
                    .description("High")
                    .pointsReward(100)
                    .startDate(LocalDateTime.now().plusDays(3))
                    .endDate(LocalDateTime.now().plusDays(9))
                    .maxVolunteers(5)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(highOpp);

            // Filter by points range 30-80
            mockMvc.perform(get("/api/opportunities")
                    .param("minPoints", "30")
                    .param("maxPoints", "80"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(1))
                    .andExpect(jsonPath("$.content[0].title").value("Mid Points"));
        }

        @Test
        @DisplayName("should filter opportunities by start date from")
        void shouldFilterOpportunitiesByStartDateFrom() throws Exception {
            Set<Skill> skills = new HashSet<>();
            skills.add(communicationSkill);

            // Create opportunity starting soon
            Opportunity earlyOpp = Opportunity.builder()
                    .title("Early Start")
                    .description("Starts soon")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(5))
                    .maxVolunteers(10)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(earlyOpp);

            // Create opportunity starting later
            Opportunity lateOpp = Opportunity.builder()
                    .title("Late Start")
                    .description("Starts later")
                    .pointsReward(75)
                    .startDate(LocalDateTime.now().plusDays(30))
                    .endDate(LocalDateTime.now().plusDays(35))
                    .maxVolunteers(5)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(lateOpp);

            // Filter by start date from 15 days from now
            String startDateFrom = LocalDateTime.now().plusDays(15).toString();
            mockMvc.perform(get("/api/opportunities")
                    .param("startDateFrom", startDateFrom))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(1))
                    .andExpect(jsonPath("$.content[0].title").value("Late Start"));
        }

        @Test
        @DisplayName("should apply multiple filters together")
        void shouldApplyMultipleFiltersTogether() throws Exception {
            Set<Skill> communicationSkills = new HashSet<>();
            communicationSkills.add(communicationSkill);

            Set<Skill> leadershipSkills = new HashSet<>();
            leadershipSkills.add(leadershipSkill);

            // Create various opportunities
            Opportunity opp1 = Opportunity.builder()
                    .title("Comm Low Points")
                    .description("Communication, low points")
                    .pointsReward(20)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(communicationSkills)
                    .build();
            opportunityRepository.save(opp1);

            Opportunity opp2 = Opportunity.builder()
                    .title("Comm High Points")
                    .description("Communication, high points")
                    .pointsReward(100)
                    .startDate(LocalDateTime.now().plusDays(2))
                    .endDate(LocalDateTime.now().plusDays(8))
                    .maxVolunteers(5)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(communicationSkills)
                    .build();
            opportunityRepository.save(opp2);

            Opportunity opp3 = Opportunity.builder()
                    .title("Leader High Points")
                    .description("Leadership, high points")
                    .pointsReward(100)
                    .startDate(LocalDateTime.now().plusDays(3))
                    .endDate(LocalDateTime.now().plusDays(9))
                    .maxVolunteers(5)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(leadershipSkills)
                    .build();
            opportunityRepository.save(opp3);

            // Filter by communication skill AND minimum 50 points
            mockMvc.perform(get("/api/opportunities")
                    .param("skillIds", communicationSkill.getId().toString())
                    .param("minPoints", "50"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(1))
                    .andExpect(jsonPath("$.content[0].title").value("Comm High Points"));
        }

        @Test
        @DisplayName("should return empty when no opportunities match filters")
        void shouldReturnEmptyWhenNoMatchingFilters() throws Exception {
            Set<Skill> skills = new HashSet<>();
            skills.add(communicationSkill);

            Opportunity opportunity = Opportunity.builder()
                    .title("Test Opportunity")
                    .description("Test")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoterUser)
                    .requiredSkills(skills)
                    .build();
            opportunityRepository.save(opportunity);

            // Filter by points that don't match
            mockMvc.perform(get("/api/opportunities")
                    .param("minPoints", "1000"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(0))
                    .andExpect(jsonPath("$.totalElements").value(0));
        }
    }
}

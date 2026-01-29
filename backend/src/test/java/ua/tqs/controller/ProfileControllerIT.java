package ua.tqs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import ua.tqs.dto.UpdateProfileRequest;
import ua.tqs.model.Skill;
import ua.tqs.model.User;
import ua.tqs.model.enums.SkillCategory;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.SkillRepository;
import ua.tqs.repository.UserRepository;
import ua.tqs.service.JwtService;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for ProfileController.
 * 
 * Test Strategy:
 * - Uses @SpringBootTest with full application context
 * - Tests profile CRUD operations with authentication
 * - Uses H2 in-memory database (test profile)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ProfileControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private User volunteerUser;
    private String volunteerToken;
    private Skill communicationSkill;
    private Skill leadershipSkill;
    private Skill technicalSkill;

    @BeforeEach
    void setUp() {
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

        technicalSkill = Skill.builder()
                .name("Programming")
                .category(SkillCategory.TECHNICAL)
                .description("Software development skills")
                .build();
        technicalSkill = skillRepository.save(technicalSkill);

        // Create volunteer user with skills
        Set<Skill> skills = new HashSet<>();
        skills.add(communicationSkill);

        volunteerUser = User.builder()
                .email("volunteer@ua.pt")
                .password(passwordEncoder.encode("VolunteerPass123"))
                .name("Volunteer User")
                .role(UserRole.VOLUNTEER)
                .points(50)
                .bio("I love volunteering")
                .skills(skills)
                .build();
        volunteerUser = userRepository.save(volunteerUser);
        volunteerToken = jwtService.generateToken(volunteerUser);
    }

    @Nested
    @DisplayName("GET /api/profile")
    class GetProfileEndpoint {

        @Test
        @DisplayName("should return 200 OK with user profile")
        void shouldReturnProfileForAuthenticatedUser() throws Exception {
            mockMvc.perform(get("/api/profile")
                    .header("Authorization", "Bearer " + volunteerToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(volunteerUser.getId()))
                    .andExpect(jsonPath("$.email").value("volunteer@ua.pt"))
                    .andExpect(jsonPath("$.name").value("Volunteer User"))
                    .andExpect(jsonPath("$.role").value("VOLUNTEER"))
                    .andExpect(jsonPath("$.points").value(50))
                    .andExpect(jsonPath("$.bio").value("I love volunteering"));
        }

        @Test
        @DisplayName("should return profile with skills")
        void shouldReturnProfileWithSkills() throws Exception {
            mockMvc.perform(get("/api/profile")
                    .header("Authorization", "Bearer " + volunteerToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.skills").isArray())
                    .andExpect(jsonPath("$.skills.length()").value(1))
                    .andExpect(jsonPath("$.skills[0].name").value("Communication"));
        }

        @Test
        @DisplayName("should return 403 FORBIDDEN when no token provided")
        void shouldReturnForbiddenWithoutToken() throws Exception {
            mockMvc.perform(get("/api/profile"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 403 FORBIDDEN for invalid token")
        void shouldReturnForbiddenForInvalidToken() throws Exception {
            mockMvc.perform(get("/api/profile")
                    .header("Authorization", "Bearer invalid.token.here"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should not include password in response")
        void shouldNotIncludePasswordInResponse() throws Exception {
            mockMvc.perform(get("/api/profile")
                    .header("Authorization", "Bearer " + volunteerToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.password").doesNotExist());
        }
    }

    @Nested
    @DisplayName("PUT /api/profile")
    class UpdateProfileEndpoint {

        @Test
        @DisplayName("should return 200 OK when updating profile")
        void shouldUpdateProfileSuccessfully() throws Exception {
            UpdateProfileRequest request = UpdateProfileRequest.builder()
                    .name("Updated Name")
                    .bio("Updated bio")
                    .skillIds(Set.of(communicationSkill.getId()))
                    .build();

            mockMvc.perform(put("/api/profile")
                    .header("Authorization", "Bearer " + volunteerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Updated Name"))
                    .andExpect(jsonPath("$.bio").value("Updated bio"));
        }

        @Test
        @DisplayName("should persist profile changes to database")
        void shouldPersistProfileChangesToDatabase() throws Exception {
            UpdateProfileRequest request = UpdateProfileRequest.builder()
                    .name("Persisted Name")
                    .bio("Persisted bio")
                    .skillIds(Set.of(leadershipSkill.getId()))
                    .build();

            mockMvc.perform(put("/api/profile")
                    .header("Authorization", "Bearer " + volunteerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            User updatedUser = userRepository.findById(volunteerUser.getId()).orElseThrow();
            assertThat(updatedUser.getName()).isEqualTo("Persisted Name");
            assertThat(updatedUser.getBio()).isEqualTo("Persisted bio");
            assertThat(updatedUser.getSkills()).hasSize(1);
            assertThat(updatedUser.getSkills().iterator().next().getName()).isEqualTo("Leadership");
        }

        @Test
        @DisplayName("should update skills correctly")
        void shouldUpdateSkillsCorrectly() throws Exception {
            UpdateProfileRequest request = UpdateProfileRequest.builder()
                    .name("Volunteer User")
                    .bio("I love volunteering")
                    .skillIds(Set.of(leadershipSkill.getId(), technicalSkill.getId()))
                    .build();

            mockMvc.perform(put("/api/profile")
                    .header("Authorization", "Bearer " + volunteerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.skills.length()").value(2));
        }

        @Test
        @DisplayName("should remove all skills when empty skillIds provided")
        void shouldRemoveAllSkillsWhenEmptySkillIds() throws Exception {
            UpdateProfileRequest request = UpdateProfileRequest.builder()
                    .name("Volunteer User")
                    .bio("I love volunteering")
                    .skillIds(Set.of())
                    .build();

            mockMvc.perform(put("/api/profile")
                    .header("Authorization", "Bearer " + volunteerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.skills.length()").value(0));
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST when name is missing")
        void shouldReturnBadRequestWhenNameMissing() throws Exception {
            UpdateProfileRequest request = UpdateProfileRequest.builder()
                    .bio("Updated bio")
                    .skillIds(Set.of())
                    .build();

            mockMvc.perform(put("/api/profile")
                    .header("Authorization", "Bearer " + volunteerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST when name is too short")
        void shouldReturnBadRequestWhenNameTooShort() throws Exception {
            UpdateProfileRequest request = UpdateProfileRequest.builder()
                    .name("A")
                    .bio("Updated bio")
                    .skillIds(Set.of())
                    .build();

            mockMvc.perform(put("/api/profile")
                    .header("Authorization", "Bearer " + volunteerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST when bio is too long")
        void shouldReturnBadRequestWhenBioTooLong() throws Exception {
            String longBio = "a".repeat(501);
            UpdateProfileRequest request = UpdateProfileRequest.builder()
                    .name("Volunteer User")
                    .bio(longBio)
                    .skillIds(Set.of())
                    .build();

            mockMvc.perform(put("/api/profile")
                    .header("Authorization", "Bearer " + volunteerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should allow null bio")
        void shouldAllowNullBio() throws Exception {
            UpdateProfileRequest request = UpdateProfileRequest.builder()
                    .name("Volunteer User")
                    .bio(null)
                    .skillIds(Set.of())
                    .build();

            mockMvc.perform(put("/api/profile")
                    .header("Authorization", "Bearer " + volunteerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("should return 403 FORBIDDEN when no token provided")
        void shouldReturnForbiddenWithoutToken() throws Exception {
            UpdateProfileRequest request = UpdateProfileRequest.builder()
                    .name("Updated Name")
                    .build();

            mockMvc.perform(put("/api/profile")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should ignore non-existent skill IDs")
        void shouldIgnoreNonExistentSkillIds() throws Exception {
            UpdateProfileRequest request = UpdateProfileRequest.builder()
                    .name("Volunteer User")
                    .bio("I love volunteering")
                    .skillIds(Set.of(communicationSkill.getId(), 9999L))
                    .build();

            mockMvc.perform(put("/api/profile")
                    .header("Authorization", "Bearer " + volunteerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.skills.length()").value(1))
                    .andExpect(jsonPath("$.skills[0].name").value("Communication"));
        }
    }

    @Nested
    @DisplayName("GET /api/skills")
    class GetSkillsEndpoint {

        @Test
        @DisplayName("should return 200 OK with all skills")
        void shouldReturnAllSkills() throws Exception {
            mockMvc.perform(get("/api/skills")
                    .header("Authorization", "Bearer " + volunteerToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(3));
        }

        @Test
        @DisplayName("should filter skills by category")
        void shouldFilterSkillsByCategory() throws Exception {
            mockMvc.perform(get("/api/skills")
                    .header("Authorization", "Bearer " + volunteerToken)
                    .param("category", "COMMUNICATION"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].name").value("Communication"));
        }

        @Test
        @DisplayName("should return empty list when no skills match category")
        void shouldReturnEmptyListWhenNoCategoryMatch() throws Exception {
            mockMvc.perform(get("/api/skills")
                    .header("Authorization", "Bearer " + volunteerToken)
                    .param("category", "OTHER"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(0));
        }

        @Test
        @DisplayName("should return skill with all fields")
        void shouldReturnSkillWithAllFields() throws Exception {
            mockMvc.perform(get("/api/skills")
                    .header("Authorization", "Bearer " + volunteerToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").exists())
                    .andExpect(jsonPath("$[0].name").exists())
                    .andExpect(jsonPath("$[0].category").exists())
                    .andExpect(jsonPath("$[0].description").exists());
        }

        @Test
        @DisplayName("should return 200 OK when no token provided (public endpoint)")
        void shouldReturnOkWithoutToken() throws Exception {
            mockMvc.perform(get("/api/skills"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray());
        }
    }
}

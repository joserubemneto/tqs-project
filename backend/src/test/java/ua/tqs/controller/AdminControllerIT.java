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
import ua.tqs.dto.UpdateRoleRequest;
import ua.tqs.model.User;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.UserRepository;
import ua.tqs.service.JwtService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for AdminController.
 * 
 * Test Strategy:
 * - Uses @SpringBootTest with full application context
 * - Validates role-based access control
 * - Tests CRUD operations for user management
 * - Uses H2 in-memory database (test profile)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private User adminUser;
    private User volunteerUser;
    private User promoterUser;
    private String adminToken;
    private String volunteerToken;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        // Create admin user
        adminUser = User.builder()
                .email("admin@ua.pt")
                .password(passwordEncoder.encode("AdminPass123"))
                .name("Admin User")
                .role(UserRole.ADMIN)
                .points(0)
                .build();
        adminUser = userRepository.save(adminUser);
        adminToken = jwtService.generateToken(adminUser);

        // Create volunteer user
        volunteerUser = User.builder()
                .email("volunteer@ua.pt")
                .password(passwordEncoder.encode("VolunteerPass123"))
                .name("Volunteer User")
                .role(UserRole.VOLUNTEER)
                .points(100)
                .build();
        volunteerUser = userRepository.save(volunteerUser);
        volunteerToken = jwtService.generateToken(volunteerUser);

        // Create promoter user
        promoterUser = User.builder()
                .email("promoter@ua.pt")
                .password(passwordEncoder.encode("PromoterPass123"))
                .name("Promoter User")
                .role(UserRole.PROMOTER)
                .points(50)
                .build();
        promoterUser = userRepository.save(promoterUser);
    }

    @Nested
    @DisplayName("GET /api/admin/users")
    class GetUsersEndpoint {

        @Test
        @DisplayName("should return 200 OK with paginated users for admin")
        void shouldReturnUsersForAdmin() throws Exception {
            mockMvc.perform(get("/api/admin/users")
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.users").isArray())
                    .andExpect(jsonPath("$.users.length()").value(3))
                    .andExpect(jsonPath("$.totalElements").value(3))
                    .andExpect(jsonPath("$.currentPage").value(0));
        }

        @Test
        @DisplayName("should return 403 FORBIDDEN for non-admin user")
        void shouldReturnForbiddenForNonAdmin() throws Exception {
            mockMvc.perform(get("/api/admin/users")
                    .header("Authorization", "Bearer " + volunteerToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 403 FORBIDDEN when no token provided")
        void shouldReturnForbiddenWithoutToken() throws Exception {
            mockMvc.perform(get("/api/admin/users"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should filter users by search term")
        void shouldFilterBySearch() throws Exception {
            mockMvc.perform(get("/api/admin/users")
                    .header("Authorization", "Bearer " + adminToken)
                    .param("search", "volunteer"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.users.length()").value(1))
                    .andExpect(jsonPath("$.users[0].email").value("volunteer@ua.pt"));
        }

        @Test
        @DisplayName("should filter users by role")
        void shouldFilterByRole() throws Exception {
            mockMvc.perform(get("/api/admin/users")
                    .header("Authorization", "Bearer " + adminToken)
                    .param("role", "PROMOTER"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.users.length()").value(1))
                    .andExpect(jsonPath("$.users[0].role").value("PROMOTER"));
        }

        @Test
        @DisplayName("should paginate results correctly")
        void shouldPaginateResults() throws Exception {
            mockMvc.perform(get("/api/admin/users")
                    .header("Authorization", "Bearer " + adminToken)
                    .param("page", "0")
                    .param("size", "2"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.users.length()").value(2))
                    .andExpect(jsonPath("$.totalElements").value(3))
                    .andExpect(jsonPath("$.totalPages").value(2))
                    .andExpect(jsonPath("$.hasNext").value(true));
        }

        @Test
        @DisplayName("should return user details without password")
        void shouldReturnUserDetailsWithoutPassword() throws Exception {
            mockMvc.perform(get("/api/admin/users")
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.users[0].id").exists())
                    .andExpect(jsonPath("$.users[0].email").exists())
                    .andExpect(jsonPath("$.users[0].name").exists())
                    .andExpect(jsonPath("$.users[0].role").exists())
                    .andExpect(jsonPath("$.users[0].points").exists())
                    .andExpect(jsonPath("$.users[0].password").doesNotExist());
        }

        @Test
        @DisplayName("should return empty list when no users match search")
        void shouldReturnEmptyListForNoMatch() throws Exception {
            mockMvc.perform(get("/api/admin/users")
                    .header("Authorization", "Bearer " + adminToken)
                    .param("search", "nonexistent"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.users.length()").value(0))
                    .andExpect(jsonPath("$.totalElements").value(0));
        }
    }

    @Nested
    @DisplayName("PUT /api/admin/users/{id}/role")
    class UpdateUserRoleEndpoint {

        @Test
        @DisplayName("should return 200 OK when admin updates user role")
        void shouldUpdateUserRoleSuccessfully() throws Exception {
            UpdateRoleRequest request = new UpdateRoleRequest(UserRole.PROMOTER);

            mockMvc.perform(put("/api/admin/users/{id}/role", volunteerUser.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(volunteerUser.getId()))
                    .andExpect(jsonPath("$.role").value("PROMOTER"));

            // Verify database update
            User updatedUser = userRepository.findById(volunteerUser.getId()).orElseThrow();
            assertThat(updatedUser.getRole()).isEqualTo(UserRole.PROMOTER);
        }

        @Test
        @DisplayName("should return 403 FORBIDDEN for non-admin user")
        void shouldReturnForbiddenForNonAdmin() throws Exception {
            UpdateRoleRequest request = new UpdateRoleRequest(UserRole.ADMIN);

            mockMvc.perform(put("/api/admin/users/{id}/role", promoterUser.getId())
                    .header("Authorization", "Bearer " + volunteerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST when admin tries to change own role")
        void shouldReturnBadRequestForSelfRoleChange() throws Exception {
            UpdateRoleRequest request = new UpdateRoleRequest(UserRole.VOLUNTEER);

            mockMvc.perform(put("/api/admin/users/{id}/role", adminUser.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("You cannot change your own role to prevent lockout"));
        }

        @Test
        @DisplayName("should return 404 NOT FOUND when user does not exist")
        void shouldReturnNotFoundForNonExistentUser() throws Exception {
            UpdateRoleRequest request = new UpdateRoleRequest(UserRole.ADMIN);

            mockMvc.perform(put("/api/admin/users/{id}/role", 9999L)
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message").value("User not found with id: 9999"));
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST when role is null")
        void shouldReturnBadRequestForNullRole() throws Exception {
            mockMvc.perform(put("/api/admin/users/{id}/role", volunteerUser.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"role\": null}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should allow promoting user to ADMIN")
        void shouldAllowPromotingToAdmin() throws Exception {
            UpdateRoleRequest request = new UpdateRoleRequest(UserRole.ADMIN);

            mockMvc.perform(put("/api/admin/users/{id}/role", volunteerUser.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.role").value("ADMIN"));
        }

        @Test
        @DisplayName("should allow demoting another admin")
        void shouldAllowDemotingAnotherAdmin() throws Exception {
            // Create another admin
            User anotherAdmin = User.builder()
                    .email("admin2@ua.pt")
                    .password(passwordEncoder.encode("Admin2Pass123"))
                    .name("Another Admin")
                    .role(UserRole.ADMIN)
                    .points(0)
                    .build();
            anotherAdmin = userRepository.save(anotherAdmin);

            UpdateRoleRequest request = new UpdateRoleRequest(UserRole.VOLUNTEER);

            mockMvc.perform(put("/api/admin/users/{id}/role", anotherAdmin.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.role").value("VOLUNTEER"));
        }
    }
}

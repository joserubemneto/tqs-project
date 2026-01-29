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
import ua.tqs.dto.CreateRewardRequest;
import ua.tqs.dto.UpdateRewardRequest;
import ua.tqs.model.Partner;
import ua.tqs.model.Reward;
import ua.tqs.model.User;
import ua.tqs.model.enums.RewardType;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.PartnerRepository;
import ua.tqs.repository.RedemptionRepository;
import ua.tqs.repository.RewardRepository;
import ua.tqs.repository.UserRepository;
import ua.tqs.service.JwtService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for RewardController.
 * 
 * Test Strategy:
 * - Uses @SpringBootTest with full application context
 * - Tests reward CRUD operations with authentication
 * - Uses H2 in-memory database (test profile)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class RewardControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RewardRepository rewardRepository;

    @Autowired
    private PartnerRepository partnerRepository;

    @Autowired
    private RedemptionRepository redemptionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private ObjectMapper objectMapper;

    private User adminUser;
    private User volunteerUser;
    private String adminToken;
    private String volunteerToken;
    private Partner partner;
    private Reward activeReward;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        redemptionRepository.deleteAll();
        rewardRepository.deleteAll();
        partnerRepository.deleteAll();
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

        // Create partner
        partner = Partner.builder()
                .name("UA Cafeteria")
                .description("University cafeteria partner")
                .website("https://cafeteria.ua.pt")
                .active(true)
                .build();
        partner = partnerRepository.save(partner);

        // Create active reward
        activeReward = Reward.builder()
                .title("Free Coffee")
                .description("Get a free coffee at UA Cafeteria")
                .pointsCost(50)
                .type(RewardType.PARTNER_VOUCHER)
                .partner(partner)
                .quantity(100)
                .active(true)
                .build();
        activeReward = rewardRepository.save(activeReward);
    }

    @Nested
    @DisplayName("GET /api/rewards (Public)")
    class GetAvailableRewardsEndpoint {

        @Test
        @DisplayName("should return available rewards without authentication")
        void shouldReturnAvailableRewardsWithoutAuth() throws Exception {
            mockMvc.perform(get("/api/rewards"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$[0].title").value("Free Coffee"))
                    .andExpect(jsonPath("$[0].pointsCost").value(50))
                    .andExpect(jsonPath("$[0].partner.name").value("UA Cafeteria"));
        }

        @Test
        @DisplayName("should not return inactive rewards")
        void shouldNotReturnInactiveRewards() throws Exception {
            // Create inactive reward
            Reward inactiveReward = Reward.builder()
                    .title("Inactive Reward")
                    .description("This reward is inactive")
                    .pointsCost(25)
                    .type(RewardType.MERCHANDISE)
                    .active(false)
                    .build();
            rewardRepository.save(inactiveReward);

            mockMvc.perform(get("/api/rewards"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].title").value("Free Coffee"));
        }
    }

    @Nested
    @DisplayName("GET /api/rewards/{id} (Public)")
    class GetRewardByIdEndpoint {

        @Test
        @DisplayName("should return reward by ID without authentication")
        void shouldReturnRewardByIdWithoutAuth() throws Exception {
            mockMvc.perform(get("/api/rewards/{id}", activeReward.getId()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(activeReward.getId()))
                    .andExpect(jsonPath("$.title").value("Free Coffee"))
                    .andExpect(jsonPath("$.remainingQuantity").value(100));
        }

        @Test
        @DisplayName("should return 404 when reward not found")
        void shouldReturn404WhenRewardNotFound() throws Exception {
            mockMvc.perform(get("/api/rewards/999"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("POST /api/admin/rewards (Admin)")
    class CreateRewardEndpoint {

        @Test
        @DisplayName("should return 201 CREATED when admin creates reward")
        void shouldCreateRewardAsAdmin() throws Exception {
            CreateRewardRequest request = CreateRewardRequest.builder()
                    .title("New Reward")
                    .description("A brand new reward")
                    .pointsCost(75)
                    .type(RewardType.CERTIFICATE)
                    .build();

            mockMvc.perform(post("/api/admin/rewards")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").exists())
                    .andExpect(jsonPath("$.title").value("New Reward"))
                    .andExpect(jsonPath("$.pointsCost").value(75))
                    .andExpect(jsonPath("$.type").value("CERTIFICATE"))
                    .andExpect(jsonPath("$.active").value(true));

            assertThat(rewardRepository.findAll()).hasSize(2);
        }

        @Test
        @DisplayName("should return 201 CREATED with partner association")
        void shouldCreateRewardWithPartner() throws Exception {
            CreateRewardRequest request = CreateRewardRequest.builder()
                    .title("Partner Reward")
                    .description("Reward from partner")
                    .pointsCost(100)
                    .type(RewardType.PARTNER_VOUCHER)
                    .partnerId(partner.getId())
                    .quantity(50)
                    .build();

            mockMvc.perform(post("/api/admin/rewards")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.partner.name").value("UA Cafeteria"))
                    .andExpect(jsonPath("$.quantity").value(50));
        }

        @Test
        @DisplayName("should return 403 FORBIDDEN when volunteer tries to create")
        void shouldForbidVolunteerFromCreating() throws Exception {
            CreateRewardRequest request = CreateRewardRequest.builder()
                    .title("Forbidden Reward")
                    .description("This should not be created")
                    .pointsCost(50)
                    .type(RewardType.OTHER)
                    .build();

            mockMvc.perform(post("/api/admin/rewards")
                    .header("Authorization", "Bearer " + volunteerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 401 UNAUTHORIZED without token")
        void shouldRequireAuthentication() throws Exception {
            CreateRewardRequest request = CreateRewardRequest.builder()
                    .title("Unauthorized Reward")
                    .description("This should fail")
                    .pointsCost(50)
                    .type(RewardType.OTHER)
                    .build();

            mockMvc.perform(post("/api/admin/rewards")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST for invalid data")
        void shouldValidateRequestData() throws Exception {
            CreateRewardRequest invalidRequest = CreateRewardRequest.builder()
                    .title("") // Invalid: blank title
                    .description("Valid description")
                    .pointsCost(0) // Invalid: must be at least 1
                    .type(RewardType.OTHER)
                    .build();

            mockMvc.perform(post("/api/admin/rewards")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(invalidRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 404 NOT FOUND for invalid partner ID")
        void shouldReturn404ForInvalidPartner() throws Exception {
            CreateRewardRequest request = CreateRewardRequest.builder()
                    .title("Invalid Partner Reward")
                    .description("Partner does not exist")
                    .pointsCost(50)
                    .type(RewardType.PARTNER_VOUCHER)
                    .partnerId(999L)
                    .build();

            mockMvc.perform(post("/api/admin/rewards")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/admin/rewards (Admin)")
    class GetAllRewardsEndpoint {

        @Test
        @DisplayName("should return paginated rewards for admin")
        void shouldReturnPaginatedRewardsForAdmin() throws Exception {
            mockMvc.perform(get("/api/admin/rewards")
                    .header("Authorization", "Bearer " + adminToken)
                    .param("page", "0")
                    .param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    .andExpect(jsonPath("$.content[0].title").value("Free Coffee"))
                    .andExpect(jsonPath("$.totalElements").value(1));
        }

        @Test
        @DisplayName("should return 403 FORBIDDEN for non-admin")
        void shouldForbidNonAdmin() throws Exception {
            mockMvc.perform(get("/api/admin/rewards")
                    .header("Authorization", "Bearer " + volunteerToken))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("PUT /api/admin/rewards/{id} (Admin)")
    class UpdateRewardEndpoint {

        @Test
        @DisplayName("should update reward successfully")
        void shouldUpdateReward() throws Exception {
            UpdateRewardRequest request = UpdateRewardRequest.builder()
                    .title("Updated Coffee Reward")
                    .pointsCost(75)
                    .build();

            mockMvc.perform(put("/api/admin/rewards/{id}", activeReward.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.title").value("Updated Coffee Reward"))
                    .andExpect(jsonPath("$.pointsCost").value(75));
        }

        @Test
        @DisplayName("should deactivate reward via update")
        void shouldDeactivateRewardViaUpdate() throws Exception {
            UpdateRewardRequest request = UpdateRewardRequest.builder()
                    .active(false)
                    .build();

            mockMvc.perform(put("/api/admin/rewards/{id}", activeReward.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.active").value(false));
        }

        @Test
        @DisplayName("should return 404 for non-existent reward")
        void shouldReturn404ForNonExistentReward() throws Exception {
            UpdateRewardRequest request = UpdateRewardRequest.builder()
                    .title("Updated Title")
                    .build();

            mockMvc.perform(put("/api/admin/rewards/999")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/admin/rewards/{id} (Admin)")
    class DeleteRewardEndpoint {

        @Test
        @DisplayName("should deactivate reward (soft delete)")
        void shouldDeactivateReward() throws Exception {
            mockMvc.perform(delete("/api/admin/rewards/{id}", activeReward.getId())
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNoContent());

            Reward deactivatedReward = rewardRepository.findById(activeReward.getId()).orElseThrow();
            assertThat(deactivatedReward.getActive()).isFalse();
        }

        @Test
        @DisplayName("should return 404 for non-existent reward")
        void shouldReturn404ForNonExistentReward() throws Exception {
            mockMvc.perform(delete("/api/admin/rewards/999")
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should return 403 FORBIDDEN for non-admin")
        void shouldForbidNonAdmin() throws Exception {
            mockMvc.perform(delete("/api/admin/rewards/{id}", activeReward.getId())
                    .header("Authorization", "Bearer " + volunteerToken))
                    .andExpect(status().isForbidden());
        }
    }
}

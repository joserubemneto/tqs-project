package ua.tqs.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.model.Partner;
import ua.tqs.model.User;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.PartnerRepository;
import ua.tqs.repository.RewardRepository;
import ua.tqs.repository.UserRepository;
import ua.tqs.service.JwtService;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for PartnerController.
 * 
 * Test Strategy:
 * - Uses @SpringBootTest with full application context
 * - Tests partner retrieval with authentication and authorization
 * - Uses H2 in-memory database (test profile)
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PartnerControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PartnerRepository partnerRepository;

    @Autowired
    private RewardRepository rewardRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User adminUser;
    private User volunteerUser;
    private User promoterUser;
    private String adminToken;
    private String volunteerToken;
    private String promoterToken;
    private Partner activePartner1;
    private Partner activePartner2;
    private Partner inactivePartner;

    @BeforeEach
    void setUp() {
        // Clean up in correct order to respect foreign key constraints
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

        // Create active partners
        activePartner1 = Partner.builder()
                .name("UA Cafeteria")
                .description("University cafeteria partner")
                .logoUrl("https://example.com/logo1.png")
                .website("https://cafeteria.ua.pt")
                .active(true)
                .build();
        activePartner1 = partnerRepository.save(activePartner1);

        activePartner2 = Partner.builder()
                .name("Campus Bookstore")
                .description("University bookstore")
                .logoUrl("https://example.com/logo2.png")
                .website("https://bookstore.ua.pt")
                .active(true)
                .build();
        activePartner2 = partnerRepository.save(activePartner2);

        // Create inactive partner
        inactivePartner = Partner.builder()
                .name("Inactive Partner")
                .description("This partner is no longer active")
                .active(false)
                .build();
        inactivePartner = partnerRepository.save(inactivePartner);
    }

    @Nested
    @DisplayName("GET /api/admin/partners")
    class GetActivePartnersEndpoint {

        @Test
        @DisplayName("should return active partners when authenticated as admin")
        void shouldReturnActivePartnersWhenAdmin() throws Exception {
            mockMvc.perform(get("/api/admin/partners")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$", hasSize(2)))
                    .andExpect(jsonPath("$[*].name", containsInAnyOrder("UA Cafeteria", "Campus Bookstore")));
        }

        @Test
        @DisplayName("should return partner details correctly")
        void shouldReturnPartnerDetailsCorrectly() throws Exception {
            mockMvc.perform(get("/api/admin/partners")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[?(@.name == 'UA Cafeteria')].description", 
                            hasItem("University cafeteria partner")))
                    .andExpect(jsonPath("$[?(@.name == 'UA Cafeteria')].website", 
                            hasItem("https://cafeteria.ua.pt")))
                    .andExpect(jsonPath("$[?(@.name == 'UA Cafeteria')].logoUrl", 
                            hasItem("https://example.com/logo1.png")))
                    .andExpect(jsonPath("$[?(@.name == 'UA Cafeteria')].active", 
                            hasItem(true)));
        }

        @Test
        @DisplayName("should not return inactive partners")
        void shouldNotReturnInactivePartners() throws Exception {
            mockMvc.perform(get("/api/admin/partners")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[*].name", not(hasItem("Inactive Partner"))));
        }

        @Test
        @DisplayName("should return 403 when not authenticated")
        void shouldReturn403WhenNotAuthenticated() throws Exception {
            mockMvc.perform(get("/api/admin/partners"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 403 when authenticated as volunteer")
        void shouldReturn403WhenVolunteer() throws Exception {
            mockMvc.perform(get("/api/admin/partners")
                            .header("Authorization", "Bearer " + volunteerToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 403 when authenticated as promoter")
        void shouldReturn403WhenPromoter() throws Exception {
            mockMvc.perform(get("/api/admin/partners")
                            .header("Authorization", "Bearer " + promoterToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return 403 with invalid token")
        void shouldReturn403WithInvalidToken() throws Exception {
            mockMvc.perform(get("/api/admin/partners")
                            .header("Authorization", "Bearer invalid-token"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should return empty list when no active partners exist")
        void shouldReturnEmptyListWhenNoActivePartners() throws Exception {
            // Delete all partners
            rewardRepository.deleteAll();
            partnerRepository.deleteAll();

            mockMvc.perform(get("/api/admin/partners")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$", hasSize(0)));
        }

        @Test
        @DisplayName("should return partner with null optional fields")
        void shouldReturnPartnerWithNullOptionalFields() throws Exception {
            // Create partner with minimal data
            Partner minimalPartner = Partner.builder()
                    .name("Minimal Partner")
                    .active(true)
                    .build();
            partnerRepository.save(minimalPartner);

            mockMvc.perform(get("/api/admin/partners")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[?(@.name == 'Minimal Partner')].name", hasItem("Minimal Partner")))
                    .andExpect(jsonPath("$[?(@.name == 'Minimal Partner')].active", hasItem(true)));
        }

        @Test
        @DisplayName("should include createdAt timestamp")
        void shouldIncludeCreatedAtTimestamp() throws Exception {
            mockMvc.perform(get("/api/admin/partners")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].createdAt").exists());
        }

        @Test
        @DisplayName("should include partner id")
        void shouldIncludePartnerId() throws Exception {
            mockMvc.perform(get("/api/admin/partners")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").exists())
                    .andExpect(jsonPath("$[0].id").isNumber());
        }
    }
}

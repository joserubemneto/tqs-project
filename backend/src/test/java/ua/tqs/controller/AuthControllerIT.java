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
import ua.tqs.dto.LoginRequest;
import ua.tqs.dto.RegisterRequest;
import ua.tqs.model.User;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.UserRepository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for AuthController.
 * 
 * Test Strategy:
 * - Uses @SpringBootTest with full application context
 * - Validates HTTP response codes, headers, and body
 * - Uses H2 in-memory database (test profile)
 * - Tests full registration flow including database persistence
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Nested
    @DisplayName("POST /api/auth/register")
    class RegisterEndpoint {

        @Test
        @DisplayName("should return 201 CREATED for valid registration")
        void shouldReturnCreatedForValidRegistration() throws Exception {
            RegisterRequest request = RegisterRequest.builder()
                    .email("newuser@ua.pt")
                    .password("SecurePass123")
                    .name("New User")
                    .build();

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("should return JSON content type")
        void shouldReturnJsonContentType() throws Exception {
            RegisterRequest request = RegisterRequest.builder()
                    .email("newuser@ua.pt")
                    .password("SecurePass123")
                    .name("New User")
                    .build();

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
        }

        @Test
        @DisplayName("should return user details and token in response")
        void shouldReturnUserDetailsAndToken() throws Exception {
            RegisterRequest request = RegisterRequest.builder()
                    .email("newuser@ua.pt")
                    .password("SecurePass123")
                    .name("New User")
                    .build();

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.email").value("newuser@ua.pt"))
                    .andExpect(jsonPath("$.name").value("New User"))
                    .andExpect(jsonPath("$.role").value("VOLUNTEER"))
                    .andExpect(jsonPath("$.token").isNotEmpty())
                    .andExpect(jsonPath("$.id").isNotEmpty());
        }

        @Test
        @DisplayName("should persist user to database")
        void shouldPersistUserToDatabase() throws Exception {
            RegisterRequest request = RegisterRequest.builder()
                    .email("persisted@ua.pt")
                    .password("SecurePass123")
                    .name("Persisted User")
                    .build();

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated());

            assertThat(userRepository.existsByEmail("persisted@ua.pt")).isTrue();
            
            User savedUser = userRepository.findByEmail("persisted@ua.pt").orElseThrow();
            assertThat(savedUser.getName()).isEqualTo("Persisted User");
            assertThat(savedUser.getRole()).isEqualTo(UserRole.VOLUNTEER);
        }

        @Test
        @DisplayName("should encode password before storing")
        void shouldEncodePassword() throws Exception {
            RegisterRequest request = RegisterRequest.builder()
                    .email("encoded@ua.pt")
                    .password("SecurePass123")
                    .name("Encoded User")
                    .build();

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated());

            User savedUser = userRepository.findByEmail("encoded@ua.pt").orElseThrow();
            assertThat(savedUser.getPassword()).isNotEqualTo("SecurePass123");
            assertThat(passwordEncoder.matches("SecurePass123", savedUser.getPassword())).isTrue();
        }

        @Test
        @DisplayName("should return 409 CONFLICT when email already exists")
        void shouldReturnConflictWhenEmailExists() throws Exception {
            // First, create a user
            User existingUser = User.builder()
                    .email("existing@ua.pt")
                    .password(passwordEncoder.encode("password"))
                    .name("Existing User")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();
            userRepository.save(existingUser);

            // Try to register with same email
            RegisterRequest request = RegisterRequest.builder()
                    .email("existing@ua.pt")
                    .password("SecurePass123")
                    .name("New User")
                    .build();

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value("Email already registered"));
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST for invalid email format")
        void shouldReturnBadRequestForInvalidEmail() throws Exception {
            RegisterRequest request = RegisterRequest.builder()
                    .email("invalid-email")
                    .password("SecurePass123")
                    .name("Test User")
                    .build();

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Invalid email format"));
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST for missing email")
        void shouldReturnBadRequestForMissingEmail() throws Exception {
            RegisterRequest request = RegisterRequest.builder()
                    .password("SecurePass123")
                    .name("Test User")
                    .build();

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST for short password")
        void shouldReturnBadRequestForShortPassword() throws Exception {
            RegisterRequest request = RegisterRequest.builder()
                    .email("test@ua.pt")
                    .password("short")
                    .name("Test User")
                    .build();

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Password must be at least 8 characters"));
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST for missing name")
        void shouldReturnBadRequestForMissingName() throws Exception {
            RegisterRequest request = RegisterRequest.builder()
                    .email("test@ua.pt")
                    .password("SecurePass123")
                    .build();

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should allow registration with PROMOTER role")
        void shouldAllowPromoterRole() throws Exception {
            RegisterRequest request = RegisterRequest.builder()
                    .email("promoter@ua.pt")
                    .password("SecurePass123")
                    .name("Promoter User")
                    .role(UserRole.PROMOTER)
                    .build();

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.role").value("PROMOTER"));
        }

        @Test
        @DisplayName("should be accessible without authentication")
        void shouldBePublic() throws Exception {
            RegisterRequest request = RegisterRequest.builder()
                    .email("public@ua.pt")
                    .password("SecurePass123")
                    .name("Public User")
                    .build();

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/login")
    class LoginEndpoint {

        private void createTestUser(String email, String password) {
            User user = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .name("Test User")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();
            userRepository.save(user);
        }

        @Test
        @DisplayName("should return 200 OK for valid credentials")
        void shouldReturnOkForValidCredentials() throws Exception {
            createTestUser("login@ua.pt", "SecurePass123");

            LoginRequest request = LoginRequest.builder()
                    .email("login@ua.pt")
                    .password("SecurePass123")
                    .build();

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("should return JSON content type")
        void shouldReturnJsonContentType() throws Exception {
            createTestUser("login@ua.pt", "SecurePass123");

            LoginRequest request = LoginRequest.builder()
                    .email("login@ua.pt")
                    .password("SecurePass123")
                    .build();

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
        }

        @Test
        @DisplayName("should return user details and token in response")
        void shouldReturnUserDetailsAndToken() throws Exception {
            createTestUser("login@ua.pt", "SecurePass123");

            LoginRequest request = LoginRequest.builder()
                    .email("login@ua.pt")
                    .password("SecurePass123")
                    .build();

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.email").value("login@ua.pt"))
                    .andExpect(jsonPath("$.name").value("Test User"))
                    .andExpect(jsonPath("$.role").value("VOLUNTEER"))
                    .andExpect(jsonPath("$.token").isNotEmpty())
                    .andExpect(jsonPath("$.id").isNotEmpty());
        }

        @Test
        @DisplayName("should return 401 UNAUTHORIZED for wrong password")
        void shouldReturnUnauthorizedForWrongPassword() throws Exception {
            createTestUser("login@ua.pt", "SecurePass123");

            LoginRequest request = LoginRequest.builder()
                    .email("login@ua.pt")
                    .password("WrongPassword")
                    .build();

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Invalid credentials"));
        }

        @Test
        @DisplayName("should return 401 UNAUTHORIZED for non-existent email")
        void shouldReturnUnauthorizedForNonExistentEmail() throws Exception {
            LoginRequest request = LoginRequest.builder()
                    .email("nonexistent@ua.pt")
                    .password("SecurePass123")
                    .build();

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Invalid credentials"));
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST for invalid email format")
        void shouldReturnBadRequestForInvalidEmail() throws Exception {
            LoginRequest request = LoginRequest.builder()
                    .email("invalid-email")
                    .password("SecurePass123")
                    .build();

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Invalid email format"));
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST for missing email")
        void shouldReturnBadRequestForMissingEmail() throws Exception {
            LoginRequest request = LoginRequest.builder()
                    .password("SecurePass123")
                    .build();

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST for missing password")
        void shouldReturnBadRequestForMissingPassword() throws Exception {
            LoginRequest request = LoginRequest.builder()
                    .email("test@ua.pt")
                    .build();

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should be accessible without authentication")
        void shouldBePublic() throws Exception {
            createTestUser("login@ua.pt", "SecurePass123");

            LoginRequest request = LoginRequest.builder()
                    .email("login@ua.pt")
                    .password("SecurePass123")
                    .build();

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }
    }
}

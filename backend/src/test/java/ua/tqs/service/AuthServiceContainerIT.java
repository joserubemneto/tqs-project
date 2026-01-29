package ua.tqs.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.config.PostgresTestContainerConfig;
import ua.tqs.dto.AuthResponse;
import ua.tqs.dto.LoginRequest;
import ua.tqs.dto.RegisterRequest;
import ua.tqs.exception.EmailAlreadyExistsException;
import ua.tqs.exception.InvalidCredentialsException;
import ua.tqs.model.User;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.UserRepository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for AuthService using Testcontainers with PostgreSQL.
 * 
 * These tests verify the complete authentication flow with:
 * - Real PostgreSQL database
 * - Real password encoding
 * - Real JWT token generation
 * - Real database constraints
 */
@SpringBootTest
@Transactional
class AuthServiceContainerIT extends PostgresTestContainerConfig {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Nested
    @DisplayName("register() with PostgreSQL")
    class RegisterMethod {

        @Test
        @DisplayName("should register user and persist to PostgreSQL")
        void shouldRegisterUserAndPersist() {
            RegisterRequest request = RegisterRequest.builder()
                    .email("newuser@ua.pt")
                    .password("SecurePass123")
                    .name("New User")
                    .build();

            AuthResponse response = authService.register(request);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isNotNull();
            assertThat(response.getEmail()).isEqualTo("newuser@ua.pt");
            assertThat(response.getName()).isEqualTo("New User");
            assertThat(response.getRole()).isEqualTo(UserRole.VOLUNTEER);
            assertThat(response.getToken()).isNotBlank();

            // Verify user is persisted in PostgreSQL
            User savedUser = userRepository.findByEmail("newuser@ua.pt").orElseThrow();
            assertThat(savedUser.getEmail()).isEqualTo("newuser@ua.pt");
            assertThat(savedUser.getCreatedAt()).isNotNull();
        }

        @Test
        @DisplayName("should encode password before storing in PostgreSQL")
        void shouldEncodePasswordBeforeStoring() {
            String rawPassword = "SecurePass123";
            RegisterRequest request = RegisterRequest.builder()
                    .email("encoded@ua.pt")
                    .password(rawPassword)
                    .name("Encoded User")
                    .build();

            authService.register(request);

            User savedUser = userRepository.findByEmail("encoded@ua.pt").orElseThrow();
            assertThat(savedUser.getPassword()).isNotEqualTo(rawPassword);
            assertThat(passwordEncoder.matches(rawPassword, savedUser.getPassword())).isTrue();
        }

        @Test
        @DisplayName("should generate valid JWT token")
        void shouldGenerateValidJwtToken() {
            RegisterRequest request = RegisterRequest.builder()
                    .email("jwt@ua.pt")
                    .password("SecurePass123")
                    .name("JWT User")
                    .build();

            AuthResponse response = authService.register(request);

            // Verify token is valid JWT (has 3 parts)
            assertThat(response.getToken().split("\\.")).hasSize(3);

            // Verify token contains correct email
            String email = jwtService.extractEmail(response.getToken());
            assertThat(email).isEqualTo("jwt@ua.pt");
        }

        @Test
        @DisplayName("should throw exception for duplicate email (PostgreSQL constraint)")
        void shouldThrowExceptionForDuplicateEmail() {
            RegisterRequest request1 = RegisterRequest.builder()
                    .email("duplicate@ua.pt")
                    .password("SecurePass123")
                    .name("First User")
                    .build();

            RegisterRequest request2 = RegisterRequest.builder()
                    .email("duplicate@ua.pt")
                    .password("SecurePass123")
                    .name("Second User")
                    .build();

            authService.register(request1);

            assertThatThrownBy(() -> authService.register(request2))
                    .isInstanceOf(EmailAlreadyExistsException.class)
                    .hasMessage("Email already registered");
        }

        @Test
        @DisplayName("should register with PROMOTER role")
        void shouldRegisterWithPromoterRole() {
            RegisterRequest request = RegisterRequest.builder()
                    .email("promoter@ua.pt")
                    .password("SecurePass123")
                    .name("Promoter User")
                    .role(UserRole.PROMOTER)
                    .build();

            AuthResponse response = authService.register(request);

            assertThat(response.getRole()).isEqualTo(UserRole.PROMOTER);

            User savedUser = userRepository.findByEmail("promoter@ua.pt").orElseThrow();
            assertThat(savedUser.getRole()).isEqualTo(UserRole.PROMOTER);
        }

        @Test
        @DisplayName("should default role to VOLUNTEER when not specified")
        void shouldDefaultToVolunteerRole() {
            RegisterRequest request = RegisterRequest.builder()
                    .email("default@ua.pt")
                    .password("SecurePass123")
                    .name("Default Role User")
                    .build();

            AuthResponse response = authService.register(request);

            assertThat(response.getRole()).isEqualTo(UserRole.VOLUNTEER);
        }

        @Test
        @DisplayName("should initialize points to zero")
        void shouldInitializePointsToZero() {
            RegisterRequest request = RegisterRequest.builder()
                    .email("points@ua.pt")
                    .password("SecurePass123")
                    .name("Points User")
                    .build();

            authService.register(request);

            User savedUser = userRepository.findByEmail("points@ua.pt").orElseThrow();
            assertThat(savedUser.getPoints()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("login() with PostgreSQL")
    class LoginMethod {

        @BeforeEach
        void setUpUser() {
            // Create a user for login tests
            User user = User.builder()
                    .email("login@ua.pt")
                    .password(passwordEncoder.encode("SecurePass123"))
                    .name("Login User")
                    .role(UserRole.VOLUNTEER)
                    .points(50)
                    .build();
            userRepository.save(user);
        }

        @Test
        @DisplayName("should login with valid credentials")
        void shouldLoginWithValidCredentials() {
            LoginRequest request = LoginRequest.builder()
                    .email("login@ua.pt")
                    .password("SecurePass123")
                    .build();

            AuthResponse response = authService.login(request);

            assertThat(response).isNotNull();
            assertThat(response.getEmail()).isEqualTo("login@ua.pt");
            assertThat(response.getName()).isEqualTo("Login User");
            assertThat(response.getRole()).isEqualTo(UserRole.VOLUNTEER);
            assertThat(response.getToken()).isNotBlank();
        }

        @Test
        @DisplayName("should return valid JWT token on login")
        void shouldReturnValidJwtTokenOnLogin() {
            LoginRequest request = LoginRequest.builder()
                    .email("login@ua.pt")
                    .password("SecurePass123")
                    .build();

            AuthResponse response = authService.login(request);

            // Verify token structure
            assertThat(response.getToken().split("\\.")).hasSize(3);

            // Verify token claims
            String email = jwtService.extractEmail(response.getToken());
            assertThat(email).isEqualTo("login@ua.pt");
        }

        @Test
        @DisplayName("should throw exception for wrong password")
        void shouldThrowExceptionForWrongPassword() {
            LoginRequest request = LoginRequest.builder()
                    .email("login@ua.pt")
                    .password("WrongPassword")
                    .build();

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(InvalidCredentialsException.class)
                    .hasMessage("Invalid credentials");
        }

        @Test
        @DisplayName("should throw exception for non-existent email")
        void shouldThrowExceptionForNonExistentEmail() {
            LoginRequest request = LoginRequest.builder()
                    .email("nonexistent@ua.pt")
                    .password("SecurePass123")
                    .build();

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(InvalidCredentialsException.class)
                    .hasMessage("Invalid credentials");
        }

        @Test
        @DisplayName("should verify password using BCrypt")
        void shouldVerifyPasswordUsingBCrypt() {
            // Register a new user
            RegisterRequest registerRequest = RegisterRequest.builder()
                    .email("bcrypt@ua.pt")
                    .password("SecurePass123")
                    .name("BCrypt User")
                    .build();
            authService.register(registerRequest);

            // Login should verify the BCrypt encoded password
            LoginRequest loginRequest = LoginRequest.builder()
                    .email("bcrypt@ua.pt")
                    .password("SecurePass123")
                    .build();

            AuthResponse response = authService.login(loginRequest);
            assertThat(response).isNotNull();
            assertThat(response.getToken()).isNotBlank();
        }
    }

    @Nested
    @DisplayName("Full Authentication Flow")
    class FullAuthenticationFlow {

        @Test
        @DisplayName("should complete register then login flow")
        void shouldCompleteRegisterThenLoginFlow() {
            // Register
            RegisterRequest registerRequest = RegisterRequest.builder()
                    .email("flow@ua.pt")
                    .password("SecurePass123")
                    .name("Flow User")
                    .build();
            AuthResponse registerResponse = authService.register(registerRequest);

            assertThat(registerResponse.getToken()).isNotBlank();

            // Login with same credentials
            LoginRequest loginRequest = LoginRequest.builder()
                    .email("flow@ua.pt")
                    .password("SecurePass123")
                    .build();
            AuthResponse loginResponse = authService.login(loginRequest);

            assertThat(loginResponse.getId()).isEqualTo(registerResponse.getId());
            assertThat(loginResponse.getEmail()).isEqualTo(registerResponse.getEmail());
            assertThat(loginResponse.getToken()).isNotBlank();
            // Tokens should be different (generated at different times)
            assertThat(loginResponse.getToken()).isNotEqualTo(registerResponse.getToken());
        }

        @Test
        @DisplayName("should handle multiple users in PostgreSQL")
        void shouldHandleMultipleUsers() {
            // Register multiple users
            for (int i = 1; i <= 5; i++) {
                RegisterRequest request = RegisterRequest.builder()
                        .email("user" + i + "@ua.pt")
                        .password("SecurePass" + i)
                        .name("User " + i)
                        .build();
                authService.register(request);
            }

            // Verify all users can login
            for (int i = 1; i <= 5; i++) {
                LoginRequest loginRequest = LoginRequest.builder()
                        .email("user" + i + "@ua.pt")
                        .password("SecurePass" + i)
                        .build();
                AuthResponse response = authService.login(loginRequest);
                assertThat(response.getName()).isEqualTo("User " + i);
            }

            assertThat(userRepository.count()).isEqualTo(5);
        }
    }
}

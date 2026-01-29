package ua.tqs.api;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import ua.tqs.config.PostgresTestContainerConfig;
import ua.tqs.model.User;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.UserRepository;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * REST Assured API tests using Testcontainers with PostgreSQL.
 * 
 * These tests verify the complete HTTP API layer with:
 * - Real HTTP requests/responses
 * - Real PostgreSQL database
 * - Full Spring Security context
 * - Real JSON serialization/deserialization
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AuthApiContainerIT extends PostgresTestContainerConfig {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.basePath = "/api";
        userRepository.deleteAll();
    }

    @Nested
    @DisplayName("POST /api/auth/register")
    class RegisterEndpoint {

        @Test
        @DisplayName("should return 201 CREATED with user details and token")
        void shouldReturn201WithUserDetailsAndToken() {
            given()
                .contentType(ContentType.JSON)
                .body("""
                    {
                        "email": "newuser@ua.pt",
                        "password": "SecurePass123",
                        "name": "New User"
                    }
                    """)
            .when()
                .post("/auth/register")
            .then()
                .statusCode(201)
                .contentType(ContentType.JSON)
                .body("id", notNullValue())
                .body("email", equalTo("newuser@ua.pt"))
                .body("name", equalTo("New User"))
                .body("role", equalTo("VOLUNTEER"))
                .body("token", notNullValue())
                .body("token", matchesPattern("^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+$"));
        }

        @Test
        @DisplayName("should persist user to PostgreSQL")
        void shouldPersistUserToPostgres() {
            given()
                .contentType(ContentType.JSON)
                .body("""
                    {
                        "email": "persist@ua.pt",
                        "password": "SecurePass123",
                        "name": "Persist User"
                    }
                    """)
            .when()
                .post("/auth/register")
            .then()
                .statusCode(201);

            // Verify user is in PostgreSQL
            User user = userRepository.findByEmail("persist@ua.pt").orElseThrow();
            assert user.getName().equals("Persist User");
            assert passwordEncoder.matches("SecurePass123", user.getPassword());
        }

        @Test
        @DisplayName("should register with PROMOTER role")
        void shouldRegisterWithPromoterRole() {
            given()
                .contentType(ContentType.JSON)
                .body("""
                    {
                        "email": "promoter@ua.pt",
                        "password": "SecurePass123",
                        "name": "Promoter User",
                        "role": "PROMOTER"
                    }
                    """)
            .when()
                .post("/auth/register")
            .then()
                .statusCode(201)
                .body("role", equalTo("PROMOTER"));
        }

        @Test
        @DisplayName("should return 409 CONFLICT for duplicate email")
        void shouldReturn409ForDuplicateEmail() {
            // First registration
            given()
                .contentType(ContentType.JSON)
                .body("""
                    {
                        "email": "duplicate@ua.pt",
                        "password": "SecurePass123",
                        "name": "First User"
                    }
                    """)
            .when()
                .post("/auth/register")
            .then()
                .statusCode(201);

            // Second registration with same email
            given()
                .contentType(ContentType.JSON)
                .body("""
                    {
                        "email": "duplicate@ua.pt",
                        "password": "SecurePass123",
                        "name": "Second User"
                    }
                    """)
            .when()
                .post("/auth/register")
            .then()
                .statusCode(409)
                .body("message", equalTo("Email already registered"));
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST for invalid email format")
        void shouldReturn400ForInvalidEmail() {
            given()
                .contentType(ContentType.JSON)
                .body("""
                    {
                        "email": "invalid-email",
                        "password": "SecurePass123",
                        "name": "Test User"
                    }
                    """)
            .when()
                .post("/auth/register")
            .then()
                .statusCode(400)
                .body("message", equalTo("Invalid email format"));
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST for missing email")
        void shouldReturn400ForMissingEmail() {
            given()
                .contentType(ContentType.JSON)
                .body("""
                    {
                        "password": "SecurePass123",
                        "name": "Test User"
                    }
                    """)
            .when()
                .post("/auth/register")
            .then()
                .statusCode(400);
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST for short password")
        void shouldReturn400ForShortPassword() {
            given()
                .contentType(ContentType.JSON)
                .body("""
                    {
                        "email": "test@ua.pt",
                        "password": "short",
                        "name": "Test User"
                    }
                    """)
            .when()
                .post("/auth/register")
            .then()
                .statusCode(400)
                .body("message", equalTo("Password must be at least 8 characters"));
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST for missing name")
        void shouldReturn400ForMissingName() {
            given()
                .contentType(ContentType.JSON)
                .body("""
                    {
                        "email": "test@ua.pt",
                        "password": "SecurePass123"
                    }
                    """)
            .when()
                .post("/auth/register")
            .then()
                .statusCode(400);
        }
    }

    @Nested
    @DisplayName("POST /api/auth/login")
    class LoginEndpoint {

        @BeforeEach
        void createTestUser() {
            User user = User.builder()
                    .email("login@ua.pt")
                    .password(passwordEncoder.encode("SecurePass123"))
                    .name("Login User")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();
            userRepository.save(user);
        }

        @Test
        @DisplayName("should return 200 OK with user details and token")
        void shouldReturn200WithUserDetailsAndToken() {
            given()
                .contentType(ContentType.JSON)
                .body("""
                    {
                        "email": "login@ua.pt",
                        "password": "SecurePass123"
                    }
                    """)
            .when()
                .post("/auth/login")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("id", notNullValue())
                .body("email", equalTo("login@ua.pt"))
                .body("name", equalTo("Login User"))
                .body("role", equalTo("VOLUNTEER"))
                .body("token", notNullValue())
                .body("token", matchesPattern("^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+$"));
        }

        @Test
        @DisplayName("should return 401 UNAUTHORIZED for wrong password")
        void shouldReturn401ForWrongPassword() {
            given()
                .contentType(ContentType.JSON)
                .body("""
                    {
                        "email": "login@ua.pt",
                        "password": "WrongPassword"
                    }
                    """)
            .when()
                .post("/auth/login")
            .then()
                .statusCode(401)
                .body("message", equalTo("Invalid credentials"));
        }

        @Test
        @DisplayName("should return 401 UNAUTHORIZED for non-existent email")
        void shouldReturn401ForNonExistentEmail() {
            given()
                .contentType(ContentType.JSON)
                .body("""
                    {
                        "email": "nonexistent@ua.pt",
                        "password": "SecurePass123"
                    }
                    """)
            .when()
                .post("/auth/login")
            .then()
                .statusCode(401)
                .body("message", equalTo("Invalid credentials"));
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST for invalid email format")
        void shouldReturn400ForInvalidEmail() {
            given()
                .contentType(ContentType.JSON)
                .body("""
                    {
                        "email": "invalid-email",
                        "password": "SecurePass123"
                    }
                    """)
            .when()
                .post("/auth/login")
            .then()
                .statusCode(400)
                .body("message", equalTo("Invalid email format"));
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST for missing email")
        void shouldReturn400ForMissingEmail() {
            given()
                .contentType(ContentType.JSON)
                .body("""
                    {
                        "password": "SecurePass123"
                    }
                    """)
            .when()
                .post("/auth/login")
            .then()
                .statusCode(400);
        }

        @Test
        @DisplayName("should return 400 BAD REQUEST for missing password")
        void shouldReturn400ForMissingPassword() {
            given()
                .contentType(ContentType.JSON)
                .body("""
                    {
                        "email": "login@ua.pt"
                    }
                    """)
            .when()
                .post("/auth/login")
            .then()
                .statusCode(400);
        }
    }

    @Nested
    @DisplayName("Full Authentication Flow via API")
    class FullAuthenticationFlow {

        @Test
        @DisplayName("should complete register then login flow via API")
        void shouldCompleteRegisterThenLoginFlow() {
            // Register
            String token1 = given()
                .contentType(ContentType.JSON)
                .body("""
                    {
                        "email": "flow@ua.pt",
                        "password": "SecurePass123",
                        "name": "Flow User"
                    }
                    """)
            .when()
                .post("/auth/register")
            .then()
                .statusCode(201)
                .extract()
                .path("token");

            // Login
            String token2 = given()
                .contentType(ContentType.JSON)
                .body("""
                    {
                        "email": "flow@ua.pt",
                        "password": "SecurePass123"
                    }
                    """)
            .when()
                .post("/auth/login")
            .then()
                .statusCode(200)
                .body("email", equalTo("flow@ua.pt"))
                .extract()
                .path("token");

            // Both should be valid JWT tokens but different
            assert token1 != null && !token1.isEmpty();
            assert token2 != null && !token2.isEmpty();
            assert !token1.equals(token2);
        }

        @Test
        @DisplayName("should handle concurrent registrations")
        void shouldHandleConcurrentRegistrations() {
            // Register multiple users sequentially (simulating concurrent usage)
            for (int i = 1; i <= 5; i++) {
                final int index = i;
                given()
                    .contentType(ContentType.JSON)
                    .body(String.format("""
                        {
                            "email": "concurrent%d@ua.pt",
                            "password": "SecurePass123",
                            "name": "User %d"
                        }
                        """, index, index))
                .when()
                    .post("/auth/register")
                .then()
                    .statusCode(201);
            }

            // All users should be able to login
            for (int i = 1; i <= 5; i++) {
                final int index = i;
                given()
                    .contentType(ContentType.JSON)
                    .body(String.format("""
                        {
                            "email": "concurrent%d@ua.pt",
                            "password": "SecurePass123"
                        }
                        """, index))
                .when()
                    .post("/auth/login")
                .then()
                    .statusCode(200)
                    .body("name", equalTo("User " + index));
            }
        }
    }

    @Nested
    @DisplayName("API Security")
    class ApiSecurity {

        @Test
        @DisplayName("should allow unauthenticated access to register endpoint")
        void shouldAllowUnauthenticatedAccessToRegister() {
            given()
                .contentType(ContentType.JSON)
                .body("""
                    {
                        "email": "public@ua.pt",
                        "password": "SecurePass123",
                        "name": "Public User"
                    }
                    """)
            .when()
                .post("/auth/register")
            .then()
                .statusCode(201);
        }

        @Test
        @DisplayName("should allow unauthenticated access to login endpoint")
        void shouldAllowUnauthenticatedAccessToLogin() {
            // Create user first
            User user = User.builder()
                    .email("public-login@ua.pt")
                    .password(passwordEncoder.encode("SecurePass123"))
                    .name("Public Login User")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();
            userRepository.save(user);

            given()
                .contentType(ContentType.JSON)
                .body("""
                    {
                        "email": "public-login@ua.pt",
                        "password": "SecurePass123"
                    }
                    """)
            .when()
                .post("/auth/login")
            .then()
                .statusCode(200);
        }

        @Test
        @DisplayName("should allow access to health endpoint")
        void shouldAllowAccessToHealthEndpoint() {
            given()
            .when()
                .get("/health")
            .then()
                .statusCode(200);
        }
    }
}

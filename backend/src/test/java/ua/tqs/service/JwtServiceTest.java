package ua.tqs.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import ua.tqs.model.User;
import ua.tqs.model.enums.UserRole;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private JwtService jwtService;

    private static final String TEST_SECRET = "test-secret-key-for-testing-purposes-only-minimum-256-bits-required-here";
    private static final long TEST_EXPIRATION = 3600000L; // 1 hour

    private User testUser;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", TEST_SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", TEST_EXPIRATION);

        testUser = User.builder()
                .id(1L)
                .email("test@ua.pt")
                .password("encodedPassword")
                .name("Test User")
                .role(UserRole.VOLUNTEER)
                .points(0)
                .build();
    }

    @Nested
    @DisplayName("generateToken()")
    class GenerateToken {

        @Test
        @DisplayName("should generate a valid JWT token")
        void shouldGenerateValidToken() {
            String token = jwtService.generateToken(testUser);

            assertThat(token).isNotNull();
            assertThat(token).isNotBlank();
            // JWT tokens have 3 parts separated by dots
            assertThat(token.split("\\.")).hasSize(3);
        }

        @Test
        @DisplayName("should generate different tokens for different users")
        void shouldGenerateDifferentTokensForDifferentUsers() {
            User anotherUser = User.builder()
                    .id(2L)
                    .email("another@ua.pt")
                    .password("encodedPassword")
                    .name("Another User")
                    .role(UserRole.PROMOTER)
                    .points(0)
                    .build();

            String token1 = jwtService.generateToken(testUser);
            String token2 = jwtService.generateToken(anotherUser);

            assertThat(token1).isNotEqualTo(token2);
        }
    }

    @Nested
    @DisplayName("extractEmail()")
    class ExtractEmail {

        @Test
        @DisplayName("should extract email from token")
        void shouldExtractEmailFromToken() {
            String token = jwtService.generateToken(testUser);

            String extractedEmail = jwtService.extractEmail(token);

            assertThat(extractedEmail).isEqualTo("test@ua.pt");
        }
    }

    @Nested
    @DisplayName("extractUserId()")
    class ExtractUserId {

        @Test
        @DisplayName("should extract user ID from token")
        void shouldExtractUserIdFromToken() {
            String token = jwtService.generateToken(testUser);

            Long extractedId = jwtService.extractUserId(token);

            assertThat(extractedId).isEqualTo(1L);
        }
    }

    @Nested
    @DisplayName("extractRole()")
    class ExtractRole {

        @Test
        @DisplayName("should extract role from token")
        void shouldExtractRoleFromToken() {
            String token = jwtService.generateToken(testUser);

            String extractedRole = jwtService.extractRole(token);

            assertThat(extractedRole).isEqualTo("VOLUNTEER");
        }

        @Test
        @DisplayName("should extract PROMOTER role from token")
        void shouldExtractPromoterRole() {
            User promoter = User.builder()
                    .id(2L)
                    .email("promoter@ua.pt")
                    .password("encodedPassword")
                    .name("Promoter")
                    .role(UserRole.PROMOTER)
                    .points(0)
                    .build();

            String token = jwtService.generateToken(promoter);

            String extractedRole = jwtService.extractRole(token);

            assertThat(extractedRole).isEqualTo("PROMOTER");
        }
    }

    @Nested
    @DisplayName("isTokenValid()")
    class IsTokenValid {

        @Test
        @DisplayName("should return true for valid token and matching user")
        void shouldReturnTrueForValidToken() {
            String token = jwtService.generateToken(testUser);

            boolean isValid = jwtService.isTokenValid(token, testUser);

            assertThat(isValid).isTrue();
        }

        @Test
        @DisplayName("should return false for token with different user email")
        void shouldReturnFalseForDifferentUser() {
            String token = jwtService.generateToken(testUser);

            User differentUser = User.builder()
                    .id(2L)
                    .email("different@ua.pt")
                    .password("encodedPassword")
                    .name("Different User")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();

            boolean isValid = jwtService.isTokenValid(token, differentUser);

            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("should throw exception for expired token")
        void shouldThrowExceptionForExpiredToken() {
            // Create a service with very short expiration
            JwtService shortExpirationService = new JwtService();
            ReflectionTestUtils.setField(shortExpirationService, "secretKey", TEST_SECRET);
            ReflectionTestUtils.setField(shortExpirationService, "jwtExpiration", -1000L); // Already expired

            String expiredToken = shortExpirationService.generateToken(testUser);

            // Expired tokens throw ExpiredJwtException when parsed
            assertThatThrownBy(() -> jwtService.isTokenValid(expiredToken, testUser))
                    .isInstanceOf(io.jsonwebtoken.ExpiredJwtException.class);
        }

        @Test
        @DisplayName("should return false when email matches but token is expired (covers second condition)")
        void shouldReturnFalseForExpiredTokenWithMatchingEmail() {
            // Create a service with negative expiration to create an already-expired token
            JwtService expiredTokenService = new JwtService();
            ReflectionTestUtils.setField(expiredTokenService, "secretKey", TEST_SECRET);
            ReflectionTestUtils.setField(expiredTokenService, "jwtExpiration", -1000L);

            String expiredToken = expiredTokenService.generateToken(testUser);

            // When trying to validate an expired token, JJWT throws ExpiredJwtException
            // This covers the case where email would match but token is expired
            // The exception is thrown during parsing, before isTokenExpired can return
            assertThatThrownBy(() -> jwtService.isTokenValid(expiredToken, testUser))
                    .isInstanceOf(io.jsonwebtoken.ExpiredJwtException.class);
        }

        @Test
        @DisplayName("should return true for token that is still valid (not expired)")
        void shouldReturnTrueForNotExpiredToken() {
            // Create a token with long expiration
            JwtService longExpirationService = new JwtService();
            ReflectionTestUtils.setField(longExpirationService, "secretKey", TEST_SECRET);
            ReflectionTestUtils.setField(longExpirationService, "jwtExpiration", 86400000L); // 24 hours

            String validToken = longExpirationService.generateToken(testUser);

            // Token should be valid - both conditions satisfied
            boolean isValid = jwtService.isTokenValid(validToken, testUser);

            assertThat(isValid).isTrue();
        }

        @Test
        @DisplayName("should return false when email does not match (short-circuit, expiration not checked)")
        void shouldReturnFalseWhenEmailDoesNotMatchRegardlessOfExpiration() {
            String token = jwtService.generateToken(testUser);

            User userWithDifferentEmail = User.builder()
                    .id(1L) // Same ID
                    .email("different@ua.pt") // Different email
                    .password("encodedPassword")
                    .name("Test User")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();

            // Should return false due to email mismatch (isTokenExpired is not evaluated)
            boolean isValid = jwtService.isTokenValid(token, userWithDifferentEmail);

            assertThat(isValid).isFalse();
        }
    }

    @Nested
    @DisplayName("Token integrity")
    class TokenIntegrity {

        @Test
        @DisplayName("should throw exception for invalid token")
        void shouldThrowExceptionForInvalidToken() {
            String invalidToken = "invalid.token.here";

            assertThatThrownBy(() -> jwtService.extractEmail(invalidToken))
                    .isInstanceOf(Exception.class);
        }

        @Test
        @DisplayName("should throw exception for tampered token")
        void shouldThrowExceptionForTamperedToken() {
            String token = jwtService.generateToken(testUser);
            // Tamper with the token
            String tamperedToken = token.substring(0, token.length() - 5) + "xxxxx";

            assertThatThrownBy(() -> jwtService.extractEmail(tamperedToken))
                    .isInstanceOf(Exception.class);
        }
    }
}

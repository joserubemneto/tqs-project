package ua.tqs.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import ua.tqs.dto.AuthResponse;
import ua.tqs.dto.RegisterRequest;
import ua.tqs.exception.EmailAlreadyExistsException;
import ua.tqs.model.enums.UserRole;
import ua.tqs.service.AuthService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private RegisterRequest validRequest;
    private AuthResponse successResponse;

    @BeforeEach
    void setUp() {
        validRequest = RegisterRequest.builder()
                .email("test@ua.pt")
                .password("SecurePass123")
                .name("Test User")
                .role(UserRole.VOLUNTEER)
                .build();

        successResponse = AuthResponse.builder()
                .id(1L)
                .email("test@ua.pt")
                .name("Test User")
                .role(UserRole.VOLUNTEER)
                .token("jwt.token.here")
                .build();
    }

    @Nested
    @DisplayName("POST /api/auth/register")
    class RegisterEndpoint {

        @Test
        @DisplayName("should return HTTP 201 CREATED on successful registration")
        void shouldReturnCreatedStatus() {
            // Arrange
            when(authService.register(any(RegisterRequest.class))).thenReturn(successResponse);

            // Act
            ResponseEntity<AuthResponse> response = authController.register(validRequest);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        }

        @Test
        @DisplayName("should return AuthResponse with user details and token")
        void shouldReturnAuthResponseWithDetails() {
            // Arrange
            when(authService.register(any(RegisterRequest.class))).thenReturn(successResponse);

            // Act
            ResponseEntity<AuthResponse> response = authController.register(validRequest);

            // Assert
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getId()).isEqualTo(1L);
            assertThat(response.getBody().getEmail()).isEqualTo("test@ua.pt");
            assertThat(response.getBody().getName()).isEqualTo("Test User");
            assertThat(response.getBody().getRole()).isEqualTo(UserRole.VOLUNTEER);
            assertThat(response.getBody().getToken()).isEqualTo("jwt.token.here");
        }

        @Test
        @DisplayName("should delegate to AuthService.register()")
        void shouldDelegateToAuthService() {
            // Arrange
            when(authService.register(any(RegisterRequest.class))).thenReturn(successResponse);

            // Act
            authController.register(validRequest);

            // Assert
            verify(authService).register(validRequest);
        }

        @Test
        @DisplayName("should propagate EmailAlreadyExistsException from service")
        void shouldPropagateEmailAlreadyExistsException() {
            // Arrange
            when(authService.register(any(RegisterRequest.class)))
                    .thenThrow(new EmailAlreadyExistsException("Email already registered"));

            // Act & Assert
            assertThatThrownBy(() -> authController.register(validRequest))
                    .isInstanceOf(EmailAlreadyExistsException.class)
                    .hasMessage("Email already registered");
        }

        @Test
        @DisplayName("should pass request to service unchanged")
        void shouldPassRequestUnchanged() {
            // Arrange
            when(authService.register(any(RegisterRequest.class))).thenReturn(successResponse);

            // Act
            authController.register(validRequest);

            // Assert
            verify(authService).register(argThat(request ->
                request.getEmail().equals("test@ua.pt") &&
                request.getPassword().equals("SecurePass123") &&
                request.getName().equals("Test User") &&
                request.getRole() == UserRole.VOLUNTEER
            ));
        }
    }
}

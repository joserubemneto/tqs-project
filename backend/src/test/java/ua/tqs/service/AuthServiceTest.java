package ua.tqs.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import ua.tqs.dto.AuthResponse;
import ua.tqs.dto.LoginRequest;
import ua.tqs.dto.RegisterRequest;
import ua.tqs.exception.EmailAlreadyExistsException;
import ua.tqs.exception.InvalidCredentialsException;

import java.util.Optional;
import ua.tqs.model.User;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.UserRepository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = RegisterRequest.builder()
                .email("test@ua.pt")
                .password("SecurePass123")
                .name("Test User")
                .role(UserRole.VOLUNTEER)
                .build();
    }

    @Nested
    @DisplayName("register()")
    class RegisterMethod {

        @Test
        @DisplayName("should successfully register user with valid data")
        void shouldSuccessfullyRegisterUser() {
            // Arrange
            User savedUser = User.builder()
                    .id(1L)
                    .email(validRequest.getEmail())
                    .password("encodedPassword")
                    .name(validRequest.getName())
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();

            when(userRepository.existsByEmail(validRequest.getEmail())).thenReturn(false);
            when(passwordEncoder.encode(validRequest.getPassword())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(jwtService.generateToken(any(User.class))).thenReturn("jwt.token.here");

            // Act
            AuthResponse response = authService.register(validRequest);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getEmail()).isEqualTo(validRequest.getEmail());
            assertThat(response.getName()).isEqualTo(validRequest.getName());
            assertThat(response.getRole()).isEqualTo(UserRole.VOLUNTEER);
            assertThat(response.getToken()).isEqualTo("jwt.token.here");

            verify(userRepository).existsByEmail(validRequest.getEmail());
            verify(passwordEncoder).encode(validRequest.getPassword());
            verify(userRepository).save(any(User.class));
            verify(jwtService).generateToken(any(User.class));
        }

        @Test
        @DisplayName("should throw EmailAlreadyExistsException when email is already registered")
        void shouldThrowExceptionWhenEmailExists() {
            // Arrange
            when(userRepository.existsByEmail(validRequest.getEmail())).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> authService.register(validRequest))
                    .isInstanceOf(EmailAlreadyExistsException.class)
                    .hasMessage("Email already registered");

            verify(userRepository).existsByEmail(validRequest.getEmail());
            verify(userRepository, never()).save(any(User.class));
            verify(jwtService, never()).generateToken(any(User.class));
        }

        @Test
        @DisplayName("should encode password before saving")
        void shouldEncodePasswordBeforeSaving() {
            // Arrange
            String rawPassword = "SecurePass123";
            String encodedPassword = "$2a$10$encodedPasswordHash";
            
            User savedUser = User.builder()
                    .id(1L)
                    .email(validRequest.getEmail())
                    .password(encodedPassword)
                    .name(validRequest.getName())
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();

            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode(rawPassword)).thenReturn(encodedPassword);
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(jwtService.generateToken(any(User.class))).thenReturn("token");

            // Act
            authService.register(validRequest);

            // Assert
            verify(passwordEncoder).encode(rawPassword);
            verify(userRepository).save(argThat(user -> 
                user.getPassword().equals(encodedPassword)
            ));
        }

        @Test
        @DisplayName("should set default role to VOLUNTEER when not specified")
        void shouldSetDefaultRoleToVolunteer() {
            // Arrange
            RegisterRequest requestWithoutRole = RegisterRequest.builder()
                    .email("test@ua.pt")
                    .password("SecurePass123")
                    .name("Test User")
                    .role(null)
                    .build();

            User savedUser = User.builder()
                    .id(1L)
                    .email(requestWithoutRole.getEmail())
                    .password("encodedPassword")
                    .name(requestWithoutRole.getName())
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();

            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(jwtService.generateToken(any(User.class))).thenReturn("token");

            // Act
            AuthResponse response = authService.register(requestWithoutRole);

            // Assert
            assertThat(response.getRole()).isEqualTo(UserRole.VOLUNTEER);
            verify(userRepository).save(argThat(user -> 
                user.getRole() == UserRole.VOLUNTEER
            ));
        }

        @Test
        @DisplayName("should initialize points to zero for new user")
        void shouldInitializePointsToZero() {
            // Arrange
            User savedUser = User.builder()
                    .id(1L)
                    .email(validRequest.getEmail())
                    .password("encodedPassword")
                    .name(validRequest.getName())
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();

            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(jwtService.generateToken(any(User.class))).thenReturn("token");

            // Act
            authService.register(validRequest);

            // Assert
            verify(userRepository).save(argThat(user -> 
                user.getPoints() != null && user.getPoints() == 0
            ));
        }

        @Test
        @DisplayName("should allow registration with PROMOTER role")
        void shouldAllowRegistrationWithPromoterRole() {
            // Arrange
            RegisterRequest promoterRequest = RegisterRequest.builder()
                    .email("promoter@ua.pt")
                    .password("SecurePass123")
                    .name("Promoter User")
                    .role(UserRole.PROMOTER)
                    .build();

            User savedUser = User.builder()
                    .id(2L)
                    .email(promoterRequest.getEmail())
                    .password("encodedPassword")
                    .name(promoterRequest.getName())
                    .role(UserRole.PROMOTER)
                    .points(0)
                    .build();

            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(jwtService.generateToken(any(User.class))).thenReturn("token");

            // Act
            AuthResponse response = authService.register(promoterRequest);

            // Assert
            assertThat(response.getRole()).isEqualTo(UserRole.PROMOTER);
        }
    }

    @Nested
    @DisplayName("login()")
    class LoginMethod {

        private LoginRequest validLoginRequest;
        private User existingUser;

        @BeforeEach
        void setUpLogin() {
            validLoginRequest = LoginRequest.builder()
                    .email("test@ua.pt")
                    .password("SecurePass123")
                    .build();

            existingUser = User.builder()
                    .id(1L)
                    .email("test@ua.pt")
                    .password("$2a$10$encodedPasswordHash")
                    .name("Test User")
                    .role(UserRole.VOLUNTEER)
                    .points(100)
                    .build();
        }

        @Test
        @DisplayName("should return AuthResponse for valid credentials")
        void shouldReturnAuthResponseForValidCredentials() {
            // Arrange
            when(userRepository.findByEmail(validLoginRequest.getEmail())).thenReturn(Optional.of(existingUser));
            when(passwordEncoder.matches(validLoginRequest.getPassword(), existingUser.getPassword())).thenReturn(true);
            when(jwtService.generateToken(existingUser)).thenReturn("jwt.token.here");

            // Act
            AuthResponse response = authService.login(validLoginRequest);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getEmail()).isEqualTo("test@ua.pt");
            assertThat(response.getName()).isEqualTo("Test User");
            assertThat(response.getRole()).isEqualTo(UserRole.VOLUNTEER);
            assertThat(response.getToken()).isEqualTo("jwt.token.here");
        }

        @Test
        @DisplayName("should throw InvalidCredentialsException for non-existent email")
        void shouldThrowExceptionForNonExistentEmail() {
            // Arrange
            when(userRepository.findByEmail(validLoginRequest.getEmail())).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> authService.login(validLoginRequest))
                    .isInstanceOf(InvalidCredentialsException.class)
                    .hasMessage("Invalid credentials");

            verify(userRepository).findByEmail(validLoginRequest.getEmail());
            verify(passwordEncoder, never()).matches(anyString(), anyString());
            verify(jwtService, never()).generateToken(any(User.class));
        }

        @Test
        @DisplayName("should throw InvalidCredentialsException for wrong password")
        void shouldThrowExceptionForWrongPassword() {
            // Arrange
            when(userRepository.findByEmail(validLoginRequest.getEmail())).thenReturn(Optional.of(existingUser));
            when(passwordEncoder.matches(validLoginRequest.getPassword(), existingUser.getPassword())).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authService.login(validLoginRequest))
                    .isInstanceOf(InvalidCredentialsException.class)
                    .hasMessage("Invalid credentials");

            verify(userRepository).findByEmail(validLoginRequest.getEmail());
            verify(passwordEncoder).matches(validLoginRequest.getPassword(), existingUser.getPassword());
            verify(jwtService, never()).generateToken(any(User.class));
        }

        @Test
        @DisplayName("should generate JWT token on successful login")
        void shouldGenerateJwtToken() {
            // Arrange
            when(userRepository.findByEmail(validLoginRequest.getEmail())).thenReturn(Optional.of(existingUser));
            when(passwordEncoder.matches(validLoginRequest.getPassword(), existingUser.getPassword())).thenReturn(true);
            when(jwtService.generateToken(existingUser)).thenReturn("jwt.token.here");

            // Act
            authService.login(validLoginRequest);

            // Assert
            verify(jwtService).generateToken(existingUser);
        }

        @Test
        @DisplayName("should verify password using PasswordEncoder")
        void shouldVerifyPasswordWithEncoder() {
            // Arrange
            when(userRepository.findByEmail(validLoginRequest.getEmail())).thenReturn(Optional.of(existingUser));
            when(passwordEncoder.matches(validLoginRequest.getPassword(), existingUser.getPassword())).thenReturn(true);
            when(jwtService.generateToken(existingUser)).thenReturn("token");

            // Act
            authService.login(validLoginRequest);

            // Assert
            verify(passwordEncoder).matches(validLoginRequest.getPassword(), existingUser.getPassword());
        }
    }
}

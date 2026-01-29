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
import ua.tqs.config.JwtUserDetails;
import ua.tqs.dto.ProfileResponse;
import ua.tqs.dto.SkillResponse;
import ua.tqs.dto.UpdateProfileRequest;
import ua.tqs.exception.UserNotFoundException;
import ua.tqs.model.enums.SkillCategory;
import ua.tqs.model.enums.UserRole;
import ua.tqs.service.ProfileService;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileControllerTest {

    @Mock
    private ProfileService profileService;

    @InjectMocks
    private ProfileController profileController;

    private JwtUserDetails currentUser;
    private ProfileResponse profileResponse;
    private SkillResponse skillResponse;

    @BeforeEach
    void setUp() {
        currentUser = new JwtUserDetails(1L, "volunteer@ua.pt", "VOLUNTEER");

        skillResponse = SkillResponse.builder()
                .id(1L)
                .name("Communication")
                .category(SkillCategory.COMMUNICATION)
                .description("Effective communication skills")
                .build();

        profileResponse = ProfileResponse.builder()
                .id(1L)
                .email("volunteer@ua.pt")
                .name("Sample Volunteer")
                .role(UserRole.VOLUNTEER)
                .points(50)
                .bio("I love volunteering")
                .skills(List.of(skillResponse))
                .build();
    }

    @Nested
    @DisplayName("GET /api/profile")
    class GetProfileEndpoint {

        @Test
        @DisplayName("should return HTTP 200 OK on successful profile retrieval")
        void shouldReturnOkStatus() {
            // Arrange
            when(profileService.getCurrentUserProfile(1L)).thenReturn(profileResponse);

            // Act
            ResponseEntity<ProfileResponse> response = profileController.getProfile(currentUser);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        @Test
        @DisplayName("should return ProfileResponse with user details and skills")
        void shouldReturnProfileResponseWithDetails() {
            // Arrange
            when(profileService.getCurrentUserProfile(1L)).thenReturn(profileResponse);

            // Act
            ResponseEntity<ProfileResponse> response = profileController.getProfile(currentUser);

            // Assert
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getId()).isEqualTo(1L);
            assertThat(response.getBody().getEmail()).isEqualTo("volunteer@ua.pt");
            assertThat(response.getBody().getName()).isEqualTo("Sample Volunteer");
            assertThat(response.getBody().getRole()).isEqualTo(UserRole.VOLUNTEER);
            assertThat(response.getBody().getBio()).isEqualTo("I love volunteering");
            assertThat(response.getBody().getSkills()).hasSize(1);
        }

        @Test
        @DisplayName("should delegate to ProfileService.getCurrentUserProfile()")
        void shouldDelegateToProfileService() {
            // Arrange
            when(profileService.getCurrentUserProfile(1L)).thenReturn(profileResponse);

            // Act
            profileController.getProfile(currentUser);

            // Assert
            verify(profileService).getCurrentUserProfile(1L);
        }

        @Test
        @DisplayName("should propagate UserNotFoundException from service")
        void shouldPropagateUserNotFoundException() {
            // Arrange
            when(profileService.getCurrentUserProfile(1L))
                    .thenThrow(new UserNotFoundException(1L));

            // Act & Assert
            assertThatThrownBy(() -> profileController.getProfile(currentUser))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessageContaining("1");
        }
    }

    @Nested
    @DisplayName("PUT /api/profile")
    class UpdateProfileEndpoint {

        private UpdateProfileRequest updateRequest;

        @BeforeEach
        void setUpUpdate() {
            updateRequest = UpdateProfileRequest.builder()
                    .name("Updated Name")
                    .bio("Updated bio")
                    .skillIds(Set.of(1L, 2L))
                    .build();
        }

        @Test
        @DisplayName("should return HTTP 200 OK on successful profile update")
        void shouldReturnOkStatus() {
            // Arrange
            when(profileService.updateProfile(eq(1L), any(UpdateProfileRequest.class)))
                    .thenReturn(profileResponse);

            // Act
            ResponseEntity<ProfileResponse> response = profileController.updateProfile(updateRequest, currentUser);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        @Test
        @DisplayName("should return updated ProfileResponse")
        void shouldReturnUpdatedProfileResponse() {
            // Arrange
            ProfileResponse updatedResponse = ProfileResponse.builder()
                    .id(1L)
                    .email("volunteer@ua.pt")
                    .name("Updated Name")
                    .role(UserRole.VOLUNTEER)
                    .bio("Updated bio")
                    .skills(List.of(skillResponse))
                    .build();

            when(profileService.updateProfile(eq(1L), any(UpdateProfileRequest.class)))
                    .thenReturn(updatedResponse);

            // Act
            ResponseEntity<ProfileResponse> response = profileController.updateProfile(updateRequest, currentUser);

            // Assert
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getName()).isEqualTo("Updated Name");
            assertThat(response.getBody().getBio()).isEqualTo("Updated bio");
        }

        @Test
        @DisplayName("should delegate to ProfileService.updateProfile()")
        void shouldDelegateToProfileService() {
            // Arrange
            when(profileService.updateProfile(eq(1L), any(UpdateProfileRequest.class)))
                    .thenReturn(profileResponse);

            // Act
            profileController.updateProfile(updateRequest, currentUser);

            // Assert
            verify(profileService).updateProfile(eq(1L), eq(updateRequest));
        }

        @Test
        @DisplayName("should propagate UserNotFoundException from service")
        void shouldPropagateUserNotFoundException() {
            // Arrange
            when(profileService.updateProfile(eq(1L), any(UpdateProfileRequest.class)))
                    .thenThrow(new UserNotFoundException(1L));

            // Act & Assert
            assertThatThrownBy(() -> profileController.updateProfile(updateRequest, currentUser))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        @DisplayName("should pass request to service unchanged")
        void shouldPassRequestUnchanged() {
            // Arrange
            when(profileService.updateProfile(eq(1L), any(UpdateProfileRequest.class)))
                    .thenReturn(profileResponse);

            // Act
            profileController.updateProfile(updateRequest, currentUser);

            // Assert
            verify(profileService).updateProfile(eq(1L), argThat(request ->
                    request.getName().equals("Updated Name") &&
                    request.getBio().equals("Updated bio") &&
                    request.getSkillIds().contains(1L) &&
                    request.getSkillIds().contains(2L)
            ));
        }
    }
}

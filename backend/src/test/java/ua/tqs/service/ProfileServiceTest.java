package ua.tqs.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ua.tqs.dto.ProfileResponse;
import ua.tqs.dto.SkillResponse;
import ua.tqs.dto.UpdateProfileRequest;
import ua.tqs.exception.UserNotFoundException;
import ua.tqs.model.Skill;
import ua.tqs.model.User;
import ua.tqs.model.enums.SkillCategory;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.SkillRepository;
import ua.tqs.repository.UserRepository;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SkillRepository skillRepository;

    @InjectMocks
    private ProfileService profileService;

    private User testUser;
    private Skill communicationSkill;
    private Skill leadershipSkill;

    @BeforeEach
    void setUp() {
        communicationSkill = Skill.builder()
                .id(1L)
                .name("Communication")
                .category(SkillCategory.COMMUNICATION)
                .description("Effective verbal and written communication")
                .build();

        leadershipSkill = Skill.builder()
                .id(2L)
                .name("Leadership")
                .category(SkillCategory.LEADERSHIP)
                .description("Ability to lead and motivate teams")
                .build();

        Set<Skill> skills = new HashSet<>();
        skills.add(communicationSkill);

        testUser = User.builder()
                .id(1L)
                .email("volunteer@ua.pt")
                .password("encoded")
                .name("Sample Volunteer")
                .role(UserRole.VOLUNTEER)
                .points(50)
                .bio("I love volunteering")
                .skills(skills)
                .build();
    }

    @Nested
    @DisplayName("getCurrentUserProfile()")
    class GetCurrentUserProfileMethod {

        @Test
        @DisplayName("should return user profile with skills")
        void shouldReturnUserProfileWithSkills() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            // Act
            ProfileResponse response = profileService.getCurrentUserProfile(1L);

            // Assert
            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getEmail()).isEqualTo("volunteer@ua.pt");
            assertThat(response.getName()).isEqualTo("Sample Volunteer");
            assertThat(response.getRole()).isEqualTo(UserRole.VOLUNTEER);
            assertThat(response.getPoints()).isEqualTo(50);
            assertThat(response.getBio()).isEqualTo("I love volunteering");
            assertThat(response.getSkills()).hasSize(1);
            assertThat(response.getSkills().get(0).getName()).isEqualTo("Communication");
        }

        @Test
        @DisplayName("should throw UserNotFoundException when user does not exist")
        void shouldThrowExceptionWhenUserNotFound() {
            // Arrange
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> profileService.getCurrentUserProfile(999L))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessageContaining("999");
        }

        @Test
        @DisplayName("should return empty skills list when user has no skills")
        void shouldReturnEmptySkillsWhenUserHasNone() {
            // Arrange
            User userWithoutSkills = User.builder()
                    .id(2L)
                    .email("newuser@ua.pt")
                    .password("encoded")
                    .name("New User")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .skills(new HashSet<>())
                    .build();
            when(userRepository.findById(2L)).thenReturn(Optional.of(userWithoutSkills));

            // Act
            ProfileResponse response = profileService.getCurrentUserProfile(2L);

            // Assert
            assertThat(response.getSkills()).isEmpty();
        }
    }

    @Nested
    @DisplayName("updateProfile()")
    class UpdateProfileMethod {

        @Test
        @DisplayName("should update user name successfully")
        void shouldUpdateName() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateProfileRequest request = UpdateProfileRequest.builder()
                    .name("Updated Name")
                    .bio("I love volunteering")
                    .skillIds(Set.of(1L))
                    .build();

            when(skillRepository.findById(1L)).thenReturn(Optional.of(communicationSkill));

            // Act
            ProfileResponse response = profileService.updateProfile(1L, request);

            // Assert
            assertThat(response.getName()).isEqualTo("Updated Name");
            verify(userRepository).save(argThat(user -> user.getName().equals("Updated Name")));
        }

        @Test
        @DisplayName("should update user bio successfully")
        void shouldUpdateBio() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateProfileRequest request = UpdateProfileRequest.builder()
                    .name("Sample Volunteer")
                    .bio("New bio text")
                    .skillIds(Set.of(1L))
                    .build();

            when(skillRepository.findById(1L)).thenReturn(Optional.of(communicationSkill));

            // Act
            ProfileResponse response = profileService.updateProfile(1L, request);

            // Assert
            assertThat(response.getBio()).isEqualTo("New bio text");
        }

        @Test
        @DisplayName("should update user skills successfully")
        void shouldUpdateSkills() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(skillRepository.findById(1L)).thenReturn(Optional.of(communicationSkill));
            when(skillRepository.findById(2L)).thenReturn(Optional.of(leadershipSkill));

            UpdateProfileRequest request = UpdateProfileRequest.builder()
                    .name("Sample Volunteer")
                    .bio("I love volunteering")
                    .skillIds(Set.of(1L, 2L))
                    .build();

            // Act
            ProfileResponse response = profileService.updateProfile(1L, request);

            // Assert
            assertThat(response.getSkills()).hasSize(2);
        }

        @Test
        @DisplayName("should remove all skills when empty skillIds provided")
        void shouldRemoveAllSkillsWhenEmpty() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateProfileRequest request = UpdateProfileRequest.builder()
                    .name("Sample Volunteer")
                    .bio("I love volunteering")
                    .skillIds(Set.of())
                    .build();

            // Act
            ProfileResponse response = profileService.updateProfile(1L, request);

            // Assert
            assertThat(response.getSkills()).isEmpty();
        }

        @Test
        @DisplayName("should throw UserNotFoundException when user does not exist")
        void shouldThrowExceptionWhenUserNotFound() {
            // Arrange
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            UpdateProfileRequest request = UpdateProfileRequest.builder()
                    .name("Updated Name")
                    .build();

            // Act & Assert
            assertThatThrownBy(() -> profileService.updateProfile(999L, request))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessageContaining("999");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("should ignore non-existent skill IDs")
        void shouldIgnoreNonExistentSkillIds() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(skillRepository.findById(1L)).thenReturn(Optional.of(communicationSkill));
            when(skillRepository.findById(999L)).thenReturn(Optional.empty());

            UpdateProfileRequest request = UpdateProfileRequest.builder()
                    .name("Sample Volunteer")
                    .bio("I love volunteering")
                    .skillIds(Set.of(1L, 999L))
                    .build();

            // Act
            ProfileResponse response = profileService.updateProfile(1L, request);

            // Assert
            assertThat(response.getSkills()).hasSize(1);
            assertThat(response.getSkills().get(0).getId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("should allow null bio")
        void shouldAllowNullBio() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateProfileRequest request = UpdateProfileRequest.builder()
                    .name("Sample Volunteer")
                    .bio(null)
                    .skillIds(null)
                    .build();

            // Act
            ProfileResponse response = profileService.updateProfile(1L, request);

            // Assert
            assertThat(response.getBio()).isNull();
        }
    }

    @Nested
    @DisplayName("getAllSkills()")
    class GetAllSkillsMethod {

        @Test
        @DisplayName("should return all skills")
        void shouldReturnAllSkills() {
            // Arrange
            when(skillRepository.findAll()).thenReturn(List.of(communicationSkill, leadershipSkill));

            // Act
            List<SkillResponse> skills = profileService.getAllSkills();

            // Assert
            assertThat(skills).hasSize(2);
            assertThat(skills.get(0).getName()).isEqualTo("Communication");
            assertThat(skills.get(1).getName()).isEqualTo("Leadership");
        }

        @Test
        @DisplayName("should return empty list when no skills exist")
        void shouldReturnEmptyListWhenNoSkills() {
            // Arrange
            when(skillRepository.findAll()).thenReturn(List.of());

            // Act
            List<SkillResponse> skills = profileService.getAllSkills();

            // Assert
            assertThat(skills).isEmpty();
        }

        @Test
        @DisplayName("should map Skill to SkillResponse correctly")
        void shouldMapSkillToSkillResponse() {
            // Arrange
            when(skillRepository.findAll()).thenReturn(List.of(communicationSkill));

            // Act
            List<SkillResponse> skills = profileService.getAllSkills();

            // Assert
            SkillResponse skillResponse = skills.get(0);
            assertThat(skillResponse.getId()).isEqualTo(communicationSkill.getId());
            assertThat(skillResponse.getName()).isEqualTo(communicationSkill.getName());
            assertThat(skillResponse.getCategory()).isEqualTo(communicationSkill.getCategory());
            assertThat(skillResponse.getDescription()).isEqualTo(communicationSkill.getDescription());
        }
    }

    @Nested
    @DisplayName("getSkillsByCategory()")
    class GetSkillsByCategoryMethod {

        @Test
        @DisplayName("should return skills filtered by category")
        void shouldReturnSkillsByCategory() {
            // Arrange
            when(skillRepository.findByCategory(SkillCategory.COMMUNICATION))
                    .thenReturn(List.of(communicationSkill));

            // Act
            List<SkillResponse> skills = profileService.getSkillsByCategory(SkillCategory.COMMUNICATION);

            // Assert
            assertThat(skills).hasSize(1);
            assertThat(skills.get(0).getCategory()).isEqualTo(SkillCategory.COMMUNICATION);
        }

        @Test
        @DisplayName("should return empty list when no skills in category")
        void shouldReturnEmptyListWhenNoCategoryMatch() {
            // Arrange
            when(skillRepository.findByCategory(SkillCategory.OTHER)).thenReturn(List.of());

            // Act
            List<SkillResponse> skills = profileService.getSkillsByCategory(SkillCategory.OTHER);

            // Assert
            assertThat(skills).isEmpty();
        }
    }
}

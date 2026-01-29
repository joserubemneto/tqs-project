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
import ua.tqs.dto.SkillResponse;
import ua.tqs.model.enums.SkillCategory;
import ua.tqs.service.ProfileService;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SkillControllerTest {

    @Mock
    private ProfileService profileService;

    @InjectMocks
    private SkillController skillController;

    private SkillResponse communicationSkill;
    private SkillResponse leadershipSkill;
    private SkillResponse technicalSkill;

    @BeforeEach
    void setUp() {
        communicationSkill = SkillResponse.builder()
                .id(1L)
                .name("Communication")
                .category(SkillCategory.COMMUNICATION)
                .description("Effective communication skills")
                .build();

        leadershipSkill = SkillResponse.builder()
                .id(2L)
                .name("Leadership")
                .category(SkillCategory.LEADERSHIP)
                .description("Ability to lead teams")
                .build();

        technicalSkill = SkillResponse.builder()
                .id(3L)
                .name("Programming")
                .category(SkillCategory.TECHNICAL)
                .description("Software development skills")
                .build();
    }

    @Nested
    @DisplayName("GET /api/skills")
    class GetSkillsEndpoint {

        @Test
        @DisplayName("should return HTTP 200 OK with all skills when no category filter")
        void shouldReturnOkWithAllSkills() {
            // Arrange
            when(profileService.getAllSkills())
                    .thenReturn(List.of(communicationSkill, leadershipSkill, technicalSkill));

            // Act
            ResponseEntity<List<SkillResponse>> response = skillController.getSkills(null);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).hasSize(3);
        }

        @Test
        @DisplayName("should return skills filtered by category")
        void shouldReturnSkillsFilteredByCategory() {
            // Arrange
            when(profileService.getSkillsByCategory(SkillCategory.COMMUNICATION))
                    .thenReturn(List.of(communicationSkill));

            // Act
            ResponseEntity<List<SkillResponse>> response = skillController.getSkills(SkillCategory.COMMUNICATION);

            // Assert
            assertThat(response.getBody()).hasSize(1);
            assertThat(response.getBody().get(0).getCategory()).isEqualTo(SkillCategory.COMMUNICATION);
        }

        @Test
        @DisplayName("should delegate to ProfileService.getAllSkills() when no category")
        void shouldDelegateToGetAllSkills() {
            // Arrange
            when(profileService.getAllSkills()).thenReturn(List.of());

            // Act
            skillController.getSkills(null);

            // Assert
            verify(profileService).getAllSkills();
            verify(profileService, never()).getSkillsByCategory(any());
        }

        @Test
        @DisplayName("should delegate to ProfileService.getSkillsByCategory() when category provided")
        void shouldDelegateToGetSkillsByCategory() {
            // Arrange
            when(profileService.getSkillsByCategory(SkillCategory.TECHNICAL))
                    .thenReturn(List.of(technicalSkill));

            // Act
            skillController.getSkills(SkillCategory.TECHNICAL);

            // Assert
            verify(profileService).getSkillsByCategory(SkillCategory.TECHNICAL);
            verify(profileService, never()).getAllSkills();
        }

        @Test
        @DisplayName("should return empty list when no skills match category")
        void shouldReturnEmptyListWhenNoCategoryMatch() {
            // Arrange
            when(profileService.getSkillsByCategory(SkillCategory.OTHER))
                    .thenReturn(List.of());

            // Act
            ResponseEntity<List<SkillResponse>> response = skillController.getSkills(SkillCategory.OTHER);

            // Assert
            assertThat(response.getBody()).isEmpty();
        }

        @Test
        @DisplayName("should return skill response with all fields populated")
        void shouldReturnSkillResponseWithAllFields() {
            // Arrange
            when(profileService.getAllSkills()).thenReturn(List.of(communicationSkill));

            // Act
            ResponseEntity<List<SkillResponse>> response = skillController.getSkills(null);

            // Assert
            assertThat(response.getBody()).isNotNull();
            SkillResponse skill = response.getBody().get(0);
            assertThat(skill.getId()).isEqualTo(1L);
            assertThat(skill.getName()).isEqualTo("Communication");
            assertThat(skill.getCategory()).isEqualTo(SkillCategory.COMMUNICATION);
            assertThat(skill.getDescription()).isEqualTo("Effective communication skills");
        }
    }
}

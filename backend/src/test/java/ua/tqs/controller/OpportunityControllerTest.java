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
import ua.tqs.dto.CreateOpportunityRequest;
import ua.tqs.dto.OpportunityResponse;
import ua.tqs.dto.SkillResponse;
import ua.tqs.dto.UserResponse;
import ua.tqs.exception.OpportunityValidationException;
import ua.tqs.exception.UserNotFoundException;
import ua.tqs.model.enums.OpportunityStatus;
import ua.tqs.model.enums.SkillCategory;
import ua.tqs.model.enums.UserRole;
import ua.tqs.service.OpportunityService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OpportunityControllerTest {

    @Mock
    private OpportunityService opportunityService;

    @InjectMocks
    private OpportunityController opportunityController;

    private JwtUserDetails currentUser;
    private CreateOpportunityRequest createRequest;
    private OpportunityResponse opportunityResponse;

    @BeforeEach
    void setUp() {
        currentUser = new JwtUserDetails(1L, "promoter@ua.pt", "PROMOTER");

        UserResponse promoterResponse = UserResponse.builder()
                .id(1L)
                .email("promoter@ua.pt")
                .name("Sample Promoter")
                .role(UserRole.PROMOTER)
                .points(0)
                .build();

        SkillResponse skillResponse = SkillResponse.builder()
                .id(1L)
                .name("Communication")
                .category(SkillCategory.COMMUNICATION)
                .description("Effective communication skills")
                .build();

        LocalDateTime startDate = LocalDateTime.now().plusDays(1);
        LocalDateTime endDate = LocalDateTime.now().plusDays(7);

        createRequest = CreateOpportunityRequest.builder()
                .title("UA Open Day Support")
                .description("Help with university open day activities")
                .pointsReward(50)
                .startDate(startDate)
                .endDate(endDate)
                .maxVolunteers(10)
                .location("University Campus")
                .requiredSkillIds(Set.of(1L))
                .build();

        opportunityResponse = OpportunityResponse.builder()
                .id(1L)
                .title("UA Open Day Support")
                .description("Help with university open day activities")
                .pointsReward(50)
                .startDate(startDate)
                .endDate(endDate)
                .maxVolunteers(10)
                .status(OpportunityStatus.DRAFT)
                .location("University Campus")
                .promoter(promoterResponse)
                .requiredSkills(List.of(skillResponse))
                .build();
    }

    @Nested
    @DisplayName("POST /api/opportunities")
    class CreateOpportunityEndpoint {

        @Test
        @DisplayName("should return HTTP 201 CREATED on successful creation")
        void shouldReturnCreatedStatus() {
            // Arrange
            when(opportunityService.createOpportunity(eq(1L), any(CreateOpportunityRequest.class)))
                    .thenReturn(opportunityResponse);

            // Act
            ResponseEntity<OpportunityResponse> response = 
                    opportunityController.createOpportunity(createRequest, currentUser);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        }

        @Test
        @DisplayName("should return OpportunityResponse with all details")
        void shouldReturnOpportunityResponse() {
            // Arrange
            when(opportunityService.createOpportunity(eq(1L), any(CreateOpportunityRequest.class)))
                    .thenReturn(opportunityResponse);

            // Act
            ResponseEntity<OpportunityResponse> response = 
                    opportunityController.createOpportunity(createRequest, currentUser);

            // Assert
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getId()).isEqualTo(1L);
            assertThat(response.getBody().getTitle()).isEqualTo("UA Open Day Support");
            assertThat(response.getBody().getDescription()).isEqualTo("Help with university open day activities");
            assertThat(response.getBody().getPointsReward()).isEqualTo(50);
            assertThat(response.getBody().getMaxVolunteers()).isEqualTo(10);
            assertThat(response.getBody().getStatus()).isEqualTo(OpportunityStatus.DRAFT);
            assertThat(response.getBody().getLocation()).isEqualTo("University Campus");
            assertThat(response.getBody().getPromoter()).isNotNull();
            assertThat(response.getBody().getRequiredSkills()).hasSize(1);
        }

        @Test
        @DisplayName("should delegate to OpportunityService.createOpportunity()")
        void shouldDelegateToOpportunityService() {
            // Arrange
            when(opportunityService.createOpportunity(eq(1L), any(CreateOpportunityRequest.class)))
                    .thenReturn(opportunityResponse);

            // Act
            opportunityController.createOpportunity(createRequest, currentUser);

            // Assert
            verify(opportunityService).createOpportunity(eq(1L), eq(createRequest));
        }

        @Test
        @DisplayName("should propagate OpportunityValidationException from service")
        void shouldPropagateValidationException() {
            // Arrange
            when(opportunityService.createOpportunity(eq(1L), any(CreateOpportunityRequest.class)))
                    .thenThrow(new OpportunityValidationException("End date must be after start date"));

            // Act & Assert
            assertThatThrownBy(() -> opportunityController.createOpportunity(createRequest, currentUser))
                    .isInstanceOf(OpportunityValidationException.class)
                    .hasMessage("End date must be after start date");
        }

        @Test
        @DisplayName("should propagate UserNotFoundException from service")
        void shouldPropagateUserNotFoundException() {
            // Arrange
            when(opportunityService.createOpportunity(eq(1L), any(CreateOpportunityRequest.class)))
                    .thenThrow(new UserNotFoundException(1L));

            // Act & Assert
            assertThatThrownBy(() -> opportunityController.createOpportunity(createRequest, currentUser))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        @DisplayName("should pass request to service unchanged")
        void shouldPassRequestUnchanged() {
            // Arrange
            when(opportunityService.createOpportunity(eq(1L), any(CreateOpportunityRequest.class)))
                    .thenReturn(opportunityResponse);

            // Act
            opportunityController.createOpportunity(createRequest, currentUser);

            // Assert
            verify(opportunityService).createOpportunity(eq(1L), argThat(request ->
                    request.getTitle().equals("UA Open Day Support") &&
                    request.getPointsReward().equals(50) &&
                    request.getMaxVolunteers().equals(10) &&
                    request.getRequiredSkillIds().contains(1L)
            ));
        }
    }

    @Nested
    @DisplayName("GET /api/opportunities/my")
    class GetMyOpportunitiesEndpoint {

        @Test
        @DisplayName("should return HTTP 200 OK")
        void shouldReturnOkStatus() {
            // Arrange
            when(opportunityService.getOpportunitiesByPromoter(1L))
                    .thenReturn(List.of(opportunityResponse));

            // Act
            ResponseEntity<List<OpportunityResponse>> response = 
                    opportunityController.getMyOpportunities(currentUser);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        @Test
        @DisplayName("should return list of opportunities")
        void shouldReturnListOfOpportunities() {
            // Arrange
            when(opportunityService.getOpportunitiesByPromoter(1L))
                    .thenReturn(List.of(opportunityResponse));

            // Act
            ResponseEntity<List<OpportunityResponse>> response = 
                    opportunityController.getMyOpportunities(currentUser);

            // Assert
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody()).hasSize(1);
            assertThat(response.getBody().get(0).getTitle()).isEqualTo("UA Open Day Support");
        }

        @Test
        @DisplayName("should return empty list when no opportunities")
        void shouldReturnEmptyList() {
            // Arrange
            when(opportunityService.getOpportunitiesByPromoter(1L))
                    .thenReturn(List.of());

            // Act
            ResponseEntity<List<OpportunityResponse>> response = 
                    opportunityController.getMyOpportunities(currentUser);

            // Assert
            assertThat(response.getBody()).isEmpty();
        }

        @Test
        @DisplayName("should delegate to OpportunityService.getOpportunitiesByPromoter()")
        void shouldDelegateToOpportunityService() {
            // Arrange
            when(opportunityService.getOpportunitiesByPromoter(1L))
                    .thenReturn(List.of(opportunityResponse));

            // Act
            opportunityController.getMyOpportunities(currentUser);

            // Assert
            verify(opportunityService).getOpportunitiesByPromoter(1L);
        }

        @Test
        @DisplayName("should propagate UserNotFoundException from service")
        void shouldPropagateUserNotFoundException() {
            // Arrange
            when(opportunityService.getOpportunitiesByPromoter(1L))
                    .thenThrow(new UserNotFoundException(1L));

            // Act & Assert
            assertThatThrownBy(() -> opportunityController.getMyOpportunities(currentUser))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }
}

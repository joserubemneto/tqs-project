package ua.tqs.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import ua.tqs.config.JwtUserDetails;
import ua.tqs.dto.CreateOpportunityRequest;
import ua.tqs.dto.OpportunityFilterRequest;
import ua.tqs.dto.OpportunityResponse;
import ua.tqs.dto.SkillResponse;
import ua.tqs.dto.UserResponse;
import ua.tqs.exception.OpportunityNotFoundException;
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

    @Nested
    @DisplayName("GET /api/opportunities/{id}")
    class GetOpportunityByIdEndpoint {

        @Test
        @DisplayName("should return HTTP 200 OK when opportunity found")
        void shouldReturnOkStatus() {
            // Arrange
            when(opportunityService.getOpportunityById(1L))
                    .thenReturn(opportunityResponse);

            // Act
            ResponseEntity<OpportunityResponse> response = 
                    opportunityController.getOpportunityById(1L);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        @Test
        @DisplayName("should return OpportunityResponse with all details")
        void shouldReturnOpportunityResponse() {
            // Arrange
            when(opportunityService.getOpportunityById(1L))
                    .thenReturn(opportunityResponse);

            // Act
            ResponseEntity<OpportunityResponse> response = 
                    opportunityController.getOpportunityById(1L);

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
        @DisplayName("should delegate to OpportunityService.getOpportunityById()")
        void shouldDelegateToOpportunityService() {
            // Arrange
            when(opportunityService.getOpportunityById(1L))
                    .thenReturn(opportunityResponse);

            // Act
            opportunityController.getOpportunityById(1L);

            // Assert
            verify(opportunityService).getOpportunityById(1L);
        }

        @Test
        @DisplayName("should propagate OpportunityNotFoundException from service")
        void shouldPropagateNotFoundException() {
            // Arrange
            when(opportunityService.getOpportunityById(999L))
                    .thenThrow(new OpportunityNotFoundException(999L));

            // Act & Assert
            assertThatThrownBy(() -> opportunityController.getOpportunityById(999L))
                    .isInstanceOf(OpportunityNotFoundException.class)
                    .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("GET /api/opportunities")
    class GetAllOpportunitiesEndpoint {

        @Test
        @DisplayName("should return HTTP 200 OK")
        void shouldReturnOkStatus() {
            // Arrange
            Page<OpportunityResponse> page = new PageImpl<>(List.of(opportunityResponse));
            when(opportunityService.getFilteredOpportunities(any(OpportunityFilterRequest.class), any(Pageable.class)))
                    .thenReturn(page);

            // Act
            ResponseEntity<Page<OpportunityResponse>> response = 
                    opportunityController.getAllOpportunities(0, 10, "startDate", "asc", null, null, null, null, null);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        @Test
        @DisplayName("should return page of opportunities")
        void shouldReturnPageOfOpportunities() {
            // Arrange
            Page<OpportunityResponse> page = new PageImpl<>(List.of(opportunityResponse));
            when(opportunityService.getFilteredOpportunities(any(OpportunityFilterRequest.class), any(Pageable.class)))
                    .thenReturn(page);

            // Act
            ResponseEntity<Page<OpportunityResponse>> response = 
                    opportunityController.getAllOpportunities(0, 10, "startDate", "asc", null, null, null, null, null);

            // Assert
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getContent()).hasSize(1);
            assertThat(response.getBody().getContent().get(0).getTitle()).isEqualTo("UA Open Day Support");
        }

        @Test
        @DisplayName("should return empty page when no opportunities")
        void shouldReturnEmptyPage() {
            // Arrange
            Page<OpportunityResponse> emptyPage = new PageImpl<>(List.of());
            when(opportunityService.getFilteredOpportunities(any(OpportunityFilterRequest.class), any(Pageable.class)))
                    .thenReturn(emptyPage);

            // Act
            ResponseEntity<Page<OpportunityResponse>> response = 
                    opportunityController.getAllOpportunities(0, 10, "startDate", "asc", null, null, null, null, null);

            // Assert
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getContent()).isEmpty();
        }

        @Test
        @DisplayName("should pass correct pagination parameters to service")
        void shouldPassCorrectPaginationParameters() {
            // Arrange
            Page<OpportunityResponse> page = new PageImpl<>(List.of());
            when(opportunityService.getFilteredOpportunities(any(OpportunityFilterRequest.class), any(Pageable.class)))
                    .thenReturn(page);

            // Act
            opportunityController.getAllOpportunities(2, 20, "title", "desc", null, null, null, null, null);

            // Assert
            verify(opportunityService).getFilteredOpportunities(any(OpportunityFilterRequest.class), argThat(pageable ->
                    pageable.getPageNumber() == 2 &&
                    pageable.getPageSize() == 20 &&
                    pageable.getSort().getOrderFor("title") != null &&
                    pageable.getSort().getOrderFor("title").getDirection() == Sort.Direction.DESC
            ));
        }

        @Test
        @DisplayName("should use ascending sort when sortDir is asc")
        void shouldUseAscendingSortWhenAsc() {
            // Arrange
            Page<OpportunityResponse> page = new PageImpl<>(List.of());
            when(opportunityService.getFilteredOpportunities(any(OpportunityFilterRequest.class), any(Pageable.class)))
                    .thenReturn(page);

            // Act
            opportunityController.getAllOpportunities(0, 10, "startDate", "asc", null, null, null, null, null);

            // Assert
            verify(opportunityService).getFilteredOpportunities(any(OpportunityFilterRequest.class), argThat(pageable ->
                    pageable.getSort().getOrderFor("startDate").getDirection() == Sort.Direction.ASC
            ));
        }

        @Test
        @DisplayName("should use descending sort when sortDir is desc")
        void shouldUseDescendingSortWhenDesc() {
            // Arrange
            Page<OpportunityResponse> page = new PageImpl<>(List.of());
            when(opportunityService.getFilteredOpportunities(any(OpportunityFilterRequest.class), any(Pageable.class)))
                    .thenReturn(page);

            // Act
            opportunityController.getAllOpportunities(0, 10, "startDate", "DESC", null, null, null, null, null);

            // Assert
            verify(opportunityService).getFilteredOpportunities(any(OpportunityFilterRequest.class), argThat(pageable ->
                    pageable.getSort().getOrderFor("startDate").getDirection() == Sort.Direction.DESC
            ));
        }

        @Test
        @DisplayName("should delegate to OpportunityService.getFilteredOpportunities()")
        void shouldDelegateToOpportunityService() {
            // Arrange
            Page<OpportunityResponse> page = new PageImpl<>(List.of(opportunityResponse));
            when(opportunityService.getFilteredOpportunities(any(OpportunityFilterRequest.class), any(Pageable.class)))
                    .thenReturn(page);

            // Act
            opportunityController.getAllOpportunities(0, 10, "startDate", "asc", null, null, null, null, null);

            // Assert
            verify(opportunityService).getFilteredOpportunities(any(OpportunityFilterRequest.class), any(Pageable.class));
        }

        @Test
        @DisplayName("should pass filter parameters to service")
        void shouldPassFilterParametersToService() {
            // Arrange
            Page<OpportunityResponse> page = new PageImpl<>(List.of());
            when(opportunityService.getFilteredOpportunities(any(OpportunityFilterRequest.class), any(Pageable.class)))
                    .thenReturn(page);
            List<Long> skillIds = List.of(1L, 2L);
            LocalDateTime startDateFrom = LocalDateTime.now();
            LocalDateTime startDateTo = LocalDateTime.now().plusDays(7);
            Integer minPoints = 10;
            Integer maxPoints = 100;

            // Act
            opportunityController.getAllOpportunities(0, 10, "startDate", "asc", skillIds, startDateFrom, startDateTo, minPoints, maxPoints);

            // Assert
            verify(opportunityService).getFilteredOpportunities(argThat(filter ->
                    filter.getSkillIds() != null && filter.getSkillIds().equals(skillIds) &&
                    filter.getStartDateFrom() != null && filter.getStartDateFrom().equals(startDateFrom) &&
                    filter.getStartDateTo() != null && filter.getStartDateTo().equals(startDateTo) &&
                    filter.getMinPoints() != null && filter.getMinPoints().equals(minPoints) &&
                    filter.getMaxPoints() != null && filter.getMaxPoints().equals(maxPoints)
            ), any(Pageable.class));
        }
    }
}

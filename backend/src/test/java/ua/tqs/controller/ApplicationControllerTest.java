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
import ua.tqs.dto.ApplicationResponse;
import ua.tqs.dto.CreateApplicationRequest;
import ua.tqs.exception.AlreadyAppliedException;
import ua.tqs.exception.ApplicationNotFoundException;
import ua.tqs.exception.InvalidApplicationStatusException;
import ua.tqs.exception.NoSpotsAvailableException;
import ua.tqs.exception.OpportunityNotFoundException;
import ua.tqs.exception.OpportunityOwnershipException;
import ua.tqs.exception.OpportunityStatusException;
import ua.tqs.exception.UserNotFoundException;
import ua.tqs.model.enums.ApplicationStatus;
import ua.tqs.service.ApplicationService;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationControllerTest {

    @Mock
    private ApplicationService applicationService;

    @InjectMocks
    private ApplicationController applicationController;

    private JwtUserDetails currentUser;
    private ApplicationResponse applicationResponse;
    private CreateApplicationRequest createRequest;

    @BeforeEach
    void setUp() {
        currentUser = new JwtUserDetails(1L, "volunteer@ua.pt", "VOLUNTEER");

        ApplicationResponse.OpportunitySummary opportunitySummary = ApplicationResponse.OpportunitySummary.builder()
                .id(1L)
                .title("UA Open Day Support")
                .status("OPEN")
                .startDate(LocalDateTime.now().plusDays(1))
                .endDate(LocalDateTime.now().plusDays(7))
                .pointsReward(50)
                .location("University Campus")
                .build();

        applicationResponse = ApplicationResponse.builder()
                .id(1L)
                .status(ApplicationStatus.PENDING)
                .message("I would love to help!")
                .appliedAt(LocalDateTime.now())
                .opportunity(opportunitySummary)
                .build();

        createRequest = CreateApplicationRequest.builder()
                .opportunityId(1L)
                .message("I would love to help!")
                .build();
    }

    @Nested
    @DisplayName("POST /api/applications")
    class ApplyToOpportunityEndpoint {

        @Test
        @DisplayName("should return HTTP 201 CREATED on successful application")
        void shouldReturnCreatedStatus() {
            // Arrange
            when(applicationService.applyToOpportunity(eq(1L), any(CreateApplicationRequest.class)))
                    .thenReturn(applicationResponse);

            // Act
            ResponseEntity<ApplicationResponse> response = 
                    applicationController.applyToOpportunity(createRequest, currentUser);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        }

        @Test
        @DisplayName("should return ApplicationResponse with all details")
        void shouldReturnApplicationResponse() {
            // Arrange
            when(applicationService.applyToOpportunity(eq(1L), any(CreateApplicationRequest.class)))
                    .thenReturn(applicationResponse);

            // Act
            ResponseEntity<ApplicationResponse> response = 
                    applicationController.applyToOpportunity(createRequest, currentUser);

            // Assert
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getId()).isEqualTo(1L);
            assertThat(response.getBody().getStatus()).isEqualTo(ApplicationStatus.PENDING);
            assertThat(response.getBody().getMessage()).isEqualTo("I would love to help!");
            assertThat(response.getBody().getOpportunity()).isNotNull();
            assertThat(response.getBody().getOpportunity().getId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("should delegate to ApplicationService.applyToOpportunity()")
        void shouldDelegateToApplicationService() {
            // Arrange
            when(applicationService.applyToOpportunity(eq(1L), any(CreateApplicationRequest.class)))
                    .thenReturn(applicationResponse);

            // Act
            applicationController.applyToOpportunity(createRequest, currentUser);

            // Assert
            verify(applicationService).applyToOpportunity(eq(1L), eq(createRequest));
        }

        @Test
        @DisplayName("should propagate AlreadyAppliedException from service")
        void shouldPropagateAlreadyAppliedException() {
            // Arrange
            when(applicationService.applyToOpportunity(eq(1L), any(CreateApplicationRequest.class)))
                    .thenThrow(new AlreadyAppliedException());

            // Act & Assert
            assertThatThrownBy(() -> applicationController.applyToOpportunity(createRequest, currentUser))
                    .isInstanceOf(AlreadyAppliedException.class)
                    .hasMessage("Already applied");
        }

        @Test
        @DisplayName("should propagate NoSpotsAvailableException from service")
        void shouldPropagateNoSpotsAvailableException() {
            // Arrange
            when(applicationService.applyToOpportunity(eq(1L), any(CreateApplicationRequest.class)))
                    .thenThrow(new NoSpotsAvailableException());

            // Act & Assert
            assertThatThrownBy(() -> applicationController.applyToOpportunity(createRequest, currentUser))
                    .isInstanceOf(NoSpotsAvailableException.class)
                    .hasMessage("No spots available");
        }

        @Test
        @DisplayName("should propagate OpportunityNotFoundException from service")
        void shouldPropagateOpportunityNotFoundException() {
            // Arrange
            when(applicationService.applyToOpportunity(eq(1L), any(CreateApplicationRequest.class)))
                    .thenThrow(new OpportunityNotFoundException(1L));

            // Act & Assert
            assertThatThrownBy(() -> applicationController.applyToOpportunity(createRequest, currentUser))
                    .isInstanceOf(OpportunityNotFoundException.class);
        }

        @Test
        @DisplayName("should propagate OpportunityStatusException from service")
        void shouldPropagateOpportunityStatusException() {
            // Arrange
            when(applicationService.applyToOpportunity(eq(1L), any(CreateApplicationRequest.class)))
                    .thenThrow(new OpportunityStatusException("Cannot apply to opportunity that is not open"));

            // Act & Assert
            assertThatThrownBy(() -> applicationController.applyToOpportunity(createRequest, currentUser))
                    .isInstanceOf(OpportunityStatusException.class)
                    .hasMessage("Cannot apply to opportunity that is not open");
        }

        @Test
        @DisplayName("should propagate UserNotFoundException from service")
        void shouldPropagateUserNotFoundException() {
            // Arrange
            when(applicationService.applyToOpportunity(eq(1L), any(CreateApplicationRequest.class)))
                    .thenThrow(new UserNotFoundException(1L));

            // Act & Assert
            assertThatThrownBy(() -> applicationController.applyToOpportunity(createRequest, currentUser))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("GET /api/applications/my")
    class GetMyApplicationsEndpoint {

        @Test
        @DisplayName("should return HTTP 200 OK")
        void shouldReturnOkStatus() {
            // Arrange
            when(applicationService.getMyApplications(1L))
                    .thenReturn(List.of(applicationResponse));

            // Act
            ResponseEntity<List<ApplicationResponse>> response = 
                    applicationController.getMyApplications(currentUser);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        @Test
        @DisplayName("should return list of applications")
        void shouldReturnListOfApplications() {
            // Arrange
            when(applicationService.getMyApplications(1L))
                    .thenReturn(List.of(applicationResponse));

            // Act
            ResponseEntity<List<ApplicationResponse>> response = 
                    applicationController.getMyApplications(currentUser);

            // Assert
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody()).hasSize(1);
            assertThat(response.getBody().get(0).getOpportunity().getTitle()).isEqualTo("UA Open Day Support");
        }

        @Test
        @DisplayName("should return empty list when no applications")
        void shouldReturnEmptyList() {
            // Arrange
            when(applicationService.getMyApplications(1L))
                    .thenReturn(List.of());

            // Act
            ResponseEntity<List<ApplicationResponse>> response = 
                    applicationController.getMyApplications(currentUser);

            // Assert
            assertThat(response.getBody()).isEmpty();
        }

        @Test
        @DisplayName("should delegate to ApplicationService.getMyApplications()")
        void shouldDelegateToApplicationService() {
            // Arrange
            when(applicationService.getMyApplications(1L))
                    .thenReturn(List.of(applicationResponse));

            // Act
            applicationController.getMyApplications(currentUser);

            // Assert
            verify(applicationService).getMyApplications(1L);
        }

        @Test
        @DisplayName("should propagate UserNotFoundException from service")
        void shouldPropagateUserNotFoundException() {
            // Arrange
            when(applicationService.getMyApplications(1L))
                    .thenThrow(new UserNotFoundException(1L));

            // Act & Assert
            assertThatThrownBy(() -> applicationController.getMyApplications(currentUser))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("GET /api/opportunities/{opportunityId}/my-application")
    class GetMyApplicationForOpportunityEndpoint {

        @Test
        @DisplayName("should return HTTP 200 OK when application exists")
        void shouldReturnOkStatusWhenApplicationExists() {
            // Arrange
            when(applicationService.getApplicationForOpportunity(1L, 1L))
                    .thenReturn(applicationResponse);

            // Act
            ResponseEntity<ApplicationResponse> response = 
                    applicationController.getMyApplicationForOpportunity(1L, currentUser);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        @Test
        @DisplayName("should return ApplicationResponse when application exists")
        void shouldReturnApplicationResponseWhenExists() {
            // Arrange
            when(applicationService.getApplicationForOpportunity(1L, 1L))
                    .thenReturn(applicationResponse);

            // Act
            ResponseEntity<ApplicationResponse> response = 
                    applicationController.getMyApplicationForOpportunity(1L, currentUser);

            // Assert
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getId()).isEqualTo(1L);
            assertThat(response.getBody().getStatus()).isEqualTo(ApplicationStatus.PENDING);
        }

        @Test
        @DisplayName("should return HTTP 204 NO CONTENT when no application exists")
        void shouldReturnNoContentWhenNoApplicationExists() {
            // Arrange
            when(applicationService.getApplicationForOpportunity(1L, 1L))
                    .thenReturn(null);

            // Act
            ResponseEntity<ApplicationResponse> response = 
                    applicationController.getMyApplicationForOpportunity(1L, currentUser);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
            assertThat(response.getBody()).isNull();
        }

        @Test
        @DisplayName("should delegate to ApplicationService.getApplicationForOpportunity()")
        void shouldDelegateToApplicationService() {
            // Arrange
            when(applicationService.getApplicationForOpportunity(1L, 1L))
                    .thenReturn(applicationResponse);

            // Act
            applicationController.getMyApplicationForOpportunity(1L, currentUser);

            // Assert
            verify(applicationService).getApplicationForOpportunity(1L, 1L);
        }

        @Test
        @DisplayName("should propagate OpportunityNotFoundException from service")
        void shouldPropagateOpportunityNotFoundException() {
            // Arrange
            when(applicationService.getApplicationForOpportunity(1L, 999L))
                    .thenThrow(new OpportunityNotFoundException(999L));

            // Act & Assert
            assertThatThrownBy(() -> applicationController.getMyApplicationForOpportunity(999L, currentUser))
                    .isInstanceOf(OpportunityNotFoundException.class)
                    .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("GET /api/opportunities/{opportunityId}/application-count")
    class GetApprovedApplicationCountEndpoint {

        @Test
        @DisplayName("should return HTTP 200 OK")
        void shouldReturnOkStatus() {
            // Arrange
            when(applicationService.getApprovedApplicationCount(1L))
                    .thenReturn(5L);

            // Act
            ResponseEntity<Long> response = 
                    applicationController.getApprovedApplicationCount(1L);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        @Test
        @DisplayName("should return count of approved applications")
        void shouldReturnCount() {
            // Arrange
            when(applicationService.getApprovedApplicationCount(1L))
                    .thenReturn(5L);

            // Act
            ResponseEntity<Long> response = 
                    applicationController.getApprovedApplicationCount(1L);

            // Assert
            assertThat(response.getBody()).isEqualTo(5L);
        }

        @Test
        @DisplayName("should return zero when no approved applications")
        void shouldReturnZero() {
            // Arrange
            when(applicationService.getApprovedApplicationCount(1L))
                    .thenReturn(0L);

            // Act
            ResponseEntity<Long> response = 
                    applicationController.getApprovedApplicationCount(1L);

            // Assert
            assertThat(response.getBody()).isZero();
        }

        @Test
        @DisplayName("should delegate to ApplicationService.getApprovedApplicationCount()")
        void shouldDelegateToApplicationService() {
            // Arrange
            when(applicationService.getApprovedApplicationCount(1L))
                    .thenReturn(5L);

            // Act
            applicationController.getApprovedApplicationCount(1L);

            // Assert
            verify(applicationService).getApprovedApplicationCount(1L);
        }

        @Test
        @DisplayName("should propagate OpportunityNotFoundException from service")
        void shouldPropagateOpportunityNotFoundException() {
            // Arrange
            when(applicationService.getApprovedApplicationCount(999L))
                    .thenThrow(new OpportunityNotFoundException(999L));

            // Act & Assert
            assertThatThrownBy(() -> applicationController.getApprovedApplicationCount(999L))
                    .isInstanceOf(OpportunityNotFoundException.class)
                    .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("GET /api/opportunities/{opportunityId}/applications")
    class GetApplicationsForOpportunityEndpoint {

        private JwtUserDetails promoterUser;

        @BeforeEach
        void setUp() {
            promoterUser = new JwtUserDetails(2L, "promoter@ua.pt", "PROMOTER");
        }

        @Test
        @DisplayName("should return HTTP 200 OK")
        void shouldReturnOkStatus() {
            // Arrange
            when(applicationService.getApplicationsForOpportunity(1L, 2L))
                    .thenReturn(List.of(applicationResponse));

            // Act
            ResponseEntity<List<ApplicationResponse>> response = 
                    applicationController.getApplicationsForOpportunity(1L, promoterUser);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        @Test
        @DisplayName("should return list of applications")
        void shouldReturnListOfApplications() {
            // Arrange
            when(applicationService.getApplicationsForOpportunity(1L, 2L))
                    .thenReturn(List.of(applicationResponse));

            // Act
            ResponseEntity<List<ApplicationResponse>> response = 
                    applicationController.getApplicationsForOpportunity(1L, promoterUser);

            // Assert
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody()).hasSize(1);
        }

        @Test
        @DisplayName("should return empty list when no applications")
        void shouldReturnEmptyList() {
            // Arrange
            when(applicationService.getApplicationsForOpportunity(1L, 2L))
                    .thenReturn(List.of());

            // Act
            ResponseEntity<List<ApplicationResponse>> response = 
                    applicationController.getApplicationsForOpportunity(1L, promoterUser);

            // Assert
            assertThat(response.getBody()).isEmpty();
        }

        @Test
        @DisplayName("should delegate to ApplicationService.getApplicationsForOpportunity()")
        void shouldDelegateToApplicationService() {
            // Arrange
            when(applicationService.getApplicationsForOpportunity(1L, 2L))
                    .thenReturn(List.of(applicationResponse));

            // Act
            applicationController.getApplicationsForOpportunity(1L, promoterUser);

            // Assert
            verify(applicationService).getApplicationsForOpportunity(1L, 2L);
        }

        @Test
        @DisplayName("should propagate OpportunityOwnershipException from service")
        void shouldPropagateOpportunityOwnershipException() {
            // Arrange
            when(applicationService.getApplicationsForOpportunity(1L, 2L))
                    .thenThrow(new OpportunityOwnershipException("Only the opportunity promoter or admin can view applications"));

            // Act & Assert
            assertThatThrownBy(() -> applicationController.getApplicationsForOpportunity(1L, promoterUser))
                    .isInstanceOf(OpportunityOwnershipException.class);
        }
    }

    @Nested
    @DisplayName("PATCH /api/applications/{applicationId}/approve")
    class ApproveApplicationEndpoint {

        private JwtUserDetails promoterUser;
        private ApplicationResponse approvedApplicationResponse;

        @BeforeEach
        void setUp() {
            promoterUser = new JwtUserDetails(2L, "promoter@ua.pt", "PROMOTER");
            
            ApplicationResponse.OpportunitySummary opportunitySummary = ApplicationResponse.OpportunitySummary.builder()
                    .id(1L)
                    .title("UA Open Day Support")
                    .status("OPEN")
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .pointsReward(50)
                    .location("University Campus")
                    .build();

            approvedApplicationResponse = ApplicationResponse.builder()
                    .id(1L)
                    .status(ApplicationStatus.APPROVED)
                    .message("I would love to help!")
                    .appliedAt(LocalDateTime.now())
                    .reviewedAt(LocalDateTime.now())
                    .opportunity(opportunitySummary)
                    .build();
        }

        @Test
        @DisplayName("should return HTTP 200 OK on successful approval")
        void shouldReturnOkStatus() {
            // Arrange
            when(applicationService.approveApplication(1L, 2L))
                    .thenReturn(approvedApplicationResponse);

            // Act
            ResponseEntity<ApplicationResponse> response = 
                    applicationController.approveApplication(1L, promoterUser);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        @Test
        @DisplayName("should return approved ApplicationResponse")
        void shouldReturnApprovedApplicationResponse() {
            // Arrange
            when(applicationService.approveApplication(1L, 2L))
                    .thenReturn(approvedApplicationResponse);

            // Act
            ResponseEntity<ApplicationResponse> response = 
                    applicationController.approveApplication(1L, promoterUser);

            // Assert
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getStatus()).isEqualTo(ApplicationStatus.APPROVED);
            assertThat(response.getBody().getReviewedAt()).isNotNull();
        }

        @Test
        @DisplayName("should delegate to ApplicationService.approveApplication()")
        void shouldDelegateToApplicationService() {
            // Arrange
            when(applicationService.approveApplication(1L, 2L))
                    .thenReturn(approvedApplicationResponse);

            // Act
            applicationController.approveApplication(1L, promoterUser);

            // Assert
            verify(applicationService).approveApplication(1L, 2L);
        }

        @Test
        @DisplayName("should propagate ApplicationNotFoundException from service")
        void shouldPropagateApplicationNotFoundException() {
            // Arrange
            when(applicationService.approveApplication(999L, 2L))
                    .thenThrow(new ApplicationNotFoundException(999L));

            // Act & Assert
            assertThatThrownBy(() -> applicationController.approveApplication(999L, promoterUser))
                    .isInstanceOf(ApplicationNotFoundException.class);
        }

        @Test
        @DisplayName("should propagate InvalidApplicationStatusException from service")
        void shouldPropagateInvalidApplicationStatusException() {
            // Arrange
            when(applicationService.approveApplication(1L, 2L))
                    .thenThrow(new InvalidApplicationStatusException("Cannot approve application with status: APPROVED"));

            // Act & Assert
            assertThatThrownBy(() -> applicationController.approveApplication(1L, promoterUser))
                    .isInstanceOf(InvalidApplicationStatusException.class);
        }

        @Test
        @DisplayName("should propagate NoSpotsAvailableException from service")
        void shouldPropagateNoSpotsAvailableException() {
            // Arrange
            when(applicationService.approveApplication(1L, 2L))
                    .thenThrow(new NoSpotsAvailableException());

            // Act & Assert
            assertThatThrownBy(() -> applicationController.approveApplication(1L, promoterUser))
                    .isInstanceOf(NoSpotsAvailableException.class);
        }

        @Test
        @DisplayName("should propagate OpportunityOwnershipException from service")
        void shouldPropagateOpportunityOwnershipException() {
            // Arrange
            when(applicationService.approveApplication(1L, 2L))
                    .thenThrow(new OpportunityOwnershipException("Only the opportunity promoter or admin can approve applications"));

            // Act & Assert
            assertThatThrownBy(() -> applicationController.approveApplication(1L, promoterUser))
                    .isInstanceOf(OpportunityOwnershipException.class);
        }
    }

    @Nested
    @DisplayName("PATCH /api/applications/{applicationId}/reject")
    class RejectApplicationEndpoint {

        private JwtUserDetails promoterUser;
        private ApplicationResponse rejectedApplicationResponse;

        @BeforeEach
        void setUp() {
            promoterUser = new JwtUserDetails(2L, "promoter@ua.pt", "PROMOTER");
            
            ApplicationResponse.OpportunitySummary opportunitySummary = ApplicationResponse.OpportunitySummary.builder()
                    .id(1L)
                    .title("UA Open Day Support")
                    .status("OPEN")
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .pointsReward(50)
                    .location("University Campus")
                    .build();

            rejectedApplicationResponse = ApplicationResponse.builder()
                    .id(1L)
                    .status(ApplicationStatus.REJECTED)
                    .message("I would love to help!")
                    .appliedAt(LocalDateTime.now())
                    .reviewedAt(LocalDateTime.now())
                    .opportunity(opportunitySummary)
                    .build();
        }

        @Test
        @DisplayName("should return HTTP 200 OK on successful rejection")
        void shouldReturnOkStatus() {
            // Arrange
            when(applicationService.rejectApplication(1L, 2L))
                    .thenReturn(rejectedApplicationResponse);

            // Act
            ResponseEntity<ApplicationResponse> response = 
                    applicationController.rejectApplication(1L, promoterUser);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        @Test
        @DisplayName("should return rejected ApplicationResponse")
        void shouldReturnRejectedApplicationResponse() {
            // Arrange
            when(applicationService.rejectApplication(1L, 2L))
                    .thenReturn(rejectedApplicationResponse);

            // Act
            ResponseEntity<ApplicationResponse> response = 
                    applicationController.rejectApplication(1L, promoterUser);

            // Assert
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getStatus()).isEqualTo(ApplicationStatus.REJECTED);
            assertThat(response.getBody().getReviewedAt()).isNotNull();
        }

        @Test
        @DisplayName("should delegate to ApplicationService.rejectApplication()")
        void shouldDelegateToApplicationService() {
            // Arrange
            when(applicationService.rejectApplication(1L, 2L))
                    .thenReturn(rejectedApplicationResponse);

            // Act
            applicationController.rejectApplication(1L, promoterUser);

            // Assert
            verify(applicationService).rejectApplication(1L, 2L);
        }

        @Test
        @DisplayName("should propagate ApplicationNotFoundException from service")
        void shouldPropagateApplicationNotFoundException() {
            // Arrange
            when(applicationService.rejectApplication(999L, 2L))
                    .thenThrow(new ApplicationNotFoundException(999L));

            // Act & Assert
            assertThatThrownBy(() -> applicationController.rejectApplication(999L, promoterUser))
                    .isInstanceOf(ApplicationNotFoundException.class);
        }

        @Test
        @DisplayName("should propagate InvalidApplicationStatusException from service")
        void shouldPropagateInvalidApplicationStatusException() {
            // Arrange
            when(applicationService.rejectApplication(1L, 2L))
                    .thenThrow(new InvalidApplicationStatusException("Cannot reject application with status: REJECTED"));

            // Act & Assert
            assertThatThrownBy(() -> applicationController.rejectApplication(1L, promoterUser))
                    .isInstanceOf(InvalidApplicationStatusException.class);
        }

        @Test
        @DisplayName("should propagate OpportunityOwnershipException from service")
        void shouldPropagateOpportunityOwnershipException() {
            // Arrange
            when(applicationService.rejectApplication(1L, 2L))
                    .thenThrow(new OpportunityOwnershipException("Only the opportunity promoter or admin can reject applications"));

            // Act & Assert
            assertThatThrownBy(() -> applicationController.rejectApplication(1L, promoterUser))
                    .isInstanceOf(OpportunityOwnershipException.class);
        }
    }
}

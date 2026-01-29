package ua.tqs.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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
import ua.tqs.model.Application;
import ua.tqs.model.Opportunity;
import ua.tqs.model.Skill;
import ua.tqs.model.User;
import ua.tqs.model.enums.ApplicationStatus;
import ua.tqs.model.enums.OpportunityStatus;
import ua.tqs.model.enums.SkillCategory;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.ApplicationRepository;
import ua.tqs.repository.OpportunityRepository;
import ua.tqs.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private OpportunityRepository opportunityRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ApplicationService applicationService;

    private User volunteer;
    private User promoter;
    private Opportunity opportunity;
    private Application application;
    private Skill skill;

    @BeforeEach
    void setUp() {
        volunteer = User.builder()
                .id(1L)
                .email("volunteer@ua.pt")
                .password("encoded")
                .name("Sample Volunteer")
                .role(UserRole.VOLUNTEER)
                .points(0)
                .build();

        promoter = User.builder()
                .id(2L)
                .email("promoter@ua.pt")
                .password("encoded")
                .name("Sample Promoter")
                .role(UserRole.PROMOTER)
                .points(0)
                .build();

        skill = Skill.builder()
                .id(1L)
                .name("Communication")
                .category(SkillCategory.COMMUNICATION)
                .description("Effective communication")
                .build();

        Set<Skill> requiredSkills = new HashSet<>();
        requiredSkills.add(skill);

        opportunity = Opportunity.builder()
                .id(1L)
                .title("UA Open Day Support")
                .description("Help with university open day activities")
                .pointsReward(50)
                .startDate(LocalDateTime.now().plusDays(1))
                .endDate(LocalDateTime.now().plusDays(7))
                .maxVolunteers(10)
                .status(OpportunityStatus.OPEN)
                .location("University Campus")
                .promoter(promoter)
                .requiredSkills(requiredSkills)
                .build();

        application = Application.builder()
                .id(1L)
                .volunteer(volunteer)
                .opportunity(opportunity)
                .status(ApplicationStatus.PENDING)
                .message("I would love to help!")
                .appliedAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("applyToOpportunity()")
    class ApplyToOpportunityMethod {

        @Test
        @DisplayName("should create application with valid data")
        void shouldCreateApplicationWithValidData() {
            // Arrange
            CreateApplicationRequest request = CreateApplicationRequest.builder()
                    .opportunityId(1L)
                    .message("I would love to help!")
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(opportunityRepository.findById(1L)).thenReturn(Optional.of(opportunity));
            when(applicationRepository.existsByVolunteerAndOpportunity(volunteer, opportunity)).thenReturn(false);
            when(applicationRepository.countByOpportunityAndStatus(opportunity, ApplicationStatus.APPROVED)).thenReturn(0L);
            when(applicationRepository.save(any(Application.class))).thenReturn(application);

            // Act
            ApplicationResponse response = applicationService.applyToOpportunity(1L, request);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo(ApplicationStatus.PENDING);
            assertThat(response.getMessage()).isEqualTo("I would love to help!");
            assertThat(response.getOpportunity()).isNotNull();
            assertThat(response.getOpportunity().getId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("should create application without message")
        void shouldCreateApplicationWithoutMessage() {
            // Arrange
            CreateApplicationRequest request = CreateApplicationRequest.builder()
                    .opportunityId(1L)
                    .message(null)
                    .build();

            Application applicationNoMessage = Application.builder()
                    .id(1L)
                    .volunteer(volunteer)
                    .opportunity(opportunity)
                    .status(ApplicationStatus.PENDING)
                    .message(null)
                    .appliedAt(LocalDateTime.now())
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(opportunityRepository.findById(1L)).thenReturn(Optional.of(opportunity));
            when(applicationRepository.existsByVolunteerAndOpportunity(volunteer, opportunity)).thenReturn(false);
            when(applicationRepository.countByOpportunityAndStatus(opportunity, ApplicationStatus.APPROVED)).thenReturn(0L);
            when(applicationRepository.save(any(Application.class))).thenReturn(applicationNoMessage);

            // Act
            ApplicationResponse response = applicationService.applyToOpportunity(1L, request);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getMessage()).isNull();
        }

        @Test
        @DisplayName("should throw exception when volunteer not found")
        void shouldThrowExceptionWhenVolunteerNotFound() {
            // Arrange
            CreateApplicationRequest request = CreateApplicationRequest.builder()
                    .opportunityId(1L)
                    .build();

            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> applicationService.applyToOpportunity(999L, request))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessageContaining("999");

            verify(applicationRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw exception when opportunity not found")
        void shouldThrowExceptionWhenOpportunityNotFound() {
            // Arrange
            CreateApplicationRequest request = CreateApplicationRequest.builder()
                    .opportunityId(999L)
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(opportunityRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> applicationService.applyToOpportunity(1L, request))
                    .isInstanceOf(OpportunityNotFoundException.class)
                    .hasMessageContaining("999");

            verify(applicationRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw exception when opportunity is not OPEN")
        void shouldThrowExceptionWhenOpportunityNotOpen() {
            // Arrange
            opportunity.setStatus(OpportunityStatus.DRAFT);
            CreateApplicationRequest request = CreateApplicationRequest.builder()
                    .opportunityId(1L)
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(opportunityRepository.findById(1L)).thenReturn(Optional.of(opportunity));

            // Act & Assert
            assertThatThrownBy(() -> applicationService.applyToOpportunity(1L, request))
                    .isInstanceOf(OpportunityStatusException.class)
                    .hasMessage("Cannot apply to opportunity that is not open");

            verify(applicationRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw exception when already applied")
        void shouldThrowExceptionWhenAlreadyApplied() {
            // Arrange
            CreateApplicationRequest request = CreateApplicationRequest.builder()
                    .opportunityId(1L)
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(opportunityRepository.findById(1L)).thenReturn(Optional.of(opportunity));
            when(applicationRepository.existsByVolunteerAndOpportunity(volunteer, opportunity)).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> applicationService.applyToOpportunity(1L, request))
                    .isInstanceOf(AlreadyAppliedException.class)
                    .hasMessage("Already applied");

            verify(applicationRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw exception when no spots available")
        void shouldThrowExceptionWhenNoSpotsAvailable() {
            // Arrange
            opportunity.setMaxVolunteers(5);
            CreateApplicationRequest request = CreateApplicationRequest.builder()
                    .opportunityId(1L)
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(opportunityRepository.findById(1L)).thenReturn(Optional.of(opportunity));
            when(applicationRepository.existsByVolunteerAndOpportunity(volunteer, opportunity)).thenReturn(false);
            when(applicationRepository.countByOpportunityAndStatus(opportunity, ApplicationStatus.APPROVED)).thenReturn(5L);

            // Act & Assert
            assertThatThrownBy(() -> applicationService.applyToOpportunity(1L, request))
                    .isInstanceOf(NoSpotsAvailableException.class)
                    .hasMessage("No spots available");

            verify(applicationRepository, never()).save(any());
        }

        @Test
        @DisplayName("should allow application when spots are still available")
        void shouldAllowApplicationWhenSpotsAvailable() {
            // Arrange
            opportunity.setMaxVolunteers(5);
            CreateApplicationRequest request = CreateApplicationRequest.builder()
                    .opportunityId(1L)
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(opportunityRepository.findById(1L)).thenReturn(Optional.of(opportunity));
            when(applicationRepository.existsByVolunteerAndOpportunity(volunteer, opportunity)).thenReturn(false);
            when(applicationRepository.countByOpportunityAndStatus(opportunity, ApplicationStatus.APPROVED)).thenReturn(4L);
            when(applicationRepository.save(any(Application.class))).thenReturn(application);

            // Act
            ApplicationResponse response = applicationService.applyToOpportunity(1L, request);

            // Assert
            assertThat(response).isNotNull();
            verify(applicationRepository).save(any(Application.class));
        }

        @Test
        @DisplayName("should set application status to PENDING")
        void shouldSetStatusToPending() {
            // Arrange
            CreateApplicationRequest request = CreateApplicationRequest.builder()
                    .opportunityId(1L)
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(opportunityRepository.findById(1L)).thenReturn(Optional.of(opportunity));
            when(applicationRepository.existsByVolunteerAndOpportunity(volunteer, opportunity)).thenReturn(false);
            when(applicationRepository.countByOpportunityAndStatus(opportunity, ApplicationStatus.APPROVED)).thenReturn(0L);
            when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            applicationService.applyToOpportunity(1L, request);

            // Assert
            verify(applicationRepository).save(argThat(app ->
                    app.getStatus() == ApplicationStatus.PENDING
            ));
        }
    }

    @Nested
    @DisplayName("getMyApplications()")
    class GetMyApplicationsMethod {

        @Test
        @DisplayName("should return all applications for volunteer")
        void shouldReturnAllApplicationsForVolunteer() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(applicationRepository.findByVolunteer(volunteer)).thenReturn(List.of(application));

            // Act
            List<ApplicationResponse> applications = applicationService.getMyApplications(1L);

            // Assert
            assertThat(applications).hasSize(1);
            assertThat(applications.get(0).getOpportunity().getTitle()).isEqualTo("UA Open Day Support");
        }

        @Test
        @DisplayName("should return empty list when no applications")
        void shouldReturnEmptyListWhenNoApplications() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(applicationRepository.findByVolunteer(volunteer)).thenReturn(List.of());

            // Act
            List<ApplicationResponse> applications = applicationService.getMyApplications(1L);

            // Assert
            assertThat(applications).isEmpty();
        }

        @Test
        @DisplayName("should throw exception when volunteer not found")
        void shouldThrowExceptionWhenVolunteerNotFound() {
            // Arrange
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> applicationService.getMyApplications(999L))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessageContaining("999");
        }

        @Test
        @DisplayName("should return multiple applications")
        void shouldReturnMultipleApplications() {
            // Arrange
            Opportunity secondOpportunity = Opportunity.builder()
                    .id(2L)
                    .title("Beach Cleanup")
                    .description("Help clean the beach")
                    .pointsReward(30)
                    .startDate(LocalDateTime.now().plusDays(10))
                    .endDate(LocalDateTime.now().plusDays(11))
                    .maxVolunteers(20)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoter)
                    .requiredSkills(new HashSet<>())
                    .build();

            Application secondApplication = Application.builder()
                    .id(2L)
                    .volunteer(volunteer)
                    .opportunity(secondOpportunity)
                    .status(ApplicationStatus.APPROVED)
                    .appliedAt(LocalDateTime.now())
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(applicationRepository.findByVolunteer(volunteer)).thenReturn(List.of(application, secondApplication));

            // Act
            List<ApplicationResponse> applications = applicationService.getMyApplications(1L);

            // Assert
            assertThat(applications).hasSize(2);
        }
    }

    @Nested
    @DisplayName("getApplicationForOpportunity()")
    class GetApplicationForOpportunityMethod {

        @Test
        @DisplayName("should return application when exists")
        void shouldReturnApplicationWhenExists() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(opportunityRepository.findById(1L)).thenReturn(Optional.of(opportunity));
            when(applicationRepository.findByVolunteerAndOpportunity(volunteer, opportunity))
                    .thenReturn(Optional.of(application));

            // Act
            ApplicationResponse response = applicationService.getApplicationForOpportunity(1L, 1L);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo(ApplicationStatus.PENDING);
        }

        @Test
        @DisplayName("should return null when no application exists")
        void shouldReturnNullWhenNoApplicationExists() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(opportunityRepository.findById(1L)).thenReturn(Optional.of(opportunity));
            when(applicationRepository.findByVolunteerAndOpportunity(volunteer, opportunity))
                    .thenReturn(Optional.empty());

            // Act
            ApplicationResponse response = applicationService.getApplicationForOpportunity(1L, 1L);

            // Assert
            assertThat(response).isNull();
        }

        @Test
        @DisplayName("should throw exception when volunteer not found")
        void shouldThrowExceptionWhenVolunteerNotFound() {
            // Arrange
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> applicationService.getApplicationForOpportunity(999L, 1L))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessageContaining("999");
        }

        @Test
        @DisplayName("should throw exception when opportunity not found")
        void shouldThrowExceptionWhenOpportunityNotFound() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(opportunityRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> applicationService.getApplicationForOpportunity(1L, 999L))
                    .isInstanceOf(OpportunityNotFoundException.class)
                    .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("getApprovedApplicationCount()")
    class GetApprovedApplicationCountMethod {

        @Test
        @DisplayName("should return count of approved applications")
        void shouldReturnCountOfApprovedApplications() {
            // Arrange
            when(opportunityRepository.findById(1L)).thenReturn(Optional.of(opportunity));
            when(applicationRepository.countByOpportunityAndStatus(opportunity, ApplicationStatus.APPROVED))
                    .thenReturn(5L);

            // Act
            long count = applicationService.getApprovedApplicationCount(1L);

            // Assert
            assertThat(count).isEqualTo(5L);
        }

        @Test
        @DisplayName("should return zero when no approved applications")
        void shouldReturnZeroWhenNoApprovedApplications() {
            // Arrange
            when(opportunityRepository.findById(1L)).thenReturn(Optional.of(opportunity));
            when(applicationRepository.countByOpportunityAndStatus(opportunity, ApplicationStatus.APPROVED))
                    .thenReturn(0L);

            // Act
            long count = applicationService.getApprovedApplicationCount(1L);

            // Assert
            assertThat(count).isZero();
        }

        @Test
        @DisplayName("should throw exception when opportunity not found")
        void shouldThrowExceptionWhenOpportunityNotFound() {
            // Arrange
            when(opportunityRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> applicationService.getApprovedApplicationCount(999L))
                    .isInstanceOf(OpportunityNotFoundException.class)
                    .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("getApplicationsForOpportunity()")
    class GetApplicationsForOpportunityMethod {

        @Test
        @DisplayName("should return all applications for opportunity when user is promoter")
        void shouldReturnAllApplicationsWhenUserIsPromoter() {
            // Arrange
            when(opportunityRepository.findById(1L)).thenReturn(Optional.of(opportunity));
            when(userRepository.findById(2L)).thenReturn(Optional.of(promoter));
            when(applicationRepository.findByOpportunity(opportunity)).thenReturn(List.of(application));

            // Act
            List<ApplicationResponse> applications = applicationService.getApplicationsForOpportunity(1L, 2L);

            // Assert
            assertThat(applications).hasSize(1);
            assertThat(applications.get(0).getVolunteer().getName()).isEqualTo("Sample Volunteer");
        }

        @Test
        @DisplayName("should return all applications when user is admin")
        void shouldReturnAllApplicationsWhenUserIsAdmin() {
            // Arrange
            User admin = User.builder()
                    .id(3L)
                    .email("admin@ua.pt")
                    .password("encoded")
                    .name("Admin User")
                    .role(UserRole.ADMIN)
                    .points(0)
                    .build();

            when(opportunityRepository.findById(1L)).thenReturn(Optional.of(opportunity));
            when(userRepository.findById(3L)).thenReturn(Optional.of(admin));
            when(applicationRepository.findByOpportunity(opportunity)).thenReturn(List.of(application));

            // Act
            List<ApplicationResponse> applications = applicationService.getApplicationsForOpportunity(1L, 3L);

            // Assert
            assertThat(applications).hasSize(1);
        }

        @Test
        @DisplayName("should throw exception when user is not owner or admin")
        void shouldThrowExceptionWhenUserIsNotOwnerOrAdmin() {
            // Arrange
            when(opportunityRepository.findById(1L)).thenReturn(Optional.of(opportunity));
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));

            // Act & Assert
            assertThatThrownBy(() -> applicationService.getApplicationsForOpportunity(1L, 1L))
                    .isInstanceOf(OpportunityOwnershipException.class)
                    .hasMessage("Only the opportunity promoter or admin can view applications");
        }

        @Test
        @DisplayName("should throw exception when opportunity not found")
        void shouldThrowExceptionWhenOpportunityNotFound() {
            // Arrange
            when(opportunityRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> applicationService.getApplicationsForOpportunity(999L, 2L))
                    .isInstanceOf(OpportunityNotFoundException.class);
        }

        @Test
        @DisplayName("should throw exception when user not found")
        void shouldThrowExceptionWhenUserNotFound() {
            // Arrange
            when(opportunityRepository.findById(1L)).thenReturn(Optional.of(opportunity));
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> applicationService.getApplicationsForOpportunity(1L, 999L))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("approveApplication()")
    class ApproveApplicationMethod {

        @Test
        @DisplayName("should approve pending application when user is promoter")
        void shouldApprovePendingApplicationWhenUserIsPromoter() {
            // Arrange
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));
            when(userRepository.findById(2L)).thenReturn(Optional.of(promoter));
            when(applicationRepository.countByOpportunityAndStatus(opportunity, ApplicationStatus.APPROVED)).thenReturn(0L);
            when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            ApplicationResponse response = applicationService.approveApplication(1L, 2L);

            // Assert
            assertThat(response.getStatus()).isEqualTo(ApplicationStatus.APPROVED);
            assertThat(response.getReviewedAt()).isNotNull();
        }

        @Test
        @DisplayName("should approve application when user is admin")
        void shouldApproveApplicationWhenUserIsAdmin() {
            // Arrange
            User admin = User.builder()
                    .id(3L)
                    .email("admin@ua.pt")
                    .password("encoded")
                    .name("Admin User")
                    .role(UserRole.ADMIN)
                    .points(0)
                    .build();

            when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));
            when(userRepository.findById(3L)).thenReturn(Optional.of(admin));
            when(applicationRepository.countByOpportunityAndStatus(opportunity, ApplicationStatus.APPROVED)).thenReturn(0L);
            when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            ApplicationResponse response = applicationService.approveApplication(1L, 3L);

            // Assert
            assertThat(response.getStatus()).isEqualTo(ApplicationStatus.APPROVED);
        }

        @Test
        @DisplayName("should throw exception when user is not owner or admin")
        void shouldThrowExceptionWhenUserIsNotOwnerOrAdmin() {
            // Arrange
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));

            // Act & Assert
            assertThatThrownBy(() -> applicationService.approveApplication(1L, 1L))
                    .isInstanceOf(OpportunityOwnershipException.class)
                    .hasMessage("Only the opportunity promoter or admin can approve applications");

            verify(applicationRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw exception when application not found")
        void shouldThrowExceptionWhenApplicationNotFound() {
            // Arrange
            when(applicationRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> applicationService.approveApplication(999L, 2L))
                    .isInstanceOf(ApplicationNotFoundException.class);
        }

        @Test
        @DisplayName("should throw exception when application is not pending")
        void shouldThrowExceptionWhenApplicationIsNotPending() {
            // Arrange
            application.setStatus(ApplicationStatus.APPROVED);
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));
            when(userRepository.findById(2L)).thenReturn(Optional.of(promoter));

            // Act & Assert
            assertThatThrownBy(() -> applicationService.approveApplication(1L, 2L))
                    .isInstanceOf(InvalidApplicationStatusException.class)
                    .hasMessage("Cannot approve application with status: APPROVED");

            verify(applicationRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw exception when no spots available")
        void shouldThrowExceptionWhenNoSpotsAvailable() {
            // Arrange
            opportunity.setMaxVolunteers(5);
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));
            when(userRepository.findById(2L)).thenReturn(Optional.of(promoter));
            when(applicationRepository.countByOpportunityAndStatus(opportunity, ApplicationStatus.APPROVED)).thenReturn(5L);

            // Act & Assert
            assertThatThrownBy(() -> applicationService.approveApplication(1L, 2L))
                    .isInstanceOf(NoSpotsAvailableException.class);

            verify(applicationRepository, never()).save(any());
        }

        @Test
        @DisplayName("should set reviewedAt timestamp when approving")
        void shouldSetReviewedAtTimestampWhenApproving() {
            // Arrange
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));
            when(userRepository.findById(2L)).thenReturn(Optional.of(promoter));
            when(applicationRepository.countByOpportunityAndStatus(opportunity, ApplicationStatus.APPROVED)).thenReturn(0L);
            when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            applicationService.approveApplication(1L, 2L);

            // Assert
            verify(applicationRepository).save(argThat(app ->
                    app.getReviewedAt() != null
            ));
        }
    }

    @Nested
    @DisplayName("rejectApplication()")
    class RejectApplicationMethod {

        @Test
        @DisplayName("should reject pending application when user is promoter")
        void shouldRejectPendingApplicationWhenUserIsPromoter() {
            // Arrange
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));
            when(userRepository.findById(2L)).thenReturn(Optional.of(promoter));
            when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            ApplicationResponse response = applicationService.rejectApplication(1L, 2L);

            // Assert
            assertThat(response.getStatus()).isEqualTo(ApplicationStatus.REJECTED);
            assertThat(response.getReviewedAt()).isNotNull();
        }

        @Test
        @DisplayName("should reject application when user is admin")
        void shouldRejectApplicationWhenUserIsAdmin() {
            // Arrange
            User admin = User.builder()
                    .id(3L)
                    .email("admin@ua.pt")
                    .password("encoded")
                    .name("Admin User")
                    .role(UserRole.ADMIN)
                    .points(0)
                    .build();

            when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));
            when(userRepository.findById(3L)).thenReturn(Optional.of(admin));
            when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            ApplicationResponse response = applicationService.rejectApplication(1L, 3L);

            // Assert
            assertThat(response.getStatus()).isEqualTo(ApplicationStatus.REJECTED);
        }

        @Test
        @DisplayName("should throw exception when user is not owner or admin")
        void shouldThrowExceptionWhenUserIsNotOwnerOrAdmin() {
            // Arrange
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));

            // Act & Assert
            assertThatThrownBy(() -> applicationService.rejectApplication(1L, 1L))
                    .isInstanceOf(OpportunityOwnershipException.class)
                    .hasMessage("Only the opportunity promoter or admin can reject applications");

            verify(applicationRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw exception when application not found")
        void shouldThrowExceptionWhenApplicationNotFound() {
            // Arrange
            when(applicationRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> applicationService.rejectApplication(999L, 2L))
                    .isInstanceOf(ApplicationNotFoundException.class);
        }

        @Test
        @DisplayName("should throw exception when application is not pending")
        void shouldThrowExceptionWhenApplicationIsNotPending() {
            // Arrange
            application.setStatus(ApplicationStatus.REJECTED);
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));
            when(userRepository.findById(2L)).thenReturn(Optional.of(promoter));

            // Act & Assert
            assertThatThrownBy(() -> applicationService.rejectApplication(1L, 2L))
                    .isInstanceOf(InvalidApplicationStatusException.class)
                    .hasMessage("Cannot reject application with status: REJECTED");

            verify(applicationRepository, never()).save(any());
        }

        @Test
        @DisplayName("should set reviewedAt timestamp when rejecting")
        void shouldSetReviewedAtTimestampWhenRejecting() {
            // Arrange
            when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));
            when(userRepository.findById(2L)).thenReturn(Optional.of(promoter));
            when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            applicationService.rejectApplication(1L, 2L);

            // Assert
            verify(applicationRepository).save(argThat(app ->
                    app.getReviewedAt() != null
            ));
        }
    }
}
